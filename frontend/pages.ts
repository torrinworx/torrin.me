// Writes every page of the site as a file, plus 404.html, shell.html, sitemap.xml and the feeds.
//
// Run: npm run pages, after `npm run content` and `vite build` have written the twins and the
// shell into dist/. That directory sits beside main.ts, which is where the server looks for it,
// locally and on the droplet alike. The posts are rendered from the same twins the browser
// fetches, so the page and its twin are one string.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { createSite } from '@aweftjs/ssg';
import { h } from '@aweftjs/ui';

import { feeds } from './feeds.ts';
import { memory, posts, tokensOf, twinOf } from './posts.ts';
import type { Body, Fence } from './posts.ts';
import { Site } from './site.tsx';

const dist = 'dist';

// Every published post's body, from the files the build step wrote and vite copied.
const bodies = new Map<string, Body>(posts.map((post) => {
	const twin = `${dist}${twinOf(post.slug)}`;
	if (!existsSync(twin)) throw new Error(`${twin} is missing: run npm run content before vite build`);
	const tokens = `${dist}${tokensOf(post.slug)}`;
	return [post.slug, {
		markdown: readFileSync(twin, 'utf8'),
		fences: post.code ? JSON.parse(readFileSync(tokens, 'utf8')) as Fence[] : [],
	}];
}));

const site = createSite({
	page: (router) => h(Site, { router, content: memory(bodies) }),
	shell: readFileSync(`${dist}/index.html`, 'utf8'),
	out: dist,
	base: 'https://torrin.me',
});

const written = await site.write();
console.log(`${String(written.urls.length)} pages, ${String(written.files.length)} files in ${dist}`);
if (written.unenumerated.length > 0) throw new Error(`acts nothing could list: ${written.unenumerated.map((act) => act.name).join(', ')}`);

const made = await feeds(posts, bodies);
writeFileSync(`${dist}/feed.xml`, made.atom);
writeFileSync(`${dist}/feed.json`, made.json);
writeFileSync(`${dist}/feed-summary.xml`, made.summary);
console.log(`3 feeds over ${String(posts.length)} posts`);
