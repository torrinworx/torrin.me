// The sweep that crosses the resume and contact buttons every few seconds.
//
// One span, always present, in the static render and in the browser alike. Only the sweep itself is
// browser-only, because it runs on animation frames and a static render has none.
//
// Two earlier versions were wrong in the same way. The first pushed a span per sweep and spliced it
// out afterwards, so the button grew and snapped back: between the node landing in the DOM and its
// class being minted, the span is an ordinary in-flow child of a flex button and contributes its
// width. The second kept one span but built it only where there are frames, so the page the build
// wrote and the page the browser renders had different children, and `ui`'s button padding is
// decided by `:has(> svg:first-child)` and `:has(> svg:last-child)`: one extra child changes which
// of those match, and the button changed width by 2px on hydration.
//
// So the span is in both trees, and everything keeping it out of flow is an inline style rather
// than a themed rule, so it can never be laid out before the rule that positions it arrives.

import { mutable, timer } from '@aweftjs/core';
import { h } from '@aweftjs/ui';

const RUN = 'transform 0.8s ease-out, opacity 0.8s ease-out';

const framesOf = (): ((fn: () => void) => number) | undefined =>
	(globalThis as { requestAnimationFrame?: (fn: () => void) => number }).requestAnimationFrame;

/**
 * The shine a button holds.
 *
 * Params:
 *   cleanup: the component's own, so the timer stops when the button goes
 *
 * Returns: a node to mount inside the button. Put `shiny` in the button's theme so it clips.
 */
export const useShine = (cleanup: (...fns: (() => void)[]) => void): unknown => {
	const offset = mutable(-150);
	const opacity = mutable(0);
	const move = mutable('none');

	const request = framesOf();
	if (request !== undefined) {
		const sweep = (): void => {
			// Back to the start with no transition, or it animates backwards across the button.
			move.set('none');
			offset.set(-150);
			opacity.set(0.9);
			// Two frames: one to put it where it starts, one to move it, so the transition has a
			// value to run from.
			request(() => request(() => {
				move.set(RUN);
				offset.set(150);
				opacity.set(0);
			}));
		};
		// Every other tick of a two-second timer, which is one sweep every four seconds.
		cleanup(timer(2000).watch((tick) => { if (tick % 2 === 0) sweep(); }));
		sweep();
	}

	return <span
		theme="shine"
		aria-hidden="true"
		style={{
			position: 'absolute',
			top: 0,
			left: 0,
			width: '200%',
			height: '100%',
			pointerEvents: 'none',
			transform: offset.map((at) => `translateX(${String(at)}%) skewX(-20deg)`),
			opacity,
			transition: move,
		}}
	/>;
};
