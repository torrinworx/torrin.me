// The composer. A track is a pure function of its slot number, and what happens on any step of
// it is a pure function of the track and the step, so two processes at the same moment play the
// same notes and a restart picks up mid-track. Nothing here keeps state between calls.
//
// Time is counted in sixteenth-note steps, sixteen to a bar. The station turns steps into seconds
// with the track's tempo. Which style a slot is comes from the schedule, and each style has its
// own rules below: sleep is pads and a drone with nothing struck, synthwave is a kick on every
// beat with a bass that ducks under it.

import { config } from './config.ts';
import type { Config, Style, StyleName } from './config.ts';
import { slotOf } from './schedule.ts';

export const STEPS_PER_BAR = 16;

/** The parts a track has. Every event names one. The station maps them to MIDI channels. */
export type Part = 'pad' | 'keys' | 'bass' | 'lead' | 'drums' | 'duck';

export interface Event {
	readonly part: Part;
	readonly key: number;
	/** 1 to 127 for a note on, 0 for a note off. For `duck`, the bass level to set, as a percentage. */
	readonly velocity: number;
}

export interface Chord {
	/** The scale degree the chord is built on, 0 to 6. */
	readonly degree: number;
	/** Root, fifth and octave: what the pad holds. */
	readonly pad: readonly number[];
	/** Third, seventh and ninth above: what the keys play, when there are keys. */
	readonly keys: readonly number[];
	/** The root, low. */
	readonly bass: number;
	readonly fifth: number;
	/** The chord's tones in the lead's octave, for arpeggios. */
	readonly tones: readonly number[];
}

export interface Track {
	readonly slot: number;
	readonly style: StyleName;
	readonly name: string;
	readonly tempo: number;
	/** Semitones above C. */
	readonly root: number;
	readonly mode: string;
	readonly chords: readonly Chord[];
	/** Programs per part. A part with no program is silent. */
	readonly instruments: Readonly<Partial<Record<Exclude<Part, 'drums' | 'duck'>, number>>>;
	/** How far an off-beat sixteenth is pushed late, as a fraction of a step. */
	readonly swing: number;
	/** Steps in the track: enough bars to cover its length at this tempo. */
	readonly steps: number;
}

export const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** The key as a name, like "A minor" or "D lydian": the two everyday modes by their everyday names. */
export const keyName = (of: Track): string => {
	const mode = of.mode === 'aeolian' ? 'minor' : of.mode === 'ionian' ? 'major' : of.mode;
	return `${KEY_NAMES[of.root]!} ${mode}`;
};

// A small, fast generator with a full period: mulberry32. One per track for its shape and,
// through `chance`, one per step, so a step never has to replay the steps before it.
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

const chordOf = (root: number, scale: readonly number[], degree: number, octaves: Style['octaves']): Chord => ({
	degree,
	pad: [keyOf(root, scale, degree, octaves.pad), keyOf(root, scale, degree + 4, octaves.pad), keyOf(root, scale, degree, octaves.pad + 1)],
	keys: [keyOf(root, scale, degree + 2, octaves.keys), keyOf(root, scale, degree + 6, octaves.keys), keyOf(root, scale, degree + 8, octaves.keys)],
	bass: keyOf(root, scale, degree, octaves.bass),
	fifth: keyOf(root, scale, degree + 4, octaves.bass),
	tones: [keyOf(root, scale, degree, octaves.lead), keyOf(root, scale, degree + 2, octaves.lead), keyOf(root, scale, degree + 4, octaves.lead), keyOf(root, scale, degree + 7, octaves.lead)],
});

const styleOf = (of: Track, settings: Config): Style => settings.style[of.style];

/** The track that plays in one slot. The same slot always answers the same track. */
export const track = (slot: number, settings: Config = config): Track => {
	const where = slotOf(slot, settings);
	const style = settings.style[where.style];
	const random = generator(mix(slot, 0x7261646f));
	const tempo = between(random, style.tempo.min, style.tempo.max);
	const root = between(random, 0, 11);
	const mode = pick(random, Object.keys(style.modes));
	const scale = style.modes[mode]!;
	const chords = pick(random, style.progressions).map((degree) => chordOf(root, scale, degree, style.octaves));
	const instruments: Record<string, number> = {};
	for (const part of ['pad', 'keys', 'bass', 'lead'] as const) {
		if (style.instruments[part].length > 0) instruments[part] = pick(random, style.instruments[part]);
	}
	// Synthwave sits straight on the grid. Sleep has no grid to hear, and a little swing is what
	// keeps a pad's second voice from landing on the drone.
	const swing = where.style === 'synthwave' ? 0 : 0.08 + random() * 0.12;
	const name = `${pick(random, style.names.first)} ${pick(random, style.names.second)}`;
	const secondsPerBar = (60 / tempo) * 4;
	const bars = Math.ceil(where.seconds / secondsPerBar);
	return { slot, style: where.style, name, tempo, root, mode, chords, instruments, swing, steps: bars * STEPS_PER_BAR };
};

