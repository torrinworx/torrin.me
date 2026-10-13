// The pixel scenes a post can hold (work order 519): each draws the real things of one idea, a
// file and the chunks it is cut into, the points they become on a map of meanings, a database, a
// search, the pages a deploy uploads, a figure as a bar.
//
// What has words on it is HTML: the page lays most of it out and the painter reads where it went,
// or for a map, the painter says where each word goes. Either way every word is real text. The
// canvas draws what has none, and the motion: things carried from step to step, searches landing,
// lines reaching what they find. Like strip.ts, nothing here needs a DOM, so the tests and the
// feed's still frames run it in Node.

import { bayer, pack } from './strip.ts';
import type { Painter } from './strip.ts';
import { FOREST, ICONS, LIME, MOSS, PAPER, PAPER_A, PINE, SAGE } from './theme.ts';
import type { IconName } from './theme.ts';

/** The colours a scene draws with, packed, for a mode. */
export interface Inks {
	readonly page: number;
	readonly surface: number;
	readonly ink: number;
	readonly ink2: number;
	readonly accent: number;
	readonly soft: number;
	readonly glow: number;
	readonly fill: number;
	readonly fill2: number;
}

export const inksOf = (night: boolean): Inks => (night
	? { page: pack(FOREST), surface: pack('#1A331A'), ink: pack(PAPER_A), ink2: pack(SAGE), accent: pack(LIME), soft: pack(PINE), glow: pack('#5E8238'), fill: pack('#183118'), fill2: pack('#1F3D1D') }
	: { page: pack(PAPER), surface: pack(PAPER_A), ink: pack(FOREST), ink2: pack(PINE), accent: pack(MOSS), soft: pack(SAGE), glow: pack(LIME), fill: pack('#EAEFDC'), fill2: pack('#DFE7CA') });

/**
 * Where a thing with words stands this frame, in strip pixels, and how much of it shows. A thing
 * the page lays out is moved by `x` and `y` from where it stands (`offset`). A thing the painter
 * places has its top left corner at them.
 */
export interface Anchor {
	readonly x: number;
	readonly y: number;
	readonly alpha: number;
	readonly offset?: boolean;
	/** For a snippet on a map: whether a search found it. */
	readonly found?: boolean;
}

/** A scene's painter: the canvas's pixels, and where each thing with words is. */
export interface Explainer extends Painter {
	readonly anchors: ReadonlyMap<string, Anchor>;
	/** How far each typed thing's words are written, 0 to 1, by name. */
	readonly typed: ReadonlyMap<string, number>;
	move(x: number, y: number): void;
	leave(): void;
	poke(x: number, y: number): boolean;
}

/** A box in strip pixels. */
export interface Box {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

/** A thing's size in strip pixels, as the page measured it. */
export interface Size {
	readonly width: number;
	readonly height: number;
}

/** What every painter is handed. `started` is the moment, on the clock `frame` is given, its story began, or null while it waits. */
export interface Stage {
	readonly width: number;
	readonly height: number;
	readonly night: boolean;
	readonly moving: boolean;
	readonly started: () => number | null;
}

/** How far a moment is through a stretch of time, eased in and out, 0 to 1. */
export const through = (t: number, start: number, length: number): number => {
	const u = (t - start) / length;
	return u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
};

/** How far into its story a scene is: -1 before it starts, Infinity (the end) with motion off. */
const storyAt = (stage: Stage, t: number): number => {
	if (!stage.moving) return Infinity;
	const start = stage.started();
	return start === null ? -1 : t - start;
};

const penOf = (W: number, H: number) => {
	const pixels = new Uint32Array(W * H);
	const put = (x: number, y: number, c: number): void => {
		const px = Math.round(x), py = Math.round(y);
		if (px >= 0 && px < W && py >= 0 && py < H) pixels[py * W + px] = c;
	};
	// A line one pixel wide, every `every`th pixel of it, drawn as far as `upto` of its length.
	const line = (x0: number, y0: number, x1: number, y1: number, c: number, every = 1, upto = 1): void => {
		if (upto <= 0) return;
		const n = Math.max(Math.abs(Math.round(x1) - Math.round(x0)), Math.abs(Math.round(y1) - Math.round(y0)), 1);
		for (let k = 0; k <= n * upto; k++) if (k % every === 0) put(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, c);
	};
	// Anything drawn while `fade` is under 1 shows only where the dither lets it, so a thing comes in as the strip's bands do.
	let fade = 1;
	const dithered = (x: number, y: number, c: number): void => { if (fade >= 1 || bayer(Math.round(x), Math.round(y)) < fade) put(x, y, c); };
	return { pixels, put: dithered, rect: (x: number, y: number, w: number, h: number, c: number) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) dithered(x + i, y + j, c); }, line, set fade(v: number) { fade = v; } };
};
type Pen = ReturnType<typeof penOf>;

const overlap = (a: Box, b: Box): number =>
	Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

/**
 * Where a word goes. First, the first of the places, each kept inside the stage, that covers
 * nothing taken and `fits`. Else the free place that fits nearest the spot, within `reach`. Else,
 * when it must show, the place that covers least, and when it need not, nowhere.
 */
const placeAmong = (places: readonly Box[], taken: readonly Box[], W: number, H: number, spot: readonly [number, number], must: boolean, reach = 45, fits = (_box: Box): boolean => true): Box | null => {
	let best = places[0]!, least = Infinity;
	for (const place of places) {
		const box = { ...place, x: Math.max(0, Math.min(W - place.width, place.x)), y: Math.max(0, Math.min(H - place.height, place.y)) };
		const covered = taken.reduce((sum, other) => sum + overlap(box, other), 0);
		if (covered === 0 && fits(box)) return box;
		if (covered < least) { least = covered; best = box; }
	}
	const { width: w, height: h } = best;
	let free: Box | null = null, closest = reach;
	for (let y = 0; y <= H - h; y += 2) for (let x = 0; x <= W - w; x += 2) {
		const d = Math.hypot(x + w / 2 - spot[0], y + h / 2 - spot[1]);
		if (d >= closest) continue;
		const box = { x, y, width: w, height: h };
		if (fits(box) && taken.every((other) => overlap(box, other) === 0)) { free = box; closest = d; }
	}
	return free ?? (must ? best : null);
};

/** Where a line from one box to another leaves the first and meets the second: their facing sides. */
const between = (a: Box, b: Box): readonly [number, number, number, number] => {
	if (b.x >= a.x + a.width - 2) return [a.x + a.width + 1, a.y + a.height / 2, b.x - 2, b.y + b.height / 2];
	if (b.x + b.width <= a.x + 2) return [a.x - 2, a.y + a.height / 2, b.x + b.width + 1, b.y + b.height / 2];
	if (b.y >= a.y + a.height - 2) return [a.x + a.width / 2, a.y + a.height + 1, b.x + b.width / 2, b.y - 2];
	return [a.x + a.width / 2, a.y - 2, b.x + b.width / 2, b.y + b.height + 1];
};

const union = (boxes: readonly (Box | undefined)[]): Box | undefined => {
	const all = boxes.filter((box): box is Box => box !== undefined && box.width > 0);
	if (all.length === 0) return undefined;
	const x = Math.min(...all.map((box) => box.x)), y = Math.min(...all.map((box) => box.y));
	return { x, y, width: Math.max(...all.map((box) => box.x + box.width)) - x, height: Math.max(...all.map((box) => box.y + box.height)) - y };
};

// --- the things, drawn ---------------------------------------------------------------------

