// The station: the clock that turns the composer's steps into sound. It knows what time it is,
// which track that time is inside, and plays that track's events into the voice as the time
// comes, one block of samples at a time. A new slot starts its track on the other bank of
// channels and both banks crossfade; a station that starts mid-track strikes the chord it is
// inside so the first block is not silence.
//
// Time is seconds since the epoch. The slot is `floor(time / trackSeconds)`, and the track in it
// is `track(slot)` from the composer, which is how every process at the same moment plays the
// same thing.
//
// The station is pulled: `next()` renders the block after the last one. Whoever calls it keeps
// it in step with the wall clock (`pace.ts`); a test can drive it as fast as it likes with a
// clock of its own.

import { STEPS_PER_BAR, events, holding, stepAt, track } from './compose.ts';
import type { Event, Part, Track } from './compose.ts';
import { config } from './config.ts';
import type { Config } from './config.ts';
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
	readonly tempo: number;
	readonly root: number;
	readonly mode: string;
	readonly bar: number;
	readonly bars: number;
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

const PARTS: readonly Exclude<Part, 'drums'>[] = ['pad', 'keys', 'bass', 'melody'];

interface Running {
	readonly track: Track;
	/** The first channel of the bank this track's parts are on. */
	readonly bank: number;
	/** Seconds since the epoch the track's step zero fell on. */
	readonly begins: number;
	/** The next step to fire. */
	step: number;
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
	// Counted, not accumulated: a sum of tenths drifts off the slot boundaries it has to land on.
	let began = options.start ?? Date.now() / 1000;
	let blocks = 0;
	let time = began;
	const running: Running[] = [];

	const channel = (of: Running, part: Part): number =>
		(part === 'drums' ? DRUM_CHANNEL : of.bank + PARTS.indexOf(part));

	const fire = (of: Running, fired: readonly Event[], drums: boolean): void => {
		for (const event of fired) {
			if (event.part === 'drums' && !drums) continue;
			const on = channel(of, event.part);
			if (event.velocity === 0) voice.off(on, event.key);
			else voice.on(on, event.key, event.velocity);
		}
	};

	const levelOf = (of: Running, at: number): number => {
		const span = of.rampTo - of.rampFrom;
		const through = span <= 0 ? 1 : Math.max(0, Math.min(1, (at - of.rampFrom) / span));
		return of.fadeIn ? through : 1 - through;
	};

	const setLevels = (of: Running, at: number): void => {
		const scale = levelOf(of, at);
		for (const part of PARTS) voice.volume(channel(of, part), Math.round(settings.levels[part] * scale));
	};

	const start = (slot: number, at: number): void => {
		const of = track(slot, settings);
		const bank = slot % 2 === 0 ? 0 : 4;
		const begins = slot * settings.trackSeconds;
		const position = at - begins;
		const fresh = position < blockSeconds;
		const run: Running = {
			track: of,
			bank,
			begins,
			step: 0,
			until: begins + settings.trackSeconds + settings.crossfadeSeconds,
			rampFrom: begins,
			rampTo: fresh ? begins + settings.crossfadeSeconds : begins,
			fadeIn: true,
		};
		for (const part of PARTS) {
			voice.allOff(channel(run, part));
			voice.program(channel(run, part), of.instruments[part]);
		}
		setLevels(run, at);
		// A fresh track keeps its step zero even when the boundary fell inside the last block, so
		// its first chord is struck at the top of this one and not lost. A track joined later
		// skips to its place and strikes the chord it is inside.
		if (!fresh) {
			while (run.step < of.steps && begins + stepAt(of, run.step) < at) run.step++;
			fire(run, holding(of, Math.max(0, run.step - 1), settings), false);
		}
		running.push(run);
	};

	const end = (of: Running): Running => ({
		...of,
		rampFrom: of.begins + settings.trackSeconds,
		rampTo: of.begins + settings.trackSeconds + settings.crossfadeSeconds,
		fadeIn: false,
	});

	const left = new Float32Array(blockFrames);
	const right = new Float32Array(blockFrames);

	const next = (): Buffer => {
		const from = time;
		const to = time + blockSeconds;
		const slot = Math.floor(from / settings.trackSeconds);

		if (!running.some((run) => run.track.slot === slot)) {
			for (let i = 0; i < running.length; i++) running[i] = end(running[i]!);
			start(slot, from);
		}
		for (let i = running.length - 1; i >= 0; i--) {
			const run = running[i]!;
			if (run.until > from) continue;
			for (const part of PARTS) voice.allOff(channel(run, part));
			running.splice(i, 1);
		}
		const newest = running[running.length - 1];

		// The steps that fall inside this block, in time order across both tracks, each rendered
		// up to and fired at its own sample.
		interface Due { at: number; run: Running }
		const due: Due[] = [];
		for (const run of running) {
			for (let step = run.step; step < run.track.steps; step++) {
				const at = run.begins + stepAt(run.track, step);
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
			for (let i = 0; i < count; i++) {
				out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((l[i] ?? 0) * 32767))), (rendered + i) * 4);
				out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((r[i] ?? 0) * 32767))), (rendered + i) * 4 + 2);
			}
			rendered = frame;
		};

		for (const run of running) setLevels(run, from);
		for (const { at, run } of due) {
			renderTo(Math.min(blockFrames, Math.max(0, Math.round((at - from) * SAMPLE_RATE))));
			fire(run, events(run.track, run.step, settings), run === newest);
			run.step++;
		}
		renderTo(blockFrames);

		blocks++;
		time = began + blocks * blockSeconds;
		return out;
	};

	const playing = (): Playing => {
		const run = running[running.length - 1];
		if (run === undefined) {
			const of = track(Math.floor(time / settings.trackSeconds), settings);
			return { slot: of.slot, tempo: of.tempo, root: of.root, mode: of.mode, bar: 0, bars: of.steps / STEPS_PER_BAR };
		}
		return {
			slot: run.track.slot,
			tempo: run.track.tempo,
			root: run.track.root,
			mode: run.track.mode,
			bar: Math.floor(run.step / STEPS_PER_BAR),
			bars: run.track.steps / STEPS_PER_BAR,
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
