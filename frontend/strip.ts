// The pixel strip at the top of the landing page: trees, a pond that mirrors them, leaves that fall
// when the cursor brushes a crown, birds, fireflies at night, and ripples where the cursor crosses
// the water. Approved as https://claude.ai/artifact/WfGHVZb54iFvZTbUHKXwfP (work order 485).
//
// Two halves. `createStrip` paints into a pixel buffer and needs no DOM, so the favicon script and
// the tests run it in Node. `runStrip` puts one on a canvas in a page, sizes it, feeds it the
// pointer and runs it only while it is on screen.
//
// Colours are packed as ImageData lays them out on a little-endian machine: 0xAABBGGRR.

import { FOREST, LIME, MOSS, PAPER, PAPER_A, PINE, SAGE, STACKED } from './theme.ts';

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
	/** Where the moon is, as shares of the width and of the sky. */
	readonly moon?: readonly [number, number];
	/** How tall the hills are, against the default. */
	readonly hills?: number;
	/** Whether crowns grow hanging vines. */
	readonly vines?: boolean;
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
	firefly: LIME, moon: LIME, bird: '#0A170A',
};

/** The landing hero's seed. Its trees are seeded from it in order, so its third tree is `treeSeed(HERO_SEED, 2)`. */
export const HERO_SEED = 5;

// On a wide screen the trees stand to the right of the words; on a narrower one the words sit above
// the strip, so the trees spread across it.
// Their heights are against a 680px hero, so the crowns stand below the words and the photo.
const WIDE_TREES: readonly Tree[] = [[0.64, 0.41], [0.74, 0.57], [0.86, 0.47], [0.96, 0.34]];
const STACKED_TREES: readonly Tree[] = [[0.12, 0.45], [0.38, 0.72], [0.64, 0.56], [0.9, 0.42]];
/** A strip's `index`th tree is seeded from the strip's seed and its place in the list. */
export const treeSeed = (seed: number, index: number): number => seed * 31 + index;

// The ground at half the height: the pond below the bank is as deep as the sky above it, so every
// reflection fits. The hills are kept low so the words in the sky stand clear of them.
const hero = (palette: Palette, night: boolean, trees: readonly Tree[]): StripConfig => ({
	seed: HERO_SEED,
	ground: 0.5,
	hills: 0.5,
	reflection: true,
	ambient: night ? 1 : 0.9,
	light: night ? [0.6, -0.8] : [-0.6, -0.8],
	trees,
	palette,
	...(night ? { fireflies: 12, moon: [trees === STACKED_TREES ? 0.8 : 0.6, 0.14] as const } : { birds: 2, flock: true }),
});
const HERO = {
	light: { wide: hero(LIGHT, false, WIDE_TREES), stacked: hero(LIGHT, false, STACKED_TREES) },
	night: { wide: hero(NIGHT, true, WIDE_TREES), stacked: hero(NIGHT, true, STACKED_TREES) },
};

/** The hero's scene for a mode and a width in CSS pixels. The same object for the same answer, so a resize within a layout keeps the scene. */
export const heroScene = (night: boolean, width: number): StripConfig =>
	HERO[night ? 'night' : 'light'][width <= STACKED ? 'stacked' : 'wide'];

/** The size of one strip pixel on a screen this wide. */
export const heroScale = (width: number): number => (width >= 440 ? 3 : 2);

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
	for (let i = 0; i < (config.fireflies ?? 0); i++) flies.push({ x: r() * W, y: gy * (0.35 + r() * 0.6), vx: 0, vy: 0, phase: r() * 6 });
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
				fl.x = (fl.x + fl.vx * dt + W) % W; fl.y = clamp(fl.y + fl.vy * dt, gy * 0.3, gy - 2);
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
				for (let x = 0; x < W; x++) {
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
		}
		ptr.x = x; ptr.y = y;
	};

	return { width: W, height: H, pixels, frame, move, leave: () => { ptr.x = null; }, leaves: () => leaves.length };
};

/**
 * Run a strip on the canvas inside `host`, filling the host.
 *
 * `configFor` and `scale` take the host's width in CSS pixels: the first picks the scene for it (a
 * phone lays its trees out differently), the second the size of one strip pixel. The strip runs only
 * while the host is on screen, and holds still for a visitor who asked for reduced motion.
 *
 * Returns: a stop function that takes every listener and observer back off.
 */
export const runStrip = (
	host: HTMLElement,
	configFor: (width: number) => StripConfig,
	scale: (width: number) => number,
): (() => void) => {
	const canvas = host.querySelector('canvas');
	const context = canvas?.getContext('2d');
	if (canvas === null || canvas === undefined || !context) return () => {};
	const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
	let strip: Strip | null = null;
	let image: ImageData | null = null;
	let config: StripConfig | null = null;
	let size = 1;

	const paint = (dt: number, t: number): void => {
		if (strip === null || image === null) return;
		strip.frame(dt, t);
		new Uint32Array(image.data.buffer).set(strip.pixels);
		context.putImageData(image, 0, 0);
	};
	const layout = (): void => {
		const box = host.getBoundingClientRect();
		if (!box.width || !box.height) return;
		const next = configFor(box.width);
		size = scale(box.width);
		const width = Math.ceil(box.width / size), height = Math.ceil(box.height / size);
		if (strip !== null && strip.width === width && strip.height === height && next === config) return;
		config = next;
		strip = createStrip(config, width, height, { motion });
		canvas.width = width; canvas.height = height;
		canvas.style.width = `${String(width * size)}px`; canvas.style.height = `${String(height * size)}px`;
		image = context.createImageData(width, height);
		paint(0, performance.now() / 1000);
	};

	const onMove = (event: PointerEvent): void => {
		const box = canvas.getBoundingClientRect();
		strip?.move((event.clientX - box.left) / size, (event.clientY - box.top) / size);
	};
	const onLeave = (): void => { strip?.leave(); };
	host.addEventListener('pointermove', onMove);
	host.addEventListener('pointerleave', onLeave);

	const resized = new ResizeObserver(layout);
	resized.observe(host);
	layout();

	let on = false, raf = 0, last = 0;
	const tick = (ms: number): void => {
		paint(Math.min(0.05, (ms - last) / 1000), ms / 1000);
		last = ms;
		if (on) raf = requestAnimationFrame(tick);
	};
	const seen = new IntersectionObserver(([entry]) => {
		if (!motion) return;
		if (entry?.isIntersecting && !on) { on = true; last = performance.now(); raf = requestAnimationFrame(tick); }
		else if (!entry?.isIntersecting) { on = false; cancelAnimationFrame(raf); }
	});
	seen.observe(host);

	return () => {
		on = false;
		cancelAnimationFrame(raf);
		resized.disconnect();
		seen.disconnect();
		host.removeEventListener('pointermove', onMove);
		host.removeEventListener('pointerleave', onLeave);
	};
};