/** A database: a cylinder of stacked disks, lit from the left, `full` of the dots stored in it. */
const drawDatabase = (pen: Pen, x: number, y: number, w: number, h: number, inks: Inks, full: number): void => {
	const half = (w - 1) / 2, ry = Math.max(2, Math.round(w / 6));
	const dip = (i: number): number => Math.round(ry * Math.sqrt(Math.max(0, 1 - ((i - half) / half) ** 2)));
	for (let i = 0; i < w; i++) {
		const d = dip(i), top = y + ry - d, bottom = y + h - ry - 1 + d;
		const light = 0.95 - i / (w - 1) + (bayer(x + i, 0) - 0.5) * 0.3;
		for (let j = y + ry; j <= bottom; j++) pen.put(x + i, j, light > 0.55 ? inks.surface : light > 0.15 ? inks.fill2 : inks.soft);
		for (let j = top; j <= y + ry + d; j++) pen.put(x + i, j, (j - top) % 3 === 1 && i > 1 && i < w - 2 && bayer(x + i, j) < 0.3 ? inks.glow : inks.fill);
		pen.put(x + i, top, inks.ink2);
		pen.put(x + i, y + ry + d, inks.ink2);
		for (const k of [1, 2]) pen.put(x + i, y + ry + Math.round(k * (h - 2 * ry) / 3) + d, inks.ink2);
		pen.put(x + i, bottom, inks.ink2);
	}
	for (let j = y + ry; j < y + h - ry; j++) { pen.put(x, j, inks.ink2); pen.put(x + w - 1, j, inks.ink2); }
	const across = Math.floor((w - 4) / 3), shown = Math.round(full * across * 3);
	for (let s = 0; s < shown; s++) {
		const row = Math.floor(s / across), col = s % across;
		pen.put(x + 3 + col * 3, y + h - ry - 3 - row * Math.round((h - 2 * ry) / 3), inks.accent);
	}
};

/** Object storage: a cloud, flat below, lit from the upper left. */
const drawCloud = (pen: Pen, cx: number, cy: number, w: number, h: number, inks: Inks): void => {
	const discs = [[cx, cy - h * 0.12, h * 0.48], [cx - w * 0.28, cy + h * 0.08, h * 0.34], [cx + w * 0.27, cy + h * 0.06, h * 0.38]] as const;
	const base = cy + h * 0.4;
	const inside = (x: number, y: number): boolean => y <= base && discs.some(([dx, dy, r]) => (x - dx) ** 2 + (y - dy) ** 2 <= r * r);
	for (let y = Math.floor(cy - h); y <= base + 1; y++) for (let x = Math.floor(cx - w); x <= cx + w; x++) {
		if (!inside(x, y)) continue;
		const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
		const light = 0.75 - (x - cx) / w * 0.6 - (y - cy) / h * 0.7 + (bayer(x, y) - 0.5) * 0.3;
		pen.put(x, y, edge ? inks.ink2 : light > 0.55 ? inks.surface : light > 0.2 ? inks.fill : inks.fill2);
	}
};

/** One page of a site, seven by nine: its fold and its lines of text, lit and edged in the accent when it changed. */
const drawPage = (pen: Pen, x: number, y: number, inks: Inks, changed: boolean): void => {
	const edge = changed ? inks.accent : inks.ink2;
	pen.rect(x, y, 7, 9, changed ? inks.glow : inks.surface);
	for (let i = 0; i < 5; i++) pen.put(x + i, y, edge);
	for (let j = 0; j < 9; j++) { pen.put(x, y + j, edge); pen.put(x + 6, y + Math.max(j, 2), edge); }
	for (let i = 0; i < 7; i++) pen.put(x + i, y + 8, edge);
	pen.put(x + 5, y + 1, edge); pen.put(x + 5, y + 2, edge); pen.put(x + 4, y + 2, edge);
	for (const [j, n] of [[3, 3], [5, 4], [6, 2]] as const) for (let i = 0; i < n; i++) pen.put(x + 2 + i, y + j, changed ? inks.accent : inks.soft);
};

/** A stack of pages, the top one whole, fanned up and to the right. */
const drawStack = (pen: Pen, x: number, y: number, w: number, h: number, inks: Inks): void => {
	const n = Math.max(2, Math.min(4, Math.floor((w - 7) / 3) + 1));
	for (let k = n - 1; k >= 0; k--) drawPage(pen, x + k * 3, y + h - 9 - k * 2, inks, false);
};

/** A search's place on the map: a pin with its tip at the spot, and its shadow under it. */
const drawPin = (pen: Pen, x: number, y: number, inks: Inks): void => {
	for (let i = -2; i <= 2; i++) if (bayer(x + i, y + 1) < 0.6) pen.put(x + i, y + 1, inks.fill2);
	const cy = y - 6;
	for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
		if (i * i + j * j > 10) continue;
		pen.put(x + i, cy + j, i * i + j * j <= 1 ? inks.surface : (i < 0 && j < 0 && i * i + j * j > 4) ? inks.glow : inks.accent);
	}
	for (const [j, w] of [[4, 1], [5, 1], [6, 0]] as const) for (let i = -w; i <= w; i++) pen.put(x + i, cy + j, inks.accent);
};

/** A point on the map: a small cross, or lit, a dot with a ring of glow. */
const drawPoint = (pen: Pen, x: number, y: number, inks: Inks, lit: number): void => {
	if (lit > 0) {
		for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
			const d = i * i + j * j;
			if (d > 4 && d <= 10 && bayer(x + i, y + j) < lit * 0.75) pen.put(x + i, y + j, inks.glow);
		}
		for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) pen.put(x + i, y + j, inks.accent);
		pen.put(x - 2, y, inks.accent); pen.put(x + 2, y, inks.accent); pen.put(x, y - 2, inks.accent); pen.put(x, y + 2, inks.accent);
		return;
	}
	pen.put(x, y, inks.ink2); pen.put(x - 1, y, inks.ink2); pen.put(x + 1, y, inks.ink2); pen.put(x, y - 1, inks.ink2); pen.put(x, y + 1, inks.ink2);
};

/** A processor chip, the model behind an API: pins on every side, and its core lit while it works. */
const drawChip = (pen: Pen, x: number, y: number, size: number, inks: Inks, busy: number): void => {
	for (let k = 2; k < size - 2; k += 2) {
		pen.put(x + k, y - 1, inks.ink2); pen.put(x + k, y + size, inks.ink2);
		pen.put(x - 1, y + k, inks.ink2); pen.put(x + size, y + k, inks.ink2);
	}
	pen.rect(x, y, size, size, inks.fill2);
	for (let i = 0; i < size; i++) { pen.put(x + i, y, inks.ink2); pen.put(x + i, y + size - 1, inks.ink2); pen.put(x, y + i, inks.ink2); pen.put(x + size - 1, y + i, inks.ink2); }
	const inner = Math.round(size * 0.3);
	pen.rect(x + inner, y + inner, size - inner * 2, size - inner * 2, busy > 0 ? inks.glow : inks.accent);
	pen.put(x + 1, y + 1, inks.surface);
};

/** A build: a cog, its teeth turning a step while it works. */
const drawGear = (pen: Pen, cx: number, cy: number, r: number, inks: Inks, turn: number): void => {
	for (let y = -r - 2; y <= r + 2; y++) for (let x = -r - 2; x <= r + 2; x++) {
		const d = Math.hypot(x, y), a = Math.atan2(y, x) + turn;
		const tooth = Math.cos(a * 8) > 0.3 ? r + 2 : r;
		if (d > tooth + 0.5) continue;
		const edge = d > tooth - 0.7 || (d < r * 0.4 + 0.5 && d > r * 0.4 - 0.7);
		if (d < r * 0.4 - 0.7) continue;
		pen.put(cx + x, cy + y, edge ? inks.ink2 : (x + y < 0 ? inks.surface : inks.fill2));
	}
};

/** Data: a table, a header row in the accent and rows of cells. */
const drawTable = (pen: Pen, x: number, y: number, w: number, h: number, inks: Inks): void => {
	pen.rect(x, y, w, h, inks.surface);
	pen.rect(x, y, w, 3, inks.accent);
	for (let j = y + 3; j < y + h; j += 3) for (let i = 0; i < w; i++) pen.put(x + i, j, inks.fill2);
	for (let i = x + Math.round(w / 3); i < x + w - 1; i += Math.round(w / 3)) for (let j = y; j < y + h; j++) pen.put(i, j, inks.ink2);
	for (let i = 0; i < w; i++) { pen.put(x + i, y, inks.ink2); pen.put(x + i, y + h - 1, inks.ink2); }
	for (let j = 0; j < h; j++) { pen.put(x, y + j, inks.ink2); pen.put(x + w - 1, y + j, inks.ink2); }
};

