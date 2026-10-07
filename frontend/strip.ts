// The pixel-art scenes: the strip at the top of the landing page (drawn trees, a pond that reflects
// them, leaves that fall when the cursor touches a tree's crown, birds, fireflies at night, ripples
// where the cursor crosses the pond) and the smaller scenes on the other pages. The strip was
// approved as https://claude.ai/artifact/WfGHVZb54iFvZTbUHKXwfP (work order 485). The photo floating
// over it and the other scenes were approved as https://claude.ai/artifact/8LvHKbwqDGKm2dgPnZHTw5.
//
// Two halves. `createStrip`, `createCanopy` and `createReeds` paint into pixel buffers and need no
// DOM, so the favicon script and the tests run them in Node. `runScene` puts one on a canvas in a
// page, sizes it, feeds it the pointer and runs it only while it is on screen and `motion` is on.
//
// Colours are packed as ImageData lays them out on a little-endian machine: 0xAABBGGRR.

import { mutable } from '@aweftjs/core';

import { FOREST, LIME, MOSS, PAPER, PAPER_A, PINE, SAGE, STACKED } from './theme.ts';

/**
 * Whether the scenes animate. Off, every scene holds still and no bird flies. WCAG 2.2.2 asks for a
 * way to stop anything that moves on its own for more than five seconds, and this is it. It starts
 * off for a visitor whose system asks for reduced motion, and the menu's switch sets it.
 */
export const motion = mutable(true);

/** A tree: where it stands across the width, its height against the sky, and its own seed if it has one. */
export type Tree = readonly [x: number, height: number, seed?: number];

export interface Palette {
	/** Bands from the top of the sky to the horizon. The first is the page colour. */
	readonly sky: readonly string[];
	/** The far hills, then the near ones. */
	readonly hills: readonly string[];
	/** A crown's five tones, darkest first. */
	readonly tones: readonly string[];
	/** Bark: shade, body, lit side. */
	readonly wood: readonly string[];
	readonly bankTop: string;
	readonly bank: readonly string[];
	readonly water: string;
	readonly sparkle: string;
	readonly trough: string;
	readonly vine: string;
	readonly vineLeaf: readonly string[];
	readonly tuft: readonly string[];
	readonly firefly: string;
	readonly moon: string;
	readonly bird: string;
}

export interface StripConfig {
	readonly seed: number;
	/** Where the bank is, as a share of the height. At one half the pond mirrors the whole sky. */
	readonly ground: number;
	readonly reflection: boolean;
	/** Seconds between leaves that fall on their own, on average. */
	readonly ambient: number;
	/** The direction the light comes from, as a unit-ish vector in screen space. */
	readonly light: readonly [number, number];
	readonly trees: readonly Tree[];
	readonly palette: Palette;
	readonly birds?: number;
	readonly flock?: boolean;
	readonly fireflies?: number;
	/**
	 * How high the fireflies rise, as a share of the way from the top down to the bank: 0.3 when left
	 * off. A scene with words in its sky keeps them below the words, and their reflections above any
	 * words in its pond, so none ever stops behind a letter.
	 */
	readonly fireflyTop?: number;
	/** Where the moon is, as shares of the width and of the sky. */
	readonly moon?: readonly [number, number];
	/** How tall the hills are, against the default. */
	readonly hills?: number;
	/** Whether crowns grow hanging vines. */
	readonly vines?: boolean;
	readonly stone?: Stone;
	/** For a strip narrower than the window: how many pixels it takes to fade out at each side. */
	readonly sides?: number;
}

/**
 * A picture in the scene, behind the trees: on the bank, or floating over it. Its lift, bob, vines
 * and island are read every frame, so a page can change them while the strip runs.
 */
export interface Stone {
	/** Its left edge, in strip pixels. */
	readonly x: number;
	readonly width: number;
	readonly height: number;
	/** Its packed pixels, row by row. */
	readonly pixels: Uint32Array;
	/** How far it floats above the bank, and how far it bobs up and down, in strip pixels. */
	readonly lift?: number;
	readonly bob?: number;
	/** How long its longest vine is, in strip pixels. */
	readonly vines?: number;
	/** Whether it stands on a clump of earth. */
	readonly island?: boolean;
	/** How many birds stand on its top edge. */
	readonly birds?: number;
}

export interface Strip {
	readonly width: number;
	readonly height: number;
	/** The frame, one packed colour per pixel, row by row. */
	readonly pixels: Uint32Array;
	/** Advance by `dt` seconds to time `t` and paint. */
	frame(dt: number, t: number): void;
	/** The pointer moved to a point in strip pixels. */
	move(x: number, y: number): void;
	/** The pointer left. */
	leave(): void;
	/** How many leaves are falling or lying on the bank. */
	leaves(): number;
	/** The pointer pressed at a point in strip pixels. Whether it pressed the stone. */
	poke(x: number, y: number): boolean;
	/** Where the stone's top left corner is this frame, or null with no stone. */
	readonly stoneAt: { readonly x: number; readonly y: number } | null;
}

/** The light strip. Its sky starts at the page colour, so the top edge is invisible. */
export const LIGHT: Palette = {
	sky: [PAPER, PAPER, '#EEF2DF'],
	hills: ['#E3EAD0', '#D3DDB8'],
	tones: [FOREST, PINE, MOSS, SAGE, LIME],
	wood: ['#0C1D0C', FOREST, PINE],
	bankTop: MOSS, bank: [PINE, FOREST],
	water: '#D3DDBB', sparkle: PAPER_A, trough: SAGE,
	vine: PINE, vineLeaf: [MOSS, SAGE], tuft: [MOSS, SAGE],
	firefly: LIME, moon: LIME, bird: FOREST,
};

/** The night strip, for the dark mode. Its sky starts at forest, the dark page colour. */
export const NIGHT: Palette = {
	sky: [FOREST, FOREST, '#1A341A', '#21401F'],
	hills: ['#1B381C', '#0F220F'],
	tones: ['#0A170A', '#10240F', '#1E3B1C', PINE, '#5E8238'],
	wood: ['#050D05', '#0B180B', '#1A331A'],
	bankTop: '#1E3B1C', bank: ['#0F220F', '#0A170A'],
	water: '#0B180B', sparkle: SAGE, trough: '#050D05',
	vine: '#1E3B1C', vineLeaf: [PINE, MOSS], tuft: ['#1E3B1C', PINE],
	// The night strip has no birds; this is the one on the resume button, which stands against the
	// forest page and so takes the second ink.
	firefly: LIME, moon: LIME, bird: SAGE,
};

/** The landing hero's seed. Its trees are seeded from it in order, so its third tree is `treeSeed(HERO_SEED, 2)`. */
export const HERO_SEED = 5;

/** A strip's `index`th tree is seeded from the strip's seed and its place in the list. */
export const treeSeed = (seed: number, index: number): number => seed * 31 + index;

/** The size of one strip pixel on a screen this wide. */
export const heroScale = (width: number): number => (width >= 440 ? 3 : 2);

/** The light coming from the upper left by day and the upper right by night, where the moon is. */
const lightOf = (night: boolean): readonly [number, number] => (night ? [0.6, -0.8] : [-0.6, -0.8]);

/**
 * The photo's box in the hero, in strip pixels and frame included: 180 by 240 CSS pixels on a wide
 * screen, 132 by 176 when the words stack above the strip.
 */
export const photoBox = (width: number): { readonly width: number; readonly height: number } => {
	const size = heroScale(width);
	const [w, h] = width <= STACKED ? [132, 176] : [180, 240];
	return { width: Math.round(w / size), height: Math.round(h / size) };
};

/**
 * Where the photo's left edge stands in a hero this wide, in strip pixels. On a wide screen it ends
 * where the words' column ends. Stacked, it is centred.
 */
export const photoLeft = (width: number): number => {
	const size = heroScale(width), box = photoBox(width), across = Math.ceil(width / size);
	if (width <= STACKED) return Math.round((across - box.width) / 2);
	const end = width - Math.max(0, (width - 840) / 2) - 40;
	return Math.round((end - box.width * size) / size);
};

/**
 * How the photo floats: high enough over the bank that the hero does not read as standing on the
 * ground, bobbing a few pixels, with vines down from its foot and a clump of earth under it. In
 * strip pixels, as Torrin set them on the sketch's sliders.
 */
export const FLOAT = { lift: 25, bob: 5, vines: 30 } as const;

const heroCache = new Map<string, StripConfig>();

/**
 * The hero's scene for a mode and a width in CSS pixels.
 *
 * `photo` is the photo's pixels at a size, its inner box without the frame, or null while it has
 * not loaded. Without it the trees stand where they would around it and nothing floats. The same
 * object comes back for the same answer, so a resize that keeps the layout keeps the scene.
 *
 * The bank is a little over halfway down on a wide screen, so the pond is shallower than the sky
 * and its reflections fade into the page before its bottom edge. Stacked, the strip is taller and
 * the bank lower. The hills are kept low so the words in the sky stand clear of them.
 */
export const heroScene = (
	night: boolean,
	width: number,
	photo?: (width: number, height: number) => Uint32Array | null,
): StripConfig => {
	const size = heroScale(width), across = Math.ceil(width / size);
	const box = photoBox(width), left = photoLeft(width), stacked = width <= STACKED;
	const inner = photo?.(box.width - 2, box.height - 2) ?? null;
	const key = `${String(night)} ${String(width)} ${String(inner !== null)}`;
	const held = heroCache.get(key);
	if (held !== undefined) return held;
	const at = (x: number): number => x / across;
	const trees: readonly Tree[] = stacked
		? [[0.05, 0.42], [at(left - 10), 0.42], [at(left + box.width + 9), 0.36], [0.95, 0.5]]
		: [[at(left - 46), 0.42], [at(left - 12), 0.46], [at(left + box.width + 10), 0.4], [at(left + box.width + 46), 0.36]];
	const palette = night ? NIGHT : LIGHT;
	let stone: Stone | undefined;
	if (inner !== null) {
		// The photo with the bank's top colour as a frame, so it reads as part of the scene.
		const frame = pack(palette.bankTop), iw = box.width - 2, pixels = new Uint32Array(box.width * box.height);
		for (let y = 0; y < box.height; y++) for (let x = 0; x < box.width; x++) {
			const edge = x === 0 || y === 0 || x === box.width - 1 || y === box.height - 1;
			pixels[y * box.width + x] = edge ? frame : inner[(y - 1) * iw + x - 1]!;
		}
		// Birds stand on it by day, as elsewhere in the strip. At night there are fireflies instead.
		stone = { x: left, width: box.width, height: box.height, pixels, ...FLOAT, island: true, birds: night ? 0 : 2 };
	}
	const scene: StripConfig = {
		seed: HERO_SEED,
		ground: stacked ? 0.62 : 0.56,
		hills: 0.5,
		reflection: true,
		ambient: night ? 1 : 0.9,
		light: lightOf(night),
		trees,
		palette,
		...(stone === undefined ? {} : { stone }),
		// On a wide screen the words sit over the strip's upper half and the buttons over its pond.
		// The fireflies are kept below the words, and their reflections above the buttons.
		...(night ? { fireflies: 12, moon: stacked ? [0.84, 0.1] as const : [0.53, 0.12] as const, ...(stacked ? {} : { fireflyTop: 0.6 }) } : { birds: 2, flock: true }),
	};
	// A page shows one width at a time. The cache holds the last few, so switching the mode back is free.
	if (heroCache.size > 8) heroCache.clear();
	heroCache.set(key, scene);
	return scene;
};

