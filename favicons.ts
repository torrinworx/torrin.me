// The tab and home screen icons: the landing hero's third tree on a paper tile, drawn by the
// strip's own generator, so the icon is the same tree the page shows (work order 485).
//
// The tree is drawn natively at 16 and at 32 pixels rather than scaled from one size, and the 16
// leaves out the hanging vines, which turn to noise at that size. The 180 pixel home screen icon is
// the 32 drawing scaled by five with a tile border, so its pixels stay square and sharp.
//
// Run: npm run favicons. The files are committed; the tests check they still match what this draws.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { crc32, deflateSync } from 'node:zlib';

import { HERO_SEED, LIGHT, createStrip, pack, treeSeed } from './frontend/strip.ts';
import type { StripConfig } from './frontend/strip.ts';
import { PAPER_A } from './frontend/theme.ts';

/** The hero's third tree. */
export const ICON_TREE = treeSeed(HERO_SEED, 2);
const TILE = PAPER_A;

const scene = (size: 16 | 32): StripConfig => ({
	seed: HERO_SEED,
	ground: size === 32 ? 0.86 : 0.84,
	reflection: false,
	ambient: 1,
	light: [-0.6, -0.8],
	trees: [[0.5, size === 32 ? 1.16 : 1.12, ICON_TREE]],
	vines: size === 32,
	palette: { ...LIGHT, sky: [TILE, TILE], hills: [TILE, TILE] },
});

/** One icon's pixels, packed as the strip packs them, row by row. */
export interface Icon { readonly size: number; readonly pixels: Uint32Array }

/** The tree drawn natively at 16 or 32 pixels, still. */
export const drawIcon = (size: 16 | 32): Icon => {
	const strip = createStrip(scene(size), size, size, { motion: false });
	strip.frame(0, 0);
	return { size, pixels: strip.pixels };
};

/** An icon scaled by a whole number, with a border of tile around it. */
export const enlarge = (icon: Icon, by: number, border: number): Icon => {
	const size = icon.size * by + border * 2;
	const pixels = new Uint32Array(size * size).fill(pack(TILE));
	for (let y = 0; y < icon.size * by; y++) for (let x = 0; x < icon.size * by; x++) {
		pixels[(y + border) * size + x + border] = icon.pixels[Math.floor(y / by) * icon.size + Math.floor(x / by)]!;
	}
	return { size, pixels };
};

/** An opaque RGB PNG of an icon. */
export const png = (icon: Icon): Buffer => {
	const { size, pixels } = icon;
	const rows = Buffer.alloc(size * (size * 3 + 1));
	for (let y = 0; y < size; y++) {
		const at = y * (size * 3 + 1);
		rows[at] = 0;
		for (let x = 0; x < size; x++) {
			const c = pixels[y * size + x]!;
			rows[at + 1 + x * 3] = c & 255;
			rows[at + 2 + x * 3] = c >> 8 & 255;
			rows[at + 3 + x * 3] = c >> 16 & 255;
		}
	}
	const chunk = (type: string, data: Buffer): Buffer => {
		const head = Buffer.alloc(8);
		head.writeUInt32BE(data.length, 0);
		head.write(type, 4, 'ascii');
		const sum = Buffer.alloc(4);
		sum.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
		return Buffer.concat([head, data, sum]);
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(size, 0);
	header.writeUInt32BE(size, 4);
	header[8] = 8; // bits per channel
	header[9] = 2; // RGB
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(rows, { level: 9 })),
		chunk('IEND', Buffer.alloc(0)),
	]);
};

/** Every icon file, by its path under frontend/public. */
export const icons = (): Record<string, Buffer> => {
	const small = drawIcon(16), large = drawIcon(32);
	return {
		'favicon-16.png': png(small),
		'favicon-32.png': png(large),
		'apple-touch-icon.png': png(enlarge(large, 5, 10)),
	};
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	for (const [name, bytes] of Object.entries(icons())) {
		writeFileSync(fileURLToPath(new URL(`./frontend/public/${name}`, import.meta.url)), bytes);
		console.log(`frontend/public/${name}: ${String(bytes.length)} bytes`);
	}
}