/** An upload: an arrow rising out of a tray. */
const drawUpload = (pen: Pen, cx: number, y: number, h: number, inks: Inks, lift: number): void => {
	const tray = y + h - 3;
	for (let i = -6; i <= 6; i++) pen.put(cx + i, tray + 2, inks.ink2);
	pen.put(cx - 6, tray, inks.ink2); pen.put(cx - 6, tray + 1, inks.ink2); pen.put(cx + 6, tray, inks.ink2); pen.put(cx + 6, tray + 1, inks.ink2);
	const top = y + 1 - Math.round(lift);
	for (let j = top + 3; j < tray; j++) { pen.put(cx, j, inks.accent); pen.put(cx - 1, j, inks.accent); }
	for (let k = 0; k < 4; k++) for (let i = -k; i <= k - 1; i++) pen.put(cx + i, top + k, inks.accent);
};

/** A chunk of a file: a slip of paper with two lines of text on it. */
const drawSlip = (pen: Pen, x: number, y: number, inks: Inks): void => {
	pen.rect(x, y, 9, 4, inks.surface);
	for (let i = 0; i < 9; i++) { pen.put(x + i, y, inks.ink2); pen.put(x + i, y + 3, inks.ink2); }
	pen.put(x, y + 1, inks.ink2); pen.put(x, y + 2, inks.ink2); pen.put(x + 8, y + 1, inks.ink2); pen.put(x + 8, y + 2, inks.ink2);
	for (let i = 2; i < 7; i++) pen.put(x + i, y + 1 + (i % 3 === 0 ? 1 : 0), inks.soft);
};

/** A dot that stands for one chunk's numbers, travelling. */
const drawDot = (pen: Pen, x: number, y: number, inks: Inks): void => {
	pen.rect(x - 1, y - 1, 3, 3, inks.accent);
	pen.put(x - 1, y - 1, inks.glow);
};

/** A thing with words, drawn as a pixel box with its icon, where the page is not there to draw it: in a feed's still frame. */
const drawCard = (pen: Pen, box: Box, inks: Inks, icon: IconName | null, tone: 'card' | 'search' | 'found'): void => {
	const fill = tone === 'search' ? inks.accent : tone === 'found' ? inks.glow : inks.surface;
	const edge = tone === 'search' ? inks.accent : tone === 'found' ? inks.soft : inks.ink2;
	const { x, y, width: w, height: h } = box;
	pen.rect(x, y, w, h, fill);
	for (let i = 1; i < w - 1; i++) { pen.put(x + i, y - 1, edge); pen.put(x + i, y + h, edge); }
	for (let j = 0; j < h; j++) { pen.put(x - 1, y + j, edge); pen.put(x + w, y + j, edge); }
	const ink = tone === 'search' ? inks.surface : inks.ink2;
	if (icon !== null) ICONS[icon].forEach((row, j) => { for (let i = 0; i < 6; i++) if (row[i] === '#') pen.put(x + 1 + i, y + Math.max(0, Math.round((h - 6) / 2)) + j, ink); });
	for (let i = icon === null ? 2 : 9; i < w - 2; i++) if (i % 4 !== 3) pen.put(x + i, y + Math.round(h / 2), tone === 'search' ? inks.surface : inks.soft);
};

// --- the map of meanings --------------------------------------------------------------------------

/**
 * Where each region of a map sits, across and down from 0 to 1, by how many there are. On a
 * narrow map they take turns left and right going down, so each has its own band of height and
 * its words have the width beside it.
 */
const REGION_SPOTS: Readonly<Record<number, readonly (readonly [number, number])[]>> = {
	2: [[0.25, 0.5], [0.75, 0.5]],
	3: [[0.2, 0.3], [0.8, 0.3], [0.5, 0.78]],
	4: [[0.2, 0.28], [0.78, 0.26], [0.2, 0.78], [0.78, 0.78]],
};
const NARROW_SPOTS: Readonly<Record<number, readonly (readonly [number, number])[]>> = {
	2: [[0.3, 0.25], [0.7, 0.75]],
	3: [[0.28, 0.18], [0.72, 0.5], [0.28, 0.82]],
	4: [[0.26, 0.13], [0.74, 0.38], [0.26, 0.62], [0.74, 0.87]],
};
// Where each of a region's snippets sits around its middle, in reading order.
const SNIPPET_SPOTS = [[-0.09, -0.08], [0.09, -0.12], [0, 0.13], [0.11, 0.05]] as const;
const NARROW_SNIPPETS = [[-0.13, -0.05], [0.13, -0.07], [0.02, 0.08], [0.16, 0.03]] as const;

/** Whether a map this many strip pixels wide lays its regions out down the column. */
export const narrowMap = (width: number): boolean => width < 160;

/** A map's regions and snippets laid out: each region's middle, and each snippet's place, 0 to 1. */
export const mapOf = (regions: readonly { readonly name: string; readonly snippets: readonly string[] }[], narrow = false) => regions.map((region, i) => {
	const [x, y] = (narrow ? NARROW_SPOTS : REGION_SPOTS)[regions.length]?.[i] ?? [0.5, 0.5];
	const around = narrow ? NARROW_SNIPPETS : SNIPPET_SPOTS;
	return { name: region.name, x, y, snippets: region.snippets.map((text, j) => ({ text, x: x + around[j]![0], y: y + around[j]![1] })) };
});
export type MapRegion = ReturnType<typeof mapOf>[number];

/** Where a search lands that is about the regions named: between them, and a touch off their middle. */
export const landing = (map: readonly MapRegion[], at: readonly string[]): readonly [number, number] => {
	const named = map.filter((region) => at.includes(region.name));
	const x = named.reduce((sum, region) => sum + region.x, 0) / Math.max(1, named.length);
	const y = named.reduce((sum, region) => sum + region.y, 0) / Math.max(1, named.length);
	return [x + 0.02, y + 0.03];
};

/**
 * A search on the map: where it lands, where it sets off from (either may be off the map, as a
 * request above it is), when it set off, and how many of its nearest snippets it finds. A search
 * about regions names them in `to`, or for where it sets off, in `fromTo`, and lands between them
 * wherever the map has put them.
 */
export interface Seek {
	readonly id: string;
	readonly x: number;
	readonly y: number;
	readonly from: readonly [x: number, y: number];
	readonly to?: readonly string[];
	readonly fromTo?: readonly string[];
	readonly at: number;
	readonly near: number;
}

/** How long a search takes to reach its place, and its lines to reach what it finds, in seconds. */
export const GLIDE = 0.9;
const REACH = 0.4;

/** The box of a map within its stage, for a stage this many strip pixels wide. */
export const mapArea = (width: number, height: number): Box => (width >= 200
	? { x: 8, y: 12, width: width - 16, height: height - 18 }
	: { x: 4, y: 12, width: width - 8, height: height - 18 });

/**
 * A map of meanings: the regions dithered in, each snippet a point, each search a pin with lines
 * to the snippets nearest it, which light up. `seeks` is read every frame, so the page moves a
 * search by changing it. Anchors, each placed by its top left corner: `region:<i>`,
 * `snippet:<i>.<j>` (shown while lit or under the pointer, and when still, all of them if all fit) and
 * `seek:<id>`. Words are placed where they cover no other words, no pin and no lit point, by the
 * sizes the page measured. With no room anywhere, they go where they cover least.
 */
