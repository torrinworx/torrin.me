// What a crawler sees. Everything here is read out of the written files, never out of a live DOM,
// because a crawler does not run the page's JavaScript: a tag that only appears after hydration is
// a tag Google never gets.
//
// Run `npm run build` (or `vite build && npm run pages`) before this suite.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

const read = (file: string): string => {
	const path = `${dist}${file}`;
	assert.ok(existsSync(path), `${file} is missing: run the build before this suite`);
	return readFileSync(path, 'utf8');
};

/** Every page a reader can land on. Both must carry the whole head, not just the landing page. */
const PAGES = ['index.html', 'contact/index.html'];

const META_NAMES = ['description', 'author', 'robots', 'geo.placename', 'geo.region', 'theme-color', 'viewport'];
const OG = ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:site_name', 'og:locale'];
const TWITTER = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
// Read out of head.tsx. Organization (the employer, via worksFor) and CollegeOrUniversity (alumniOf)
// left on 2026-09-16 when the Equator role ended and the education entry was corrected.
const SCHEMA = ['Person', 'WebSite', 'ImageObject', 'Place', 'PostalAddress', 'Language'];

describe('the head a crawler reads', () => {
	for (const page of PAGES) {
		it(`${page} carries a title and every meta name`, () => {
			const html = read(page);
			assert.match(html, /<title[^>]*>[^<]+<\/title>/, 'a non-empty title');
			for (const name of META_NAMES) {
				assert.ok(html.includes(`name="${name}"`), `${page} has meta ${name}`);
			}
		});

		it(`${page} carries the Open Graph and Twitter cards`, () => {
			const html = read(page);
			for (const property of OG) assert.ok(html.includes(`property="${property}"`), `${page} has ${property}`);
			for (const name of TWITTER) assert.ok(html.includes(`name="${name}"`), `${page} has ${name}`);
		});

		it(`${page} carries the canonical link and the favicon`, () => {
			const html = read(page);
			assert.match(html, /<link[^>]*rel="canonical"[^>]*href="https:\/\/torrin\.me/, `${page} is canonical`);
			assert.match(html, /<link[^>]*rel="icon"/, `${page} has a favicon`);
		});

		it(`${page} carries the whole JSON-LD block, parseable`, () => {
			const html = read(page);
			const found = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
			assert.ok(found.length > 0, `${page} has a JSON-LD script`);
			// Parsed rather than pattern-matched: a block that does not parse is a block Google drops,
			// and escaping is exactly what breaks when markup is generated rather than written.
			const types = new Set<string>();
			const collect = (value: unknown): void => {
				if (Array.isArray(value)) { for (const item of value) collect(item); return; }
				if (value === null || typeof value !== 'object') return;
				const record = value as Record<string, unknown>;
				if (typeof record['@type'] === 'string') types.add(record['@type']);
				for (const item of Object.values(record)) collect(item);
			};
			for (const block of found) collect(JSON.parse(block[1]!.trim()));
			for (const type of SCHEMA) assert.ok(types.has(type), `${page} declares @type ${type}`);
		});
	}

	it('the sitemap lists every page and robots.txt points at it', () => {
		const sitemap = read('sitemap.xml');
		assert.ok(sitemap.includes('<loc>https://torrin.me/</loc>'), 'the landing page is in the sitemap');
		assert.ok(sitemap.includes('<loc>https://torrin.me/contact</loc>'), 'the contact page is in the sitemap');
		assert.ok(read('robots.txt').includes('Sitemap: https://torrin.me/sitemap.xml'), 'robots.txt points at it');
	});

	it('the fallback page is a real 404 and is not indexable', () => {
		const html = read('404.html');
		assert.match(html, /<title[^>]*>[^<]+<\/title>/, '404.html is a rendered page, not an empty shell');
		assert.ok(!read('sitemap.xml').includes('404'), 'and it is not in the sitemap');
	});
});