// --- the scenes around the site -------------------------------------------------------------
//
// Each is a strip whose sky is the page colour all the way down, with no hills. The runner makes that
// colour transparent, so the page shows through and only the trees, the bank and the pond are drawn.

const paged = (night: boolean): Palette => {
	const palette = night ? NIGHT : LIGHT, page = night ? FOREST : PAPER;
	return { ...palette, sky: [page, page], hills: [] };
};

/** The heights of the trees under the landing's five section headings, in strip pixels. Each is taller than the last. */
export const RULE_HEIGHTS = [14, 22, 32, 44, 58] as const;

/**
 * The rule under the landing's `index`th section heading: a bank one pixel tall in the accent colour,
 * which draws the rule, and a tree at its right end that is taller under each heading than the last.
 * The trees under the fourth and fifth headings have vines, and by day a bird stands on the last.
 */
export const ruleScene = (index: number, night: boolean, height: number): StripConfig => {
	const line = night ? LIME : MOSS;
	return {
		seed: 41 + index,
		ground: (height - 1) / height,
		reflection: false,
		ambient: 3.5,
		light: lightOf(night),
		trees: [[0.94, 0.95]],
		vines: index >= 3,
		birds: !night && index === RULE_HEIGHTS.length - 1 ? 1 : 0,
		palette: { ...paged(night), bankTop: line, bank: [line, line] },
	};
};

/**
 * The seed of a post's tree, from its slug, so a post always gets the same tree. FNV-1a over the
 * slug, reduced to the range of tree seeds.
 */
export const seedOf = (slug: string): number => {
	let h = 2166136261;
	for (const c of slug) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
	return (h >>> 0) % 100000;
};

/** The tile beside a post on the blog's index: its tree alone on a bank, mirrored, fading out at the sides. */
export const tileScene = (seed: number, night: boolean): StripConfig => ({
	seed, ground: 0.5, reflection: true, ambient: 9, light: lightOf(night), trees: [[0.5, 0.95, seed]], sides: 5,
	palette: paged(night),
});

/** The plot above a post's title: the same tree, larger, with a bird by day and fireflies at night. */
export const plotScene = (seed: number, night: boolean): StripConfig => ({
	seed, ground: 0.5, reflection: true, ambient: 1.4, light: lightOf(night), trees: [[0.5, 0.92, seed]], sides: 24,
	palette: paged(night),
	...(night ? { fireflies: 5 } : { birds: 1 }),
});

/** Where the footer's trees are drawn: four at each side, clear of the social links and the copyright line. */
export const SHORE_TREES: readonly Tree[] = [[0.04, 0.42], [0.11, 0.62], [0.19, 0.38], [0.27, 0.5], [0.73, 0.48], [0.81, 0.36], [0.89, 0.6], [0.97, 0.44]];

/** The footer's scene: a pixel-art shore across the window, the social links over its upper half and the copyright over its pond. */
export const shoreScene = (night: boolean, trees: readonly Tree[] = SHORE_TREES): StripConfig => ({
	seed: 11, ground: 0.5, hills: 0.8, reflection: true, ambient: 2, light: lightOf(night), trees,
	palette: night ? NIGHT : LIGHT,
	// The fireflies keep below the social row, and their reflections above the copyright.
	...(night ? { fireflies: 8, fireflyTop: 0.5, moon: [0.62, 0.7] as const } : { birds: 1, flock: true }),
});

/** The 404 page's scene: one drawn tree. */
export const lostScene = (night: boolean): StripConfig => ({
	seed: 404, ground: 0.56, hills: 0.7, reflection: true, ambient: 1.6, light: lightOf(night), trees: [[0.5, 0.8]],
	palette: night ? NIGHT : LIGHT,
	...(night ? { fireflies: 6, moon: [0.76, 0.24] as const } : { birds: 1 }),
});

/** How far down the pond, as a share of its depth, its reflection starts to fade out. */
const FADE = 0.4;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x: number, y: number): number => BAYER[(y & 3) * 4 + (x & 3)]!;
const hash = (x: number, y: number): number => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

/** `#rrggbb` as a packed pixel. */
export const pack = (hex: string): number =>
	(0xFF000000 | parseInt(hex.slice(5, 7), 16) << 16 | parseInt(hex.slice(3, 5), 16) << 8 | parseInt(hex.slice(1, 3), 16)) >>> 0;

const mix = (a: number, b: number, m: number): number => {
	const r = (a & 255) * (1 - m) + (b & 255) * m;
	const g = (a >> 8 & 255) * (1 - m) + (b >> 8 & 255) * m;
	const bl = (a >> 16 & 255) * (1 - m) + (b >> 16 & 255) * m;
	return (0xFF000000 | (bl | 0) << 16 | (g | 0) << 8 | (r | 0)) >>> 0;
};