export const createMap = (options: Stage & {
	readonly regions: readonly { readonly name: string; readonly snippets: readonly string[] }[];
	readonly seeks: () => readonly Seek[];
	readonly sizes?: () => ReadonlyMap<string, Size>;
}): Explainer => {
	const { width: W, height: H } = options;
	const regions = mapOf(options.regions, narrowMap(W));
	const area = mapArea(W, H);
	const inks = inksOf(options.night), pen = penOf(W, H);
	const at = (x: number, y: number): readonly [number, number] => [area.x + x * area.width, area.y + y * area.height];
	const snippets = regions.flatMap((region, i) => region.snippets.map((snippet, j) => ({ key: `${String(i)}.${String(j)}`, at: at(snippet.x, snippet.y) })));

	// The neighbourhoods, dithered in and out of the page, so the map has no edge of its own.
	const ground = new Uint32Array(W * H);
	const reach = Math.min(area.width, area.height) * 0.3;
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
		let near = 0;
		for (const region of regions) {
			const [cx, cy] = at(region.x, region.y);
			near = Math.max(near, 1 - Math.hypot(x - cx, (y - cy) * 1.2) / reach);
		}
		ground[y * W + x] = near > 0.45 + bayer(x, y) * 0.2 ? inks.fill2 : near > 0.05 + bayer(x, y) * 0.35 ? inks.fill : 0;
	}

	let hover: string | null = null;
	const anchors = new Map<string, Anchor>();
	const sizeOf = (name: string): Size => options.sizes?.().get(name) ?? { width: 40, height: 7 };
	const names = (): Box[] => regions.map((region, i) => {
		const [cx, cy] = at(region.x, region.y), size = sizeOf(`region:${String(i)}`);
		const box = { x: Math.round(cx - size.width / 2), y: Math.round(cy - reach * 0.78 - size.height / 2), ...size };
		anchors.set(`region:${String(i)}`, { x: box.x, y: box.y, alpha: 1 });
		return box;
	});

	const frame = (_dt: number, t: number): void => {
		pen.pixels.set(ground);
		const lit = new Map<string, number>();
		const pins: (readonly [number, number, string])[] = [];
		const seeks = options.seeks();
		// A narrow map has room for one find per search when there are several.
		const crowded = W < 200 && seeks.length > 1;
		for (const seek of seeks) {
			const g = options.moving ? through(t, seek.at, GLIDE) : 1;
			const to = seek.to === undefined ? [seek.x, seek.y] : landing(regions, seek.to), from = seek.fromTo === undefined ? seek.from : landing(regions, seek.fromTo);
			const [fx, fy] = at(from[0]!, from[1]!), [tx, ty] = at(to[0]!, to[1]!);
			pins.push([fx + (tx - fx) * g, fy + (ty - fy) * g - Math.sin(Math.PI * g) * 6, seek.id]);
			if (g < 1) continue;
			const reached = options.moving ? through(t, seek.at + GLIDE, REACH) : 1;
			const nearest = [...snippets].sort((a, b) => Math.hypot(a.at[0] - tx, a.at[1] - ty) - Math.hypot(b.at[0] - tx, b.at[1] - ty)).slice(0, crowded ? 1 : seek.near);
			for (const snippet of nearest) {
				pen.line(tx, ty, snippet.at[0], snippet.at[1], inks.accent, 2, reached);
				lit.set(snippet.key, Math.max(lit.get(snippet.key) ?? 0, reached));
			}
		}
		for (const snippet of snippets) drawPoint(pen, snippet.at[0], snippet.at[1], inks, lit.get(snippet.key) ?? 0);
		for (const [x, y] of pins) drawPin(pen, x, y, inks);

		// Words go where they cover nothing: the region names, then the searches', beside their
		// pins, then each lit snippet's beside its point.
		const taken: Box[] = names();
		for (const [x, y] of pins) taken.push({ x: x - 4, y: y - 10, width: 9, height: 12 });
		for (const snippet of snippets) if ((lit.get(snippet.key) ?? 0) > 0) taken.push({ x: snippet.at[0] - 2, y: snippet.at[1] - 2, width: 5, height: 5 });
		// A search no longer on the map takes its words with it.
		for (const [key, anchor] of anchors) if (key.startsWith('seek:') && !pins.some(([, , id]) => key === `seek:${id}`)) anchors.set(key, { ...anchor, alpha: 0 });
		for (const [x, y, id] of pins) {
			const { width: w, height: h } = sizeOf(`seek:${id}`);
			const box = placeAmong([
				{ x: x - w / 2, y: y - 11 - h, width: w, height: h },
				{ x: x + 5, y: y - 7 - h / 2, width: w, height: h },
				{ x: x - 5 - w, y: y - 7 - h / 2, width: w, height: h },
				{ x: x - w / 2, y: y + 3, width: w, height: h },
			], taken, W, H, [x, y - 6], true)!;
			taken.push(box);
			anchors.set(`seek:${id}`, { x: box.x, y: box.y, alpha: 1 });
		}
		// The snippets shown, each placed beside its point in turn. With no free place near its
		// point, a snippet's words wait, but the point is still lit. On a narrow map held still, a
		// word also sits nearer its own point than any other region's middle, so it never reads as
		// part of the wrong region.
		const away = (box: Box, [px, py]: readonly [number, number]): number => Math.hypot(Math.max(box.x - px, 0, px - box.x - box.width), Math.max(box.y - py, 0, py - box.y - box.height));
		const place = (shown: (key: string) => boolean): Map<string, Box | null> => {
			const room = [...taken], boxes = new Map<string, Box | null>();
			for (const snippet of snippets) {
				if (!shown(snippet.key)) continue;
				const [x, y] = snippet.at, { width: w, height: h } = sizeOf(`snippet:${snippet.key}`), own = Number(snippet.key.split('.')[0]);
				const fits = (box: Box): boolean => options.moving || !narrowMap(W) || regions.every((region, r) => r === own || away(box, snippet.at) < away(box, at(region.x, region.y)));
				const box = placeAmong([
					{ x: x + 4, y: y - h / 2, width: w, height: h },
					{ x: x - 4 - w, y: y - h / 2, width: w, height: h },
					{ x: x - w / 2, y: y + 4, width: w, height: h },
					{ x: x - w / 2, y: y - 4 - h, width: w, height: h },
					{ x: x + 3, y: y + 3, width: w, height: h },
					{ x: x + 3, y: y - 3 - h, width: w, height: h },
					{ x: x - 3 - w, y: y + 3, width: w, height: h },
					{ x: x - 3 - w, y: y - 3 - h, width: w, height: h },
					{ x: x - w / 2, y: y + 4 + h, width: w, height: h },
					{ x: x - w / 2, y: y - 4 - 2 * h, width: w, height: h },
					{ x: x + 4, y: y + 3 + h, width: w, height: h },
					{ x: x - 4 - w, y: y - 3 - 2 * h, width: w, height: h },
				], room, W, H, [x, y], false, 45, fits);
				boxes.set(snippet.key, box);
				if (box !== null) room.push(box);
			}
			return boxes;
		};
		let boxes = place((key) => (lit.get(key) ?? 0) >= 1 || hover === key);
		// Still, every snippet says what it is where there is room for all of them. Where there is
		// not, as on a phone, the map shows what its story ends on: what the search found.
		if (!options.moving) {
			const every = place(() => true);
			if ([...every.values()].every((box) => box !== null)) boxes = every;
		}
		for (const snippet of snippets) {
			const key = `snippet:${snippet.key}`, box = boxes.get(snippet.key) ?? null, found = (lit.get(snippet.key) ?? 0) >= 1;
			anchors.set(key, box === null ? { ...(anchors.get(key) ?? { x: snippet.at[0] + 4, y: snippet.at[1] }), alpha: 0, found } : { x: box.x, y: box.y, alpha: 1, found });
		}
	};

	// The pointer near a point shows what it is.
	const move = (x: number, y: number): void => {
		const close = snippets.find((snippet) => Math.hypot(snippet.at[0] - x, snippet.at[1] - y) < 5);
		hover = close?.key ?? null;
	};

	return { width: W, height: H, pixels: pen.pixels, anchors, typed: new Map(), frame, move, leave: () => { hover = null; }, poke: () => false };
};

// --- a deploy ----------------------------------------------------------------------------------

/** How a deploy goes: every page uploaded, or only those that changed, and when it began. */
export interface Deploy {
	readonly every: boolean;
	readonly started: number | null;
}

/** How long one page takes to reach the storage, in seconds. */
const FLIGHT = 0.9;

