// The composer. A track is a pure function of its slot number, and what happens on any step of
// it is a pure function of the track and the step, so two processes at the same moment play the
// same notes and a restart picks up mid-track. Nothing here keeps state between calls.
//
// Time is counted in sixteenth-note steps, sixteen to a bar. The station turns steps into seconds
// with the track's tempo.

import { config } from './config.ts';
import type { Config } from './config.ts';

export const STEPS_PER_BAR = 16;

/** The parts a track has. Every event names one; the station maps them to MIDI channels. */
export type Part = 'pad' | 'keys' | 'bass' | 'melody' | 'drums';

export interface Event {
	readonly part: Part;
	readonly key: number;
	/** 1 to 127 for a note on, 0 for a note off. */
	readonly velocity: number;
}

export interface Chord {
	/** The scale degree the chord is built on, 0 to 6. */
	readonly degree: number;
	/** Root, fifth and octave, low: what the pad holds. */
	readonly pad: readonly number[];
	/** Third, seventh and ninth in the middle: what the keys play. */
	readonly keys: readonly number[];
	/** The root, low. */
	readonly bass: number;
	readonly fifth: number;
}

export interface Track {
	readonly slot: number;
	readonly tempo: number;
	/** Semitones above C. */
	readonly root: number;
	readonly mode: string;
	readonly chords: readonly Chord[];
	readonly instruments: Readonly<Record<Exclude<Part, 'drums'>, number>>;
	/** How far an off-beat sixteenth is pushed late, as a fraction of a step. */
	readonly swing: number;
	/** Steps in the track: enough bars to cover the slot at this tempo. */
	readonly steps: number;
}

