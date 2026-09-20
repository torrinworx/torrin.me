// The images a link unfurls to, rendered with Playwright from the studio kit's templates: one card
// per post, the site's own card, and the dark profile image the structured data names.
//
// The template is `kit/templates/og.html` in the studio repository, beside the brand's fonts and
// tokens, because the card is the brand's and not this site's. The kit is a sibling checkout
// (`../studio`), or wherever STUDIO_DIR points.

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';

import { FOREST, LIME } from '../frontend/theme.ts';

/** What one card says. */
export interface Card {
	readonly eyebrow: string;
	readonly title: string;
	readonly handle: string;
	readonly date: string;
}

export const OG = { width: 1200, height: 630 } as const;
export const PROFILE = { width: 1080, height: 1080 } as const;

const escape = (text: string): string => text
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The kit's own step: over 24 characters 0.8, over 40 characters 0.65 (templates/thumb.css).
const lengthClass = (text: string): string => (text.length > 40 ? 'xlong' : text.length > 24 ? 'long' : '');

/** `{{key}}` was escaped when the data was built; `{{{key}}}` is raw markup. The kit's rule. */
const fill = (template: string, data: Readonly<Record<string, string>>): string =>
	template.replace(/\{\{\{(\w+)\}\}\}|\{\{(\w+)\}\}/g, (_, raw: string | undefined, plain: string | undefined) => data[raw ?? plain ?? ''] ?? '');

/** The template's directory, or an error naming what to check out. */
export const templatesOf = (studio: string): string => {
	const templates = join(studio, 'kit', 'templates');
	if (!existsSync(join(templates, 'og.html'))) {
		throw new Error(`the studio kit is not at ${studio} (no kit/templates/og.html): check out github.com/torrinworx/studio beside this repository, or point STUDIO_DIR at it`);
	}
	return templates;
};

/** The filled og.html for one card, as a string a browser can open from a file. */
export const cardHtml = (templates: string, card: Card): string => fill(readFileSync(join(templates, 'og.html'), 'utf8'), {
	css: `${pathToFileURL(templates).href}/`,
	postEyebrow: escape(card.eyebrow),
	postTitle: escape(card.title),
	titleClass: lengthClass(card.title),
	handle: escape(card.handle),
	date: escape(card.date),
});

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
	// The document is opened from a file, as the kit opens its own: a page set from a string has
	// no origin, and Chromium lets no such page read the fonts and the stylesheet from disk.
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