/** The order a deploy uploads in, and when each upload sets off after the deploy begins. */
export const uploadsOf = (pages: number, changed: readonly number[], every: boolean): { page: number; at: number }[] =>
	(every ? Array.from({ length: pages }, (_, i) => i) : [...changed]).map((page, n) => ({ page, at: 0.3 + n * (every ? 0.07 : 0.25) }));

/** Which pages of a deploy changed: spread through the grid, the same ones every time. */
export const changedOf = (pages: number, changed: number): number[] =>
	Array.from({ length: changed }, (_, k) => Math.min(pages - 1, Math.floor((k + 0.5) * pages / changed + ((k * 7) % 3) - 1)));

/** Where a deploy's things go in a stage this many strip pixels wide. */
export const deployLayout = (width: number, pages: number) => {
	const wide = width >= 200, columns = Math.min(pages, wide ? 16 : 8), rows = Math.ceil(pages / columns);
	const store = { x: Math.round(width / 2), y: 34, width: wide ? 64 : 56, height: 32 };
	// The pages as far apart as the stage lets them be, up to their usual spacing, with room at the sides.
	const across = Math.max(8, Math.min(wide ? 14 : 18, Math.floor((width - 16 - 7) / Math.max(1, columns - 1))));
	const grid = { x: Math.round((width - (columns - 1) * across - 7) / 2), y: 64, width: (columns - 1) * across + 7, height: (rows - 1) * 14 + 9 };
	return { columns, store, grid, height: grid.y + grid.height + 6 };
};

/**
 * A site's pages in a grid under the object storage they are served from. A deploy sends a copy
 * of each page it uploads up into the storage. `uploaded` is how many have arrived. Anchors:
 * `store`, `count` and `page:<i>`, shown under the pointer.
 */
export const createDeploy = (options: Stage & {
	readonly pages: number;
	readonly changed: readonly number[];
	readonly deploy: () => Deploy;
}): Explainer & { readonly uploaded: number; readonly total: number } => {
	const { width: W, height: H } = options;
	const { columns, store, grid } = deployLayout(W, options.pages);
	const inks = inksOf(options.night), pen = penOf(W, H);
	const changed = new Set(options.changed);
	const rows = Math.ceil(options.pages / columns);
	const stepX = (grid.width - 7) / Math.max(1, columns - 1), stepY = (grid.height - 9) / Math.max(1, rows - 1);
	const place = (i: number): readonly [number, number] => [Math.round(grid.x + (i % columns) * stepX), Math.round(grid.y + Math.floor(i / columns) * stepY)];
	let hover = -1, uploaded = 0, total = 0;
	const anchors = new Map<string, Anchor>();
	// The storage's name and its count stand over it, out of the way of the pages flying up.
	anchors.set('store', { x: store.x, y: store.y - store.height / 2 - 16, alpha: 1 });
	anchors.set('count', { x: store.x, y: store.y - store.height / 2 - 7, alpha: 1 });

	const frame = (_dt: number, t: number): void => {
		pen.pixels.fill(0);
		drawCloud(pen, store.x, store.y, store.width / 2, store.height / 2, inks);
		const deploy = options.deploy();
		const uploads = uploadsOf(options.pages, options.changed, deploy.every);
		total = uploads.length;
		for (let i = 0; i < options.pages; i++) {
			const [x, y] = place(i);
			drawPage(pen, x, y - (hover === i ? 1 : 0), inks, changed.has(i));
			anchors.set(`page:${String(i)}`, { x: x + 3, y: y - 9, alpha: hover === i ? 1 : 0 });
		}
		uploaded = 0;
		for (const upload of uploads) {
			const g = !options.moving ? 1 : deploy.started === null ? 0 : through(t, deploy.started + upload.at, FLIGHT);
			if (g >= 1) { uploaded++; continue; }
			if (g <= 0) continue;
			const [x0, y0] = place(upload.page), x1 = store.x - 3, y1 = store.y + store.height * 0.2 - 9;
			drawPage(pen, x0 + (x1 - x0) * g, y0 + (y1 - y0) * g - Math.sin(Math.PI * g) * 8, inks, changed.has(upload.page));
		}
	};

	const move = (x: number, y: number): void => {
		hover = -1;
		for (let i = 0; i < options.pages; i++) {
			const [px, py] = place(i);
			if (x >= px - 1 && x <= px + 7 && y >= py - 1 && y <= py + 9) hover = i;
		}
	};

	return {
		width: W, height: H, pixels: pen.pixels, anchors, typed: new Map(), frame, move, leave: () => { hover = -1; }, poke: () => false,
		get uploaded() { return uploaded; },
		get total() { return total; },
	};
};

// --- the scenes the page lays out ---------------------------------------------------------------
//
// For the rest, the page lays the words out and hands the painter each thing's box as it stands,
// by name. The painter draws into the empty boxes the page leaves for pictures (`slot:<name>`),
// draws what travels between things, and moves or fades the things themselves a few pixels.

/** The boxes of the things a page laid out, in strip pixels from the stage's top left corner, by name. */
export type Boxes = ReadonlyMap<string, Box>;

/** What a laid-out scene's painter is handed, beside the stage. In a feed the page is not there, and the painter draws each thing's box itself. */
interface Laid extends Stage {
	readonly boxes: () => Boxes;
	readonly feed?: boolean;
}

/** The shared parts of a laid-out painter: its pen, its anchors, the pointer's lift, a thing shown. */
const laidOut = (options: Laid) => {
	const inks = inksOf(options.night), pen = penOf(options.width, options.height);
	const anchors = new Map<string, Anchor>(), typed = new Map<string, number>();
	let hover: string | null = null;
	// A thing comes in from `dx`, `dy` as it fades in. Under the pointer it stands a pixel higher.
	const show = (name: string, alpha: number, dx = 0, dy = 0): void => {
		anchors.set(name, { x: Math.round(dx * (1 - alpha)), y: Math.round(dy * (1 - alpha)) - (hover === name && alpha >= 1 ? 1 : 0), alpha, offset: true });
	};
	const move = (x: number, y: number): void => {
		hover = null;
		for (const [name, box] of options.boxes()) if (!name.startsWith('slot:') && anchors.has(name) && x >= box.x && x < box.x + box.width && y >= box.y && y < box.y + box.height) hover = name;
	};
	const painter = (frame: (dt: number, t: number) => void): Explainer => ({
		width: options.width, height: options.height, pixels: pen.pixels, anchors, typed, frame, move, leave: () => { hover = null; }, poke: () => false,
	});
	return { inks, pen, anchors, typed, show, painter };
};

// --- pipeline -------------------------------------------------------------------------------------

/** What a pipeline's painter needs of its data: each lane's steps, by kind, and where searches reach. */
export interface PipelineShape {
	readonly lanes: readonly { readonly steps: readonly { readonly kind: string; readonly items?: readonly unknown[]; readonly name?: string; readonly reach?: string }[] }[];
}

// When each step of a pipeline comes in, by its place among all the steps, and how long between.
const STEP = 1.25;
const stepTime = (g: number): number => 0.3 + g * STEP;

/** How long a pipeline's story runs, in seconds. */
export const pipelineLength = (shape: PipelineShape): number => stepTime(shape.lanes.reduce((n, lane) => n + lane.steps.length, 0)) + 1.6;

// The kinds drawn in a picture of their own. The rest are words in boxes.
const PICTURED = new Set(['model', 'database', 'data', 'build', 'pages', 'upload', 'cloud']);
const ICON_OF: Readonly<Record<string, IconName>> = { files: 'file', searches: 'search', found: 'found', request: 'request', prompt: 'prompt', draft: 'draft' };

/**
 * Things carried through steps, lane by lane: a step comes in, then what it hands on travels to
 * the next one (slips of a file, the points a model makes, pages), searches reach into the
 * database they name, and what they find comes out of it. Things: `lane:<l>`, `step:<l>.<s>`,
 * `item:<l>.<s>.<k>`, `card:<l>.<s>`, `shows:<l>.<s>`, `note`. Boxes for pictures:
 * `slot:<l>.<s>`, and on a narrow page `slot:echo:<l>.<s>`, where searches reach a copy of the
 * database beside them.
 */
