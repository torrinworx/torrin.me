// The player: one audio element for the whole site, made on the first play and never put in the
// page, so moving between pages does not stop it. What it plays is the live stream, and a stop
// drops the connection rather than pausing, so the next play joins the broadcast where it is
// and not where this listener left it.
//
// The Media Session is what puts the station on a phone's lock screen with play and pause.
//
// The bars the page draws come from one of two sources. On a desktop the stream goes through
// the browser's analyser and the bars are its spectrum. On a phone the audio is never routed
// through the browser's audio engine, because iPhones stop that engine when the screen locks,
// so the bars pulse to the beat instead, placed from the server's clock: the time at the press,
// less the backlog, plus what the element has played since.

import { mutable } from '@aweftjs/core';

export type State = 'stopped' | 'tuning' | 'playing' | 'failed';

/** Where the stream is: nginx in production, vite's proxy in development. */
export const STREAM = '/radio/stream';
export const NOW = '/radio/now';

/** What the station answers about the track on the air. */
export interface Now {
	readonly time: number;
	readonly backlogSeconds: number;
	readonly style: 'sleep' | 'synthwave';
	readonly name: string;
	readonly tempo: number;
	readonly key: string;
	readonly begins: number;
	readonly seconds: number;
	readonly blockEnds: number;
}

export const state = mutable<State>('stopped');
export const now = mutable<Now | null>(null);

export const BARS = 24;

export type Source = 'spectrum' | 'tempo';

/** Which source the bars use: the spectrum on a desktop, the tempo on a touch screen, where the audio is not routed through the audio engine. */
export const sourceFor = (env: { readonly coarsePointer: boolean; readonly webAudio: boolean }): Source =>
	(env.coarsePointer || !env.webAudio ? 'tempo' : 'spectrum');

let audio: HTMLAudioElement | null = null;
// Which press the pending `play()` belongs to. A stop, or a second press, ends the earlier one
// with a rejection that is not a failure of the stream.
let presses = 0;
let analyser: AnalyserNode | null = null;
let spectrum: Uint8Array<ArrayBuffer> | null = null;
let listened = false;
// The server's time of the audio being heard when this press began: the time at the press, less the backlog.
let anchor: number | null = null;

export const source = (): Source => sourceFor({
	coarsePointer: typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches,
	webAudio: typeof AudioContext === 'function',
});

export const refresh = async (): Promise<Now | null> => {
	try {
		const answer = await fetch(NOW, { cache: 'no-store' });
		if (!answer.ok) return null;
		const heard = await answer.json() as Now;
		now.set(heard);
		if (state.get() === 'playing') title(heard);
		return heard;
	} catch {
		return null;
	}
};

/** What the lock screen shows: the track on the air, under the station's name. */
const title = (heard: Now | null): void => {
	if (!('mediaSession' in navigator)) return;
	navigator.mediaSession.metadata = new MediaMetadata({
		title: heard === null ? 'torrin.me radio' : heard.name,
		artist: heard === null ? 'Torrin Leonard' : 'torrin.me radio',
		artwork: [{ src: '/site-card.png', sizes: '1200x630', type: 'image/png' }],
	});
};

const stop = (): void => {
	// Counted as a press, so a /now answer that arrives after this stop, from the play before it, does not set the anchor.
	presses++;
	if (audio !== null) {
		audio.pause();
		audio.removeAttribute('src');
		audio.load();
	}
	anchor = null;
	state.set('stopped');
};

/**
 * Route the element through the browser's audio engine and an analyser, for the bars, and only
 * for the spectrum source: on a phone the element is left alone, so the audio keeps playing
 * when the screen locks. `Context` is the engine to use, the browser's unless a test hands in
 * its own.
 */
