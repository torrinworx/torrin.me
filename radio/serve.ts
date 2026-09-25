// The radio's own HTTP: the stream, what is playing, and a health answer. nginx puts
// /radio/stream and /radio/now in front of /stream and /now, and nothing else reaches this port.

import { createServer } from 'node:http';
import type { Server } from 'node:http';

import type { Station } from './station.ts';
import type { Broadcast } from './stream.ts';

export interface Radio {
	readonly port: number;
	stop(): Promise<void>;
}

export const serve = async (
	options: {
		readonly station: Station;
		readonly broadcast: Broadcast;
		readonly port?: number;
		readonly host?: string;
		/** Seconds since the epoch, as the station counts them. The wall clock by default. */
		readonly clock?: () => number;
	},
): Promise<Radio> => {
	const { station, broadcast } = options;
	const clock = options.clock ?? (() => Date.now() / 1000);
	const json = (body: unknown): [number, Record<string, string>, string] =>
		[200, { 'content-type': 'application/json', 'cache-control': 'no-store' }, JSON.stringify(body)];
	const server: Server = createServer((request, response) => {
		const url = new URL(request.url ?? '/', 'http://radio');
		if (url.pathname === '/stream' && (request.method === 'GET' || request.method === 'HEAD')) {
			response.writeHead(200, {
				'content-type': 'audio/mpeg',
				'cache-control': 'no-store',
				'icy-name': 'torrin.me radio',
			});
			if (request.method === 'HEAD') { response.end(); return; }
			response.socket?.setNoDelay(true);
			// The headers go now, not with the first frame, so a player knows it is connected.
			response.flushHeaders();
			broadcast.attach(response);
			return;
		}
		if (url.pathname === '/now' && request.method === 'GET') {
			// The server's clock and the backlog's length go with the track, so a page can place
			// the beat it hears: the time at the press, less the backlog, plus what it has played.
			const [status, headers, body] = json({ time: clock(), backlogSeconds: broadcast.backlogSeconds(), ...station.playing() });
			response.writeHead(status, headers);
			response.end(body);
			return;
		}
		if (url.pathname === '/health' && request.method === 'GET') {
			const [status, headers, body] = json({ ok: true, listeners: broadcast.listeners(), playing: station.playing(), uptime: process.uptime() });
			response.writeHead(status, headers);
			response.end(body);
			return;
		}
		response.writeHead(404, { 'content-type': 'text/plain' });
		response.end('not found');
	});
	await new Promise<void>((done) => { server.listen(options.port ?? 0, options.host ?? '127.0.0.1', done); });
	const address = server.address();
	const port = typeof address === 'object' && address !== null ? address.port : 0;
	return {
		port,
		stop: () => new Promise<void>((done, fail) => {
			server.closeAllConnections();
			server.close((error) => { error === undefined ? done() : fail(error); });
		}),
	};
};