export const createPipeline = (options: Laid & { readonly shape: PipelineShape }): Explainer => {
	const { inks, pen, show, typed, painter } = laidOut(options);
	const lanes = options.shape.lanes;
	const steps = lanes.flatMap((lane, l) => lane.steps.map((step, s) => ({ ...step, l, s, key: `${String(l)}.${String(s)}` })));
	const databases = new Map(steps.filter((step) => step.kind === 'database').map((step) => [step.name, step]));

	return painter((_dt, t) => {
		const s = storyAt(options, t), boxes = options.boxes();
		const at = (from: number, length: number): number => (s === Infinity ? 1 : through(s, from, length));
		pen.pixels.fill(0);
		const boxOf = (step: typeof steps[number]): Box | undefined => boxes.get(`slot:${step.key}`)
			?? boxes.get(`card:${step.key}`)
			?? union((step.items ?? []).map((_, k) => boxes.get(`item:${step.key}.${String(k)}`)));
		// How many of the model's points have reached each database.
		const filled = new Map<string, number>();

		steps.forEach((step, g) => {
			const t0 = stepTime(g), here = at(t0, 0.6), next = steps[g + 1];
			if (step.s === 0) show(`lane:${String(step.l)}`, at(t0 - 0.3, 0.5));
			show(`step:${step.key}`, here, -4);
			show(`shows:${step.key}`, at(t0 + 1.0, 0.5));
			show(`card:${step.key}`, here, -4);
			const reached = step.reach === undefined ? undefined : databases.get(step.reach);
			const after = steps[g - 1];
			(step.items ?? []).forEach((_, k) => {
				// Searches come out of the request. What is found comes out of the database searched.
				const from = step.kind === 'found' && after?.reach !== undefined ? -6 : 0;
				show(`item:${step.key}.${String(k)}`, at(t0 + k * 0.2, 0.6), step.kind === 'files' ? -8 : step.kind === 'searches' ? -10 : 0, from);
			});
			if (step.kind === 'draft') typed.set(`card:${step.key}`, s === Infinity ? 1 : Math.max(0, Math.min(1, (s - t0 - 0.5) / 2)));

			// The step's picture comes in through the dither.
			const slot = boxes.get(`slot:${step.key}`);
			if (slot !== undefined && slot.width > 0) {
				pen.fade = options.feed === true ? 1 : here;
				drawPicture(pen, step.kind, slot, inks, s - t0, filled.get(step.name ?? '') ?? (s === Infinity ? 1 : 0));
				pen.fade = 1;
			}
			if (options.feed === true) {
				const card = boxes.get(`card:${step.key}`);
				if (card !== undefined) drawCard(pen, card, inks, ICON_OF[step.kind] ?? null, 'card');
				(step.items ?? []).forEach((_, k) => {
					const item = boxes.get(`item:${step.key}.${String(k)}`);
					if (item !== undefined) drawCard(pen, item, inks, ICON_OF[step.kind] ?? null, step.kind === 'searches' ? 'search' : step.kind === 'found' ? 'found' : 'card');
				});
			}

			// Searches reach into their database: the one beside them on a narrow page, else the one named.
			if (reached !== undefined) {
				const echo = boxes.get(`slot:echo:${step.key}`);
				const target = echo !== undefined && echo.width > 0 ? echo : boxes.get(`slot:${reached.key}`);
				if (echo !== undefined && echo.width > 0) {
					pen.fade = here;
					drawDatabase(pen, echo.x + Math.round((echo.width - 20) / 2), echo.y, 20, Math.min(26, echo.height), inks, filled.get(reached.name ?? '') ?? (s === Infinity ? 1 : 0));
					pen.fade = 1;
				}
				(step.items ?? []).forEach((_, k) => {
					const item = boxes.get(`item:${step.key}.${String(k)}`), r = at(t0 + 0.6 + k * 0.15, 0.6);
					if (item === undefined || target === undefined || r <= 0) return;
					const [x0, y0, x1, y1] = between(item, target);
					pen.line(x0, y0, x1, y1, inks.accent, 2, r);
				});
				// What they find comes out of it, with a line to each.
				if (next !== undefined && next.kind === 'found' && target !== undefined) {
					(next.items ?? []).forEach((_, k) => {
						const item = boxes.get(`item:${next.key}.${String(k)}`), r = at(stepTime(g + 1) + k * 0.2, 0.6);
						if (item === undefined || r <= 0) return;
						const [x0, y0, x1, y1] = between(target, item);
						pen.line(x0, y0, x1, y1, inks.ink2, 3, r);
					});
				}
				return;
			}
			if (next === undefined || next.l !== step.l) return;
			const a = boxOf(step), b = boxOf(next);
			if (a === undefined || b === undefined) return;
			const [x0, y0, x1, y1] = between(a, b);
			// A dotted line joins a step to the next where the next stands beside it or under it. A
			// step that wrapped to the start of the next row is joined only by what travels to it.
			const beside = b.y < a.y + a.height && b.y + b.height > a.y, under = b.x < a.x + a.width && b.x + b.width > a.x;
			if (beside || under) pen.line(x0, y0, x1, y1, inks.ink2, 3, at(t0 + 0.6, 0.6));
			// What a step hands on travels to the next: slips of text, the points a model makes, pages.
			const carried = step.kind === 'files' || step.kind === 'data' || step.kind === 'found' ? 'slip'
				: step.kind === 'model' ? 'dot'
					: step.kind === 'build' || step.kind === 'pages' || step.kind === 'upload' ? 'page' : null;
			if (carried === null || options.feed === true) return;
			for (let k = 0; k < 4; k++) {
				const g2 = at(t0 + 0.55 + k * 0.25, 0.9);
				if (next.kind === 'database' && g2 >= 1) filled.set(next.name ?? '', (filled.get(next.name ?? '') ?? 0) + 0.25);
				if (g2 <= 0 || g2 >= 1) continue;
				const x = x0 + (x1 - x0) * g2, y = y0 + (y1 - y0) * g2 - Math.sin(Math.PI * g2) * 5;
				if (carried === 'slip') drawSlip(pen, x - 4, y - 2, inks);
				else if (carried === 'dot') drawDot(pen, x, y, inks);
				else drawPage(pen, x - 3, y - 4, inks, false);
			}
		});
		show('note', at(stepTime(steps.length) - 0.4, 0.6));
	});
};

/** The picture of a step that has one, fitted to the box the page left for it. */
const drawPicture = (pen: Pen, kind: string, box: Box, inks: Inks, since: number, full: number): void => {
	const cx = Math.round(box.x + box.width / 2), cy = Math.round(box.y + box.height / 2);
	const size = Math.min(box.width, box.height);
	switch (kind) {
		case 'model': drawChip(pen, cx - 7, cy - 7, 14, inks, since > 0 && since < 2.4 ? 1 : 0); break;
		case 'build': drawGear(pen, cx, cy, Math.min(7, Math.floor(size / 2) - 2), inks, since > 0 && since < 2.4 ? Math.floor(since * 6) * 0.2 : 0); break;
		case 'database': drawDatabase(pen, cx - 10, Math.max(box.y, cy - 13), 20, Math.min(26, box.height), inks, full); break;
		case 'data': drawTable(pen, cx - 9, cy - 7, 18, 14, inks); break;
		case 'pages': drawStack(pen, cx - 8, cy - 7, 16, 13, inks); break;
		case 'upload': drawUpload(pen, cx, cy - 8, 16, inks, since > 0 && since < 1.5 ? Math.sin(Math.min(1, since / 1.5) * Math.PI) * 2 : 0); break;
		case 'cloud': drawCloud(pen, cx, cy, 13, 9, inks); break;
		default: break;
	}
};

// --- fanout, without a map -------------------------------------------------------------------------

/**
 * One thing split into several: the source's picture, then a copy of what it makes carried to
 * each branch, whose picture and words come in as it lands. Things: `from`, `branch:<k>`. Boxes
 * for pictures: `slot:from`, `slot:branch:<k>`.
 */
