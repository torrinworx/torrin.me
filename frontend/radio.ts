// The player: one audio element for the whole site, made on the first play and never put in the
// page, so moving between pages does not stop it. What it plays is the live stream, and a stop
// drops the connection rather than pausing, so the next play joins the broadcast where it is
// and not where this listener left it.
//
// The Media Session is what puts the station on a phone's lock screen with play and pause.

import { mutable } from '@aweftjs/core';

export type State = 'stopped' | 'tuning' | 'playing' | 'failed';

/** Where the stream is: nginx in production, vite's proxy in development. */
export const STREAM = '/radio/stream';

export const state = mutable<State>('stopped');

let audio: HTMLAudioElement | null = null;
// Which press the pending `play()` belongs to. A stop, or a second press, ends the earlier one
// with a rejection that is not a failure of the stream.
let presses = 0;

const stop = (): void => {
	if (audio !== null) {
		audio.pause();
		audio.removeAttribute('src');
		audio.load();
	}
	state.set('stopped');
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
			navigator.mediaSession.metadata = new MediaMetadata({
				title: 'torrin.me radio',
				artist: 'Torrin Leonard',
				artwork: [{ src: '/site-card.png', sizes: '1200x630', type: 'image/png' }],
			});
			navigator.mediaSession.setActionHandler('play', () => { play(); });
			navigator.mediaSession.setActionHandler('pause', () => { stop(); });
			navigator.mediaSession.setActionHandler('stop', () => { stop(); });
		}
	}
	state.set('tuning');
	audio.src = STREAM;
	const press = ++presses;
	audio.play().catch(() => {
		if (press === presses && state.get() === 'tuning') state.set('failed');
	});
};

export const radio = { play, stop };
