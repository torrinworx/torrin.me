// POST /contact, through a real server on a real port. Each of the four measures has a test
// that goes red the moment that measure is taken out of `modules/Contact.ts`.

import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';

import { boot, mailbox, type Mailbox, type Site } from './boot.ts';

process.env['RESEND_API'] = 'test-key';
process.env['EMAIL_FROM'] = 'site@torrin.me';
process.env['EMAIL_TO'] = 'torrin@torrin.me, second@torrin.me';
process.env['EMAIL_SUBJECT'] = 'torrin.me contact';

const MESSAGE = { fullName: 'Ada Lovelace', email: 'ada@example.com', message: 'Hello there.', page: 'contact' };

const post = async (site: Site, body: unknown, headers: Record<string, string> = {}): Promise<Response> =>
	await fetch(`${site.url}/contact`, {
		method: 'POST',
		headers: { 'content-type': 'application/json', ...headers },
		body: JSON.stringify(body),
	});

describe('the message that gets through', () => {
	let post_box: Mailbox;
	let site: Site;

	before(async () => {
		post_box = await mailbox();
		// The limit is lifted here: these are the ordinary answers, and the rate limit has its
		// own suite below where it is the thing being tested.
		site = await boot({ Contact: { endpoint: post_box.url, limit: { count: 100, windowMs: 60_000 } } });
	});
	after(async () => { await site.stop(); await post_box.stop(); });

	test('a filled form is sent and answered 200', async () => {
		const answer = await post(site, MESSAGE);
		assert.equal(answer.status, 200);
		assert.deepEqual(await answer.json(), { ok: true });

		assert.equal(post_box.sent.length, 1);
		const mail = post_box.sent[0];
		assert.equal(mail?.authorization, 'Bearer test-key');
		assert.equal(mail?.body['from'], '"Ada Lovelace" <site@torrin.me>');
		assert.deepEqual(mail?.body['to'], ['torrin@torrin.me', 'second@torrin.me']);
		assert.equal(mail?.body['subject'], 'torrin.me contact');
		assert.equal(
			mail?.body['text'],
			'New message from torrin.me/contact form:\n\nName: Ada Lovelace\nEmail: ada@example.com\n\nMessage:\nHello there.',
		);
	});

	test('a form missing a field is 400 and sends nothing', async () => {
		const before = post_box.sent.length;
		for (const missing of ['fullName', 'email', 'message']) {
			const body: Record<string, unknown> = { ...MESSAGE };
			delete body[missing];
			const answer = await post(site, body);
			assert.equal(answer.status, 400, `${missing} missing`);
			assert.deepEqual(await answer.json(), { ok: false, error: 'Missing required fields' });
		}
		assert.equal(post_box.sent.length, before);
	});

	test('a send that fails is 500', async () => {
		const answer = await post(site, MESSAGE);
		assert.equal(answer.status, 200, 'the endpoint is answering before this test changes it');
		post_box.answer(500);
		const failed = await post(site, MESSAGE);
		post_box.answer(200);
		assert.equal(failed.status, 500);
		assert.deepEqual(await failed.json(), { ok: false, error: 'Internal server error' });
	});
});

// Measure a. Take the `company` check out and this test fails on the send count, because the
// message goes through; the status assertions still pass, which is the point of the measure.
describe('the honeypot', () => {
	let post_box: Mailbox;
	let site: Site;

	before(async () => {
		post_box = await mailbox();
		site = await boot({ Contact: { endpoint: post_box.url } });
	});
	after(async () => { await site.stop(); await post_box.stop(); });

	test('a filled company field sends nothing and looks exactly like success', async () => {
		const real = await post(site, MESSAGE);
		const honest = { status: real.status, body: await real.json() };
		assert.equal(post_box.sent.length, 1);

		const caught = await post(site, { ...MESSAGE, company: 'Acme Ltd' });
		assert.equal(caught.status, honest.status);
		assert.deepEqual(await caught.json(), honest.body);
		assert.equal(post_box.sent.length, 1, 'the honeypot message was never sent');

		// Anything but an empty field is a fill, whatever a bot put in it.
		const odd = await post(site, { ...MESSAGE, company: 1 });
		assert.equal(odd.status, honest.status);
		assert.equal(post_box.sent.length, 1);
	});

	test('an empty company field is an ordinary message', async () => {
		const answer = await post(site, { ...MESSAGE, company: '' });
		assert.equal(answer.status, 200);
		assert.equal(post_box.sent.length, 2);
	});
});