// A small, fast generator with a full period: mulberry32. Two of them per track, one for the
// track's shape and, through `chance`, one per step, so a step never has to replay the steps
// before it to know its own dice.
const generator = (seed: number): (() => number) => {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

const mix = (...parts: number[]): number => {
	let h = 0x811c9dc5;
	for (const part of parts) {
		h = Math.imul(h ^ (part >>> 0), 0x01000193);
		h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
	}
	return h >>> 0;
};

/** A number in [0, 1) that is always the same for the same track, step and purpose. */
export const chance = (track: Track, step: number, salt: number): number =>
	generator(mix(track.slot, step, salt))();

const pick = <T>(random: () => number, from: readonly T[]): T => from[Math.floor(random() * from.length)]!;

const between = (random: () => number, min: number, max: number): number =>
	min + Math.floor(random() * (max - min + 1));

/** The MIDI key of a scale degree, any number of octaves up or down. */
const keyOf = (root: number, scale: readonly number[], degree: number, octave: number): number => {
	const wrapped = ((degree % 7) + 7) % 7;
	const shift = Math.floor(degree / 7);
	return 12 * (octave + shift) + root + scale[wrapped]!;
};

// The degrees a progression walks between, weighted: home, the subdominants and the relative
// minor carry it. The dominant is rarer, and the third and the diminished seventh never come.
const DEGREES = [0, 0, 0, 3, 3, 5, 5, 1, 4];

const chordOf = (root: number, scale: readonly number[], degree: number): Chord => ({
	degree,
	pad: [keyOf(root, scale, degree, 3), keyOf(root, scale, degree + 4, 3), keyOf(root, scale, degree, 4)],
	keys: [keyOf(root, scale, degree + 2, 4), keyOf(root, scale, degree + 6, 4), keyOf(root, scale, degree + 8, 4)],
	bass: keyOf(root, scale, degree, 2),
	fifth: keyOf(root, scale, degree + 4, 2),
});

/** The track that plays in one slot. The same slot always answers the same track. */
export const track = (slot: number, settings: Config = config): Track => {
	const random = generator(mix(slot, 0x7261646f));
	const tempo = between(random, settings.tempo.min, settings.tempo.max);
	const root = between(random, 0, 11);
	const mode = pick(random, Object.keys(settings.modes));
	const scale = settings.modes[mode]!;

	const count = between(random, settings.chords.min, settings.chords.max);
	const chords: Chord[] = [];
	let last = -1;
	for (let i = 0; i < count; i++) {
		let degree = i === 0 && random() < 0.6 ? 0 : pick(random, DEGREES);
		while (degree === last) degree = pick(random, DEGREES);
		chords.push(chordOf(root, scale, degree));
		last = degree;
	}

	const instruments = {
		pad: pick(random, settings.instruments.pad),
		keys: pick(random, settings.instruments.keys),
		bass: pick(random, settings.instruments.bass),
		melody: pick(random, settings.instruments.melody),
	};
	const swing = 0.08 + random() * 0.12;

	const secondsPerBar = (60 / tempo) * 4;
	const bars = Math.ceil(settings.trackSeconds / secondsPerBar);
	return { slot, tempo, root, mode, chords, instruments, swing, steps: bars * STEPS_PER_BAR };
};

/** Seconds one step lasts at the track's tempo. */
export const stepSeconds = (of: Track): number => 60 / of.tempo / 4;

/** When a step falls, in seconds from the track's start: the off-beat sixteenths come late. */
export const stepAt = (of: Track, step: number): number =>
	stepSeconds(of) * (step + (step % 2 === 1 ? of.swing : 0));

const chordAt = (of: Track, step: number, settings: Config): Chord => {
	const bar = Math.floor(step / STEPS_PER_BAR);
	return of.chords[Math.floor(bar / settings.barsPerChord) % of.chords.length]!;
};

/** Whether a chord's bass steps up to the fifth for its last beat. */
const fifthStruck = (of: Track, boundary: number, chordSpan: number): boolean =>
	chance(of, boundary - 4, 10) < 0.3 && boundary >= chordSpan;

const on = (part: Part, key: number, velocity: number): Event => ({ part, key, velocity: Math.max(1, Math.min(127, Math.round(velocity))) });
const off = (part: Part, key: number): Event => ({ part, key, velocity: 0 });

// The melody is the one part whose notes have a length of their own, so a step has to ask the
// steps before it whether one of them started a note that ends now, or is still sounding. A
// candidate is the dice alone. A note is a candidate no earlier candidate still covers. The
// earlier candidate counts whether or not it became a note, so the rule looks back one level
// and never recurses.
const MELODY_MAX_STEPS = 12;
const MELODY_DEGREES = [0, 1, 2, 4, 5, 7, 8, 9];

const melodyCandidate = (of: Track, step: number, settings: Config): { key: number; length: number } | null => {
	if (step % 4 !== 0 && chance(of, step, 1) > 0.25) return null;
	if (chance(of, step, 2) >= settings.melody) return null;
	const scale = settings.modes[of.mode]!;
	const chord = chordAt(of, step, settings);
	const degree = chord.degree + pick(generator(mix(of.slot, step, 3)), MELODY_DEGREES);
	const key = keyOf(of.root, scale, degree, 5);
	const length = 2 + Math.floor(chance(of, step, 4) * (MELODY_MAX_STEPS - 2));
	return { key, length };
};

const melodyStart = (of: Track, step: number, settings: Config): { key: number; length: number } | null => {
	const candidate = melodyCandidate(of, step, settings);
	if (candidate === null) return null;
	for (let back = 1; back <= MELODY_MAX_STEPS; back++) {
		const earlier = step - back;
		if (earlier < 0) break;
		const sounding = melodyCandidate(of, earlier, settings);
		if (sounding !== null && earlier + sounding.length > step) return null;
	}
	return candidate;
};

/** How much of the drums a step carries: nothing at the edges of a track, all in the middle. */
const drumWeight = (of: Track, step: number, settings: Config): number => {
	const fade = settings.drumFadeBars * STEPS_PER_BAR;
	const fromStart = step / fade;
	const fromEnd = (of.steps - step) / fade;
	return Math.max(0, Math.min(1, fromStart, fromEnd)) * settings.drums;
};

/** What happens on one step of a track: the notes that start and the notes that stop. */
export const events = (of: Track, step: number, settings: Config = config): Event[] => {
	const out: Event[] = [];
	const inBar = step % STEPS_PER_BAR;
	const chordSpan = settings.barsPerChord * STEPS_PER_BAR;
	const chord = chordAt(of, step, settings);

	// The chord parts change together, on the first step of a chord. The previous chord's notes
	// stop on that same step, and the instrument's own release carries them under the new ones.
	if (step % chordSpan === 0) {
		if (step > 0) {
			const previous = chordAt(of, step - 1, settings);
			for (const key of previous.pad) out.push(off('pad', key));
			for (const key of previous.keys) out.push(off('keys', key));
			out.push(off('bass', fifthStruck(of, step, chordSpan) ? previous.fifth : previous.bass));
		}
		for (const key of chord.pad) out.push(on('pad', key, 72 + chance(of, step, 5) * 16));
		for (const key of chord.keys) out.push(on('keys', key, 56 + chance(of, step, 6) * 20));
		out.push(on('bass', chord.bass, 70 + chance(of, step, 7) * 12));
	}
	// A softer second touch of the keys on the last bar of a chord, some of the time.
	if (step % chordSpan === chordSpan - STEPS_PER_BAR && chance(of, step, 8) < 0.45) {
		for (const key of chord.keys) out.push(off('keys', key), on('keys', key, 40 + chance(of, step, 9) * 14));
	}
	// The bass steps up to the fifth for the last beat of a chord, some of the time.
	if (step % chordSpan === chordSpan - 4 && fifthStruck(of, step + 4, chordSpan)) {
		out.push(off('bass', chord.bass), on('bass', chord.fifth, 62));
	}

	for (let back = 1; back <= MELODY_MAX_STEPS; back++) {
		const earlier = step - back;
		if (earlier < 0) break;
		const started = melodyStart(of, earlier, settings);
		if (started !== null && earlier + started.length === step) out.push(off('melody', started.key));
	}
	const melody = melodyStart(of, step, settings);
	if (melody !== null) out.push(on('melody', melody.key, 48 + chance(of, step, 11) * 22));

	const weight = drumWeight(of, step, settings);
	if (weight > 0) {
		const hit = (key: number, velocity: number, odds = 1): void => {
			if (odds < 1 && chance(of, step, 20 + key) >= odds) return;
			out.push(on('drums', key, velocity * weight));
		};
		if (inBar === 0) hit(36, 96);
		if (inBar === 10) hit(36, 70, 0.5);
		if (inBar === 8) hit(37, 76);
		if (inBar % 4 === 2) hit(42, 44);
		if (inBar % 4 === 0 && inBar !== 0) hit(42, 34, 0.7);
		if (inBar === 14) hit(46, 30, 0.2);
	}

	return out;
};

/**
 * The chord-part notes that would be sounding at a step, for a station joining a track in the
 * middle: the chord that step is inside, as it was struck.
 */
export const holding = (of: Track, step: number, settings: Config = config): Event[] => {
	const chord = chordAt(of, step, settings);
	const chordSpan = settings.barsPerChord * STEPS_PER_BAR;
	const boundary = step - (step % chordSpan) + chordSpan;
	// The bass may already be on the fifth for the chord's last beat, and the next boundary will
	// stop whichever it struck, so what is struck here has to be the same one.
	const bass = step >= boundary - 4 && fifthStruck(of, boundary, chordSpan) ? chord.fifth : chord.bass;
	return [
		...chord.pad.map((key) => on('pad', key, 76)),
		...chord.keys.map((key) => on('keys', key, 60)),
		on('bass', bass, 72),
	];
};
