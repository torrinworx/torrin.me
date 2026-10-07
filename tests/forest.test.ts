// The forest around the site (forest.tsx), through the scenes and painters strip.ts gives it: the
// photo floating in the hero, the scenes that melt into the page at their edges, a post's own tree,
// the canopy that keeps off the content column and the vine that grows down a post, and the reeds.
// All of it runs in Node, frame by frame.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
	LIGHT,
	RULE_HEIGHTS,
	createCanopy,
	createReeds,
	createStrip,
	heroScale,
	heroScene,
	lostScene,
	pack,
	photoBox,
	photoLeft,
	plotScene,
	ruleScene,
	seedOf,
	shoreScene,
	tileScene,
} from '../frontend/strip.ts';
import type { StripConfig } from '../frontend/strip.ts';
import { FOREST, LIME, MOSS, PAPER, SAGE } from '../frontend/theme.ts';

const seeded = (): (() => number) => {
	let seed = 1;
	return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
};
const row = (painted: { width: number; pixels: Uint32Array }, y: number): number[] =>
	Array.from(painted.pixels.subarray(y * painted.width, (y + 1) * painted.width));
const column = (painted: { width: number; height: number; pixels: Uint32Array }, x: number): number[] =>
	Array.from({ length: painted.height }, (_, y) => painted.pixels[y * painted.width + x]!);

describe('the photo in the hero', () => {
	// A wide screen: 1300 CSS pixels at three to a strip pixel, the strip 680 CSS pixels tall.
	const CSS = 1300, W = Math.ceil(CSS / heroScale(CSS)), H = 227, GROUND = Math.round(H * 0.56);
	const GREY = pack('#808080');
	const photo = (width: number, height: number): Uint32Array => new Uint32Array(width * height).fill(GREY);
	const hero = (motion: boolean) => {
		const strip = createStrip(heroScene(false, CSS, photo), W, H, { motion, random: seeded() });
		strip.frame(0, 0);
		return strip;
	};

	it('is not there until the photo has loaded', () => {
		const strip = createStrip(heroScene(false, CSS, () => null), W, H, { motion: false });
		strip.frame(0, 0);
		assert.equal(strip.stoneAt, null);
	});

	it('stands at the end of the words\' column in a frame of the bank\'s colour', () => {
		const strip = hero(false), at = strip.stoneAt!;
		assert.equal(at.x, photoLeft(CSS));
		assert.equal(strip.pixels[(at.y + 5) * W + at.x], pack(LIGHT.bankTop), 'the frame');
		assert.equal(strip.pixels[(at.y + 5) * W + at.x + 1], GREY, 'the photo inside it');
	});

	// FLOAT: 25 strip pixels over the bank, bobbing 5 either way.
	it('floats over the bank, bobbing a few pixels and never touching it', () => {
		const strip = hero(true), height = photoBox(CSS).height, gaps: number[] = [];
		for (let i = 0; i < 600; i++) {
			strip.frame(1 / 60, i / 60);
			gaps.push(GROUND - (strip.stoneAt!.y + height));
		}
		assert.ok(Math.min(...gaps) >= 20 && Math.max(...gaps) <= 30, `the gap stays 20 to 30 pixels, not ${String(Math.min(...gaps))} to ${String(Math.max(...gaps))}`);
		assert.ok(Math.max(...gaps) - Math.min(...gaps) >= 8, 'and it bobs');
	});

	it('dips toward the water when pressed, and a press beside it does nothing', () => {
		const pressed = hero(true), left = hero(true);
		for (let i = 1; i <= 60; i++) { pressed.frame(1 / 60, i / 60); left.frame(1 / 60, i / 60); }
		const at = pressed.stoneAt!, box = photoBox(CSS);
		assert.equal(pressed.poke(0, 0), false, 'a press in the sky is not a press on the photo');
		assert.equal(pressed.poke(at.x + box.width / 2, at.y + box.height / 2), true);
		// A small dip, two or three strip pixels, that springs back.
		let deepest = 0;
		for (let i = 61; i <= 180; i++) {
			pressed.frame(1 / 60, i / 60); left.frame(1 / 60, i / 60);
			deepest = Math.max(deepest, pressed.stoneAt!.y - left.stoneAt!.y);
		}
		assert.ok(deepest >= 2, `it sank ${String(deepest)} pixels`);
		assert.ok(Math.abs(pressed.stoneAt!.y - left.stoneAt!.y) <= 1, 'and came back up');
	});

	// On a wide screen the words stand in the sky above the bank and in the pond below it. At night
	// only the moon and the fireflies are lime, so lime away from the moon is a firefly or its reflection.
	it('keeps the night\'s fireflies out of the words\' rows, reflections included', () => {
		const scene = heroScene(true, CSS, photo), strip = createStrip(scene, W, H, { motion: true, random: seeded() });
		const moonX = Math.round(scene.moon![0] * W), reach = Math.max(3, Math.round(H * 0.045)) + 3;
		const share = scene.fireflyTop!, top = Math.floor(GROUND * share) - 1, deepest = GROUND + Math.ceil(GROUND * (1 - share)) + 1;
		// The words' rows: the tagline ends 60 rows down, and the buttons start 181 rows down.
		assert.ok(top >= 60 && deepest < 181, `rows ${String(top)} to ${String(deepest)} leave the words clear`);
		const seen: number[] = [];
		for (let i = 0; i < 600; i++) {
			strip.frame(1 / 60, i / 60);
			let highest: readonly [number, number] | null = null;
			for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
				if (Math.abs(x - moonX) <= reach || strip.pixels[y * W + x] !== pack(LIME)) continue;
				seen.push(y);
				if (highest === null && y < GROUND) highest = [x, y];
			}
			// Fireflies flee the pointer, so one held just below the highest drives it up into its top.
			if (highest !== null) strip.move(highest[0], highest[1] + 5);
		}
		assert.ok(seen.length > 0, 'the fireflies are out');
		assert.ok(seen.every((y) => y >= top && y <= deepest), `between rows ${String(top)} and ${String(deepest)}, not ${String(Math.min(...seen))} to ${String(Math.max(...seen))}`);
	});

	it('does not move when pressed with motion off', () => {
		const strip = hero(false), at = strip.stoneAt!, box = photoBox(CSS);
		assert.equal(strip.poke(at.x + box.width / 2, at.y + box.height / 2), false);
		// With motion off the page holds the time still too (runScene), so every frame is at the same moment.
		for (let i = 1; i <= 60; i++) {
			strip.frame(1 / 60, 0);
			assert.deepEqual(strip.stoneAt, at, `still where it was on frame ${String(i)}`);
		}
	});
});

