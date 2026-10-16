// Animated headings: a heading line ending in `{animate: <name>}` (content/blog.ts) gets a small
// pixel emblem at its left, and when the heading is well into the window its emblem plays and a
// curtain of pixels over its words dissolves into them (createEmblem, frontend/scenes.ts). Then
// the emblem stands still beside the plain heading.
//
// The heading's words are real text from the first frame, for a screen reader, a search and the
// contents list; the canvas only paints over them. The emblem's box is in the page the server
// writes, so nothing moves when the page comes alive. With motion off the emblem is still and
// the words are bare.

import { h } from '@aweftjs/ui';

import { createEmblem } from '../scenes.ts';
import { runScene } from '../strip.ts';
import type { Running } from '../strip.ts';
import { ModeContext } from '../theme.ts';
import { nightOf } from './forest.tsx';

/** The styles a heading can play in. A new one is a name here and a case in `createEmblem`. */
export const ANIMATIONS = ['atoms', 'qubits', 'bits'] as const;
export type Animation = typeof ANIMATIONS[number];

/** A heading's words, after the box its emblem stands in, under the canvas both are painted on. */
export const AnimatedText = (props: { text: string; style: Animation }): unknown => (
	<span theme="animated" data-animated={props.style}>
		<canvas theme="animated_paint" aria-hidden="true" />
		<span theme="animated_mark" data-mark="" />
		<span theme="animated_text">{props.text}</span>
	</span>
);

// A strip pixel is two CSS pixels, so an emblem the height of a heading line is about twenty across.
const SCALE = (): number => 2;

/**
 * Runs every animated heading on the page once it is alive. Each plays once, when all of it is in
 * the top two thirds of the window, where a reader's eyes are, and then rests. One per page.
 */
export const Animations = ModeContext.use((mode) => (_props: Record<string, unknown>, cleanup: (...fns: (() => void)[]) => void): unknown => {
	if (typeof requestAnimationFrame !== 'function') return null;
	const running: Running[] = [];
	let watched: IntersectionObserver | null = null;
	const first = requestAnimationFrame(() => {
		const starts = new Map<Element, () => void>();
		for (const root of Array.from(document.querySelectorAll<HTMLElement>('[data-animated]'))) {
			const mark = root.querySelector<HTMLElement>('[data-mark]')!;
			let started: number | null = null;
			const run = runScene(root, {
				scale: SCALE,
				paint: (night, width, height, _css, moving) => createEmblem({
					width, height, night, moving, started: () => started, style: root.dataset['animated']!, mark: Math.round(mark.getBoundingClientRect().width / SCALE()),
				}),
			}, nightOf(mode));
			running.push(run);
			starts.set(root, () => { started = run.time(); });
		}
		watched = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				watched?.unobserve(entry.target);
				starts.get(entry.target)?.();
			}
		}, { rootMargin: '0px 0px -33% 0px', threshold: 1 });
		for (const root of starts.keys()) watched.observe(root);
	});
	cleanup(() => { cancelAnimationFrame(first); watched?.disconnect(); for (const run of running) run.stop(); });
	return null;
});