// Measure b. Take the limiter out and the third message is 200 and a third mail is sent.
describe('the rate limit', () => {
	let post_box: Mailbox;
	let site: Site;

	before(async () => {
		post_box = await mailbox();
		site = await boot({ Contact: { endpoint: post_box.url, limit: { count: 2, windowMs: 60_000 } } });
	});
	after(async () => { await site.stop(); await post_box.stop(); });

	test('a third message from one address is 429 and never sent', async () => {
		assert.equal((await post(site, MESSAGE)).status, 200);
		assert.equal((await post(site, MESSAGE)).status, 200);

		const over = await post(site, MESSAGE);
		assert.equal(over.status, 429);
		assert.deepEqual(await over.json(), { ok: false, error: 'Too many requests' });
		assert.equal(post_box.sent.length, 2);
	});

	test('a refused request is still counted, so a flood cannot reset itself', async () => {
		const again = await post(site, MESSAGE);
		assert.equal(again.status, 429);
		assert.equal(post_box.sent.length, 2);
	});
});

// Measure c. Take the cap out and both of these parse and answer 400 or 200 instead of 413.
describe('the body cap', () => {
	let post_box: Mailbox;
	let site: Site;

	before(async () => {
		post_box = await mailbox();
		site = await boot({ Contact: { endpoint: post_box.url, maxBytes: 1024, limit: { count: 100, windowMs: 60_000 } } });
	});
	after(async () => { await site.stop(); await post_box.stop(); });

	test('a body over the cap that declares its length is 413', async () => {
		const answer = await post(site, { ...MESSAGE, message: 'x'.repeat(4096) });
		assert.equal(answer.status, 413);
		assert.deepEqual(await answer.json(), { ok: false, error: 'Body too large' });
		assert.equal(post_box.sent.length, 0);
	});

	test('a body over the cap that declares nothing is 413 too', async () => {
		// Sent as a stream, so it arrives chunked with no `content-length` at all and the only
		// thing that can refuse it is the count kept while it is read.
		const chunks = new ReadableStream<Uint8Array>({
			start(controller) {
				const filler = new TextEncoder().encode('y'.repeat(512));
				controller.enqueue(new TextEncoder().encode('{"message":"'));
				for (let i = 0; i < 8; i++) controller.enqueue(filler);
				controller.enqueue(new TextEncoder().encode('"}'));
				controller.close();
			},
		});
		const answer = await fetch(`${site.url}/contact`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: chunks,
			duplex: 'half',
		} as RequestInit);
		assert.equal(answer.status, 413);
		assert.equal(post_box.sent.length, 0);
	});

	test('a body under the cap still goes through', async () => {
		const answer = await post(site, MESSAGE);
		assert.equal(answer.status, 200);
		assert.equal(post_box.sent.length, 1);
	});
});

// Measure d. Take the check out and the first of these is 200 and a mail is sent.
describe('the origin check', () => {
	let post_box: Mailbox;
	let site: Site;

	before(async () => {
		post_box = await mailbox();
		site = await boot({ Contact: { endpoint: post_box.url, limit: { count: 100, windowMs: 60_000 } } });
	});
	beforeEach(() => { post_box.sent.length = 0; });
	after(async () => { await site.stop(); await post_box.stop(); });

	test('a post from another site is 403 and sends nothing', async () => {
		// The server's own Origin rule answers first, with its reason; the route's list beneath it
		// would answer the same status if the rule were ever widened.
		const answer = await post(site, MESSAGE, { origin: 'https://evil.example' });
		assert.equal(answer.status, 403);
		assert.equal((await answer.json() as { reasons: { code: string }[] }).reasons[0]?.code, 'origin');
		assert.equal(post_box.sent.length, 0);
	});

	test('a post from torrin.me goes through', async () => {
		assert.equal((await post(site, MESSAGE, { origin: 'https://torrin.me' })).status, 200);
		assert.equal((await post(site, MESSAGE, { origin: 'https://www.torrin.me' })).status, 200);
		assert.equal(post_box.sent.length, 2);
	});

	test('a post with no origin at all goes through', async () => {
		assert.equal((await post(site, MESSAGE)).status, 200);
		assert.equal(post_box.sent.length, 1);
	});
});
