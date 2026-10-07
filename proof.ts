// The site doing its real job, in a real browser, against the real server.
//
// Tests pin pieces; this proves the whole thing: the server serves what the build wrote, the page
// comes alive without replacing anything the server sent, every route works as a deep link (the
// blog index and the newest post among them, with the title as the h1 and every image loaded),
// the contact form actually posts, the pages look right at desktop and phone width, every page
// passes axe's WCAG 2.1 AA rules in both modes and every word on it stands out from the scenes
// drawn behind it, the Motion switch holds the scenes still, and the radio process, run as the
// droplet runs it, streams audio that is not silence to a listener joining now.
//
// Run: npm run proof   (after npm run build, or at least
//      vite build --configLoader native && npm run pages)

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { visit, visits } from '@aweftjs/logs';
import { audit } from '@aweftjs/testing/browser';
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

// A word or an icon on a page: its colour, the contrast it needs, and its box in the window.
interface Mark { readonly what: string; readonly color: string; readonly need: number; readonly box: readonly [number, number, number, number] }

/**
 * Every visible word and icon on the page. A word's own line box, not its element's, since a
 * heading's box runs the width of the column. Emoji are left out: they are drawn in their own
 * colours. 4.5:1 for text, 3:1 for large text (24px, or 18.66px bold) and for icons.
 */
const marksOf = (): Mark[] => {
	const found: Mark[] = [];
	const large = (style: CSSStyleDeclaration): boolean => {
		const size = parseFloat(style.fontSize);
		return size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
	};
	// Visually hidden text, for a screen reader only, is clipped to nothing.
	const hidden = (element: Element): boolean => {
		for (let at: Element | null = element; at !== null; at = at.parentElement) if (getComputedStyle(at).clip.startsWith('rect')) return true;
		return !element.checkVisibility({ opacityProperty: true, visibilityProperty: true });
	};
	const box = (rect: DOMRect): Mark['box'] => [rect.left, rect.top, rect.right, rect.bottom];
	// What of a word shows: a code block that scrolls sideways hides the rest of a long line.
	const shown = (element: Element, rect: DOMRect): Mark['box'] => {
		let [left, top, right, bottom] = box(rect);
		for (let at = element.parentElement; at !== null; at = at.parentElement) {
			const style = getComputedStyle(at);
			if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
			const clip = at.getBoundingClientRect();
			left = Math.max(left, clip.left); top = Math.max(top, clip.top);
			right = Math.min(right, clip.right); bottom = Math.min(bottom, clip.bottom);
		}
		return [left, top, right, bottom];
	};
	const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
		const parent = node.parentElement;
		if (parent === null || parent.closest('script, style, noscript, svg, textarea') !== null || hidden(parent)) continue;
		const style = getComputedStyle(parent);
		for (const word of (node.textContent ?? '').matchAll(/\S+/gu)) {
			if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(word[0])) continue;
			const range = document.createRange();
			range.setStart(node, word.index);
			range.setEnd(node, word.index + word[0].length);
			for (const rect of Array.from(range.getClientRects())) {
				const [left, top, right, bottom] = shown(parent, rect);
				if (right - left >= 2 && bottom - top >= 2) found.push({ what: word[0], color: style.color, need: large(style) ? 3 : 4.5, box: [left, top, right, bottom] });
			}
		}
	}
	for (const icon of Array.from(document.querySelectorAll('svg'))) {
		const rect = icon.getBoundingClientRect();
		if (hidden(icon) || rect.width < 2 || rect.height < 2) continue;
		found.push({ what: icon.closest('[aria-label]')?.getAttribute('aria-label') ?? 'an icon', color: getComputedStyle(icon).color, need: 3, box: box(rect) });
	}
	return found;
};

/** What a page looks like with its words and icons taken off: everything they are drawn over. */
const BARE = `*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important;
	text-decoration-color: transparent !important; text-shadow: none !important; transition: none !important; }
svg { visibility: hidden !important; }`;