const rng = (start: number): (() => number) => {
	let seed = start;
	return () => {
		seed |= 0; seed = seed + 0x6D2B79F5 | 0;
		let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
};

// A flying bird is a V, wings raised then level as it beats them. With wings tucked it is two pixels.
const FLY_V = [[-2, -2], [-1, -1], [0, 0], [1, -1], [2, -2]] as const;
const FLY_FLAT = [[-2, -1], [-1, -1], [0, 0], [1, -1], [2, -1]] as const;
// A falling leaf is two pixels: flat, or tilted one way or the other.
const FLAT = [[0, 0], [1, 0]] as const;
const TILT = [[0, 0], [1, 1]] as const;
const TILT_BACK = [[1, 0], [0, 1]] as const;

interface Pal {
	sky: number[]; hills: number[]; tones: number[]; wood: number[]; bankTop: number; bank: number[];
	water: number; sparkle: number; trough: number; vine: number; vineLeaf: number[]; tuft: number[];
	firefly: number; moon: number; bird: number;
}

const packed = (p: Palette): Pal => ({
	sky: p.sky.map(pack), hills: p.hills.map(pack), tones: p.tones.map(pack), wood: p.wood.map(pack),
	bankTop: pack(p.bankTop), bank: p.bank.map(pack), water: pack(p.water), sparkle: pack(p.sparkle),
	trough: pack(p.trough), vine: pack(p.vine), vineLeaf: p.vineLeaf.map(pack), tuft: p.tuft.map(pack),
	firefly: pack(p.firefly), moon: pack(p.moon), bird: pack(p.bird),
});

interface Pixel { x: number; y: number; c: number; wood: boolean; idx: number; tree: Grown }
interface Vine { ax: number; ay: number; len: number; phase: number; push: number; pv: number }
interface Grown { all: Pixel[]; leaves: Pixel[]; vines: Vine[]; has(x: number, y: number): boolean; top: number; swayStart: number; phase: number }
interface Leaf { cx: number; x: number; y: number; vx: number; age: number; v0: number; amp: number; w: number; ph: number; c: number; c2: number; landed: number; life: number }
interface Bird { state: 'perch' | 'fly' | 'away' | 'in' | 'pass'; p: Pixel; x: number; y: number; vx: number; vy: number; flap: boolean; mt: number; face: number; phase: number; back: number; cruise: number; gone: boolean }
interface Fly { x: number; y: number; vx: number; vy: number; phase: number }
interface Ripple { x: number; y: number; t: number; amp: number }
interface Trail { x: number; y: number; t: number; s: number }

/**
 * A strip of a given size in strip pixels.
 *
 * `motion` false paints a still scene: no leaves fall, no birds move, the pointer does nothing.
 * `random` is what decides the moving parts (which leaf, which perch); the scene itself comes from
 * the seed and is the same every time.
 */
export const createStrip = (
	config: StripConfig,
	width: number,
	height: number,
	options: { motion?: boolean; random?: () => number } = {},
): Strip => {
	const motion = options.motion ?? true;
	const random = options.random ?? Math.random;
	const W = width, H = height;
	const pal = packed(config.palette);
	const L = config.light;
	const pixels = new Uint32Array(W * H);
	const bg = new Uint32Array(W * H);
	const open = new Uint8Array(W * H);
	const gy = Math.round(H * config.ground);
	const waterTop = gy + 2;
	const r = rng(config.seed);

	const put = (x: number, y: number, c: number): void => { if (x >= 0 && x < W && y >= 0 && y < H) pixels[y * W + x] = c; };

	const grow = (bx: number, Ht: number, seed: number): Grown => {
		const tr = rng(seed);
		const pix = new Map<number, Omit<Pixel, 'tree'>>();
		const blobs: { cx: number; cy: number; R: number }[] = [];
		const set = (x: number, y: number, p: { c: number; wood: boolean; idx: number }): void => {
			if (x >= 0 && x < W && y >= 0 && y < gy) pix.set(y * W + x, { x, y, ...p });
		};
		const stamp = (x0: number, y0: number, x1: number, y1: number, w0: number, w1: number): void => {
			const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
			for (let s = 0; s <= steps; s++) {
				const f = s / steps, x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f, rad = (w0 + (w1 - w0) * f) / 2, R = Math.ceil(rad);
				for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
					if (dx * dx + dy * dy > rad * rad + 0.35) continue;
					const px = Math.round(x + dx), py = Math.round(y + dy), rel = (px - x) / Math.max(rad, 0.6) * (L[0] < 0 ? 1 : -1);
					let c = rel < -0.3 ? pal.wood[2]! : rel > 0.45 ? pal.wood[0]! : pal.wood[1]!;
					if (c === pal.wood[1] && hash(px, Math.floor(py / 2)) < 0.2) c = pal.wood[0]!;
					set(px, py, { c, wood: true, idx: 0 });
				}
			}
		};
		const branch = (x: number, y: number, ang: number, len: number, w: number, depth: number): void => {
			const x1 = x + Math.sin(ang) * len, y1 = y - Math.cos(ang) * len;
			stamp(x, y, x1, y1, w, Math.max(1, w * 0.7));
			if (depth >= 3 || len < 2.5) { blobs.push({ cx: x1, cy: y1, R: Ht * (0.1 + tr() * 0.06) }); return; }
			if (depth >= 1 && tr() < 0.5) blobs.push({ cx: (x + x1) / 2, cy: (y + y1) / 2 - 1, R: Ht * (0.08 + tr() * 0.05) });
			const n = depth === 0 ? 3 : 2 + (tr() < 0.3 ? 1 : 0);
			for (let i = 0; i < n; i++) {
				const a = ang + (n === 2 ? (i ? 1 : -1) * (0.35 + tr() * 0.35) : (i - 1) * (0.55 + tr() * 0.2));
				branch(x1, y1, a, len * (0.68 + tr() * 0.12), w * 0.66, depth + 1);
			}
		};
		const w0 = Math.max(2, Ht * 0.085);
		branch(bx, gy, (tr() - 0.5) * 0.12, Ht * 0.4, w0, 0);
		set(Math.round(bx - w0 / 2 - 1), gy - 1, { c: pal.wood[0]!, wood: true, idx: 0 });
		set(Math.round(bx + w0 / 2), gy - 1, { c: pal.wood[0]!, wood: true, idx: 0 });

		// One wide blob behind the rest fills the gaps; the others go top first, so each lower clump's
		// lit edge lands on the shade of the one above.
		const mx = blobs.reduce((s, b) => s + b.cx, 0) / blobs.length, my = blobs.reduce((s, b) => s + b.cy, 0) / blobs.length;
		blobs.sort((a, b) => a.cy - b.cy);
		blobs.unshift({ cx: mx, cy: my + Ht * 0.04, R: Ht * 0.2 });
		const top = Math.min(...blobs.map((b) => b.cy - b.R)), bot = Math.max(...blobs.map((b) => b.cy + b.R));
		for (const b of blobs) {
			const R = Math.ceil(b.R) + 2;
			for (let y = Math.floor(b.cy - R); y <= b.cy + R; y++) for (let x = Math.floor(b.cx - R); x <= b.cx + R; x++) {
				const dx = x - b.cx, dy = y - b.cy, d = Math.hypot(dx, dy);
				const edge = b.R + (hash(x, y) - 0.5) * 1.8 + Math.sin(Math.atan2(dy, dx) * 5 + b.cx) * 0.6;
				const stray = d > edge && d < edge + 1.5 && hash(y, x) < 0.12;
				if (d > edge && !stray) continue;
				const facing = (dx * L[0] + dy * L[1]) / Math.max(b.R, 1);
				let light = 0.5 + 0.5 * facing - ((b.cy - top) / Math.max(bot - top, 1)) * 0.3;
				if (d > edge - 1.2 && facing > 0.2) light += 0.25;
				const idx = clamp(Math.floor(clamp(light, 0, 0.999) * 5 + bayer(x, y) - 0.5), 0, 4);
				set(x, y, { c: pal.tones[idx]!, idx, wood: false });
			}
		}
		const grown: Grown = { all: [], leaves: [], vines: [], has: (x, y) => pix.has(y * W + x), top, swayStart: gy - Ht * 0.32, phase: 0 };
		grown.all = [...pix.values()].map((p) => ({ ...p, tree: grown }));
		grown.leaves = grown.all.filter((p) => !p.wood);
		// A vine hangs from the underside of the crown: the lowest leaf in its column, so none starts on
		// top of the canopy and runs down over it.
		const lowest = new Map<number, number>();
		for (const p of grown.leaves) lowest.set(p.x, Math.max(lowest.get(p.x) ?? -1, p.y));
		const hang = grown.leaves.filter((p) => p.y === lowest.get(p.x) && p.y < gy - 6);
		for (let i = 0, n = config.vines === false ? 0 : 3 + Math.floor(tr() * 4); i < n && hang.length; i++) {
			const p = hang[Math.floor(tr() * hang.length)]!;
			grown.vines.push({ ax: p.x, ay: p.y + 1, len: Math.floor(clamp(4 + tr() * (gy - p.y) * 0.55, 3, gy - p.y - 3)), phase: tr() * 6, push: 0, pv: 0 });
		}
		grown.phase = tr() * 6;
		return grown;
	};

	// The sky, in bands that dither into each other near their edges.
	const sky = pal.sky;
	for (let y = 0; y < gy; y++) {
		const f = y / gy * (sky.length - 1), i = Math.min(Math.floor(f), sky.length - 2), frac = f - i;
		for (let x = 0; x < W; x++) {
			bg[y * W + x] = clamp((frac - 0.65) / 0.35, 0, 1) > bayer(x, y) ? sky[i + 1]! : sky[i]!;
			open[y * W + x] = 1;
		}
	}
	if (config.moon) {
		const mx = Math.round(W * config.moon[0]), my = Math.round(gy * config.moon[1]), R = Math.max(3, Math.round(H * 0.045));
		for (let y = my - R - 3; y <= my + R + 3; y++) for (let x = mx - R - 3; x <= mx + R + 3; x++) {
			const d = Math.hypot(x - mx, y - my);
			if (x < 0 || x >= W || y < 0 || y >= gy) continue;
			if (d <= R) bg[y * W + x] = hash(x, y) < 0.12 ? mix(pal.moon, sky[0]!, 0.25) : pal.moon;
			else if (d <= R + 3 && bayer(x, y) < 0.5 * (1 - (d - R) / 3)) bg[y * W + x] = mix(bg[y * W + x]!, pal.moon, 0.35);
		}
	}
	pal.hills.forEach((col, li) => {
		const hf = config.hills ?? 1, base = gy - gy * (li ? 0.12 : 0.24) * hf, ph = r() * 6, ph2 = r() * 6, top = new Float32Array(W);
		for (let x = 0; x < W; x++) top[x] = base + Math.sin(x * 0.045 + ph) * gy * 0.035 + Math.sin(x * 0.11 + ph2) * gy * 0.012;
		for (let cx = 0; cx < W; cx += 4 + Math.floor(r() * 8)) {
			const h = gy * (0.03 + r() * (li ? 0.04 : 0.06)) * hf, round = r() < 0.6, w = Math.max(2, h * (round ? 1.1 : 0.6));
			for (let x = Math.floor(cx - w); x <= cx + w; x++) {
				if (x < 0 || x >= W) continue;
				const u = Math.abs(x - cx) / w, yt = top[cx]! - h * (round ? Math.sqrt(Math.max(0, 1 - u * u)) : 1 - u);
				top[x] = Math.min(top[x]!, yt);
			}
		}
		for (let x = 0; x < W; x++) for (let y = Math.max(0, Math.round(top[x]!)); y < gy; y++) { bg[y * W + x] = col; open[y * W + x] = 0; }
	});
	const bankEnd = config.reflection ? waterTop : H;
	for (let y = gy; y < bankEnd; y++) for (let x = 0; x < W; x++) {
		bg[y * W + x] = y === gy ? pal.bankTop : bayer(x, y) < (y - gy) / (bankEnd - gy) ? pal.bank[1]! : pal.bank[0]!;
	}
	for (let y = bankEnd; y < H; y++) for (let x = 0; x < W; x++) bg[y * W + x] = pal.water;

	const trees = config.trees.map((t, i) => grow(Math.round(t[0] * W), t[1] * gy * 0.78, t[2] ?? treeSeed(config.seed, i)));
	const canopy = trees.flatMap((t) => t.leaves);
	const at = new Int32Array(W * H).fill(-1);
	canopy.forEach((p, i) => { at[p.y * W + p.x] = i; });
	const tufts: { x: number; h: number; c: number }[] = [];
	for (let x = 0; x < W; x += 1 + Math.floor(r() * 4)) tufts.push({ x, h: r() < 0.4 ? 2 : 1, c: r() < 0.5 ? 0 : 1 });
	const sparkles: { x: number; y: number; len: number; phase: number }[] = [];
	if (config.reflection) for (let i = 0; i < W / 14; i++) sparkles.push({ x: Math.floor(r() * W), y: waterTop + 1 + Math.floor(r() * (H - waterTop) * 0.35), len: 2 + Math.floor(r() * 4), phase: r() * 6 });
	const flies: Fly[] = [];
	const flyTop = config.fireflyTop ?? 0.3;
	for (let i = 0; i < (config.fireflies ?? 0); i++) flies.push({ x: r() * W, y: gy * (flyTop + 0.05 + r() * (0.9 - flyTop)), vx: 0, vy: 0, phase: r() * 6 });
	const perches = canopy.filter((p) => !p.tree.has(p.x, p.y - 1) && p.y > 4);
	const birds: Bird[] = [];
	const perch = (face: number, phase: number): Bird => {
		const p = perches[Math.floor(r() * perches.length)]!;
		return { state: 'perch', p, x: p.x, y: p.y - 1, vx: 0, vy: 0, flap: false, mt: 0, face, phase, back: 0, cruise: 0, gone: false };
	};
	for (let i = 0; i < (config.birds ?? 0) && perches.length; i++) birds.push(perch(r() < 0.5 ? 1 : -1, r() * 6));

	const leaves: Leaf[] = [];
	const pile = new Uint8Array(W);
	const trail: Trail[] = [];
	const ripples: Ripple[] = [];
	const wave = new Float32Array(W * H);
	const ptr = { x: null as number | null, y: 0 };
	let stroke = 0, wind = 0, now = 0, nextDrop = 2, nextFlock = 6, budget = 0;

	// The stone springs back from wherever the pointer pushes it: sideways from a brush, down from a
	// press. Its vines have their own seed, so adding a stone leaves the rest of the scene as it was.
	const stone = config.stone;
	const sr = rng(config.seed + 7919);
	const stoneVines = stone ? Array.from({ length: 7 }, (_, i) => ({ u: (i + 0.5 + (sr() - 0.5) * 0.7) / 7, len: 0.45 + sr() * 0.55, phase: sr() * 6, push: 0, pv: 0, x: 0, y: 0, n: 0 })) : [];
	const lump = { x: 0, vx: 0, dip: 0, dv: 0, left: 0, top: 0 };
	// The birds on the photo are the resume button's bird, drawn at the strip's size. `createPerch` works
	// in page pixels, and three of them make one strip pixel. Each bird stays on its own third of the top edge.
	const K = 3, SPOTS = [0.2, 0.5, 0.8];
	const sitters = Array.from({ length: Math.min(3, stone?.birds ?? 0) }, (_, i) => (
		{ bird: null as Perch | null, spot: i * 2 % 3, face: 1, look: 1, wait: 1.5 + i * 2.5 + sr() * 2 }
	));
	const sitAt = (spot: number): { x: number; y: number } => ({ x: (lump.left + Math.round(SPOTS[spot]! * (stone!.width - 1))) * K, y: lump.top * K });
	const drawSitters = (dt: number): void => {
		for (const s of sitters) {
			if (!s.bird) {
				s.wait -= dt;
				if (!motion || s.wait > 0) continue;
				const free = [0, 1, 2].filter((k) => !sitters.some((o) => o !== s && o.spot === k));
				s.spot = free[Math.floor(random() * free.length)] ?? s.spot;
				const to = sitAt(s.spot);
				s.bird = createPerch({ x: to.x + 240, y: -30 }, random);
				s.face = 1;
			}
			const b = s.bird;
			b.step(dt, sitAt(s.spot));
			// Standing, it turns to look about now and then. While pecking it faces one way.
			if (b.state === 'perch' && b.pose === STAND && (s.look -= dt) <= 0) { s.face = -s.face; s.look = 0.8 + random() * 1.8; }
			if (b.state === 'away' && (b.y < -20 * K || b.x < -20 * K)) { s.bird = null; s.wait = 6 + random() * 8; continue; }
			const face = b.state === 'perch' ? s.face : 1, bx = Math.round(b.x / K), by = Math.round(b.y / K) - 1;
			for (const [px, py] of b.pose) if (by + py < gy) put(bx + (face > 0 ? px : -px - 1), by + py, pal.bird);
		}
	};
	const scareSitters = (x: number, y: number, reach: number): void => {
		for (const s of sitters) if (s.bird && s.bird.state !== 'away' && Math.hypot(x - s.bird.x / K, y - s.bird.y / K) < reach) s.bird.scare();
	};
	const on = (x: number, y: number): boolean => !!stone && x >= lump.left && x < lump.left + stone.width && y >= lump.top && y < lump.top + stone.height;
	const drawStone = (dt: number): void => {
		if (!stone) return;
		// The pointer moving across it shifts it two pixels at most, on a stiff spring: enough to notice, not enough to distract.
		lump.vx += (-lump.x * 40 - lump.vx * 9) * dt; lump.x = clamp(lump.x + lump.vx * dt, -2, 2);
		lump.dv += (-lump.dip * 30 - lump.dv * 5) * dt; lump.dip += lump.dv * dt;
		const lift = (stone.lift ?? 0) + (stone.bob ?? 0) * Math.sin(now * 1.3) - lump.dip;
		lump.left = stone.x + Math.round(lump.x);
		lump.top = Math.min(gy - stone.height, gy - stone.height - Math.round(lift));
		const bottom = lump.top + stone.height, half = stone.width / 2 + 3, cx = lump.left + stone.width / 2;
		// The earth under it tapers to a ragged point, darker the deeper it goes.
		const below = (x: number): number => {
			const a = (x + 0.5 - cx) / half;
			return !stone.island || Math.abs(a) > 1 ? -1 : Math.round(12 * (1 - Math.abs(a) ** 1.6) * (0.85 + 0.3 * hash(x - lump.left, 11)));
		};
		const sky = (x: number, y: number, c: number): void => { if (y < gy) put(x, y, c); };
		if (stone.island) for (let x = Math.floor(cx - half); x < cx + half; x++) {
			const d = below(x);
			for (let j = 0; j <= d; j++) {
				const k = j / (d + 1) + (hash(x - lump.left, j) - 0.5) * 0.3;
				sky(x, bottom + j, j === 0 ? pal.bankTop : k < 0.35 ? pal.bank[0]! : k > 0.7 || bayer(x, bottom + j) < 0.5 ? pal.bank[1]! : pal.bank[0]!);
			}
			if (d >= 0 && (x < lump.left || x >= lump.left + stone.width) && hash(x - lump.left, 3) < 0.6) sky(x, bottom - 1, pal.tuft[hash(x - lump.left, 5) < 0.5 ? 0 : 1]!);
		}
		for (let y = 0; y < stone.height; y++) for (let x = 0; x < stone.width; x++) sky(lump.left + x, lump.top + y, stone.pixels[y * stone.width + x]!);
		const longest = stone.vines ?? 0;
		for (const v of stoneVines) {
			v.pv += (-v.push * 14 - v.pv * 3 - lump.vx * 2) * dt; v.push += v.pv * dt;
			v.x = Math.round(stone.island ? cx - half + 2 + v.u * (half * 2 - 4) : lump.left + 1 + v.u * (stone.width - 2));
			v.y = stone.island ? bottom + Math.max(0, below(v.x)) + 1 : bottom;
			// A vine that reached the bank would read as a leg holding the stone up.
			v.n = Math.max(0, Math.min(Math.round(v.len * longest), gy - 3 - v.y));
			for (let i = 0; i < v.n; i++) {
				const x = v.x + Math.round((Math.sin(now * 1.2 + v.phase + i * 0.18) * 0.7 + wind * 1.2 + v.push) * i / v.n);
				sky(x, v.y + i, pal.vine);
				if (i % 3 === 1) sky(x + (i % 6 === 1 ? 1 : -1), v.y + i, pal.vineLeaf[i % 2]!);
			}
		}
	};

	const sway = (t: Grown, y: number): number => {
		if (y >= t.swayStart) return 0;
		const k = clamp((t.swayStart - y) / (t.swayStart - t.top), 0, 1);
		return Math.round((Math.sin(now * 0.8 + y * 0.09 + t.phase) * 0.75 + wind * 0.9) * k);
	};
	// Where the cursor has just passed, a few leaves catch the light and turn back. Nothing moves, so
	// the crown never opens up.
	const rustle = (p: Pixel): number => {
		let k = 0;
		for (const q of trail) {
			const d = Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
			if (d < 6) k += (1 - d / 6) * q.s * (1 - (now - q.t) / 1.2);
		}
		return k > 0.05 && Math.sin(now * 7 + p.x * 2.1 + p.y * 3.7) > 1 - Math.min(k, 1) * 0.6 ? pal.tones[Math.min(4, p.idx + 1)]! : p.c;
	};
	// A falling leaf swings like a pendulum under a slow descent: it drops fastest through the bottom
	// of each swing, nearly stalls at the ends, and tilts the way it is swinging.
	const drop = (p: Pixel, kick = 0): void => {
		if (leaves.length > 600) return;
		const i = clamp(p.idx, 1, 4);
		leaves.push({
			cx: p.x + sway(p.tree, p.y), x: 0, y: p.y, vx: kick, age: 0,
			v0: H * (0.11 + random() * 0.06), amp: 1.5 + random() * 2.5, w: 2.2 + random() * 1.2, ph: random() * 6,
			c: pal.tones[i]!, c2: pal.tones[i - 1]!, landed: -1, life: 20 + random() * 15,
		});
	};

	const frame = (dt: number, t: number): void => {
		now = t;
		wind *= Math.pow(0.3, dt);
		while (trail.length && now - trail[0]!.t > 1.2) trail.shift();
		pixels.set(bg);
		drawStone(dt);
		drawSitters(dt);

		for (const tr of trees) for (const p of tr.all) put(p.x + sway(tr, p.y), p.y, p.wood || !trail.length ? p.c : rustle(p));
		for (const tr of trees) for (const v of tr.vines) {
			v.pv += (-v.push * 14 - v.pv * 3) * dt; v.push += v.pv * dt;
			const base = v.ax + sway(tr, v.ay);
			for (let i = 0; i < v.len; i++) {
				const f = i / v.len, y = v.ay + i;
				if (y >= gy) break;
				const x = base + Math.round((Math.sin(now * 1.2 + v.phase + i * 0.18) * 0.7 + wind * 1.2 + v.push) * f);
				put(x, y, pal.vine);
				if (i % 3 === 1) put(x + (i % 6 === 1 ? 1 : -1), y, pal.vineLeaf[i % 2]!);
			}
		}
		for (const tf of tufts) {
			// Grass in front of a stone standing on the bank reads as a flaw in its frame.
			if (stone && lump.top + stone.height >= gy && tf.x >= lump.left && tf.x < lump.left + stone.width) continue;
			put(tf.x, gy - 1, pal.tuft[tf.c]!);
			if (tf.h > 1) put(tf.x + Math.round(Math.sin(now * 1.5 + tf.x * 0.3) * 0.6 + wind * 0.5), gy - 2, pal.tuft[1 - tf.c]!);
		}

		for (const b of birds) {
			if (motion && b.state === 'perch' && ptr.x !== null && Math.hypot(ptr.x - b.x, ptr.y - b.y) < 10) {
				Object.assign(b, { state: 'fly', vx: (b.x > ptr.x ? 1 : -1) * (13 + random() * 5), vy: -10, flap: true, mt: 0.5 });
			}
			if (b.state === 'perch') {
				if (motion && random() < dt * 0.3) b.face = -b.face;
				const x = b.p.x + sway(b.p.tree, b.p.y), up = Math.sin(now * 3 + b.phase) > 0.97;
				for (const [ox, oy] of [[-1, 0], [0, 0], [1, up ? 0 : -1], [-2, -1]] as const) put(x + ox * b.face, b.y + oy, pal.bird);
				continue;
			}
			if (b.state === 'away') {
				if (now < b.back) continue;
				const fromLeft = random() < 0.5;
				Object.assign(b, { state: 'in', p: perches[Math.floor(random() * perches.length)]!, x: fromLeft ? -5 : W + 5, y: 6 + random() * gy * 0.2, vx: fromLeft ? 12 : -12, vy: 0, flap: true, mt: 0.3 });
			}
			// Small birds fly in bounds: a burst of wingbeats that lifts them, then wings tucked and a
			// short fall, then again.
			b.mt -= dt;
			if (b.mt <= 0) { b.flap = !b.flap; b.mt = b.flap ? 0.25 + random() * 0.25 : 0.2 + random() * 0.25; }
			b.vy += (b.flap ? (-9 - b.vy) * 6 : 38) * dt;
			if (b.state === 'pass') b.vy += (b.cruise - b.y) * 1.5 * dt;
			if (b.state === 'in') {
				const tx = b.p.x + sway(b.p.tree, b.p.y), ty = b.p.y - 1, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
				if (d < 1.2) { Object.assign(b, { state: 'perch', y: ty }); continue; }
				if (d < 10) { b.flap = true; b.mt = 0.2; const sp = Math.max(4, d * 1.3); b.vx = dx / d * sp; b.vy = dy / d * sp; }
				else { b.vx += (Math.sign(dx) * 12 - b.vx) * 2 * dt; b.vy += clamp(dy, -10, 10) * 2 * dt; }
			}
			// The strip's top edge is a ceiling: a bird that reaches it stops climbing and tucks, so it
			// never leaves through the top.
			b.x += b.vx * dt; b.y = Math.min(b.y + b.vy * dt, gy - 3);
			if (b.y < 4) { b.y = 4; b.vy = Math.max(b.vy, 0); if (b.state !== 'in') { b.flap = false; b.mt = 0.3; } }
			if (b.state !== 'in' && (b.x < -6 || b.x > W + 6)) {
				if (b.state === 'pass') b.gone = true; else Object.assign(b, { state: 'away', back: now + 8 + random() * 12 });
				continue;
			}
			const x = Math.round(b.x), y = Math.round(b.y);
			if (b.flap) for (const [ox, oy] of Math.floor(now * 14 + b.phase) & 1 ? FLY_FLAT : FLY_V) put(x + ox, y + oy, pal.bird);
			else { put(x, y, pal.bird); put(x - Math.sign(b.vx || 1), y, pal.bird); }
		}
		for (let i = birds.length - 1; i >= 0; i--) if (birds[i]!.gone) birds.splice(i, 1);
		if (motion && config.flock && now > nextFlock && canopy.length) {
			nextFlock = now + 18 + random() * 20;
			const dir = random() < 0.5 ? 1 : -1, y0 = 6 + random() * gy * 0.2, n = 3 + Math.floor(random() * 3);
			for (let i = 0; i < n; i++) {
				birds.push({ state: 'pass', p: canopy[0]!, x: (dir > 0 ? -6 : W + 6) - dir * i * 6, y: y0 + i * 1.5, cruise: y0 + i * 1.5, vx: dir * (12 + random() * 3), vy: 0, flap: random() < 0.5, mt: random() * 0.4, face: dir, phase: random() * 6, back: 0, gone: false });
			}
		}

		if (motion && now > nextDrop && canopy.length) {
			drop(canopy[Math.floor(random() * canopy.length)]!);
			nextDrop = now + config.ambient * (0.4 + random());
		}
		for (let i = leaves.length - 1; i >= 0; i--) {
			const lf = leaves[i]!;
			if (lf.landed < 0) {
				lf.age += dt;
				// The first moment is a plain drop; the swing builds as the leaf catches air.
				const settle = Math.min(1, lf.age / 0.8);
				lf.ph += lf.w * dt;
				const sw = Math.sin(lf.ph), cw = Math.cos(lf.ph);
				lf.vx *= Math.pow(0.15, dt);
				lf.cx += (lf.vx + wind * 6) * dt;
				lf.x = lf.cx + sw * lf.amp * settle;
				lf.y += lf.v0 * dt * (settle * (0.15 + 1.3 * cw * cw) + (1 - settle) * 1.4);
				if (lf.x < -3 || lf.x > W + 3) { leaves.splice(i, 1); continue; }
				const x = Math.round(lf.x);
				const top = gy - 1 - Math.min(1, pile[clamp(x, 0, W - 1)]! >> 1);
				if (lf.y >= top) {
					lf.y = top; lf.landed = now;
					for (const k of [x, x + 1]) if (k >= 0 && k < W) pile[k]!++;
				}
				const F = settle < 1 || Math.abs(sw) < 0.45 ? FLAT : sw * cw > 0 ? TILT : TILT_BACK, y = Math.round(lf.y);
				put(x + F[0][0], y + F[0][1], lf.c); put(x + F[1][0], y + F[1][1], lf.c2);
			} else {
				const age = now - lf.landed, x = Math.round(lf.x);
				if (age > lf.life) {
					for (const k of [x, x + 1]) if (k >= 0 && k < W) pile[k]!--;
					leaves.splice(i, 1); continue;
				}
				put(x, lf.y, age > lf.life * 0.5 ? lf.c2 : lf.c); put(x + 1, lf.y, lf.c2);
			}
		}
		for (const fl of flies) {
			if (motion) {
				fl.vx += (random() - 0.5) * 30 * dt; fl.vy += (random() - 0.5) * 30 * dt;
				if (ptr.x !== null) { const dx = fl.x - ptr.x, dy = fl.y - ptr.y, d = Math.hypot(dx, dy); if (d < 14 && d > 0) { fl.vx += dx / d * 60 * dt; fl.vy += dy / d * 60 * dt; } }
				const sp = Math.hypot(fl.vx, fl.vy), max = 6; if (sp > max) { fl.vx *= max / sp; fl.vy *= max / sp; }
				fl.vx *= Math.pow(0.6, dt); fl.vy *= Math.pow(0.6, dt);
				fl.x = (fl.x + fl.vx * dt + W) % W; fl.y = clamp(fl.y + fl.vy * dt, gy * flyTop, gy - 2);
			}
			const b = 0.5 + 0.5 * Math.sin(now * 2.2 + fl.phase), x = Math.round(fl.x), y = Math.round(fl.y);
			if (b < 0.25) continue;
			put(x, y, pal.firefly);
			if (b > 0.75) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
				if (x + ox >= 0 && x + ox < W && y + oy >= 0 && y + oy < H) { const k = (y + oy) * W + x + ox; pixels[k] = mix(pixels[k]!, pal.firefly, 0.45); }
			}
		}

		if (config.reflection) {
			const depth = H - waterTop;
			// Each ripple is a ring of short capillary waves spreading from where the cursor crossed the
			// water, squashed to an ellipse because the pond is seen at a low angle, and dying away as it grows.
			if (ripples.length) {
				wave.fill(0, waterTop * W);
				for (let n = ripples.length - 1; n >= 0; n--) {
					const rp = ripples[n]!, age = now - rp.t, a = rp.amp * Math.exp(-age * 1.4);
					if (a < 0.04) { ripples.splice(n, 1); continue; }
					const R = age * 16, span = R + 7;
					for (let y = Math.max(waterTop, Math.floor(rp.y - span * 0.4)); y <= Math.min(H - 1, rp.y + span * 0.4); y++) {
						for (let x = Math.max(0, Math.floor(rp.x - span)); x <= Math.min(W - 1, rp.x + span); x++) {
							const off = Math.hypot(x - rp.x, (y - rp.y) / 0.4) - R;
							if (off > -7 && off < 7) wave[y * W + x]! += a * Math.exp(-off * off / 9) * Math.cos(off * 1.7);
						}
					}
				}
			}
			for (let y = waterTop; y < H; y++) {
				// Open sky mirrors as itself, so the pond is the page colour wherever it shows sky. Only
				// what stands in front of the sky (hills, trees, leaves, birds) takes the water's tint.
				const k = y - waterTop, sy = gy - 1 - k, m = 0.42 + 0.2 * k / depth;
				const xo = Math.round(Math.sin(k * 0.8 + now * 2.1) * (0.6 + k * 0.05));
				// Below FADE of the pond's depth the reflection dithers back to the page colour, so the
				// strip's bottom edge never cuts through something it mirrors.
				const fade = clamp((k / depth - FADE) / (1 - FADE), 0, 1);
				for (let x = 0; x < W; x++) {
					if (fade > 0 && bayer(x, y) < fade) { pixels[y * W + x] = sky[0]!; continue; }
					// A wave bends the reflection under it; its crests catch light and its troughs darken.
					const h = ripples.length ? wave[y * W + x]! : 0, sy2 = clamp(sy - Math.round(h), 0, gy - 1);
					if (sy < 0 && !h) { pixels[y * W + x] = sky[0]!; continue; }
					const i = sy2 * W + clamp(x + xo + Math.round(h * 1.5), 0, W - 1), src = pixels[i]!;
					let c = open[i] && src === bg[i] ? src : mix(src, pal.water, m);
					if (h > 0.15) c = mix(c, pal.sparkle, Math.min(0.55, h * 0.35));
					else if (h < -0.15) c = mix(c, pal.trough, Math.min(0.45, -h * 0.3));
					pixels[y * W + x] = c;
				}
			}
			for (const sp of sparkles) if (Math.sin(now * 1.3 + sp.phase) > 0.55) for (let i = 0; i < sp.len; i++) put(sp.x + i, sp.y, pal.sparkle);
		}
		const sides = config.sides ?? 0;
		if (sides > 0) for (let y = 0; y < H; y++) for (let d = 0; d < sides; d++) {
			const f = 1 - d / sides;
			if (bayer(d, y) < f) pixels[y * W + d] = sky[0]!;
			if (bayer(W - 1 - d, y) < f) pixels[y * W + W - 1 - d] = sky[0]!;
		}
	};

	const move = (x: number, y: number): void => {
		if (ptr.x !== null && motion) {
			const dx = x - ptr.x, speed = Math.hypot(dx, y - ptr.y);
			wind = clamp(wind + dx * 0.006, -0.5, 0.5);
			trail.push({ x, y, t: now, s: Math.min(1, speed * 0.25) });
			// Over the water the cursor drops a ripple every few pixels it travels, so a faster drag lays
			// down more of them, and each one is bigger on a curve that climbs faster than the speed does.
			if (config.reflection && y >= waterTop + 1 && y < H) {
				stroke += speed;
				if (stroke >= 3 && ripples.length < 40) { stroke = 0; ripples.push({ x, y, t: now, amp: clamp(0.35 + Math.pow(speed / 4, 1.5), 0.35, 3) }); }
			}
			// Brushing a crown builds up a budget of leaves, 25 a second at an easy pace, spent from the
			// pixels around the cursor.
			if (at[clamp(Math.round(y), 0, H - 1) * W + clamp(Math.round(x), 0, W - 1)]! >= 0) budget = Math.min(3, budget + Math.min(speed, 6) * 25 / 120);
			for (let tries = 0; budget >= 1 && tries < 12; tries++) {
				const i = at[clamp(Math.round(y + (random() - 0.5) * 5), 0, H - 1) * W + clamp(Math.round(x + (random() - 0.5) * 5), 0, W - 1)]!;
				if (i >= 0) { drop(canopy[i]!, dx * 1.5); budget--; }
			}
			for (const tr of trees) for (const v of tr.vines) if (Math.abs(x - v.ax) < 3 && y > v.ay && y < v.ay + v.len) v.pv += dx * 3;
			for (const v of stoneVines) if (Math.abs(x - v.x) < 3 && y > v.y && y < v.y + v.n) v.pv += dx * 3;
			if (on(x, y)) lump.vx = clamp(lump.vx + dx * 2, -20, 20);
			scareSitters(x, y, 12);
		}
		ptr.x = x; ptr.y = y;
	};

	// A press on the stone dips it toward the water, and a ripple spreads where its reflection is.
	const poke = (x: number, y: number): boolean => {
		if (!stone || !motion || !on(x, y)) return false;
		lump.dv += 22;
		scareSitters(x, y, Infinity);
		if (config.reflection && ripples.length < 40) {
			ripples.push({ x: lump.left + stone.width / 2, y: Math.min(H - 1, waterTop + 1 + Math.max(0, gy - lump.top - stone.height)), t: now, amp: 2.4 });
		}
		return true;
	};

	return {
		width: W, height: H, pixels, frame, move, poke, leave: () => { ptr.x = null; }, leaves: () => leaves.length,
		get stoneAt() { return stone ? { x: lump.left, y: lump.top } : null; },
	};
};

