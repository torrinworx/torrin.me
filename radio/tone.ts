// The low-pass over the whole mix: a two-pole filter per channel whose cutoff can be moved
// between blocks, which is how one style's tone crossfades into the other's. The coefficients
// are the usual ones for a second-order low-pass with a flat passband.

import { SAMPLE_RATE } from './voice.ts';

export interface Tone {
	/** Move the cutoff, in Hz. Takes effect on the next block. */
	cutoff(hz: number): void;
	/** Filter both channels in place. */
	apply(left: Float32Array, right: Float32Array): void;
}

export const tone = (hz: number): Tone => {
	let b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0;
	const state = [new Float32Array(4), new Float32Array(4)];

	const cutoff = (at: number): void => {
		const w = (2 * Math.PI * Math.min(at, SAMPLE_RATE * 0.45)) / SAMPLE_RATE;
		const alpha = Math.sin(w) / (2 * Math.SQRT1_2);
		const cos = Math.cos(w);
		const a0 = 1 + alpha;
		b0 = ((1 - cos) / 2) / a0;
		b1 = (1 - cos) / a0;
		b2 = b0;
		a1 = (-2 * cos) / a0;
		a2 = (1 - alpha) / a0;
	};
	cutoff(hz);

	const run = (samples: Float32Array, s: Float32Array): void => {
		let x1 = s[0]!, x2 = s[1]!, y1 = s[2]!, y2 = s[3]!;
		for (let i = 0; i < samples.length; i++) {
			const x = samples[i]!;
			const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
			x2 = x1; x1 = x; y2 = y1; y1 = y;
			samples[i] = y;
		}
		s[0] = x1; s[1] = x2; s[2] = y1; s[3] = y2;
	};

	return {
		cutoff,
		apply: (left, right) => { run(left, state[0]!); run(right, state[1]!); },
	};
};