export const createBranches = (options: Laid & { readonly branches: number }): Explainer => {
	const { inks, pen, show, painter } = laidOut(options);
	return painter((_dt, t) => {
		const s = storyAt(options, t), boxes = options.boxes();
		const at = (from: number, length: number): number => (s === Infinity ? 1 : through(s, from, length));
		pen.pixels.fill(0);
		const source = boxes.get('slot:from');
		show('from', at(0.2, 0.6), -4);
		if (source !== undefined) {
			pen.fade = options.feed === true ? 1 : at(0.2, 0.6);
			drawGear(pen, Math.round(source.x + source.width / 2), Math.round(source.y + source.height / 2), 7, inks, s > 0.6 && s < 3.4 ? Math.floor(s * 6) * 0.2 : 0);
			pen.fade = 1;
		}
		for (let k = 0; k < options.branches; k++) {
			const slot = boxes.get(`slot:branch:${String(k)}`), start = 0.9 + k * 0.45, land = at(start + 0.8, 0.4);
			show(`branch:${String(k)}`, land, 6);
			if (slot === undefined || source === undefined) continue;
			const [x0, y0, x1, y1] = between(source, slot);
			pen.line(x0, y0, x1, y1, inks.ink2, 3, at(start, 0.8));
			const g = at(start, 0.9);
			if (g > 0 && g < 1) drawPage(pen, x0 + (x1 - x0) * g - 3, y0 + (y1 - y0) * g - 4 - Math.sin(Math.PI * g) * 4, inks, false);
			pen.fade = options.feed === true ? 1 : land;
			drawStack(pen, Math.round(slot.x + (slot.width - 16) / 2), Math.round(slot.y + (slot.height - 13) / 2), 16, 13, inks);
			pen.fade = 1;
		}
	});
};

// --- toggle: the prompts behind tasks ------------------------------------------------------------

/**
 * Each task beside the prompt it runs with: an admin's edit while one is live, else the default
 * from the code. Switching to `edits` slides each edit over its default, and away again for the
 * defaults. Things: `task:<k>`, `prompt:<k>`, `edit:<k>`. Boxes for pictures: `slot:who:<k>`,
 * where a person stands for a live edit and the code's brackets for a default.
 */
export const createPrompts = (options: Laid & { readonly tasks: readonly { readonly edit: boolean }[]; readonly edits: () => { readonly on: boolean; readonly since: number } }): Explainer => {
	const { inks, pen, show, painter } = laidOut(options);
	return painter((_dt, t) => {
		const s = storyAt(options, t), boxes = options.boxes();
		pen.pixels.fill(0);
		const state = options.edits();
		const swap = s === Infinity || !options.moving ? 1 : through(t, state.since, 0.7);
		options.tasks.forEach((task, k) => {
			const shown = s === Infinity ? 1 : through(s, 0.2 + k * 0.3, 0.6);
			show(`task:${String(k)}`, shown, -4);
			show(`prompt:${String(k)}`, shown, -4);
			const live = task.edit && state.on;
			const edit = task.edit ? (state.on ? swap : 1 - swap) : 0;
			show(`edit:${String(k)}`, Math.min(edit, shown), 10);
			const a = boxes.get(`task:${String(k)}`), b = boxes.get(`prompt:${String(k)}`), who = boxes.get(`slot:who:${String(k)}`);
			if (a !== undefined && b !== undefined && shown > 0) {
				const [x0, y0, x1, y1] = between(a, b);
				pen.line(x0, y0, x1, y1, live ? inks.accent : inks.ink2, live ? 2 : 3, shown);
			}
			if (who !== undefined && who.width > 0) {
				pen.fade = shown;
				const mark = live && edit > 0.5 ? ICONS.person : ICONS.code, ink = live && edit > 0.5 ? inks.accent : inks.ink2;
				const x = Math.round(who.x + (who.width - 12) / 2), y = Math.round(who.y + (who.height - 12) / 2);
				mark.forEach((row, j) => { for (let i = 0; i < 6; i++) if (row[i] === '#') pen.rect(x + i * 2, y + j * 2, 2, 2, ink); });
				pen.fade = 1;
			}
			if (options.feed === true) {
				for (const name of [`task:${String(k)}`, `prompt:${String(k)}`]) {
					const box = boxes.get(name);
					if (box !== undefined) drawCard(pen, box, inks, name.startsWith('task') ? 'prompt' : 'code', 'card');
				}
			}
		});
	});
};

// --- match ---------------------------------------------------------------------------------------------

/** The marks that tell a match's left items apart, one per item: a square, a diamond, a ring, a cross, a bar. */
const MARKS = [
	['####', '####', '####', '####'], ['.##.', '####', '####', '.##.'], ['####', '#..#', '#..#', '####'], ['#..#', '.##.', '.##.', '#..#'], ['####', '....', '####', '....'],
] as const;

/**
 * What was asked for on the left, what answers it on the right, a line from each left item to
 * each right item that answers it, drawn one left item at a time, and beside each right item the
 * marks of the left items it answers. Things: `left:<k>`, `right:<j>`. Boxes for pictures:
 * `slot:mark:<k>` beside each left item, `slot:marks:<j>` beside each right one.
 */
export const createMatch = (options: Laid & { readonly links: readonly (readonly [left: number, right: number])[]; readonly left: number; readonly right: number }): Explainer => {
	const { inks, pen, show, painter } = laidOut(options);
	const tones = (k: number): number => [inks.accent, inks.ink2, inks.soft, inks.accent, inks.ink2][k % 5]!;
	const mark = (x: number, y: number, k: number): void => {
		MARKS[k % MARKS.length]!.forEach((row, j) => { for (let i = 0; i < 4; i++) if (row[i] === '#') pen.put(x + i, y + j, tones(k)); });
	};
	return painter((_dt, t) => {
		const s = storyAt(options, t), boxes = options.boxes();
		const at = (from: number, length: number): number => (s === Infinity ? 1 : through(s, from, length));
		pen.pixels.fill(0);
		for (let k = 0; k < options.left; k++) {
			show(`left:${String(k)}`, at(0.2 + k * 0.2, 0.5), -4);
			const slot = boxes.get(`slot:mark:${String(k)}`);
			if (slot !== undefined) { pen.fade = at(0.2 + k * 0.2, 0.5); mark(slot.x, Math.round(slot.y + (slot.height - 4) / 2), k); pen.fade = 1; }
		}
		const lit = new Map<number, number[]>();
		for (let j = 0; j < options.right; j++) show(`right:${String(j)}`, at(0.6 + j * 0.1, 0.5), 4);
		// One left item at a time reaches what answers it.
		for (let k = 0; k < options.left; k++) {
			const start = 1.4 + k * 1.1;
			options.links.filter(([left]) => left === k).forEach(([, j], n) => {
				const a = boxes.get(`left:${String(k)}`), b = boxes.get(`right:${String(j)}`), r = at(start + n * 0.2, 0.7);
				if (a === undefined || b === undefined || r <= 0) return;
				const [x0, y0, x1, y1] = between(a, b);
				pen.line(x0, y0, x1, y1, tones(k), 2, r);
				if (r >= 1) lit.set(j, [...(lit.get(j) ?? []), k]);
			});
		}
		for (const [j, ks] of lit) {
			const slot = boxes.get(`slot:marks:${String(j)}`);
			if (slot !== undefined) ks.forEach((k, n) => { mark(slot.x + n * 6, Math.round(slot.y + (slot.height - 4) / 2), k); });
		}
		if (options.feed === true) {
			for (let k = 0; k < options.left; k++) { const box = boxes.get(`left:${String(k)}`); if (box !== undefined) drawCard(pen, box, inks, 'request', 'card'); }
			for (let j = 0; j < options.right; j++) { const box = boxes.get(`right:${String(j)}`); if (box !== undefined) drawCard(pen, box, inks, 'found', 'found'); }
		}
	});
};

// --- numbers -----------------------------------------------------------------------------------------

/** What a figure draws: a share of a whole, a count of blocks, or two ends of a change. */
export type FigureShape = { readonly share: number } | { readonly count: number } | { readonly ends: readonly [number, number]; readonly under: readonly [boolean, boolean] };