// --- the margins and the radio: two painters that are not strips -------------------------------

/** Something a canvas shows: a buffer of packed pixels that moves on with time. A strip is one. */
export interface Painter {
	readonly width: number;
	readonly height: number;
	/** The frame, one packed colour per pixel, row by row. 0 is see-through. */
	readonly pixels: Uint32Array;
	/** A colour the canvas shows as see-through as well, so the page behind it shows. */
	readonly clear?: number;
	/** Advance by `dt` seconds to time `t` and paint. */
	frame(dt: number, t: number): void;
	move?(x: number, y: number): void;
	leave?(): void;
	poke?(x: number, y: number): boolean;
}

interface Hanging { ax: number; ay: number; len: number; phase: number; push: number; pv: number }

/**
 * The underside of a canopy over the margins either side of the content column, with vines hanging
 * from it, `width` by `height` strip pixels. Nothing is drawn over the column, so on a screen with no
 * margins nothing is drawn at all. The pointer crossing the margins stirs the vines.
 *
 * `grow`, read every frame, is how far the reader is through the page, 0 to 1: the vine nearest the
 * column on the left grows that far down and buds at its end. `moving` false holds every vine still.
 */
export const createCanopy = (options: {
	readonly width: number;
	readonly height: number;
	/** The content column's width, in strip pixels. */
	readonly column: number;
	readonly seed: number;
	readonly night: boolean;
	readonly moving?: boolean;
	readonly grow?: () => number;
}): Painter => {
	const { width: W, height: H } = options, moving = options.moving ?? true;
	const pixels = new Uint32Array(W * H);
	const c0 = (W - Math.min(options.column, W)) / 2, c1 = W - c0;
	const r = rng(options.seed), p1 = r() * 6, p2 = r() * 6;
	// How far down the canopy reaches at each column: nothing over the content, ragged in the margins,
	// and deepest at the window's edges.
	const depth = new Float32Array(W);
	for (let x = 0; x < W; x++) {
		const out = x < c0 ? c0 - x : x > c1 ? x - c1 : 0, g = clamp((out - 2) / 16, 0, 1);
		const edge = clamp(1 - Math.min(x, W - 1 - x) / 50, 0, 1), n = 0.5 + 0.3 * Math.sin(x * 0.13 + p1) + 0.2 * Math.sin(x * 0.37 + p2);
		depth[x] = g * (1.5 + 3 * n + 6 * edge * edge);
	}
	let vines: Hanging[] = [];
	for (let x = 3; x < W - 3; x += 4 + Math.floor(r() * 8)) {
		if (depth[x]! < 2) continue;
		const out = x < c0 ? c0 - x : x - c1;
		vines.push({ ax: x, ay: Math.floor(depth[x]!), len: Math.round(4 + r() * H * 0.55 * clamp(out / 30, 0.3, 1)), phase: r() * 6, push: 0, pv: 0 });
	}
	let grown: Hanging | null = null;
	if (options.grow !== undefined) {
		const x = Math.floor(c0 - 7);
		for (let k = -2; k <= 2; k++) if (x + k >= 0 && x + k < W) depth[x + k] = Math.max(depth[x + k]!, 3 - Math.abs(k) * 0.5);
		grown = { ax: x, ay: 3, len: 3, phase: 1.3, push: 0, pv: 0 };
		vines = vines.filter((v) => Math.abs(v.ax - x) > 4);
	}
	const P = packed(options.night ? NIGHT : LIGHT), bud = pack(LIME), budHeart = pack(SAGE);
	let wind = 0, lastX: number | null = null;

	const put = (x: number, y: number, c: number): void => { if (x >= 0 && x < W && y >= 0 && y < H) pixels[y * W + x] = c; };
	const hang = (v: Hanging, dt: number, t: number): readonly [number, number] | null => {
		v.pv += (-v.push * 14 - v.pv * 3) * dt; v.push += v.pv * dt;
		let tip: readonly [number, number] | null = null;
		for (let i = 0; i < v.len; i++) {
			const f = i / Math.max(v.len, 1), y = v.ay + i;
			if (y >= H) break;
			const x = v.ax + Math.round((Math.sin(t * 1.2 + v.phase + i * 0.18) * 0.7 + wind * 1.2 + v.push) * f);
			put(x, y, P.vine);
			if (i % 3 === 1) put(x + (i % 6 === 1 ? 1 : -1), y, P.vineLeaf[i % 2]!);
			tip = [x, y];
		}
		return tip;
	};

	const frame = (dt: number, t: number): void => {
		wind *= Math.pow(0.3, dt);
		pixels.fill(0);
		for (let x = 0; x < W; x++) {
			const d = depth[x]!;
			for (let y = 0; y < d && y < H; y++) put(x, y, P.tones[clamp(Math.floor((0.72 - 0.55 * y / Math.max(d, 1)) * 5 + bayer(x, y) - 0.5), 0, 4)]!);
			const e = Math.floor(d);
			if (d > 0.5 && hash(x, e) < 0.35) put(x, e, P.tones[1]!);
		}
		for (const v of vines) hang(v, dt, t);
		if (grown !== null && options.grow !== undefined) {
			const p = clamp(options.grow(), 0, 1);
			grown.len = Math.round(3 + p * (H - grown.ay - 8));
			const tip = hang(grown, dt, t);
			if (tip !== null && p > 0.97) {
				const [x, y] = tip;
				put(x, y + 1, bud); put(x - 1, y + 2, bud); put(x + 1, y + 2, bud); put(x, y + 3, bud); put(x, y + 2, budHeart);
			}
		}
	};

	const move = (x: number, y: number): void => {
		if (!moving) return;
		if (lastX !== null) {
			const dx = x - lastX;
			wind = clamp(wind + dx * 0.006, -0.5, 0.5);
			for (const v of grown === null ? vines : [...vines, grown]) if (Math.abs(x - v.ax) < 3 && y > v.ay && y < v.ay + v.len) v.pv += dx * 3;
		}
		lastX = x;
	};

	return { width: W, height: H, pixels, frame, move, leave: () => { lastX = null; } };
};

