// What plays the notes. The station is handed one of these and never knows which: FluidSynth
// over a soundfont on the droplet, a plain tone generator in the tests, where the soundfont is
// neither present nor wanted.

import { createRequire } from 'node:module';

import type * as JSSynthTypes from 'js-synthesizer';

import { config } from './config.ts';

// The package is CommonJS with a UMD entry and documents `require` for Node; a named import
// from it depends on what Node's lexer finds in that bundle, and this does not.
const require = createRequire(import.meta.url);
const JSSynth = require('js-synthesizer') as typeof JSSynthTypes;
const libfluidsynth = require('js-synthesizer/libfluidsynth') as unknown;

export const SAMPLE_RATE = 48000;

/** The percussion channel General MIDI reserves, counted from zero. */
export const DRUM_CHANNEL = 9;

export interface Voice {
	/** Give a channel an instrument, by General MIDI program number. */
	program(channel: number, program: number): void;
	on(channel: number, key: number, velocity: number): void;
	off(channel: number, key: number): void;
	/** A channel's level, 0 to 127. */
	volume(channel: number, level: number): void;
	/** Stop every note on a channel. */
	allOff(channel: number): void;
	/** Fill both buffers with the next samples. */
	render(left: Float32Array, right: Float32Array): void;
	close(): void;
}

const CC_VOLUME = 7;

/** FluidSynth, compiled to WebAssembly, over the soundfont handed in. */
export const fluid = async (soundfont: Buffer): Promise<Voice> => {
	JSSynth.Synthesizer.initializeWithFluidSynthModule(libfluidsynth as never);
	await JSSynth.waitForReady();
	// The library's file probes are stubs in this build and say so on every load; nothing here
	// reads a file through it.
	JSSynth.disableLogging();
	const synth = new JSSynth.Synthesizer();
	synth.init(SAMPLE_RATE, {
		reverbActive: true,
		reverbRoomSize: config.reverb.room,
		reverbDamp: config.reverb.damp,
		reverbWidth: config.reverb.width,
		reverbLevel: config.reverb.level,
		chorusActive: false,
		polyphony: 96,
		initialGain: config.gain,
	});
	// The synthesizer copies the bank into its own heap. A file this size is read into a buffer
	// of its own, so its bytes are handed over as they are; a slice would be a third copy of
	// 32 MB, and the droplet has about 320 MB free.
	const bytes = soundfont.byteOffset === 0 && soundfont.byteLength === soundfont.buffer.byteLength
		? soundfont.buffer as ArrayBuffer
		: soundfont.buffer.slice(soundfont.byteOffset, soundfont.byteOffset + soundfont.byteLength) as ArrayBuffer;
	await synth.loadSFont(bytes);
	return {
		program: (channel, program) => { synth.midiProgramChange(channel, program); },
		on: (channel, key, velocity) => { synth.midiNoteOn(channel, key, velocity); },
		off: (channel, key) => { synth.midiNoteOff(channel, key); },
		volume: (channel, level) => { synth.midiControl(channel, CC_VOLUME, level); },
		allOff: (channel) => { synth.midiAllNotesOff(channel); },
		render: (left, right) => { synth.render([left, right]); },
		close: () => { synth.close(); },
	};
};

/**
 * Sine tones with a short attack and a release, one per sounding note, and a channel volume.
 * Enough to hear that the station works, and to measure that it produces sound.
 */
export const tone = (): Voice => {
	interface Sounding { channel: number; key: number; phase: number; target: number; gain: number; releasing: boolean }
	const notes: Sounding[] = [];
	const levels = new Map<number, number>();
	const level = (channel: number): number => (levels.get(channel) ?? 100) / 127;
	return {
		program: () => {},
		on: (channel, key, velocity) => {
			notes.push({ channel, key, phase: 0, target: velocity / 127, gain: 0, releasing: false });
		},
		off: (channel, key) => {
			for (const note of notes) if (note.channel === channel && note.key === key) note.releasing = true;
		},
		volume: (channel, value) => { levels.set(channel, value); },
		allOff: (channel) => {
			for (const note of notes) if (note.channel === channel) note.releasing = true;
		},
		render: (left, right) => {
			left.fill(0);
			right.fill(0);
			for (const note of notes) {
				const step = (2 * Math.PI * 440 * Math.pow(2, (note.key - 69) / 12)) / SAMPLE_RATE;
				for (let i = 0; i < left.length; i++) {
					note.gain = note.releasing ? note.gain * 0.9997 : Math.min(note.target, note.gain + note.target / 480);
					const sample = Math.sin(note.phase) * note.gain * 0.15 * level(note.channel);
					left[i] = (left[i] ?? 0) + sample;
					right[i] = (right[i] ?? 0) + sample;
					note.phase += step;
				}
			}
			for (let i = notes.length - 1; i >= 0; i--) {
				if (notes[i]!.releasing && notes[i]!.gain < 0.0005) notes.splice(i, 1);
			}
		},
		close: () => { notes.length = 0; },
	};
};
