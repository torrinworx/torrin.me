// The static half: the same server, over a directory of files.

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';

import { boot, type Site } from './boot.ts';

let site: Site;

before(async () => {
	const dir = await mkdtemp(join(tmpdir(), 'torrin-me-'));
	await writeFile(join(dir, 'index.html'), '<h1>the landing page</h1>');
	await writeFile(join(dir, '404.html'), '<h1>not found</h1>');
	await writeFile(join(dir, 'robots.txt'), 'Sitemap: https://torrin.me/sitemap.xml\n');
	await mkdir(join(dir, 'assets'));
	await writeFile(join(dir, 'assets', 'app.abc123.js'), 'console.log(1);');
	await mkdir(join(dir, 'JetBrainsMono-2.304'));
	await writeFile(join(dir, 'JetBrainsMono-2.304', 'JetBrainsMono-Regular.woff2'), 'not really a font');
	await mkdir(join(dir, 'blog'));
	await mkdir(join(dir, 'blog', 'a-post'));
	await writeFile(join(dir, 'blog', 'a-post', 'index.html'), '<h1>a post</h1>');
	await writeFile(join(dir, 'blog', 'a-post.md'), '# a post');
	await mkdir(join(dir, 'media', 'a-post'), { recursive: true });
	await writeFile(join(dir, 'media', 'a-post', 'pic.abcdef12.png'), 'not really a picture');
	// The same prefix table main.ts serves the site with, so what these tests pin is the policy
	// the droplet actually applies and not a shape invented here.
	site = await boot({ 'static/Files': { dir, unknown: '404', headers: {
		'': 'no-cache',
		'assets/': 'public, max-age=31536000, immutable',
		'media/': 'public, max-age=31536000, immutable',
		'JetBrainsMono-2.304/': 'public, max-age=31536000, immutable',
	} } });
});
after(async () => { await site.stop(); });

test('the landing page is served from the directory', async () => {
	const answer = await fetch(`${site.url}/`);
	assert.equal(answer.status, 200);
	assert.equal(answer.headers.get('content-type'), 'text/html; charset=utf-8');
	assert.equal(await answer.text(), '<h1>the landing page</h1>');
});

test('a URL with no file is 404 with the fallback page', async () => {
	const answer = await fetch(`${site.url}/no-such-page`);
	assert.equal(answer.status, 404);
	assert.equal(await answer.text(), '<h1>not found</h1>');
});

test('a text file keeps its own type', async () => {
	const answer = await fetch(`${site.url}/robots.txt`);
	assert.equal(answer.status, 200);
	assert.equal(answer.headers.get('content-type'), 'text/plain; charset=utf-8');
	await answer.text();
});

test('the hashed bundle is cached forever and a page is not', async () => {
	const asset = await fetch(`${site.url}/assets/app.abc123.js`);
	assert.equal(asset.status, 200);
	assert.equal(asset.headers.get('cache-control'), 'public, max-age=31536000, immutable');
	await asset.text();

	const page = await fetch(`${site.url}/`);
	assert.equal(page.headers.get('cache-control'), 'no-cache');
	await page.text();
});

// A font served no-cache costs a conditional request before any text can be painted in it, on
// every single load, so the page paints in the fallback face and swaps when the answer lands.
// That is the flash. The files never change under their own URL, so they are cached like the
// hashed bundle rather than like a page.
test('a font is cached forever, not revalidated on every load', async () => {
	const font = await fetch(`${site.url}/JetBrainsMono-2.304/JetBrainsMono-Regular.woff2`);
	assert.equal(font.status, 200);
	assert.equal(font.headers.get('cache-control'), 'public, max-age=31536000, immutable');
	await font.text();
});

// A post's image carries its content hash in its name, so it is cached like the bundle; the
// post's page and its twin change under their URLs and revalidate like every page.
test('a post\'s media is cached forever and its page and twin are not', async () => {
	const picture = await fetch(`${site.url}/media/a-post/pic.abcdef12.png`);
	assert.equal(picture.status, 200);
	assert.equal(picture.headers.get('cache-control'), 'public, max-age=31536000, immutable');
	await picture.text();

	const page = await fetch(`${site.url}/blog/a-post`);
	assert.equal(page.status, 200);
	assert.equal(page.headers.get('cache-control'), 'no-cache');
	await page.text();

	const twin = await fetch(`${site.url}/blog/a-post.md`);
	assert.equal(twin.headers.get('cache-control'), 'no-cache');
	assert.equal(twin.headers.get('content-type'), 'text/markdown; charset=utf-8');
	await twin.text();
});