/**
 * Reeds at the water's edge, one clump of three per band of the radio, mirrored in a pond that fades
 * into the page before its bottom edge, and fading out at the sides.
 *
 * `heard`, called every frame, fills one level per band, 0 to 1, and answers whether anything is
 * playing. While nothing is, the reeds stand at a third of their height and sway.
 */
export const createReeds = (options: {
	readonly width: number;
	readonly height: number;
	readonly night: boolean;
	readonly bands: number;
	readonly heard: (out: Float32Array, t: number) => boolean;
}): Painter => {
	const { width: W, height: H, bands } = options, gy = Math.round(H * 0.58);
	const pixels = new Uint32Array(W * H), level = new Float32Array(bands).fill(0.34), loud = new Float32Array(bands);
	const phase = Array.from({ length: bands }, (_, i) => hash(i, 3) * 6);
	const r = rng(24);
	const blades: { band: number; x: number; f: number; head: boolean; phase: number }[] = [];
	for (let i = 0; i < bands; i++) {
		const cx = Math.round((i + 0.5) / bands * W);
		for (const [dx, f] of [[-1, 0.62], [0, 1], [1, 0.78]] as const) blades.push({ band: i, x: cx + dx, f: f * (0.85 + r() * 0.15), head: dx === 0, phase: r() * 6 });
	}
	const sparks: { x: number; y: number; len: number; phase: number }[] = [];
	for (let i = 0; i < W / 16; i++) sparks.push({ x: Math.floor(r() * W), y: gy + 3 + Math.floor(r() * (H - gy - 4) * 0.3), len: 2 + Math.floor(r() * 3), phase: r() * 6 });
	const P = packed(options.night ? NIGHT : LIGHT);
	const put = (x: number, y: number, c: number): void => { if (x >= 0 && x < W && y >= 0 && y < gy) pixels[y * W + x] = c; };

	const frame = (dt: number, t: number): void => {
		const on = options.heard(loud, t);
		for (let i = 0; i < bands; i++) {
			const target = on ? 0.22 + 0.72 * loud[i]! : 0.34 + 0.05 * Math.sin(t * 0.9 + i);
			level[i]! += (target - level[i]!) * Math.min(1, dt * (on ? 10 : 3));
			// A first frame, or a still one, shows where the reeds are headed.
			if (dt === 0) level[i] = target;
		}
		pixels.fill(0);
		pixels.fill(P.bankTop, gy * W, (gy + 1) * W);
		const tallest = gy - 3;
		for (const b of blades) {
			const h = Math.max(2, Math.round(level[b.band]! * tallest * b.f));
			const at = (j: number): number => b.x + Math.round(Math.sin(t * 1.4 + b.phase + j * 0.12) * 0.8 * (j / h) * (j / h));
			for (let j = 0; j < h; j++) { const x = at(j), y = gy - 1 - j; put(x, y, P.tones[j < h * 0.35 ? 1 : bayer(x, y) < 0.5 ? 2 : 3]!); }
			if (b.head && h > 6) for (let j = 0; j < 3; j++) {
				const x = at(h - 2 - j), y = gy - h + 1 + j;
				put(x, y, P.wood[1]!); put(x + 1, y, P.wood[j === 0 ? 2 : 0]!);
			}
		}
		const top = gy + 1, deep = H - top;
		for (let y = top; y < H; y++) {
			const k = y - top, sy = gy - 1 - k, m = 0.42 + 0.2 * k / deep, xo = Math.round(Math.sin(k * 0.8 + t * 2.1) * (0.6 + k * 0.05));
			// Whole by the last row: this pond is shallow enough that its last row mirrors the tips of loud reeds.
			const fade = clamp(((k + 1) / deep - FADE) / (1 - FADE), 0, 1);
			for (let x = 0; x < W; x++) {
				if (sy < 0 || (fade > 0 && bayer(x, y) < fade)) { pixels[y * W + x] = 0; continue; }
				const from = pixels[sy * W + clamp(x + xo, 0, W - 1)]!;
				pixels[y * W + x] = from === 0 ? 0 : mix(from, P.water, m);
			}
		}
		for (const q of sparks) if (Math.sin(t * 1.3 + q.phase) > 0.55) for (let i = 0; i < q.len && q.x + i < W; i++) pixels[q.y * W + q.x + i] = P.sparkle;
		const sides = 8;
		for (let y = 0; y < H; y++) for (let d = 0; d < sides; d++) {
			const f = 1 - d / sides;
			if (bayer(d, y) < f) pixels[y * W + d] = 0;
			if (bayer(W - 1 - d, y) < f) pixels[y * W + W - 1 - d] = 0;
		}
	};

	return { width: W, height: H, pixels, frame };
};

