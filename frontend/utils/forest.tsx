// The forest around the site: the scenes from strip.ts placed on pages, beside the landing's hero.
// The rule under each of the landing's section headings, the canopy over the margins of the inner
// pages (and the vine that grows down a post as it is read), the tree on each post and beside it on
// the blog's index, the shore the footer stands on, the reeds on the radio, and the tree on the 404.
//
// Every canvas here is decoration and is hidden from assistive technology. The page the build writes
// has the boxes and empty canvases, and each scene starts on the first frame after the page comes
// alive, in the mode the page is in.

import { mutable } from '@aweftjs/core';
import type { Derived } from '@aweftjs/core';
import { h } from '@aweftjs/ui';

import { BARS, levels, state } from '../radio.ts';
import {
	RULE_HEIGHTS,
	SWITCH_SECONDS,
	createCanopy,
	createReeds,
	lostScene,
	motion,
	plotScene,
	ruleScene,
	shoreScene,
	stripPainter,
	tileScene,
	runScene,
} from '../strip.ts';
import type { Scene, Watched } from '../strip.ts';
import { ModeContext, dark } from '../theme.ts';
import type { Mode } from '../theme.ts';

type Cleanup = (...fns: (() => void)[]) => void;

/** The mode as night or day, for a scene. Absent, the page is light. */
export const nightOf = (mode: Derived<Mode> | null): Watched =>
	(mode === null ? mutable(false) : mode.map((held) => held === dark));

/**
 * Start a scene on the element with this id on the first frame after the page comes alive, and stop
 * it with the component. Nothing happens where there are no frames: in the build, and in Node.
 */
export const useScene = (cleanup: Cleanup, id: string, scene: (host: HTMLElement) => Scene, night: Watched): void => {
	if (typeof requestAnimationFrame !== 'function') return;
	let stop = (): void => {};
	const first = requestAnimationFrame(() => {
		const host = document.getElementById(id);
		if (host !== null) stop = runScene(host, scene(host), night).stop;
	});
	cleanup(() => { cancelAnimationFrame(first); stop(); });
};

/** A box the forest paints, with its canvas. */
const Painted = (props: { id: string; theme: unknown; style?: Record<string, unknown> }): unknown => (
	<div id={props.id} theme={props.theme} style={props.style} aria-hidden="true">
		<canvas theme="scene_canvas" />
	</div>
);

let faded = false;

/**
 * Fade the whole page from one mode to the other: every colour on it eases over the same moment the
 * scenes take to fade (runScene). Call it just before the mode changes. With motion off it does
 * nothing, and the mode changes at once.
 */
export const crossfade = (): void => {
	if (typeof document === 'undefined' || !motion.get()) return;
	if (!faded) {
		faded = true;
		const style = document.createElement('style');
		const s = `${String(SWITCH_SECONDS)}s ease`;
		// Only while a switch runs: the page's own transitions (the buttons, the shine) are its own the rest of the time.
		style.textContent = `html.fading, html.fading * { transition: background-color ${s}, color ${s}, border-color ${s}, `
			+ `box-shadow ${s}, outline-color ${s}, text-decoration-color ${s}, fill ${s}, stroke ${s} !important; }`;
		document.head.append(style);
	}
	const root = document.documentElement;
	root.classList.add('fading');
	setTimeout(() => { root.classList.remove('fading'); }, SWITCH_SECONDS * 1000 + 100);
};

/**
 * The rule under the landing's `index`th section heading: the bank of a strip, with a tree at its
 * end that is a little taller under each heading. Until the page comes alive it is a plain line.
 */
export const Rule = ModeContext.use((mode) => (props: { index: number }, cleanup: Cleanup): unknown => {
	const id = `rule-${String(props.index)}`;
	const tall = RULE_HEIGHTS[props.index] ?? RULE_HEIGHTS[0];
	const night = nightOf(mode);
	useScene(cleanup, id, (host) => ({
		// The section the heading leads, so brushing past the tree from the text shakes it.
		pointer: host.parentElement?.parentElement ?? host,
		paint: (dark, width, height, _css, moving) => stripPainter(ruleScene(props.index, dark, height), width, height, moving),
	}), night);
	return <Painted id={id} theme="rule" style={{ height: tall * 3 }} />;
});

/**
 * The canopy over the margins of an inner page, from the top of the window. On a post, `grow` is
 * set and a vine grows down the left margin as the post is read, and buds at the end.
 */
export const Canopy = ModeContext.use((mode) => (props: { grow?: boolean }, cleanup: Cleanup): unknown => {
	const night = nightOf(mode);
	const reading = props.grow === true;
	const through = (): number => {
		const left = document.documentElement.scrollHeight - innerHeight;
		return left > 0 ? scrollY / left : 1;
	};
	useScene(cleanup, 'canopy', () => ({
		pointer: document.body,
		scroll: reading,
		paint: (dark, width, height, css, moving) => createCanopy({
			width, height, night: dark, moving, seed: reading ? 12 : 7,
			// The content column is 800 CSS pixels at most.
			column: Math.min(800, css) / (css / width),
			...(reading ? { grow: through } : {}),
		}),
	}), night);
	return <Painted id="canopy" theme="canopy" style={{ height: reading ? 640 : 440 }} />;
});

/** The tree beside a post on the blog's index, the post's own. */
export const Tile = ModeContext.use((mode) => (props: { slug: string; seed: number }, cleanup: Cleanup): unknown => {
	const id = `tile-${props.slug}`;
	useScene(cleanup, id, () => ({
		scale: () => 2,
		paint: (dark, width, height, _css, moving) => stripPainter(tileScene(props.seed, dark), width, height, moving),
	}), nightOf(mode));
	return <Painted id={id} theme="tile" />;
});

/** The same tree, larger, above the post's title. */
export const Plot = ModeContext.use((mode) => (props: { seed: number }, cleanup: Cleanup): unknown => {
	useScene(cleanup, 'plot', () => ({
		paint: (dark, width, height, _css, moving) => stripPainter(plotScene(props.seed, dark), width, height, moving),
	}), nightOf(mode));
	return <Painted id="plot" theme="plot" />;
});

/** The shore the footer stands on, across the window. */
export const Shore = ModeContext.use((mode) => (_props: Record<string, unknown>, cleanup: Cleanup): unknown => {
	useScene(cleanup, 'shore', (host) => ({
		pointer: host.parentElement ?? host,
		paint: (dark, width, height, _css, moving) => stripPainter(shoreScene(dark), width, height, moving),
	}), nightOf(mode));
	return <Painted id="shore" theme="shore_strip" />;
});

/** The 404 page's tree, alone across the window. */
export const Lost = ModeContext.use((mode) => (_props: Record<string, unknown>, cleanup: Cleanup): unknown => {
	useScene(cleanup, 'lost', () => ({
		paint: (dark, width, height, _css, moving) => stripPainter(lostScene(dark), width, height, moving),
	}), nightOf(mode));
	return <Painted id="lost" theme="lost" />;
});

/** The radio's reeds: one clump per band, standing as tall as the band is loud while the radio plays. */
export const Reeds = ModeContext.use((mode) => (_props: Record<string, unknown>, cleanup: Cleanup): unknown => {
	useScene(cleanup, 'radio-reeds', () => ({
		paint: (dark, width, height) => createReeds({
			width, height, night: dark, bands: BARS,
			heard: (out, t) => {
				if (state.get() !== 'playing') return false;
				levels(out, t * 1000);
				return true;
			},
		}),
	}), nightOf(mode));
	return <Painted id="radio-reeds" theme="reeds" />;
});
