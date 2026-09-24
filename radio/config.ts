// The sound of the station, in one place. Everything the composer and the encoder take as a
// number or a list is here, so changing what the radio plays is an edit to this file and a
// deploy. Instruments are General MIDI program numbers, as the soundfont lists them.

export interface Config {
	readonly tempo: { readonly min: number; readonly max: number };
	readonly trackSeconds: number;
	readonly crossfadeSeconds: number;
	readonly barsPerChord: number;
	readonly chords: { readonly min: number; readonly max: number };
	readonly modes: Readonly<Record<string, readonly number[]>>;
	readonly instruments: Readonly<Record<'pad' | 'keys' | 'bass' | 'melody', readonly number[]>>;
	readonly drums: number;
	readonly drumFadeBars: number;
	readonly melody: number;
	readonly levels: Readonly<Record<'pad' | 'keys' | 'bass' | 'melody' | 'drums', number>>;
	readonly reverb: { readonly room: number; readonly damp: number; readonly width: number; readonly level: number };
	readonly gain: number;
	readonly lowpassHz: number;
	readonly bitrate: string;
}

export const config: Config = {
	/** Beats per minute, one value per track from this range. Slow enough to sleep to. */
	tempo: { min: 58, max: 70 },
	/** How long a track lasts before the next one crossfades in, in seconds. */
	trackSeconds: 240,
	/** How long the ending track and the starting one overlap, in seconds. */
	crossfadeSeconds: 12,
	/** Bars a chord holds before moving on. Two at 60 bpm is eight seconds. */
	barsPerChord: 2,
	/** How many chords a track cycles through, one value per track from this range. */
	chords: { min: 4, max: 6 },
	/** The modes a track may be in: semitone steps from the root. Nothing with a harsh fifth. */
	modes: {
		ionian: [0, 2, 4, 5, 7, 9, 11],
		dorian: [0, 2, 3, 5, 7, 9, 10],
		lydian: [0, 2, 4, 6, 7, 9, 11],
		mixolydian: [0, 2, 4, 5, 7, 9, 10],
		aeolian: [0, 2, 3, 5, 7, 8, 10],
	},
	/** The programs each part may be given, one per track. */
	instruments: {
		pad: [88, 89, 91, 92, 94, 95, 52],
		keys: [4, 5, 11, 8, 10, 99],
		bass: [32, 33, 35, 38],
		melody: [11, 8, 10, 4, 73, 79],
	},
	/**
	 * Drums, 0 to 1: 0 is none, 1 is every hit the pattern has at full weight. They also fade in
	 * over a track's first bars and out over its last.
	 */
	drums: 0.3,
	/** Bars the drums take to fade in at a track's start, and to fade out at its end. */
	drumFadeBars: 8,
	/**
	 * Chance that a beat starts a melody note; an off-beat sixteenth has a quarter of it. A
	 * note that is still sounding blocks the next, so the melody lands a little under this.
	 */
	melody: 0.14,
	/** Each part's level, 0 to 127. */
	levels: { pad: 82, keys: 78, bass: 72, melody: 66, drums: 58 },
	/** The sampler's reverb: room size, damping, stereo width and level, each 0 to 1. */
	reverb: { room: 0.8, damp: 0.25, width: 0.9, level: 0.65 },
	/** The sampler's gain. FluidSynth's default is 0.2; the encoder evens the level out after. */
	gain: 1.5,
	/** The encoder's low-pass, in Hz. Lower is warmer and further away. */
	lowpassHz: 3800,
	/** The MP3 bitrate ffmpeg encodes at. */
	bitrate: '128k',
};