// --- on a page ------------------------------------------------------------------------------

/** How long the page and its scenes take to fade from one mode to the other, in seconds. */
export const SWITCH_SECONDS = 0.6;

/** What `runScene` puts on a canvas. */
export interface Scene {
	/**
	 * A painter for a host this many strip pixels across and down, `css` CSS pixels wide, in a mode,
	 * moving or still. Asked again when that size changes, when the mode changes and when motion is
	 * switched.
	 */
	readonly paint: (night: boolean, width: number, height: number, css: number, moving: boolean) => Painter;
	/** The size of one strip pixel on a host this wide. The hero's, when left off. */
	readonly scale?: (css: number) => number;
	/** What the pointer is listened on. The host, when left off. */
	readonly pointer?: HTMLElement;
	/** Run after each frame with the painter, the pixels as the canvas shows them, and the size of a strip pixel. */
	readonly drawn?: (painter: Painter, shown: Uint32Array, size: number) => void;
	/** Paint again on every scroll, even while still: for a scene that follows the reader and not the clock. */
	readonly scroll?: boolean;
}

/** A yes or no a page holds and can be watched: night or day. */
export interface Watched {
	get(): boolean;
	watch(fn: (value: boolean) => void): () => void;
}

/** A scene running on a page. */
export interface Running {
	/** Paint it afresh, as for a change of mode, without the fade. */
	again(): void;
	/** Take every listener and observer back off. */
	stop(): void;
}

