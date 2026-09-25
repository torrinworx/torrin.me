// The sound of the station, in one place. Two styles, each with its own tempo, chords,
// instruments and tone, and the schedule that alternates them. Changing what the radio plays
// is an edit to this file and a deploy. Instruments are General MIDI program numbers as the
// soundfont lists them, and a drum kit is its program on the percussion channel.

export type StyleName = 'sleep' | 'synthwave';

export interface Style {
	/** Beats per minute, one value per track from this range. */
	readonly tempo: { readonly min: number; readonly max: number };
	/** How long a track lasts before the next one crossfades in, in seconds. */
	readonly trackSeconds: number;
	/** Bars a chord holds before moving on. */
	readonly barsPerChord: number;
	/** The modes a track may be in: semitone steps from the root. */
	readonly modes: Readonly<Record<string, readonly number[]>>;
	/** Progressions as scale degrees, 0 to 6. One is picked per track. */
	readonly progressions: readonly (readonly number[])[];
	/** The programs each part may be given, one per track. An empty list is a part that is silent. */
	readonly instruments: Readonly<Record<'pad' | 'keys' | 'bass' | 'lead', readonly number[]>>;
	/** The octave each part sits in: the MIDI octave of its root. */
	readonly octaves: Readonly<Record<'pad' | 'keys' | 'bass' | 'lead', number>>;
	/** The drum kit's program, or null for no drums at all. */
	readonly kit: number | null;
	/** Bars the drums take to come in at a track's start, and to leave at its end. */
	readonly drumFadeBars: number;
	/** Chance that a beat starts a lead note, and the chance a pair of bars is an arpeggio. */
	readonly lead: { readonly note: number; readonly arpeggio: number };
	/** Each part's level, 0 to 127. */
	readonly levels: Readonly<Record<'pad' | 'keys' | 'bass' | 'lead' | 'drums', number>>;
	/** The low-pass over the whole mix, in Hz. */
	readonly lowpassHz: number;
	/** Words a track's name is made of: one from each list. */
	readonly names: { readonly first: readonly string[]; readonly second: readonly string[] };
}

export interface Config {
	/** The styles in the order the station cycles through them. */
	readonly styles: readonly StyleName[];
	/** Tracks of one style before the next style's block. */
	readonly tracksPerBlock: number;
	/** How long the ending track and the starting one overlap, in seconds. */
	readonly crossfadeSeconds: number;
	readonly style: Readonly<Record<StyleName, Style>>;
	/** The sampler's reverb: room size, damping, stereo width and level, each 0 to 1. */
	readonly reverb: { readonly room: number; readonly damp: number; readonly width: number; readonly level: number };
	/** The sampler's gain. FluidSynth's default is 0.2, and the encoder evens the level out after. */
	readonly gain: number;
	/** The MP3 bitrate ffmpeg encodes at. */
	readonly bitrate: string;
}

const MINOR_MODES = {
	aeolian: [0, 2, 3, 5, 7, 8, 10],
	dorian: [0, 2, 3, 5, 7, 9, 10],
};

const OPEN_MODES = {
	ionian: [0, 2, 4, 5, 7, 9, 11],
	lydian: [0, 2, 4, 6, 7, 9, 11],
	mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

export const config: Config = {
	styles: ['sleep', 'synthwave'],
	tracksPerBlock: 3,
	crossfadeSeconds: 12,
	style: {
		// Measured off the reference: no beat, almost nothing above 500 Hz, level steady.
		sleep: {
			tempo: { min: 50, max: 60 },
			trackSeconds: 300,
			barsPerChord: 4,
			modes: OPEN_MODES,
			progressions: [[0, 3], [0, 5, 3], [0, 4, 5, 3], [0, 2, 3], [0, 3, 0, 4], [3, 0, 5, 0]],
			instruments: { pad: [89, 91, 94, 95, 52, 48], keys: [], bass: [89, 95, 48], lead: [] },
			octaves: { pad: 3, keys: 4, bass: 2, lead: 5 },
			kit: null,
			drumFadeBars: 0,
			lead: { note: 0, arpeggio: 0 },
			levels: { pad: 100, keys: 0, bass: 92, lead: 0, drums: 0 },
			lowpassHz: 600,
			names: {
				first: ['Slow', 'Low', 'Still', 'Deep', 'Soft', 'Late', 'Far', 'Blue', 'Quiet', 'Long'],
				second: ['Tide', 'Light', 'Water', 'Field', 'Hour', 'Shore', 'Sky', 'Room', 'Snow', 'Air'],
			},
		},
		// Measured off the reference: drums throughout, minor keys, most energy under 2 kHz, big
		// swings between intro, drop and breakdown.
		synthwave: {
			tempo: { min: 84, max: 118 },
			trackSeconds: 210,
			barsPerChord: 1,
			modes: MINOR_MODES,
			progressions: [[0, 5, 2, 6], [0, 6, 5, 6], [0, 3, 5, 4], [5, 6, 0, 0], [0, 2, 6, 5], [0, 5, 3, 6]],
			instruments: { pad: [90, 89, 95, 50], keys: [], bass: [38, 39, 87], lead: [81, 80, 86, 82] },
			octaves: { pad: 3, keys: 4, bass: 2, lead: 5 },
			kit: 25,
			drumFadeBars: 4,
			lead: { note: 0.35, arpeggio: 0.5 },
			levels: { pad: 74, keys: 0, bass: 92, lead: 64, drums: 100 },
			lowpassHz: 2600,
			names: {
				first: ['Night', 'Neon', 'Chrome', 'Last', 'Outrun', 'Midnight', 'Sodium', 'Vector', 'Coast', 'Grid'],
				second: ['Drive', 'Rain', 'Lines', 'Exit', 'Signal', 'Highway', 'Pulse', 'Horizon', 'Static', 'Mirage'],
			},
		},
	},
	reverb: { room: 0.8, damp: 0.25, width: 0.9, level: 0.65 },
	gain: 3,
	bitrate: '128k',
};