/** Seconds one step lasts at the track's tempo. */
export const stepSeconds = (of: Track): number => 60 / of.tempo / 4;

/** When a step falls, in seconds from the track's start: the off-beat sixteenths come late. */
export const stepAt = (of: Track, step: number): number =>
	stepSeconds(of) * (step + (step % 2 === 1 ? of.swing : 0));

const chordSpanOf = (of: Track, settings: Config): number => styleOf(of, settings).barsPerChord * STEPS_PER_BAR;

const chordAt = (of: Track, step: number, settings: Config): Chord =>
	of.chords[Math.floor(step / chordSpanOf(of, settings)) % of.chords.length]!;

const on = (part: Part, key: number, velocity: number): Event => ({ part, key, velocity: Math.max(1, Math.min(127, Math.round(velocity))) });
const off = (part: Part, key: number): Event => ({ part, key, velocity: 0 });
const duck = (percent: number): Event => ({ part: 'duck', key: 0, velocity: percent });

/** How much of the drums a step carries: nothing at the edges of a track, all in the middle. */
const drumWeight = (of: Track, step: number, style: Style): number => {
	if (style.kit === null) return 0;
	const fade = style.drumFadeBars * STEPS_PER_BAR;
	if (fade === 0) return 1;
	return Math.max(0, Math.min(1, step / fade, (of.steps - step) / fade));
};

// Synthwave's breakdown: the drums leave for eight bars a little past the middle of a track,
// and the bar before they come back is a fill.
const BREAKDOWN_BARS = 8;
const breakdownStart = (of: Track): number => Math.floor((of.steps / STEPS_PER_BAR) * 0.6) * STEPS_PER_BAR;
const inBreakdown = (of: Track, step: number): boolean =>
	step >= breakdownStart(of) && step < breakdownStart(of) + BREAKDOWN_BARS * STEPS_PER_BAR;

// The lead's notes have a length of their own, so a step asks the steps before it whether one
// of them started a note that ends now or is still sounding. A candidate is the dice alone. A
// note is a candidate no earlier candidate still covers, whether or not that one became a
// note, so the rule looks back one level and never recurses.
const LEAD_MAX_STEPS = 8;
const LEAD_DEGREES = [0, 2, 4, 7, 9, 11, 14];

interface Started { readonly key: number; readonly length: number }

const leadCandidate = (of: Track, step: number, settings: Config): Started | null => {
	const style = styleOf(of, settings);
	if (of.instruments.lead === undefined || style.lead.note === 0) return null;
	if (step % 4 !== 0 && chance(of, step, 1) > 0.3) return null;
	if (chance(of, step, 2) >= style.lead.note) return null;
	const scale = style.modes[of.mode]!;
	const chord = chordAt(of, step, settings);
	const degree = chord.degree + pick(generator(mix(of.slot, step, 3)), LEAD_DEGREES);
	const key = keyOf(of.root, scale, degree, style.octaves.lead);
	const length = 2 + Math.floor(chance(of, step, 4) * (LEAD_MAX_STEPS - 2));
	return { key, length };
};

const leadStart = (of: Track, step: number, settings: Config): Started | null => {
	const candidate = leadCandidate(of, step, settings);
	if (candidate === null) return null;
	for (let back = 1; back <= LEAD_MAX_STEPS; back++) {
		const earlier = step - back;
		if (earlier < 0) break;
		const sounding = leadCandidate(of, earlier, settings);
		if (sounding !== null && earlier + sounding.length > step) return null;
	}
	return candidate;
};

/** Whether a bar is an arpeggio bar: the lead runs the chord's tones on eighths instead of singing. */
const arpeggioBar = (of: Track, step: number, settings: Config): boolean => {
	const style = styleOf(of, settings);
	if (of.instruments.lead === undefined || style.lead.arpeggio === 0) return false;
	// Two bars at a time, so a figure gets to repeat once.
	const pair = Math.floor(step / (2 * STEPS_PER_BAR)) * 2 * STEPS_PER_BAR;
	return chance(of, pair, 12) < style.lead.arpeggio;
};

const sleepEvents = (of: Track, step: number, settings: Config): Event[] => {
	const out: Event[] = [];
	const chordSpan = chordSpanOf(of, settings);
	const chord = chordAt(of, step, settings);
	// The pad and the drone change together on the first step of a chord. The previous chord's
	// notes stop on the same step, and the instrument's own release carries them under.
	if (step % chordSpan === 0) {
		if (step > 0) {
			const previous = chordAt(of, step - 1, settings);
			for (const key of previous.pad) out.push(off('pad', key));
			out.push(off('bass', previous.bass));
		}
		for (const key of chord.pad) out.push(on('pad', key, 64 + chance(of, step, 5) * 16));
		out.push(on('bass', chord.bass, 70 + chance(of, step, 7) * 10));
	}
	// A second voice of the pad, an octave above the fifth, comes and goes on the half-chord.
	if (step % chordSpan === chordSpan / 2 && chance(of, step, 8) < 0.5) {
		out.push(on('pad', chord.pad[1]! + 12, 40 + chance(of, step, 9) * 12));
	}
	if (step % chordSpan === chordSpan - 2 && chance(of, step - chordSpan / 2 + 2, 8) < 0.5) {
		out.push(off('pad', chord.pad[1]! + 12));
	}
	return out;
};

