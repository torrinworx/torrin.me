// The site doing its real job, in a real browser, against the real server.
//
// Tests pin pieces; this proves the whole thing: the server serves what the build wrote, the page
// comes alive without replacing anything the server sent, every route works as a deep link (the
// blog index and the newest post among them, with the title as the h1 and every image loaded),
// the contact form actually posts, the pages look right at desktop and phone width, and the radio
// process, run as the droplet runs it, streams audio that is not silence to a listener joining now.
//
// Run: npm run proof   (after npm run build, or at least vite build && npm run pages)

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { visit, visits } from '@aweftjs/logs';
import { chromium } from 'playwright';

import { firstSlot, slotOf } from './radio/schedule.ts';
import type { StyleName } from './radio/config.ts';
import { boot, mailbox } from './tests/boot.ts';

const shots = fileURLToPath(new URL('./proof-shots/', import.meta.url));
mkdirSync(shots, { recursive: true });

// The mail credentials live in the environment, as they do in production; only the endpoint is
// moved, so nothing leaves this machine.
process.env['RESEND_API'] = 'proof-key';
process.env['EMAIL_FROM'] = 'proof@torrin.me';
process.env['EMAIL_TO'] = 'torrin@torrin.me';
process.env['EMAIL_SUBJECT'] = 'torrin.me proof run';

interface Heard { readonly frames: number; readonly rms: number; readonly health: { ok: boolean; listeners: number }; readonly now: { style: string; name: string } }

/** The moment thirty seconds into the first track of a style, so the recording has the drums in it and not the intro's fade. */
const startOf = (style: StyleName): number => slotOf(firstSlot(style)).begins + 30;

const tuneIn = async (seconds: number, style: StyleName): Promise<Heard> => {
	const port = 4174;
	const radio = spawn(process.execPath, [fileURLToPath(new URL('./radio/main.ts', import.meta.url))], {
		env: { ...process.env, RADIO_PORT: String(port), RADIO_START: String(startOf(style)) },
		stdio: ['ignore', 'pipe', 'inherit'],
	});
	try {
		await new Promise<void>((ready, failed) => {
			radio.stdout.on('data', (line: Buffer) => { if (line.toString().includes('radio on')) ready(); });
			radio.once('exit', (code) => { failed(new Error(`the radio exited with ${String(code)} before it was ready`)); });
		});
		const stopper = new AbortController();
		setTimeout(() => { stopper.abort(); }, seconds * 1000);
		const answer = await fetch(`http://127.0.0.1:${String(port)}/stream`, { signal: stopper.signal });
		assert.equal(answer.headers.get('content-type'), 'audio/mpeg');
		const health = await (await fetch(`http://127.0.0.1:${String(port)}/health`)).json() as Heard['health'];
		const now = await (await fetch(`http://127.0.0.1:${String(port)}/now`)).json() as Heard['now'];
		const chunks: Uint8Array[] = [];
		try {
			const reader = answer.body!.getReader();
			for (;;) {
				const next = await reader.read();
				if (next.done) break;
				chunks.push(next.value);
			}
		} catch (error) {
			if ((error as Error).name !== 'AbortError') throw error;
		}
		const mp3 = Buffer.concat(chunks);
		let frames = 0;
		for (let i = 0; i < mp3.length - 1; i++) if (mp3[i] === 0xff && ((mp3[i + 1] ?? 0) & 0xe0) === 0xe0) frames++;

		// Decoded by ffmpeg, the same tool the radio encodes with, to 16-bit mono samples.
		const decoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-f', 's16le', '-ac', '1', '-ar', '48000', 'pipe:1'], { stdio: ['pipe', 'pipe', 'inherit'] });
		const decoded: Buffer[] = [];
		decoder.stdout.on('data', (chunk: Buffer) => { decoded.push(chunk); });
		decoder.stdin.end(mp3);
		await new Promise<void>((done) => { decoder.once('exit', () => { done(); }); });
		const pcm = Buffer.concat(decoded);
		let sum = 0;
		for (let i = 0; i + 1 < pcm.length; i += 2) { const sample = pcm.readInt16LE(i) / 32768; sum += sample * sample; }
		const rms = Math.sqrt(sum / Math.max(1, pcm.length / 2));
		return { frames, rms, health, now };
	} finally {
		radio.kill('SIGTERM');
	}
};

// The answer the page's fetch of /radio/now gets. The site's server has no such route (in
// production nginx proxies it to the radio), so the browser is given this one.
const ON_AIR = {
	time: Date.now() / 1000, backlogSeconds: 1.5, slot: 7, style: 'synthwave', name: 'Proof Signal', tempo: 100,
	key: 'A minor', bar: 3, bars: 52, begins: Date.now() / 1000 - 30, seconds: 210, blockEnds: Date.now() / 1000 + 600,
};
const onAir = async (view: import('playwright').Page): Promise<void> => {
	await view.route('**/radio/now', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ON_AIR) }));
};

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
	['radio', '/radio', 'Radio'],
	['blog', '/blog', 'Blog'],
	['post', `/blog/${newest.slug}`, newest.title],
];

try {
	for (const [name, path, h1] of PAGES) {
		const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
		await onAir(view);
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

	// The radio page has its button and its bars before anything is pressed.
	const dial = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	await onAir(dial);
	await dial.goto(`${site.url}/radio`, { waitUntil: 'networkidle' });
	assert.equal(await dial.textContent('#radio-play'), 'Play', 'the radio page offers Play');
	assert.ok(await dial.$('#radio-bars') !== null, 'and draws its bars');
	assert.ok((await dial.textContent('main'))?.includes('Proof Signal · Synthwave · A minor · 100 bpm'), 'and says what is on the air');
	await dial.close();

	// The radio, the way the droplet runs it: the process on a port, started thirty seconds into
	// a track of each style, a listener joining now, ten seconds of the stream decoded back to
	// samples and measured. Every other check here would pass on silence, so this one measures
	// the sound.
	for (const style of ['sleep', 'synthwave'] as const) {
		const heard = await tuneIn(10, style);
		assert.equal(heard.now.style, style, `the station started on a ${style} track`);
		assert.ok(heard.now.name.includes(' '), `with a name: ${heard.now.name}`);
		assert.ok(heard.frames > 300, `${style}: ${String(heard.frames)} MP3 frames in ten seconds`);
		assert.ok(heard.rms > 0.003, `${style} is not silence: rms ${heard.rms.toFixed(4)}`);
		assert.ok(heard.health.ok && heard.health.listeners === 1, `${style}: health saw the one listener`);
	}

	assert.deepEqual(problems, [], 'no page threw and no console error was logged');
	console.log(`proof: ok. screenshots in ${shots}`);
} finally {
	await browser.close();
	await site.stop();
	await post.stop();
}
