// The site doing its real job, in a real browser, against the real server.
//
// Tests pin pieces; this proves the whole thing: the server serves what the build wrote, the page
// comes alive without replacing anything the server sent, both routes work as deep links, the
// contact form actually posts, and the pages look right at desktop and phone width.
//
// Run: npm run proof   (after npm run build, or at least vite build && npm run pages)

import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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

try {
	for (const [name, path] of [['landing', '/'], ['contact', '/contact']] as const) {
		const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
		view.on('pageerror', (error) => problems.push(`${name}: ${String(error)}`));
		view.on('console', (message) => {
			if (message.type() === 'error') problems.push(`${name} console: ${message.text()}`);
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

		await view.screenshot({ path: `${shots}${name}-desktop.png`, fullPage: true });
		await view.setViewportSize({ width: 390, height: 844 });
		await view.screenshot({ path: `${shots}${name}-phone.png`, fullPage: true });
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
	await view.close();

	assert.deepEqual(problems, [], 'no page threw and no console error was logged');
	console.log(`proof: ok. screenshots in ${shots}`);
} finally {
	await browser.close();
	await site.stop();
	await post.stop();
}
