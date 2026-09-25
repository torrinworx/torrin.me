// The station: the clock that turns the composer's steps into sound. It knows what time it is,
// which track that time is inside, and plays that track's events into the voice as the time
// comes, one block of samples at a time. A new track starts on the other bank of channels and
// both banks crossfade. A station that starts mid-track strikes the chord it is inside so the
// first block is not silence.
//
// Time is seconds since the epoch. The schedule says which slot a moment is in and when that
// track began, and the track is `track(slot)` from the composer, which is how every process at
// the same moment plays the same thing. The mix goes through one low-pass whose cutoff moves
// from one style's to the other's across a crossfade.
//
// The station is pulled: `next()` renders the block after the last one. Whoever calls it keeps
// it in step with the wall clock (`pace.ts`), and a test can drive it as fast as it likes with a
// clock of its own.

import { STEPS_PER_BAR, events, holding, keyName, stepAt, track } from './compose.ts';
import type { Event, Part, Track } from './compose.ts';
import { config } from './config.ts';
import type { Config, StyleName } from './config.ts';
import { at as slotAt } from './schedule.ts';
import type { Slot } from './schedule.ts';
import { tone } from './tone.ts';
import { DRUM_CHANNEL, SAMPLE_RATE } from './voice.ts';
import type { Voice } from './voice.ts';

export interface StationOptions {
	readonly voice: Voice;
	/** Seconds since the epoch at the station's start. Defaults to the wall clock. */
	readonly start?: number;
	/** Seconds each block covers. A tenth by default. */
	readonly blockSeconds?: number;
	readonly settings?: Config;
}

export interface Playing {
	readonly slot: number;
	readonly style: StyleName;
	readonly name: string;
	readonly tempo: number;
	/** The key as a name, like "A minor" or "D lydian". */
	readonly key: string;
	readonly bar: number;
	readonly bars: number;
	/** Seconds since the epoch the track began, and how long it lasts. */
	readonly begins: number;
	readonly seconds: number;
	/** Seconds since the epoch the block of this style ends. */
	readonly blockEnds: number;
}

export interface Station {
	/** The next block of samples: 16-bit stereo, interleaved. */
	next(): Buffer;
	/** Seconds since the epoch the station has rendered up to. */
	readonly time: number;
	/** The newest track, and how far into it the station is. */
	playing(): Playing;
	/** Silence every channel and continue from `at`, after the clock jumped. */
	jump(at: number): void;
}

const PARTS: readonly Exclude<Part, 'drums' | 'duck'>[] = ['pad', 'keys', 'bass', 'lead'];

interface Running {
	readonly track: Track;
	readonly slot: Slot;
	/** The first channel of the bank this track's parts are on. */
	readonly bank: number;
	/** The next step to fire. */
	step: number;
	/** The bass level the last duck set, 0 to 1. */
	duck: number;
	/** Seconds since the epoch the track stops being stepped. */
	readonly until: number;
	/** Volume ramps: from the level at `rampFrom` to the level at `rampTo`, linear. */
	readonly rampFrom: number;
	readonly rampTo: number;
	readonly fadeIn: boolean;
}