export const listen = (element: HTMLAudioElement, kind: Source, Context: typeof AudioContext | undefined = globalThis.AudioContext): void => {
	if (kind !== 'spectrum' || listened || Context === undefined) return;
	listened = true;
	const context = new Context();
	analyser = context.createAnalyser();
	// 2048 gives bins 23 Hz apart, so the bass gets more than one bar to itself.
	analyser.fftSize = 2048;
	analyser.smoothingTimeConstant = 0.8;
	context.createMediaElementSource(element).connect(analyser);
	analyser.connect(context.destination);
	spectrum = new Uint8Array(analyser.frequencyBinCount);
};

const play = (): void => {
	if (audio === null) {
		audio = new Audio();
		audio.preload = 'none';
		audio.addEventListener('playing', () => { state.set('playing'); });
		audio.addEventListener('waiting', () => { state.set('tuning'); });
		audio.addEventListener('error', () => { state.set('failed'); });
		audio.addEventListener('stalled', () => { state.set('tuning'); });
		if ('mediaSession' in navigator) {
			title(null);
			navigator.mediaSession.setActionHandler('play', () => { play(); });
			navigator.mediaSession.setActionHandler('pause', () => { stop(); });
			navigator.mediaSession.setActionHandler('stop', () => { stop(); });
		}
		listen(audio, source());
	}
	state.set('tuning');
	audio.src = STREAM;
	const press = ++presses;
	void refresh().then((heard) => {
		if (heard !== null && press === presses) anchor = heard.time - heard.backlogSeconds;
	});
	audio.play().then(() => {
		if (press === presses) title(now.get());
	}).catch(() => {
		if (press === presses && state.get() === 'tuning') state.set('failed');
	});
};

export const radio = { play, stop };

/** The moment of the stream that is being heard right now, in the server's seconds, or null. */
const audible = (): number | null =>
	(anchor === null || audio === null ? null : anchor + audio.currentTime);

const idle = (out: Float32Array, at: number): void => {
	for (let i = 0; i < out.length; i++) out[i] = 0.06 + 0.04 * (0.5 + 0.5 * Math.sin(at / 1400 + i * 0.7));
};

/** A number in [0, 1) that is the same for the same beat and bar, so a beat's shape holds until the next. */
const shape = (beat: number, bar: number): number => {
	let h = Math.imul(beat + 1, 0x9e3779b1) ^ Math.imul(bar + 1, 0x85ebca6b);
	h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/**
 * The bars, 0 to 1 each, for one frame. `at` is the page's clock in milliseconds. Idle when
 * nothing plays, the spectrum or the beat when something does.
 */
export const levels = (out: Float32Array, at: number): void => {
	if (state.get() !== 'playing') { idle(out, at); return; }
	if (analyser !== null && spectrum !== null) {
		analyser.getByteFrequencyData(spectrum);
		// Bins spaced by the log of frequency, so the bass does not take half the bars.
		const bins = spectrum.length;
		for (let i = 0; i < out.length; i++) {
			const from = Math.floor(Math.pow(bins, i / out.length));
			const to = Math.max(from + 1, Math.floor(Math.pow(bins, (i + 1) / out.length)));
			let peak = 0;
			for (let b = from; b < to && b < bins; b++) peak = Math.max(peak, spectrum[b]!);
			out[i] = Math.max(0.04, peak / 255);
		}
		return;
	}
	const heard = now.get();
	const moment = audible();
	if (heard === null || moment === null) { idle(out, at); return; }
	if (heard.style === 'sleep') {
		// No beat to follow: a slow rise and fall, each bar a little behind the last one.
		for (let i = 0; i < out.length; i++) out[i] = 0.12 + 0.3 * (0.5 + 0.5 * Math.sin(moment / 3 + i * 0.35));
		return;
	}
	const beats = (moment - heard.begins) * (heard.tempo / 60);
	const beat = Math.floor(beats);
	const phase = beats - beat;
	const hit = Math.exp(-phase * 4);
	for (let i = 0; i < out.length; i++) {
		const weight = 0.35 + 0.65 * shape(beat, i);
		out[i] = 0.08 + 0.85 * hit * weight;
	}
};