describe('the scenes around the site', () => {
	const still = (config: StripConfig, width: number, height: number) => {
		const strip = createStrip(config, width, height, { motion: false });
		strip.frame(0, 0);
		return strip;
	};

	for (const night of [false, true]) {
		const page = pack(night ? FOREST : PAPER), mode = night ? 'dark' : 'light';

		// The rule's last row is the line under the heading, the accent all the way across.
		for (const [index, tall] of RULE_HEIGHTS.entries()) {
			it(`the rule under heading ${String(index)} ends on an unbroken line in the accent, ${mode}`, () => {
				const strip = still(ruleScene(index, night, tall), 254, tall);
				assert.ok(row(strip, tall - 1).every((c) => c === pack(night ? LIME : MOSS)));
				assert.ok(row(strip, 0).some((c) => c === page), 'with the page above it');
			});
		}

		// The pond fades into the page before the bottom edge, so nothing is cut off there.
		const PONDS = [['a post\'s tile', tileScene(seedOf('a-post'), night), 36, 54], ['a post\'s plot', plotScene(seedOf('a-post'), night), 400, 110],
			['the footer\'s shore', shoreScene(night), 640, 150], ['the 404\'s tree', lostScene(night), 640, 125]] as const;
		for (const [name, config, width, height] of PONDS) {
			it(`${name} ends on the page colour, ${mode}`, () => {
				assert.ok(row(still(config, width, height), height - 1).every((c) => c === page));
			});
		}

		// A post's tree fades out at its sides, so the tile and the plot have no edge.
		for (const [name, config, width, height] of PONDS.slice(0, 2)) {
			it(`${name} fades into the page at its sides, ${mode}`, () => {
				const strip = still(config, width, height);
				assert.ok(column(strip, 0).every((c) => c === page) && column(strip, width - 1).every((c) => c === page));
			});
		}
	}

	it('gives a post the same tree every time, and each of the posts its own', () => {
		const slugs = (JSON.parse(readFileSync(new URL('../frontend/data/posts.json', import.meta.url), 'utf8')) as { slug: string }[]).map((post) => post.slug);
		assert.ok(slugs.length > 1);
		assert.deepEqual(slugs.map(seedOf), slugs.map(seedOf));
		assert.equal(new Set(slugs.map(seedOf)).size, slugs.length);
	});
});