// A copy of a canvas's last frame laid over it, fading out while the canvas draws the new mode
// underneath, so the forest changes mode as the page does: together and in one plain fade.
const ghost = (canvas: HTMLCanvasElement): void => {
	const copy = canvas.cloneNode(false) as HTMLCanvasElement;
	copy.removeAttribute('id');
	copy.getContext('2d')?.drawImage(canvas, 0, 0);
	copy.setAttribute('aria-hidden', 'true');
	copy.style.pointerEvents = 'none';
	copy.style.transition = `opacity ${String(SWITCH_SECONDS)}s ease`;
	canvas.after(copy);
	requestAnimationFrame(() => requestAnimationFrame(() => { copy.style.opacity = '0'; }));
	setTimeout(() => { copy.remove(); }, SWITCH_SECONDS * 1000 + 100);
};

/**
 * Run a scene on the canvas that is the first child of `host`, filling the host.
 *
 * Whatever the painter draws in 0 or in its `clear` colour is see-through, so a strip's sky is the
 * page itself. The scene runs only while the host is on screen and `motion` is on. Otherwise it shows
 * one frame and holds it. A change of mode fades a scene on screen from its last frame to the new
 * one, and repaints one off screen when it next comes into view.
 */
export const runScene = (host: HTMLElement, scene: Scene, night: Watched): Running => {
	const canvas = host.firstElementChild;
	const context = canvas instanceof HTMLCanvasElement ? canvas.getContext('2d') : null;
	if (!(canvas instanceof HTMLCanvasElement) || context === null) return { again: () => {}, stop: () => {} };
	const scale = scene.scale ?? heroScale;
	let painter: Painter | null = null;
	let image: ImageData | null = null;
	let size = 1, stale = false, seen = false, on = false, raf = 0, last = 0;
	// The moment a still scene is held at.
	let held = performance.now() / 1000;

	const draw = (dt: number): void => {
		if (painter === null || image === null) return;
		painter.frame(dt, motion.get() ? performance.now() / 1000 : held);
		const shown = new Uint32Array(image.data.buffer), from = painter.pixels, clear = painter.clear;
		for (let i = 0; i < from.length; i++) { const c = from[i]!; shown[i] = c === clear ? 0 : c; }
		context.putImageData(image, 0, 0);
		scene.drawn?.(painter, shown, size);
	};
	const layout = (again: boolean): void => {
		const box = host.getBoundingClientRect();
		if (!box.width || !box.height) return;
		size = scale(box.width);
		const width = Math.ceil(box.width / size), height = Math.ceil(box.height / size);
		if (!again && painter !== null && painter.width === width && painter.height === height) return;
		stale = false;
		painter = scene.paint(night.get(), width, height, box.width, motion.get());
		if (image === null || canvas.width !== width || canvas.height !== height) {
			canvas.width = width; canvas.height = height;
			image = context.createImageData(width, height);
		}
		canvas.style.width = `${String(width * size)}px`; canvas.style.height = `${String(height * size)}px`;
		draw(0);
	};
	const refresh = (fade: boolean): void => {
		if (painter === null) return;
		if (!seen) { stale = true; return; }
		if (fade && motion.get()) ghost(canvas);
		layout(true);
	};
	const tick = (ms: number): void => {
		draw(Math.min(0.05, (ms - last) / 1000));
		last = ms;
		if (on) raf = requestAnimationFrame(tick);
	};
	const loop = (): void => {
		const want = seen && motion.get();
		if (want && !on) { on = true; last = performance.now(); raf = requestAnimationFrame(tick); }
		else if (!want && on) { on = false; cancelAnimationFrame(raf); }
	};

	const pointer = scene.pointer ?? host;
	const at = (event: PointerEvent): readonly [number, number] => {
		const box = canvas.getBoundingClientRect();
		return [(event.clientX - box.left) / size, (event.clientY - box.top) / size];
	};
	const onMove = (event: PointerEvent): void => { const [x, y] = at(event); painter?.move?.(x, y); };
	const onDown = (event: PointerEvent): void => { const [x, y] = at(event); painter?.poke?.(x, y); };
	const onLeave = (): void => { painter?.leave?.(); };
	const onScroll = (): void => { if (seen && !on) draw(0); };
	pointer.addEventListener('pointermove', onMove);
	pointer.addEventListener('pointerdown', onDown);
	pointer.addEventListener('pointerleave', onLeave);
	if (scene.scroll === true) addEventListener('scroll', onScroll, { passive: true });

	const resized = new ResizeObserver(() => { layout(false); });
	resized.observe(host);
	layout(false);
	const watched = new IntersectionObserver(([entry]) => {
		seen = entry?.isIntersecting ?? false;
		if (seen && stale) layout(true);
		loop();
	}, { rootMargin: '60px' });
	watched.observe(host);
	const offNight = night.watch(() => { refresh(true); });
	const offMotion = motion.watch((moving) => {
		if (!moving) held = performance.now() / 1000;
		refresh(false);
		loop();
	});

	return {
		again: () => { refresh(false); },
		stop: () => {
			on = false;
			cancelAnimationFrame(raf);
			resized.disconnect();
			watched.disconnect();
			offNight();
			offMotion();
			pointer.removeEventListener('pointermove', onMove);
			pointer.removeEventListener('pointerdown', onDown);
			pointer.removeEventListener('pointerleave', onLeave);
			removeEventListener('scroll', onScroll);
		},
	};
};

/** A strip as a scene's painter, its sky's top colour see-through. */
export const stripPainter = (config: StripConfig, width: number, height: number, moving: boolean): Strip & Painter =>
	Object.assign(createStrip(config, width, height, { motion: moving }), { clear: pack(config.palette.sky[0]!) });

// --- the birds on the page ----------------------------------------------------------------------
//
// One of the strip's birds, drawn a size closer. One flies down to the resume button as the page
// opens, pecks at it, and leaves when the pointer reaches the button. Another lands on the contact
// form once the form is in full view, hops to Submit once the form would send, and carries a letter
// off when it is sent. Like the strip, `createPerch` is the bird alone and needs no DOM, and
// `runPerch` puts it on a page.

