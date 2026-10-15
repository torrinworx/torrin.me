// The images a link unfurls to, rendered with Playwright: one card per post, the site's own card,
// and the dark profile image the structured data names.
//
// A post's card carries its own tree, the one above its title on the page (`plotScene`, seeded
// from the slug), so every post unfurls to a different picture. The tree is drawn in Node by the
// same strip engine the page runs and handed to the card as raw pixels.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';

import { createStrip, plotScene } from '../frontend/strip.ts';
import { FOREST, LIME, MOSS, PAPER } from '../frontend/theme.ts';

/** What one card says, and whose tree it shows. */
export interface Card {
	readonly eyebrow: string;
	readonly title: string;
	readonly description: string;
	/** The line at the foot: the date and reading time, or nothing. */
	readonly footer: string;
	readonly seed: number;
}

export const OG = { width: 1200, height: 630 } as const;
export const PROFILE = { width: 1080, height: 1080 } as const;

// The tree's scene in strip pixels, and how many card pixels each one takes.
const SCENE = { width: 110, height: 150, scale: 4 } as const;

const PUBLIC = fileURLToPath(new URL('../frontend/public/', import.meta.url));

const escape = (text: string): string => text
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The still frame of a tree, as base64 RGBA. */
const treePixels = (seed: number): string => {
	const strip = createStrip(plotScene(seed, false), SCENE.width, SCENE.height, { motion: false, random: () => 0.5 });
	strip.frame(0, 0);
	return Buffer.from(strip.pixels.buffer).toString('base64');
};

// Long titles step down so none runs past three lines.
const titleSize = (title: string): number => (title.length > 60 ? 54 : title.length > 34 ? 64 : 76);

/** The card for one post, or the site, as a document a browser can open from a file. */
export const cardHtml = (card: Card): string => `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: "Card Serif"; src: url("${pathToFileURL(PUBLIC).href}source-serif-4.005/SourceSerif4Variable-Roman.otf.woff2") format("woff2"); font-weight: 200 900; }
@font-face { font-family: "Card Plex"; src: url("${pathToFileURL(PUBLIC).href}ibm-plex-sans/woff2/IBMPlexSans-Regular.woff2") format("woff2"); }
@font-face { font-family: "Card Mono"; src: url("${pathToFileURL(PUBLIC).href}JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Medium.woff2") format("woff2"); }
html, body { margin: 0; }
body { width: ${String(OG.width)}px; height: ${String(OG.height)}px; background: ${PAPER}; color: ${FOREST}; position: relative; overflow: hidden; }
.words { position: absolute; left: 72px; top: 64px; bottom: 64px; width: 620px; display: flex; flex-direction: column; }
.ey { font: 22px "Card Mono"; letter-spacing: 0.08em; text-transform: uppercase; color: ${MOSS}; }
.ey b { font-weight: inherit; background: ${LIME}; color: ${FOREST}; padding: 2px 8px; margin-right: 6px; }
h1 { font: 600 ${String(titleSize(card.title))}px/1.08 "Card Serif"; font-optical-sizing: auto; margin: 36px 0 0; letter-spacing: -0.01em; }
p { font: 26px/1.4 "Card Plex"; color: #5C6A56; margin: 24px 0 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.foot { margin-top: auto; font: 20px "Card Mono"; color: ${MOSS}; padding-top: 20px; }
canvas { position: absolute; right: 50px; top: 15px; width: ${String(SCENE.width * SCENE.scale)}px; height: ${String(SCENE.height * SCENE.scale)}px; image-rendering: pixelated; }
.rule { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: ${FOREST}; }
</style></head><body>
<div class="words">
	<div class="ey"><b>torrin.me</b> ${escape(card.eyebrow)}</div>
	<h1>${escape(card.title)}</h1>
	${card.description === '' ? '' : `<p>${escape(card.description)}</p>`}
	<div class="foot">${escape(card.footer)}</div>
</div>
<canvas width="${String(SCENE.width)}" height="${String(SCENE.height)}"></canvas>
<div class="rule"></div>
<script>
const bytes = Uint8ClampedArray.from(atob("${treePixels(card.seed)}"), (c) => c.charCodeAt(0));
document.querySelector('canvas').getContext('2d').putImageData(new ImageData(bytes, ${String(SCENE.width)}, ${String(SCENE.height)}), 0, 0);
</script>
</body></html>`;

/** The dark profile image: the headshot on forest, with the brand's lime edge. */
export const profileHtml = (headshot: string): string => `<!doctype html>
<html><head><meta charset="utf-8"><style>
html, body { margin: 0; }
body { width: ${String(PROFILE.width)}px; height: ${String(PROFILE.height)}px; background: ${FOREST}; display: flex; align-items: center; justify-content: center; }
img { width: 780px; height: 780px; object-fit: cover; object-position: 50% 20%; display: block; outline: 6px solid ${LIME}; outline-offset: 18px; }
</style></head><body><img src="${pathToFileURL(headshot).href}" alt=""></body></html>`;

/** One browser for a run of cards, closed when the run ends. */
export interface Cards {
	/** Render a document at a size into a PNG. */
	shoot(html: string, size: { width: number; height: number }, out: string): Promise<void>;
	close(): Promise<void>;
}

export const openCards = async (): Promise<Cards> => {
	const browser: Browser = await chromium.launch();
	const page: Page = await browser.newPage();
	// The document is opened from a file: a page set from a string has no origin, and Chromium
	// lets no such page read the fonts from disk.
	const stage = mkdtempSync(join(tmpdir(), 'torrin-me-cards-'));
	let count = 0;
	return {
		shoot: async (html, size, out) => {
			const file = join(stage, `${String(count += 1)}.html`);
			writeFileSync(file, html);
			await page.setViewportSize(size);
			await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
			await page.evaluate(() => document.fonts.ready);
			await page.evaluate(() => Promise.all(Array.from(document.images).map((image) =>
				(image.complete ? null : new Promise((done) => { image.onload = done; image.onerror = done; })))));
			await page.screenshot({ path: out, clip: { x: 0, y: 0, ...size } });
		},
		close: async () => {
			await browser.close();
			rmSync(stage, { recursive: true, force: true });
		},
	};
};