describe('the canopy over an inner page', () => {
	const W = 400, H = 150, COLUMN = 200;
	const canopy = (options: { column?: number; grow?: () => number; night?: boolean } = {}) =>
		createCanopy({ width: W, height: H, column: options.column ?? COLUMN, seed: 7, night: options.night ?? false, ...(options.grow ? { grow: options.grow } : {}) });

	it('draws nothing over the content column, however the pointer stirs the vines', () => {
		const painted = canopy();
		const c0 = (W - COLUMN) / 2;
		for (let i = 0; i < 300; i++) {
			// Back and forth through the left margin, fast.
			painted.move?.(c0 - 30 + (i % 2) * 28, 20);
			painted.frame(1 / 60, i / 60);
			for (let y = 0; y < H; y++) for (let x = c0; x < W - c0; x++) assert.equal(painted.pixels[y * W + x], 0, `nothing at (${String(x)}, ${String(y)}) on frame ${String(i)}`);
		}
	});

	it('draws nothing at all on a screen with no margins', () => {
		const painted = canopy({ column: W });
		painted.frame(0, 0);
		assert.ok(painted.pixels.every((c) => c === 0));
	});

	// The vine nearest the column on the left grows as the reader goes through the post.
	it('grows its reading vine down the page as the post is read, and buds it at the end', () => {
		let through = 0;
		const painted = canopy({ grow: () => through });
		const x = Math.floor((W - COLUMN) / 2 - 7);
		const lowest = (): number => {
			let found = -1;
			for (let y = 0; y < H; y++) for (let dx = -3; dx <= 3; dx++) if (painted.pixels[y * W + x + dx] !== 0) found = y;
			return found;
		};
		const depths: number[] = [];
		for (const at of [0, 0.25, 0.5, 0.75, 0.97]) { through = at; painted.frame(0, 0); depths.push(lowest()); }
		assert.ok(depths.every((d, i) => i === 0 || d > depths[i - 1]!), `the vine reaches lower each time: ${depths.join(', ')}`);
		// The bud: a sage heart with lime on its four sides. The canopy itself never uses lime.
		const buds = (): number => painted.pixels.filter((c, i) => c === pack(SAGE)
			&& [i - W, i + W, i - 1, i + 1].every((k) => painted.pixels[k] === pack(LIME))).length;
		assert.equal(buds(), 0, 'no bud before the end');
		through = 1;
		painted.frame(0, 0);
		assert.equal(buds(), 1, 'one bud at the end');
	});
});

describe('the reeds on the radio', () => {
	const W = 254, H = 40, BANDS = 12;
	const reeds = (playing: boolean) => createReeds({
		width: W, height: H, night: false, bands: BANDS,
		heard: (out) => { if (!playing) return false; out.fill(1); return true; },
	});
	const top = (painted: { pixels: Uint32Array }): number => {
		for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (painted.pixels[y * W + x] !== 0) return y;
		return H;
	};

	it('stand taller while the radio plays loud than while it is quiet', () => {
		const loud = reeds(true), quiet = reeds(false);
		loud.frame(0, 0); quiet.frame(0, 0);
		assert.ok(top(loud) < top(quiet) - 5, `the loud reeds reach row ${String(top(loud))}, the quiet ones row ${String(top(quiet))}`);
	});

	it('fade into the page at the bottom and the sides', () => {
		const painted = reeds(true);
		for (let i = 0; i < 30; i++) painted.frame(1 / 60, i / 60);
		assert.ok(row(painted, H - 1).every((c) => c === 0), 'the bottom row');
		assert.ok(column(painted, 0).every((c) => c === 0) && column(painted, W - 1).every((c) => c === 0), 'the side columns');
	});
});
