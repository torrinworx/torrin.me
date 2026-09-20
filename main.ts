// The whole server for torrin.me: the built site out of `dist`, the one route that takes a
// message from the contact form, the health route a deploy polls, and the logs battery. No
// users, so the gate is the site's own ten-line one; the store exists for the visits the battery
// records (its own database on the droplet, `db` in the environment), and nothing else opens a
// document.
//
// The site's own modules are named as static imports rather than found by scanning a directory.
// A scan needs the files to still be files at run time; a static import survives being bundled
// too, so what ships can be a copy of these files or a single rolled-up entry without this line
// changing.
//
// Run: node --import @aweftjs/build/loader main.ts

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { health } from '@aweftjs/health';
import { logs, paths as logPaths } from '@aweftjs/logs';
import { fromBundle } from '@aweftjs/modules';
import type { Source } from '@aweftjs/modules';
import { createServer } from '@aweftjs/server';
import { node } from '@aweftjs/server/node';
import { files } from '@aweftjs/static';
import { createStore } from '@aweftjs/store';
import { postgresDriver } from '@aweftjs/store/postgres';
import pg from 'pg';

const port = Number(process.env['PORT'] ?? 3001);

const db = process.env['db'];
if (db === undefined || db === '') {
	throw new Error('db is not set: the Postgres connection string the logs battery keeps its visits in');
}
// A few connections: the visits' writes and the hourly sweep are all that ever use them. One
// query before anything opens, because the battery's own message for an unreachable database
// is about undeclared paths, which would send whoever reads the journal the wrong way.
const pool = new pg.Pool({ connectionString: db, max: 3 });
try {
	await pool.query('SELECT 1');
} catch (error) {
	throw new Error(`db is not reachable: ${String((error as Error).message)}`);
}
const store = createStore({ driver: postgresDriver(pool), declare: { ...logPaths } });

// Beside this file, never beside the working directory. `dist` sits next to the server entry in
// every layout this runs in, and the unit is started from wherever systemd feels like.
const dir = fileURLToPath(new URL('./dist', import.meta.url));

// The id build.sh stamps on what it ships, beside this file too, so `/api/health` can prove the
// build answering is the one deploy.sh sent. A checkout has no such file and answers null.
const build = ((): string | null => {
	try {
		const stamped = JSON.parse(readFileSync(new URL('./build.json', import.meta.url), 'utf8')) as { build?: unknown };
		return typeof stamped.build === 'string' ? stamped.build : null;
	} catch {
		return null;
	}
})();

const own: Source = fromBundle({
	'./gate.ts': () => import('./modules/gate.ts'),
	'./Contact.ts': () => import('./modules/Contact.ts'),
	// Configuration for `@aweftjs/health`'s module: the build id is the whole of what this site
	// adds to the answer.
	'./health/Check.ts': { config: { info: { build } } },
	// Configuration for the logs battery's keeper: visits kept 90 days (the raw window every
	// stats table shares; stats.torrin.me's rollups keep the trend), stamped with the same build.
	'./logs/Visits.ts': { config: { keep: 90, build } },
	// Configuration for a module this site did not write, so `@aweftjs/static` is still the
	// implementation. It lives here rather than in a file of its own because `dir` is read off
	// the entry the operator runs, which is this file wherever the rest of the code ends up.
	'./static/Files.ts': {
		config: {
			dir,
			unknown: '404',
			// Pages must revalidate: with no Cache-Control at all a browser applies its own
			// heuristic freshness, which is how a visitor ends up running yesterday's page
			// against today's bundle.
			//
			// The hashed bundle and the font files are the exceptions, and both are kept
			// forever. A font under `no-cache` costs a conditional request before any text can
			// be painted in it, on every single load, so the page paints in the fallback face
			// and swaps to the real one when the answer lands. That swap is visible: 111ms of
			// fallback text on a warm cache and 314ms on a cold one, measured against the
			// droplet. Neither directory is ever edited in place, so replacing a face means
			// bumping its directory the way JetBrainsMono-2.304 already does.
			headers: {
				'': 'no-cache',
				'assets/': 'public, max-age=31536000, immutable',
				'JetBrainsMono-2.304/': 'public, max-age=31536000, immutable',
				'ibm-plex-sans/': 'public, max-age=31536000, immutable',
			},
		},
	},
});

const server = createServer({
	// This site's own modules come first, so the configuration above wins the merge; `files`
	// last, because it answers every URL it is asked.
	sources: [own, health, logs, files],
	store,
	gate: 'gate',
	listener: node({ port }),
	// The server's own Origin rule: a browser post from anywhere but the site's two names is
	// refused before any module sees it. The contact route keeps its own list beneath this one.
	origins: ['https://torrin.me', 'https://www.torrin.me'],
	handlers: {
		failed: (name, error) => { console.error(`${name} failed:`, error); },
	},
});

await server.start();
console.log(`torrin.me serving on http://localhost:${String(port)}`);

// A signal stops the server, then the store, then the pool, so the last batch is written.
const shutdown = (signal: string): void => {
	console.log(`${signal}: stopping`);
	server.stop()
		.then(() => store.stop())
		.then(() => pool.end())
		.then(() => { process.exit(0); }, (error: unknown) => { console.error('stop failed:', error); process.exit(1); });
};
process.once('SIGTERM', () => { shutdown('SIGTERM'); });
process.once('SIGINT', () => { shutdown('SIGINT'); });