export const station = (options: StationOptions): Station => {
	const settings = options.settings ?? config;
	const voice = options.voice;
	const blockSeconds = options.blockSeconds ?? 0.1;
	const blockFrames = Math.round(blockSeconds * SAMPLE_RATE);
	// Counted, not accumulated: a sum of tenths drifts off the boundaries it has to land on.
	let began = options.start ?? Date.now() / 1000;
	let blocks = 0;
	let time = began;
	const running: Running[] = [];
	const lowpass = tone(settings.style[slotAt(time, settings).style].lowpassHz);

	const channel = (of: Running, part: Part): number =>
		(part === 'drums' ? DRUM_CHANNEL : of.bank + PARTS.indexOf(part as Exclude<Part, 'drums' | 'duck'>));

	const levelOf = (of: Running, at: number): number => {
		const span = of.rampTo - of.rampFrom;
		const through = span <= 0 ? 1 : Math.max(0, Math.min(1, (at - of.rampFrom) / span));
		return of.fadeIn ? through : 1 - through;
	};

	const levelsOf = (of: Running): Config['style'][StyleName]['levels'] => settings.style[of.track.style].levels;

	const setLevels = (of: Running, at: number): void => {
		const scale = levelOf(of, at);
		const levels = levelsOf(of);
		for (const part of PARTS) {
			const level = part === 'bass' ? levels.bass * of.duck : levels[part];
			voice.volume(channel(of, part), Math.round(level * scale));
		}
	};

	const fire = (of: Running, fired: readonly Event[], drums: boolean, at: number): void => {
		for (const event of fired) {
			if (event.part === 'drums' && !drums) continue;
			if (event.part === 'duck') {
				of.duck = event.velocity / 100;
				voice.volume(channel(of, 'bass'), Math.round(levelsOf(of).bass * of.duck * levelOf(of, at)));
				continue;
			}
			const on = channel(of, event.part);
			if (event.velocity === 0) voice.off(on, event.key);
			else voice.on(on, event.key, event.velocity);
		}
	};

	const start = (where: Slot, at: number): void => {
		const of = track(where.slot, settings);
		const bank = where.slot % 2 === 0 ? 0 : 4;
		const position = at - where.begins;
		const fresh = position < blockSeconds;
		const run: Running = {
			track: of,
			slot: where,
			bank,
			step: 0,
			duck: 1,
			until: where.begins + where.seconds + settings.crossfadeSeconds,
			rampFrom: where.begins,
			rampTo: fresh ? where.begins + settings.crossfadeSeconds : where.begins,
			fadeIn: true,
		};
		for (const part of PARTS) {
			voice.allOff(channel(run, part));
			const program = of.instruments[part];
			if (program !== undefined) voice.program(channel(run, part), program);
		}
		const kit = settings.style[of.style].kit;
		if (kit !== null) voice.program(DRUM_CHANNEL, kit);
		setLevels(run, at);
		// A fresh track keeps its step zero even when the boundary fell inside the last block, so
		// its first chord is struck at the top of this one and not lost. A track joined later
		// skips to its place and strikes the chord it is inside.
		if (!fresh) {
			while (run.step < of.steps && where.begins + stepAt(of, run.step) < at) run.step++;
			fire(run, holding(of, Math.max(0, run.step - 1), settings), false, at);
		}
		running.push(run);
	};

	const end = (of: Running): Running => ({
		...of,
		rampFrom: of.slot.begins + of.slot.seconds,
		rampTo: of.slot.begins + of.slot.seconds + settings.crossfadeSeconds,
		fadeIn: false,
	});

	// One cutoff for the whole mix: the newest track's, reached from the previous track's over
	// the crossfade.
	const cutoffAt = (at: number): number => {
		const newest = running[running.length - 1];
		if (newest === undefined) return settings.style[slotAt(at, settings).style].lowpassHz;
		const target = settings.style[newest.track.style].lowpassHz;
		const previous = running.length > 1 ? settings.style[running[0]!.track.style].lowpassHz : target;
		const through = levelOf(newest, at);
		return previous + (target - previous) * through;
	};

	const left = new Float32Array(blockFrames);
	const right = new Float32Array(blockFrames);

	const next = (): Buffer => {
		const from = time;
		const to = time + blockSeconds;
		const where = slotAt(from, settings);

		if (!running.some((run) => run.slot.slot === where.slot)) {
			for (let i = 0; i < running.length; i++) running[i] = end(running[i]!);
			start(where, from);
		}
		for (let i = running.length - 1; i >= 0; i--) {
			const run = running[i]!;
			if (run.until > from) continue;
			for (const part of PARTS) voice.allOff(channel(run, part));
			running.splice(i, 1);
		}
		const newest = running[running.length - 1];
		lowpass.cutoff(cutoffAt(from));

		// The steps that fall inside this block, in time order across both tracks, each rendered
		// up to and fired at its own sample.
		interface Due { at: number; run: Running }
		const due: Due[] = [];
		for (const run of running) {
			for (let step = run.step; step < run.track.steps; step++) {
				const at = run.slot.begins + stepAt(run.track, step);
				if (at >= to) break;
				due.push({ at, run });
			}
		}
		due.sort((a, b) => a.at - b.at);

		const out = Buffer.alloc(blockFrames * 4);
		let rendered = 0;
		const renderTo = (frame: number): void => {
			const count = frame - rendered;
			if (count <= 0) return;
			const l = left.subarray(0, count);
			const r = right.subarray(0, count);
			voice.render(l, r);
			lowpass.apply(l, r);
			for (let i = 0; i < count; i++) {
				out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((l[i] ?? 0) * 32767))), (rendered + i) * 4);
				out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((r[i] ?? 0) * 32767))), (rendered + i) * 4 + 2);
			}
			rendered = frame;
		};

		for (const run of running) setLevels(run, from);
		for (const { at, run } of due) {
			renderTo(Math.min(blockFrames, Math.max(0, Math.round((at - from) * SAMPLE_RATE))));
			fire(run, events(run.track, run.step, settings), run === newest, at);
			run.step++;
		}
		renderTo(blockFrames);

		blocks++;
		time = began + blocks * blockSeconds;
		return out;
	};

	const playing = (): Playing => {
		const run = running[running.length - 1];
		const where = run?.slot ?? slotAt(time, settings);
		const of = run?.track ?? track(where.slot, settings);
		return {
			slot: where.slot,
			style: of.style,
			name: of.name,
			tempo: of.tempo,
			key: keyName(of),
			bar: run === undefined ? 0 : Math.floor(run.step / STEPS_PER_BAR),
			bars: of.steps / STEPS_PER_BAR,
			begins: where.begins,
			seconds: where.seconds,
			blockEnds: where.blockEnds,
		};
	};

	const jump = (at: number): void => {
		began = at;
		for (const run of running) for (const part of PARTS) voice.allOff(channel(run, part));
		running.length = 0;
		time = at;
		blocks = 0;
	};

	return {
		next,
		get time() { return time; },
		playing,
		jump,
	};
};