const synthwaveEvents = (of: Track, step: number, settings: Config): Event[] => {
	const out: Event[] = [];
	const style = styleOf(of, settings);
	const inBar = step % STEPS_PER_BAR;
	const chordSpan = chordSpanOf(of, settings);
	const chord = chordAt(of, step, settings);
	const quiet = inBreakdown(of, step);
	const weight = quiet ? 0 : drumWeight(of, step, style);

	if (step % chordSpan === 0) {
		if (step > 0) for (const key of chordAt(of, step - 1, settings).pad) out.push(off('pad', key));
		for (const key of chord.pad) out.push(on('pad', key, 70 + chance(of, step, 5) * 14));
	}

	// The bass: the root on every sixteenth, an octave up on the off-beats, ducked by the kick.
	// It rests in the breakdown's first half so the pad and the lead have the room.
	const rests = quiet && step < breakdownStart(of) + (BREAKDOWN_BARS / 2) * STEPS_PER_BAR;
	const bassKey = (at: number): number => {
		const held = chordAt(of, at, settings);
		return at % 2 === 1 ? held.bass + 12 : held.bass;
	};
	if (!rests) {
		if (step > 0 && !(quiet && step === breakdownStart(of) + (BREAKDOWN_BARS / 2) * STEPS_PER_BAR)) out.push(off('bass', bassKey(step - 1)));
		out.push(on('bass', bassKey(step), inBar % 4 === 0 ? 100 : 84));
	} else if (step === breakdownStart(of)) {
		out.push(off('bass', bassKey(step - 1)));
	}

	// The kick ducks the bass: down on the beat, back up over the three steps after.
	if (weight > 0) out.push(duck([35, 60, 85, 100][inBar % 4]!));
	else if (inBar === 0) out.push(duck(100));

	// The lead: an arpeggio over the chord on eighths, or a sung line, two bars at a time. A sung
	// note still sounding when an arpeggio begins is cut, so the two never hold one key at once.
	if (of.instruments.lead !== undefined) {
		const arpeggio = arpeggioBar(of, step, settings);
		for (let back = 1; back <= LEAD_MAX_STEPS; back++) {
			const earlier = step - back;
			if (earlier < 0) break;
			if (arpeggioBar(of, earlier, settings)) continue;
			const started = leadStart(of, earlier, settings);
			if (started === null) continue;
			const ends = earlier + started.length;
			if (arpeggio ? inBar === 0 && ends >= step : ends === step) out.push(off('lead', started.key));
		}
		if (arpeggio) {
			if (inBar % 2 === 0) {
				if (inBar > 0) out.push(off('lead', chord.tones[((inBar / 2) + 3) % 4]!));
				else if (step > 0 && arpeggioBar(of, step - 1, settings)) out.push(off('lead', chordAt(of, step - 1, settings).tones[3]!));
				out.push(on('lead', chord.tones[(inBar / 2) % 4]!, 58 + chance(of, step, 11) * 14));
			}
			if (inBar === STEPS_PER_BAR - 1 && !arpeggioBar(of, step + 1, settings)) out.push(off('lead', chord.tones[3]!));
		} else {
			const lead = leadStart(of, step, settings);
			if (lead !== null) out.push(on('lead', lead.key, 60 + chance(of, step, 11) * 20));
		}
	}

	if (weight > 0) {
		const hit = (key: number, velocity: number, odds = 1): void => {
			if (odds < 1 && chance(of, step, 20 + key) >= odds) return;
			out.push(on('drums', key, velocity * weight));
		};
		const fill = step >= breakdownStart(of) - STEPS_PER_BAR && step < breakdownStart(of);
		if (inBar % 4 === 0) hit(36, 118);
		if (inBar === 4 || inBar === 12) hit(38, 112);
		if (inBar % 2 === 0) hit(42, inBar % 4 === 0 ? 70 : 52);
		if (inBar % 4 === 3) hit(42, 44, 0.6);
		if (inBar === 14) hit(46, 48, 0.25);
		if (inBar === 7 || inBar === 15) hit(37, 40, 0.3);
		if (fill && inBar % 2 === 1) hit(38, 70 + inBar * 2);
	}

	return out;
};

/** What happens on one step of a track: the notes that start and the notes that stop. */
export const events = (of: Track, step: number, settings: Config = config): Event[] =>
	(of.style === 'sleep' ? sleepEvents(of, step, settings) : synthwaveEvents(of, step, settings));

/**
 * The chord-part notes that would be sounding at a step, for a station joining a track in the
 * middle: the chord that step is inside, as it was struck.
 */
export const holding = (of: Track, step: number, settings: Config = config): Event[] => {
	const chord = chordAt(of, step, settings);
	const out: Event[] = chord.pad.map((key) => on('pad', key, 70));
	if (of.style === 'sleep') out.push(on('bass', chord.bass, 72));
	return out;
};
