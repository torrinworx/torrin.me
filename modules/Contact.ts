// The contact form's one route. It takes a message from the site and sends it through Resend's
// HTTP API, and it is the only thing on this site a stranger can make happen, so the four
// measures that keep it from being a free mailer live here with it.
//
// Named `Contact.ts` rather than `.tsx` because `fromDirectory` lists `.js`, `.mjs` and `.ts`
// only (`@aweftjs/modules/src/node.ts:11`), and there is no markup here to need JSX.

import type { ModuleProps } from '@aweftjs/modules';
import type { Route } from '@aweftjs/server';

import type { Visitor } from './gate.ts';

export const defaults = {
	/** Resend's send endpoint. A test points this at a server on localhost, so no mail leaves. */
	endpoint: 'https://api.resend.com/emails',
	/** The origins a form post may carry. */
	origins: ['https://torrin.me', 'https://www.torrin.me'],
	/**
	 * The largest body this reads. A name, an address and a long message are a few kilobytes;
	 * 16 KB leaves room for a very long message and refuses anything that is not one.
	 */
	maxBytes: 16 * 1024,
	/**
	 * Five messages an hour from one address. A person writing in sends one, and the second and
	 * third are a correction and a retry, so five never touches a real sender while it caps a
	 * flood at a rate no inbox notices.
	 */
	limit: { count: 5, windowMs: 60 * 60 * 1000 },
};

interface Settings {
	readonly endpoint: string;
	readonly origins: readonly string[];
	readonly maxBytes: number;
	readonly limit: { readonly count: number; readonly windowMs: number };
}

interface Mail {
	readonly from: string;
	readonly to: readonly string[];
	readonly subject: string;
	readonly text: string;
}

export interface Contact {
	readonly routes: Readonly<Record<string, Route<Visitor>>>;
}

const json = (status: number, body: unknown): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8' },
	});

/** Success, and what the honeypot answers, which have to be the same response byte for byte. */
const accepted = (): Response => json(200, { ok: true });

type Read =
	| { readonly body: Record<string, unknown> }
	| { readonly tooLarge: true }
	| { readonly unreadable: true };

/**
 * The request body, refused past `max` bytes before anything parses it. A declared length over
 * the cap is refused without reading at all; a body that declares nothing, or lies, is counted
 * as it arrives and dropped the moment it crosses.
 */
const read = async (request: Request, max: number): Promise<Read> => {
	const declared = Number(request.headers.get('content-length'));
	if (Number.isFinite(declared) && declared > max) return { tooLarge: true };

	let text = '';
	const stream = request.body;
	if (stream !== null) {
		const reader = stream.getReader();
		const decoder = new TextDecoder();
		let seen = 0;
		for (;;) {
			const chunk = await reader.read();
			if (chunk.done) break;
			seen += chunk.value.byteLength;
			if (seen > max) {
				await reader.cancel();
				return { tooLarge: true };
			}
			text += decoder.decode(chunk.value, { stream: true });
		}
		text += decoder.decode();
	}

	try {
		const parsed: unknown = JSON.parse(text === '' ? '{}' : text);
		if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return { unreadable: true };
		return { body: parsed as Record<string, unknown> };
	} catch {
		return { unreadable: true };
	}
};

const send = async (endpoint: string, mail: Mail): Promise<void> => {
	const key = process.env['RESEND_API'];
	if (key === undefined || key === '') throw new Error('RESEND_API is not set');
	const answer = await fetch(endpoint, {
		method: 'POST',
		headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
		body: JSON.stringify(mail),
	});
	// Resend reports a rejected message with a status, not a throw, so a 4xx here is a failure
	// the caller has to hear about rather than a silent drop.
	if (!answer.ok) throw new Error(`Resend answered ${String(answer.status)}: ${await answer.text()}`);
};

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

export default ({ config }: ModuleProps): Contact => {
	const settings = config as unknown as Settings;

	// Counted in memory, because this site is one process. A restart clears the counts, which at
	// worst lets a flood start over after a deploy, and a store for a personal contact form
	// would cost more than the thing it protects. Expired entries are pruned on every request,
	// so what is held is the addresses seen inside the window and nothing older.
	const hits = new Map<string, number[]>();

	const allowed = (address: string, now: number): boolean => {
		const since = now - settings.limit.windowMs;
		for (const [seen, times] of hits) {
			const kept = times.filter((at) => at > since);
			if (kept.length === 0) hits.delete(seen);
			else hits.set(seen, kept);
		}
		const mine = hits.get(address) ?? [];
		if (mine.length >= settings.limit.count) return false;
		mine.push(now);
		hits.set(address, mine);
		return true;
	};

	return {
		routes: {
			'POST /contact': async (request: Request, context: Visitor): Promise<Response> => {
				try {
					// A browser sends `Origin` on every POST, so a real form submission always carries
					// one and a wrong one is a page that is not this site. An absent header is allowed:
					// it means the sender is not a browser at all (curl, or a proxy that strips it), and
					// refusing there would turn away those senders without stopping a bot, which gains
					// nothing the honeypot and the rate limit do not already take from it.
					const origin = request.headers.get('origin');
					if (origin !== null && !settings.origins.includes(origin)) {
						return json(403, { ok: false, error: 'Forbidden origin' });
					}

					const address = context.address ?? 'unknown';
					if (!allowed(address, Date.now())) {
						return json(429, { ok: false, error: 'Too many requests' });
					}

					const held = await read(request, settings.maxBytes);
					if ('tooLarge' in held) return json(413, { ok: false, error: 'Body too large' });
					if ('unreadable' in held) return json(400, { ok: false, error: 'Missing required fields' });
					const { fullName, email, message, page, company } = held.body;

					// The honeypot. `company` is a field no person sees and no person fills, so anything
					// in it is a bot filling every input it found. The answer is the success response
					// exactly, so the bot learns nothing and keeps wasting its time here.
					if (company !== undefined && company !== '') return accepted();

					if (text(email) === '' || text(fullName) === '' || text(message) === '') {
						return json(400, { ok: false, error: 'Missing required fields' });
					}

					await send(settings.endpoint, {
						from: `"${text(fullName)}" <${process.env['EMAIL_FROM'] ?? ''}>`,
						to: (process.env['EMAIL_TO'] ?? '').split(',').map((one) => one.trim()),
						subject: process.env['EMAIL_SUBJECT'] ?? '',
						text: `
New message from torrin.me/${text(page)} form:

Name: ${text(fullName)}
Email: ${text(email)}

Message:
${text(message)}
`.trim(),
					});

					return accepted();
				} catch (error) {
					console.error('Error in /contact handler:', error);
					return json(500, { ok: false, error: 'Internal server error' });
				}
			},
		},
	};
};
