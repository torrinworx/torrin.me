// What every test here needs: a fake Resend that never leaves this machine, and the real server
// booted on a free port with one module's configuration replaced.

import { createServer as createHttp } from 'node:http';
import type { AddressInfo } from 'node:net';

import { health } from '@aweftjs/health';
import { fromBundle } from '@aweftjs/modules';
import type { Source } from '@aweftjs/modules';
import { createServer } from '@aweftjs/server';
import { node } from '@aweftjs/server/node';
import { files } from '@aweftjs/static';

// The same list main.ts ships, so a test loads the modules the deploy loads. A module added
// there has to be added here too; there are two, and neither is found by scanning a directory
// any more. The two batteries are listed below, where main.ts lists them.
const own = (): Source => fromBundle({
	'./gate.ts': () => import('../modules/gate.ts'),
	'./Contact.ts': () => import('../modules/Contact.ts'),
});

export interface Delivered {
	readonly authorization: string | null;
	readonly body: Record<string, unknown>;
}

export interface Mailbox {
	readonly url: string;
	/** Every message that reached the endpoint. Empty is the proof that nothing was sent. */
	readonly sent: Delivered[];
	/** What the endpoint answers next, so a test can make the send fail. */
	answer(status: number): void;
	stop(): Promise<void>;
}

/** An HTTP endpoint standing in for Resend, recording what it is handed. */
export const mailbox = async (): Promise<Mailbox> => {
	const sent: Delivered[] = [];
	const state = { status: 200 };

	const server = createHttp((req, res) => {
		let raw = '';
		req.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
		req.on('end', () => {
			sent.push({
				authorization: req.headers.authorization ?? null,
				body: JSON.parse(raw === '' ? '{}' : raw) as Record<string, unknown>,
			});
			res.writeHead(state.status, { 'content-type': 'application/json' });
			res.end('{"id":"test"}');
		});
	});

	await new Promise<void>((done) => { server.listen(0, '127.0.0.1', done); });
	const port = (server.address() as AddressInfo).port;

	return {
		url: `http://127.0.0.1:${String(port)}/emails`,
		sent,
		answer: (status) => { state.status = status; },
		stop: () => new Promise<void>((done, fail) => {
			server.close((error) => { error === undefined ? done() : fail(error); });
		}),
	};
};

export interface Site {
	readonly url: string;
	stop(): Promise<void>;
}

/**
 * The real server, its own modules and the two batteries, on a free port.
 *
 * Params:
 *   over: configuration per module name, merged over what the module file says, because this
 *     source is listed first
 */
export const boot = async (
	over: Readonly<Record<string, Record<string, unknown>>> = {},
	port = 0,
): Promise<Site> => {
	// A caller that needs to know its own origin before booting (the contact route refuses a post
	// from anywhere it does not list) names the port instead of taking a free one.
	const listener = node({ port, host: '127.0.0.1' });
	const bundle = Object.fromEntries(
		Object.entries(over).map(([name, config]) => [`./${name}.ts`, { config }]),
	);
	const server = createServer({
		sources: [fromBundle(bundle), own(), health, files],
		store: undefined,
		gate: 'gate',
		listener,
	});
	await server.start();
	return {
		url: `http://127.0.0.1:${String(listener.port ?? 0)}`,
		stop: () => server.stop(),
	};
};