/**
 * The post's figures as pixel bars: a share fills a bar of the whole, a count is that many
 * blocks, and a change is two bars, from and to, on one scale, with nothing drawn between them.
 * A figure written as "under" ends in a dither, since the post says only that it was less. Things:
 * `figure:<k>`. Boxes for pictures: `slot:bar:<k>`, and for a change `slot:bar:<k>:from` and
 * `slot:bar:<k>:to`.
 */
export const createNumbers = (options: Laid & { readonly figures: readonly FigureShape[] }): Explainer => {
	const { inks, pen, show, painter } = laidOut(options);
	const bar = (box: Box, share: number, under: boolean, grown: number, strong: boolean): void => {
		const h = Math.max(3, Math.min(6, box.height)), y = Math.round(box.y + (box.height - h) / 2), full = Math.max(1, Math.round(box.width * share * grown));
		for (let i = 0; i < box.width; i++) for (let j = 0; j < h; j++) if (bayer(box.x + i, y + j) < 0.18) pen.put(box.x + i, y + j, inks.fill2);
		for (let i = 0; i < full; i++) {
			// An "under" fades out over its last fifth, since the true end is somewhere before it.
			const end = under ? Math.max(0, (i - full * 0.8) / (full * 0.2)) : 0;
			for (let j = 0; j < h; j++) if (end === 0 || bayer(box.x + i, y + j) >= end) pen.put(box.x + i, y + j, j === 0 ? inks.glow : strong ? inks.accent : inks.soft);
		}
	};
	return painter((_dt, t) => {
		const s = storyAt(options, t), boxes = options.boxes();
		const at = (from: number, length: number): number => (s === Infinity ? 1 : through(s, from, length));
		pen.pixels.fill(0);
		options.figures.forEach((figure, k) => {
			const start = 0.3 + k * 0.9;
			show(`figure:${String(k)}`, at(start, 0.5), -4);
			if ('share' in figure) {
				const box = boxes.get(`slot:bar:${String(k)}`);
				if (box !== undefined) bar(box, figure.share, false, at(start + 0.3, 1.2), true);
			} else if ('count' in figure) {
				const box = boxes.get(`slot:bar:${String(k)}`);
				if (box === undefined) return;
				const per = Math.max(1, Math.floor((box.width + 1) / 3)), shown = Math.round(figure.count * at(start + 0.3, 1.6));
				for (let n = 0; n < figure.count; n++) {
					const x = box.x + (n % per) * 3, y = box.y + Math.floor(n / per) * 3;
					pen.rect(x, y, 2, 2, n < shown ? inks.accent : inks.fill2);
				}
			} else {
				const top = Math.max(figure.ends[0], figure.ends[1]);
				const from = boxes.get(`slot:bar:${String(k)}:from`), to = boxes.get(`slot:bar:${String(k)}:to`);
				if (from !== undefined) bar(from, figure.ends[0] / top, figure.under[0], at(start + 0.3, 0.6), false);
				if (to !== undefined) bar(to, figure.ends[1] / top, figure.under[1], at(start + 0.9, 1.2), true);
			}
		});
	});
};

// --- still frames, for a feed --------------------------------------------------------------------------

/**
 * A scene's still frame where no page lays it out, for a feed: each laid-out thing given a box on
 * a plain grid, drawn as a pixel box with its icon, and the story at its end. `kind` and the
 * counts say what to draw. The words go under the frame as a list.
 */
export const stillFrame = (scene: StillScene, night = false): { readonly width: number; readonly height: number; readonly pixels: Uint32Array } => {
	const W = 240, boxes = new Map<string, Box>();
	const box = (name: string, x: number, y: number, w: number, h: number): void => { boxes.set(name, { x, y, width: w, height: h }); };
	let H = 80, paint: Explainer;
	const base = { width: W, night, moving: false, started: () => null, feed: true, boxes: () => boxes } as const;
	switch (scene.kind) {
		case 'pipeline': {
			let y = 6;
			scene.shape.lanes.forEach((lane, l) => {
				const across = Math.floor((W - 8) / lane.steps.length);
				lane.steps.forEach((step, s) => {
					const x = 4 + s * across, key = `${String(l)}.${String(s)}`, w = across - 10;
					if (PICTURED.has(step.kind)) box(`slot:${key}`, x, y, w, 26);
					else if (step.items !== undefined) step.items.forEach((_, k) => { box(`item:${key}.${String(k)}`, x, y + k * 9, w, 7); });
					else box(`card:${key}`, x, y + 6, w, 12);
				});
				y += 40;
			});
			H = y;
			paint = createPipeline({ ...base, height: H, shape: scene.shape });
			break;
		}
		case 'branches': {
			H = 10 + scene.branches * 16;
			box('slot:from', 10, H / 2 - 12, 30, 24);
			for (let k = 0; k < scene.branches; k++) box(`slot:branch:${String(k)}`, 150, 6 + k * 16, 30, 14);
			paint = createBranches({ ...base, height: H, branches: scene.branches });
			break;
		}
		case 'prompts': {
			H = 8 + scene.tasks.length * 16;
			scene.tasks.forEach((_, k) => { box(`task:${String(k)}`, 6, 6 + k * 16, 60, 10); box(`slot:who:${String(k)}`, 90, 5 + k * 16, 14, 12); box(`prompt:${String(k)}`, 110, 6 + k * 16, 120, 10); });
			paint = createPrompts({ ...base, height: H, tasks: scene.tasks, edits: () => ({ on: false, since: 0 }) });
			break;
		}
		case 'match': {
			H = 8 + Math.max(scene.left, scene.right) * 14;
			for (let k = 0; k < scene.left; k++) { box(`left:${String(k)}`, 12, 6 + k * 14, 70, 9); box(`slot:mark:${String(k)}`, 3, 6 + k * 14, 6, 9); }
			for (let j = 0; j < scene.right; j++) { box(`right:${String(j)}`, 140, 6 + j * 14, 80, 9); box(`slot:marks:${String(j)}`, 222, 6 + j * 14, 18, 9); }
			paint = createMatch({ ...base, height: H, links: scene.links, left: scene.left, right: scene.right });
			break;
		}
		case 'numbers': {
			H = 8 + scene.figures.length * 18;
			scene.figures.forEach((figure, k) => {
				if ('ends' in figure) { box(`slot:bar:${String(k)}:from`, 10, 6 + k * 18, 220, 5); box(`slot:bar:${String(k)}:to`, 10, 13 + k * 18, 220, 5); }
				else box(`slot:bar:${String(k)}`, 10, 8 + k * 18, 220, 'count' in figure ? 9 : 6);
			});
			paint = createNumbers({ ...base, height: H, figures: scene.figures });
			break;
		}
		case 'map': {
			H = 110;
			const regions = scene.regions, seeks = scene.seeks;
			paint = createMap({ width: W, height: H, night, moving: false, started: () => null, regions, seeks: () => seeks });
			break;
		}
		case 'deploy': {
			H = deployLayout(W, scene.pages).height;
			paint = createDeploy({ width: W, height: H, night, moving: false, started: () => null, pages: scene.pages, changed: scene.changed, deploy: () => ({ every: false, started: 0 }) });
			break;
		}
	}
	paint.frame(0, 0);
	return { width: W, height: H, pixels: paint.pixels };
};

/** What a still frame needs to know of a scene, for each way of drawing one. */
export type StillScene =
	| { readonly kind: 'pipeline'; readonly shape: PipelineShape }
	| { readonly kind: 'branches'; readonly branches: number }
	| { readonly kind: 'prompts'; readonly tasks: readonly { readonly edit: boolean }[] }
	| { readonly kind: 'match'; readonly links: readonly (readonly [number, number])[]; readonly left: number; readonly right: number }
	| { readonly kind: 'numbers'; readonly figures: readonly FigureShape[] }
	| { readonly kind: 'map'; readonly regions: readonly { readonly name: string; readonly snippets: readonly string[] }[]; readonly seeks: readonly Seek[] }
	| { readonly kind: 'deploy'; readonly pages: number; readonly changed: readonly number[] };
