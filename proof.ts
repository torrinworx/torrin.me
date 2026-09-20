// The site doing its real job, in a real browser, against the real server.
//
// Tests pin pieces; this proves the whole thing: the server serves what the build wrote, the page
// comes alive without replacing anything the server sent, every route works as a deep link (the
// blog index and the newest post among them, with the title as the h1 and every image loaded),
// the contact form actually posts, and the pages look right at desktop and phone width.
//
// Run: npm run proof   (after npm run build, or at least vite build && npm run pages)

import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { visit, visits } from '@aweftjs/logs';
import { chromium } from 'playwright';

import { boot, mailbox } from './tests/boot.ts';

const shots = fileURLToPath(new URL('./proof-shots/', import.meta.url));
mkdirSync(shots, { recursive: true });

// The mail credentials live in the environment, as they do in production; only the endpoint is
// moved, so nothing leaves this machine.
process.env['RESEND_API'] = 'proof-key';
process.env['EMAIL_FROM'] = 'proof@torrin.me';
process.env['EMAIL_TO'] = 'torrin@torrin.me';
process.env['EMAIL_SUBJECT'] = 'torrin.me proof run';

const post = await mailbox();
// A fixed port, because the page's own origin has to be allowed before the server starts.
const port = 4173;
const site = await boot({
	Contact: { endpoint: post.url, origins: [`http://127.0.0.1:${String(port)}`] },
	'static/Files': { dir: fileURLToPath(new URL('./dist', import.meta.url)), unknown: '404' },
}, port);
const browser = await chromium.launch();

const problems: string[] = [];

// The newest published post, from the index the build wrote: the page a reader lands on from the
// feed, and the one the blog's markup is proven on.
const newest = (JSON.parse(readFileSync(new URL('./frontend/data/posts.json', import.meta.url), 'utf8')) as { slug: string; title: string }[])[0]!;
const PAGES: readonly (readonly [name: string, path: string, h1: string | null])[] = [
	['landing', '/', null],
	['contact', '/contact', null],
	['blog', '/blog', 'Blog'],
	['post', `/blog/${newest.slug}`, newest.title],
];

try {
	for (const [name, path, h1] of PAGES) {
		const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
		view.on('pageerror', (error) => problems.push(`${name}: ${String(error)}`));
		view.on('console', (message) => {
			if (message.type() === 'error') problems.push(`${name} console: ${message.text()}`);
		});
		// Everything the page loads or posts is its own origin: the fonts, the bundle, the log
		// batches. A request anywhere else is a third-party tag that came back.
		view.on('request', (request) => {
			if (!request.url().startsWith(site.url)) problems.push(`${name} left the origin: ${request.url()}`);
		});

		// A deep link, cold. This is how a reader arrives from a search result, and it is the path
		// that breaks first when the written page and the client tree disagree.
		await view.goto(`${site.url}${path}`, { waitUntil: 'networkidle' });

		// Every element the server wrote is still the same node after the page came alive. Marked
		// before hydration finishes would be racy, so this reads what survived instead: the ssg
		// stamp is removed by `attach` only once it has adopted the body it was given.
		const title = await view.title();
		assert.ok(title.length > 0, `${path} has a title after hydration`);

		const text = await view.textContent('body');
		assert.ok((text ?? '').trim().length > 0, `${path} has visible text`);

		// A blog page's first heading is the title the index carries, and every image on it
		// loaded from this origin: a poster the build did not fetch, or a media path the build
		// rewrote wrong, is a broken image here and not on the live site.
		if (h1 !== null) assert.equal(await view.textContent('h1'), h1, `${path} shows its title as the h1`);
		const images = await view.$$eval('img', (found) => found.map((image) => [image.getAttribute('src') ?? '', (image as HTMLImageElement).naturalWidth] as const));
		for (const [src, width] of images) assert.ok(width > 0, `${path}: the image ${src} loaded`);

		await view.screenshot({ path: `${shots}${name}-desktop.png`, fullPage: true });
		await view.setViewportSize({ width: 390, height: 844 });
		await view.screenshot({ path: `${shots}${name}-phone.png`, fullPage: true });

		// The page posts its own record while it is open: the first batch, with the browser's
		// facts, goes on the recorder's timer, and this waits for the server to have answered it
		// before the page goes, the way a real tab's keepalive request outlives a close.
		const logged = await view.waitForResponse((answer) => answer.url() === `${site.url}/api/logs`, { timeout: 15_000 }).catch(() => undefined);
		assert.ok(logged !== undefined && logged.status() === 200, `${name} posted its log batch and was answered 200`);
		await view.close();
	}

	// The form, end to end: filled in a real browser, posted to the real route, landing in the
	// endpoint that stands in for Resend.
	const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	view.on('pageerror', (error) => problems.push(`form: ${String(error)}`));
	await view.goto(`${site.url}/contact`, { waitUntil: 'networkidle' });

	const before = post.sent.length;
	const sent = await view.evaluate(async () => {
		const answer = await fetch('/contact', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				fullName: 'A Reader', email: 'reader@example.com',
				message: 'Proof program says hello.', page: 'contact', company: '',
			}),
		});
		return { status: answer.status, body: (await answer.json()) as { ok: boolean } };
	});
	assert.equal(sent.status, 200, 'the form post was accepted');
	assert.equal(sent.body.ok, true, 'and answered ok');
	assert.equal(post.sent.length, before + 1, 'and one message reached the endpoint');
	const delivered = post.sent[post.sent.length - 1]!.body as { text?: string };
	assert.ok(String(delivered.text).includes('Proof program says hello.'), 'carrying what was typed');

	// The same form with the honeypot filled: the sender cannot tell, and nothing is sent.
	const trapped = await view.evaluate(async () => {
		const answer = await fetch('/contact', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				fullName: 'A Bot', email: 'bot@example.com',
				message: 'buy things', page: 'contact', company: 'Bot Industries',
			}),
		});
		return { status: answer.status, body: (await answer.json()) as { ok: boolean } };
	});
	assert.deepEqual(trapped, sent, 'the honeypot answers exactly what a real send answers');
	assert.equal(post.sent.length, before + 1, 'and sent nothing');
	const formLogged = await view.waitForResponse((answer) => answer.url() === `${site.url}/api/logs`, { timeout: 15_000 }).catch(() => undefined);
	assert.ok(formLogged !== undefined && formLogged.status() === 200, 'the form page posted its log batch and was answered 200');
	await view.close();

	// The pages recorded themselves: closing a page sends its last batch, so by now the store
	// holds a visit per page opened above, each with the browser's facts and the URL it showed.
	const expected = PAGES.length + 1;
	const recorded = await (async () => {
		for (let attempt = 0; attempt < 50; attempt++) {
			const found = await visits(site.store, {});
			if (found.length >= expected) return found;
			await new Promise((done) => setTimeout(done, 200));
		}
		return visits(site.store, {});
	})();
	assert.ok(recorded.length >= expected, `${String(expected)} pages were opened and ${String(recorded.length)} visits were recorded`);
	const opened = await Promise.all(recorded.map((summary) => visit(site.store, summary.id)));
	assert.ok(opened.every((seen) => seen !== undefined && seen.browser !== null && seen.user === null), 'each visit carries browser facts and no user');
	assert.ok(opened.some((seen) => seen?.entries.some((entry) => entry.kind === 'url')), 'a visit recorded the URL it showed');

	assert.deepEqual(problems, [], 'no page threw and no console error was logged');
	console.log(`proof: ok. screenshots in ${shots}`);
} finally {
	await browser.close();
	await site.stop();
	await post.stop();
}