type Pose = readonly (readonly [x: number, y: number])[];

/** A pose from rows of `#`, the last row on the feet row (y 0), the first column at x -4. Faces left. */
const pose = (rows: readonly string[]): Pose => rows.flatMap((row, j) =>
	[...row].flatMap((c, i) => (c === '#' ? [[i - 4, j - rows.length + 1] as const] : [])));

// Standing, with an eye. Pecking, the head drops to the button in front of the feet and the tail
// lifts; the feet stay where they are.
const STAND = pose(['.##.....', '#.##....', '.####...', '.#####..', '..###.##', '..#.#...']);
const PECK = pose(['...##...', '..####.#', '.######.', '#.###...', '#.#.#...']);
// In flight it is the strip's V with a body under it, wings raised then level; in a bound it is the
// body alone.
const FLY_UP = pose(['.#.....#', '..#...#.', '...###..', '....#...', '........']);
const FLY_LEVEL = pose(['.##...##', '...###..', '....#...', '........']);
const TUCK = pose(['.####...', '..###...', '........']);

/** How long the flight down to the button takes, in seconds. */
export const ARRIVE = 0.9;

/** What the bird is doing: flying down, on the button, or flying off. */
export type PerchState = 'in' | 'perch' | 'away';

/** The bird on the resume button. */
export interface Perch {
	readonly state: PerchState;
	/** Where its feet are, in CSS pixels. */
	readonly x: number;
	readonly y: number;
	/** The pixels to paint, in strip pixels from the feet, the bird facing left. */
	readonly pose: Pose;
	/** Advance by `dt` seconds. `to` is where it lands: the button's top edge, read each frame. */
	step(dt: number, to: { readonly x: number; readonly y: number }): void;
	/** The pointer reached the button. Flying down or standing on it, the bird flies off. */
	scare(): void;
}

/**
 * A bird that sets off from `from` and lands within `ARRIVE` seconds.
 *
 * It comes down in a curve that ends level with the button, falls with its wings tucked through
 * the middle of it, and beats its wings to brake at both ends. On the button it stands a moment,
 * pecks two to four times, and stands again. Scared, it flies off up and to the left in bounds, as
 * the strip's birds do, and keeps going; the page decides when it is out of sight.
 */
export const createPerch = (from: { readonly x: number; readonly y: number }, random: () => number = Math.random): Perch => {
	let state: PerchState = 'in';
	let x = from.x, y = from.y, t = 0;
	let current: Pose = FLY_UP;
	// On the button: the time left in this stance, and the pecks left in this round.
	let wait = 0.25 + random() * 0.3, pecks = 0, down = false;
	// Flying off.
	let vx = 0, vy = 0, flap = true, bout = 0;

	const step = (dt: number, to: { readonly x: number; readonly y: number }): void => {
		t += dt;
		const beat = Math.floor(t * 14) & 1 ? FLY_LEVEL : FLY_UP;
		if (state === 'in') {
			const s = Math.min(1, t / ARRIVE), u = 1 - (1 - s) ** 2;
			const cx = to.x + 170, cy = to.y - 70;
			x = (1 - u) ** 2 * from.x + 2 * u * (1 - u) * cx + u * u * to.x;
			y = (1 - u) ** 2 * from.y + 2 * u * (1 - u) * cy + u * u * to.y;
			current = s > 0.15 && s < 0.55 ? TUCK : beat;
			if (s === 1) { state = 'perch'; current = STAND; }
			return;
		}
		if (state === 'perch') {
			x = to.x; y = to.y;
			wait -= dt;
			if (wait <= 0) {
				if (down) { down = false; pecks--; wait = pecks > 0 ? 0.13 : 0.5 + random(); }
				else { if (pecks === 0) pecks = 2 + Math.floor(random() * 3); down = true; wait = 0.09; }
			}
			current = down ? PECK : STAND;
			return;
		}
		bout -= dt;
		if (bout <= 0) { flap = !flap; bout = flap ? 0.22 + random() * 0.08 : 0.12 + random() * 0.06; }
		vx += (-220 - vx) * 2 * dt;
		vy += (flap ? (-300 - vy) * 6 : 600) * dt;
		x += vx * dt; y += vy * dt;
		current = flap ? beat : TUCK;
	};

	const scare = (): void => {
		if (state === 'away') return;
		state = 'away'; vx = -120; vy = -150; flap = true; bout = 0.25;
	};

	return {
		get state() { return state; },
		get x() { return x; },
		get y() { return y; },
		get pose() { return current; },
		step,
		scare,
	};
};

// A letter the bird carries off when the contact form is sent: paper with an ink edge and a flap,
// held under its feet.
const LETTER = ['#####', '##.##', '#...#', '#####'];

/** A bird flown on a page by `runPerch`. */
export interface Flight {
	/** What the bird is doing, or null before it sets off and once it is gone. */
	readonly state: PerchState | null;
	/** Set off from above the window for the element it lands on, unless it is already out. */
	start(): void;
	/** Fly on to another element from where it is, and land there. */
	land(on: HTMLElement): void;
	/** Fly off, holding a letter with `letter`. */
	leave(letter?: boolean): void;
	/** Take every listener and observer back off. */
	stop(): void;
}

/**
 * Run a bird on `canvas`, a child of `host` placed against it, landing on `target`.
 *
 * It sets off from above the top of the window, to the right of where it lands, and is painted in
 * the strip's bird colour for the mode `night` reports, at the strip's pixel size. It sets off at
 * once unless `wait`, in which case `start` sends it. A `shy` bird flies off when the pointer reaches
 * its element or the keyboard focuses it. Once it is past the edge of the window it is gone. Nothing
 * flies while `motion` is off, and switching motion off takes a bird in flight away.
 */
export const runPerch = (
	host: HTMLElement,
	canvas: HTMLCanvasElement,
	target: HTMLElement,
	scale: (width: number) => number,
	night: () => boolean,
	options: { readonly wait?: boolean; readonly shy?: boolean; readonly letter?: boolean } = {},
): Flight => {
	const context = canvas.getContext('2d');
	// The canvas holds every pose: x from -4 to 3, y from -5 to 0, in strip pixels, and below the
	// feet the letter when the bird can carry one.
	const rows = options.letter === true ? 9 : 6;
	canvas.width = 8; canvas.height = rows;
	let on = target;
	const spot = (): { x: number; y: number } => {
		const h = host.getBoundingClientRect(), b = on.getBoundingClientRect();
		return { x: b.left - h.left + b.width * 0.72, y: b.top - h.top };
	};

	let bird: Perch | null = null, carrying = false;
	let raf = 0, last = performance.now(), size = 0, seen = true, running = false;
	const paint = (): void => {
		if (bird === null || context === null) return;
		const next = scale(host.getBoundingClientRect().width);
		if (next !== size) {
			size = next;
			canvas.style.width = `${String(8 * size)}px`; canvas.style.height = `${String(rows * size)}px`;
		}
		// Across, on the strip's pixel grid. Down, on the element's edge exactly, so the feet touch it.
		const left = Math.round(bird.x / size) * size - 4 * size, high = Math.round(bird.y) - 6 * size;
		canvas.style.transform = `translate(${String(left)}px, ${String(high)}px)`;
		context.clearRect(0, 0, 8, rows);
		const ink = (night() ? NIGHT : LIGHT).bird;
		context.fillStyle = ink;
		for (const [px, py] of bird.pose) context.fillRect(px + 4, py + 5, 1, 1);
		if (carrying && bird.state === 'away') {
			for (let j = 0; j < LETTER.length; j++) for (let i = 0; i < 5; i++) {
				context.fillStyle = LETTER[j]![i] === '#' ? ink : PAPER_A;
				context.fillRect(i + 2, j + 5, 1, 1);
			}
		}
	};
	const gone = (): boolean => {
		if (bird === null) return true;
		const h = host.getBoundingClientRect();
		return bird.y + h.top < -40 || bird.x + h.left < -40 || bird.x + h.left > innerWidth + 40;
	};
	const away = (): void => {
		bird = null; running = false;
		canvas.style.display = 'none';
		delete canvas.dataset['state'];
	};

	// Standing on an element that is off screen, nothing needs drawing: the loop rests until the
	// element is back, or until the bird is scared.
	const tick = (ms: number): void => {
		if (bird === null) { running = false; return; }
		bird.step(Math.min(0.05, (ms - last) / 1000), spot());
		last = ms;
		if (options.shy === true && bird.state === 'perch' && on.matches(':hover')) bird.scare();
		canvas.dataset['state'] = bird.state;
		if (bird.state === 'away' && gone()) { away(); return; }
		paint();
		if (bird.state === 'perch' && !seen) { running = false; return; }
		raf = requestAnimationFrame(tick);
	};
	const run = (): void => {
		if (running || bird === null) return;
		running = true; last = performance.now(); raf = requestAnimationFrame(tick);
	};
	const start = (): void => {
		if (!motion.get() || context === null || (bird !== null && bird.state !== 'away')) return;
		const from = spot();
		bird = createPerch({ x: from.x + 240, y: -host.getBoundingClientRect().top - 30 });
		carrying = false;
		canvas.style.display = 'block';
		paint();
		run();
	};
	const scare = (): void => { bird?.scare(); run(); };
	if (options.shy === true) {
		target.addEventListener('pointerenter', scare);
		target.addEventListener('focus', scare);
	}
	const watch = new IntersectionObserver(([entry]) => {
		seen = entry?.isIntersecting ?? true;
		if (seen) run();
	});
	watch.observe(target);
	const offMotion = motion.watch((moving) => { if (!moving) { cancelAnimationFrame(raf); away(); } });
	if (options.wait !== true) start();

	return {
		get state() { return bird?.state ?? null; },
		start,
		land: (next) => {
			if (next === on) return;
			on = next;
			watch.disconnect();
			watch.observe(on);
			if (bird !== null && bird.state !== 'away') { bird = createPerch({ x: bird.x, y: bird.y }); run(); }
		},
		leave: (letter = false) => { carrying = letter; scare(); },
		stop: () => {
			cancelAnimationFrame(raf);
			running = false;
			watch.disconnect();
			offMotion();
			target.removeEventListener('pointerenter', scare);
			target.removeEventListener('focus', scare);
		},
	};
};