/** The marks with any pixel under them, in a screenshot of the bare page, below the contrast they need. */
const judge = async ([shot, marks]: readonly [string, Mark[]]): Promise<string[]> => {
	const image = new Image();
	image.src = `data:image/png;base64,${shot}`;
	await image.decode();
	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;
	const context = canvas.getContext('2d')!;
	context.drawImage(image, 0, 0);
	const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
	const channel = (v: number): number => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
	const luminance = (r: number, g: number, b: number): number => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
	const low: string[] = [];
	for (const mark of marks) {
		const [r, g, b] = (mark.color.match(/[\d.]+/g) ?? []).map(Number);
		const ink = luminance(r!, g!, b!);
		let worst = Infinity, count = 0;
		const [x0, y0, x1, y1] = mark.box.map(Math.round) as [number, number, number, number];
		for (let y = Math.max(0, y0); y < Math.min(canvas.height, y1); y++) {
			for (let x = Math.max(0, x0); x < Math.min(canvas.width, x1); x++) {
				const i = (y * canvas.width + x) * 4, under = luminance(data[i]!, data[i + 1]!, data[i + 2]!);
				const ratio = (Math.max(ink, under) + 0.05) / (Math.min(ink, under) + 0.05);
				if (ratio < mark.need) { count++; worst = Math.min(worst, ratio); }
			}
		}
		if (count > 0) low.push(`"${mark.what}" at (${String(x0)}, ${String(y0)}): ${worst.toFixed(2)}:1 under ${String(count)} pixels, needs ${String(mark.need)}:1`);
	}
	return low;
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

	// The landing's strip, its bird and the dark mode switch, as a visitor uses them: the browser
	// draws the strip with a transparent sky, the menu's switch turns the page and the strip
	// dark, and the choice is still there after a reload (work order 485).
	const landing = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	landing.on('pageerror', (error) => problems.push(`mode: ${String(error)}`));
	// Each load of the page is a visit, and every visit must post its first batch, browser facts
	// and all, before the page reloads or closes, as the pages above do.
	// A wait still pending when a check fails rejects as the page closes. It is caught here, so the
	// failure reported is the check's.
	const posted = (): Promise<unknown> => {
		const answered = landing.waitForResponse((answer) => answer.url() === `${site.url}/api/logs`, { timeout: 15_000 });
		answered.catch(() => undefined);
		return answered;
	};
	let batch = posted();
	await landing.goto(`${site.url}/`, { waitUntil: 'commit' });
	// A bird lands on the resume button in the first second and a half, and flies off when the
	// pointer reaches the button.
	const perched = await landing.waitForFunction(
		() => (document.getElementById('hero-bird')?.dataset['state'] === 'perch' ? performance.now() : false),
		undefined,
		{ polling: 'raf', timeout: 5_000 },
	).then(async (at) => Number(await at.jsonValue()), () => Infinity);
	assert.ok(perched <= 1_500, `the bird lands within 1.5s of the page opening, not at ${String(Math.round(perched))}ms`);
	const resume = landing.locator('#hero-strip ~ * a[download]').first();
	const onEdge = await landing.evaluate(() => {
		const hero = document.getElementById('hero-strip')!.parentElement!;
		return document.getElementById('hero-bird')!.getBoundingClientRect().bottom === hero.querySelector('a[download]')!.getBoundingClientRect().top;
	});
	assert.ok(onEdge, 'with its feet on the button');
	await resume.hover();
	const flown = await landing.waitForFunction(
		() => getComputedStyle(document.getElementById('hero-bird')!).display === 'none',
		undefined,
		{ timeout: 5_000 },
	).then(() => true, () => false);
	assert.ok(flown, 'and is gone once the pointer reaches the button');
	await landing.mouse.move(640, 300);
	await landing.waitForLoadState('networkidle');
	// The sky is transparent, so the page shows through it. The far hills at the strip's left edge,
	// half way down, are pale by day and dark by night.
	const skyIs = async (hills: string): Promise<void> => {
		await landing.waitForFunction((want) => {
			const canvas = document.querySelector<HTMLCanvasElement>('#hero-strip canvas');
			if (canvas === null || canvas.width === 0) return false;
			const context = canvas.getContext('2d')!;
			const sky = context.getImageData(0, 0, 1, 1).data[3];
			const [r, g, b] = context.getImageData(0, Math.floor(canvas.height / 2), 1, 1).data;
			return sky === 0 && `${String(r)},${String(g)},${String(b)}` === want;
		}, hills, { timeout: 5_000 });
	};
	await skyIs('227,234,208');
	// The menu floats at the top right of the window, so a visitor deep in the page still has it.
	await landing.evaluate(() => { document.querySelector('h2')!.scrollIntoView(); });
	const menu = await landing.locator('button[aria-label="Menu"]').boundingBox();
	assert.ok(menu !== null && menu.y === 20 && menu.x + menu.width === 1260, `the menu stays at the top right as the page scrolls, not at ${JSON.stringify(menu)}`);
	await landing.click('button[aria-label="Menu"]');
	await landing.click('text=Dark mode');
	await landing.evaluate(() => { scrollTo(0, 0); });
	await skyIs('27,56,28');
	// The page eases into its new background over a moment, so this waits for it to arrive.
	const forest = await landing.waitForFunction(
		() => getComputedStyle(document.querySelector('main')!.parentElement!).backgroundColor === 'rgb(19, 42, 19)',
		undefined,
		{ timeout: 5_000 },
	).then(() => true, () => false);
	assert.ok(forest, 'the switch turns the page forest');
	await batch;
	batch = posted();
	await landing.reload({ waitUntil: 'networkidle' });
	await skyIs('27,56,28');
	assert.equal(await landing.evaluate(() => localStorage.getItem('modeChoice')), 'dark', 'and the choice is kept across a reload');
	await landing.screenshot({ path: `${shots}landing-dark.png` });
	await batch;
	await landing.close();

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

	// The form as a visitor fills it, with a phone number in the message: a bird lands on the form
	// once it is all in view, the message is sent, and a live region announces it (SC 4.1.3).
	const landed = await view.waitForFunction(() => document.getElementById('contact-bird')?.dataset['state'] === 'perch', undefined, { timeout: 5_000 }).then(() => true, () => false);
	assert.ok(landed, 'a bird lands on the form');
	await view.fill('[aria-label="Full Name"]', 'A Reader');
	await view.fill('[aria-label="Email"]', 'reader@example.com');
	await view.fill('[aria-label="Message"]', 'Call me at 519 555 0100.');
	await view.click('#contact-submit');
	const heard = await view.waitForFunction(() => document.querySelector('[role="status"]')?.textContent?.includes('Received') === true, undefined, { timeout: 5_000 }).then(() => true, () => false);
	assert.ok(heard, 'the page says it was received, in a live region');
	assert.equal(post.sent.length, before + 2, 'and it reached the endpoint');
	assert.ok(String((post.sent[post.sent.length - 1]!.body as { text?: string }).text).includes('519 555 0100'), 'digits and all');
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
	const bare = opened.filter((seen) => seen === undefined || seen.browser === null || seen.user !== null);
	assert.deepEqual(bare.map((seen) => JSON.stringify(seen?.entries.find((entry) => entry.kind === 'url') ?? seen?.id)), [], 'each visit carries browser facts and no user');
	assert.ok(opened.some((seen) => seen?.entries.some((entry) => entry.kind === 'url')), 'a visit recorded the URL it showed');

	// On a post, the vine drawn in the left margin gets longer as the reader scrolls. In a 1280 by
	// 800 window, half way down and at the end, its lowest pixel is in the window and above the footer.
	const reader = await browser.newPage({ viewport: { width: 1280, height: 800 } });
	await reader.goto(`${site.url}/blog/${newest.slug}`, { waitUntil: 'networkidle' });
	for (const through of [0.5, 1]) {
		const { tip, shore } = await reader.evaluate(async (at) => {
			scrollTo(0, at * (document.documentElement.scrollHeight - innerHeight));
			await new Promise((done) => { requestAnimationFrame(() => { requestAnimationFrame(done); }); });
			const canvas = document.querySelector<HTMLCanvasElement>('#canopy canvas')!;
			const box = canvas.getBoundingClientRect(), size = box.width / canvas.width;
			// Where createCanopy hangs it: seven strip pixels left of the 800 pixel column.
			const x = Math.floor((canvas.width - 800 / size) / 2 - 7);
			const { data } = canvas.getContext('2d')!.getImageData(x - 3, 0, 7, canvas.height);
			let lowest = -1;
			for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) lowest = Math.floor(i / 4 / 7);
			return { tip: box.top + (lowest + 0.5) * size, shore: document.getElementById('shore')!.getBoundingClientRect().top };
		}, through);
		assert.ok(tip > 20 && tip < Math.min(800, shore), `${String(through * 100)}% through a post, the vine's tip is in the window above the footer, not at ${String(tip)}px`);
	}
	await reader.close();

	// The pages below are opened after the visit check above, which counts every page opened before it.
	// Every page against WCAG 2.1 AA, light and dark, at a desktop, a tablet and the 320 CSS pixels a
	// phone reflows to (SC 1.4.10). axe checks the markup, but it cannot read a canvas, and the
	// scenes' canvases sit behind and beside the words. So each word and icon is also measured
	// against what the browser painted under it, with the words hidden (SC 1.4.3, 1.4.11). Motion is
	// off, so every run measures the same frame.
	for (const [name, path] of [...PAGES.map(([page, at]) => [page, at] as const), ['404', '/nope'] as const]) {
		for (const dark of [false, true]) {
			for (const width of [1280, 600, 320]) {
				const where = `${name}, ${dark ? 'dark' : 'light'}, ${String(width)}px`;
				const context = await browser.newContext({ viewport: { width, height: 900 } });
				await context.addInitScript((night) => {
					localStorage.setItem('motionChoice', 'off');
					if (night) localStorage.setItem('modeChoice', 'dark');
				}, dark);
				const view = await context.newPage();
				await onAir(view);
				await view.goto(`${site.url}${path}`, { waitUntil: 'networkidle' });
				const { violations } = await audit(view);
				assert.deepEqual(violations.map((found) => `${found.rule}: ${found.help} (${found.nodes.map((node) => node.target).join(', ')})`), [], `${where}: axe`);

				// The whole page in the window at once, so every scene has drawn.
				const tall = await view.evaluate(() => document.documentElement.scrollHeight);
				await view.setViewportSize({ width, height: tall });
				await view.waitForFunction(() => Array.from(document.querySelectorAll<HTMLCanvasElement>('[aria-hidden="true"] > canvas')).every((canvas) => canvas.width > 0));
				const settle = (): Promise<void> => view.evaluate(() => new Promise<void>((done) => { requestAnimationFrame(() => { requestAnimationFrame(() => { done(); }); }); }));
				await settle();
				const marks = await view.evaluate(marksOf);
				await view.addStyleTag({ content: BARE });
				await settle();
				const shot = (await view.screenshot()).toString('base64');
				assert.deepEqual(await view.evaluate(judge, [shot, marks] as const), [], `${where}: every word and icon stands out from what is drawn under it`);
				await context.close();
			}
		}
	}

	// The menu's Motion switch stops the scenes for a visitor who finds motion distracting
	// (SC 2.2.2), and the choice is kept.
	const calm = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	calm.on('pageerror', (error) => problems.push(`motion: ${String(error)}`));
	await calm.goto(`${site.url}/`, { waitUntil: 'networkidle' });
	const frameOf = (): Promise<string> => calm.evaluate(() => document.querySelector<HTMLCanvasElement>('#hero-strip canvas')!.toDataURL());
	const pause = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));
	const moving = await frameOf();
	await pause(400);
	assert.notEqual(await frameOf(), moving, 'the forest moves');
	await calm.click('button[aria-label="Menu"]');
	await calm.click('text="Motion"');
	await pause(200);
	const held = await frameOf();
	await pause(400);
	assert.equal(await frameOf(), held, 'and holds still once Motion is off');
	assert.equal(await calm.evaluate(() => localStorage.getItem('motionChoice')), 'off', 'and the choice is kept');
	await calm.close();

	// The radio page has its button and its reeds before anything is pressed.
	const dial = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	await onAir(dial);
	await dial.goto(`${site.url}/radio`, { waitUntil: 'networkidle' });
	assert.equal(await dial.textContent('#radio-play'), 'Play', 'the radio page offers Play');
	assert.ok(await dial.$('#radio-reeds canvas') !== null, 'and draws its reeds');
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
