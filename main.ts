// The whole server for torrin.me: the built site out of `dist`, the one route that takes a
// message from the contact form, and the health route a deploy polls. No store and no users, so
// the gate is the site's own ten-line one and nothing here opens a document.
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
import { fromBundle } from '@aweftjs/modules';
import type { Source } from '@aweftjs/modules';
import { createServer } from '@aweftjs/server';
import { node } from '@aweftjs/server/node';
import { files } from '@aweftjs/static';

const port = Number(process.env['PORT'] ?? 3001);

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
	// adds to the answer, and there is no store for it to ask.
	'./health/Check.ts': { config: { info: { build } } },
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
	// This site's own modules come first, so the configuration above wins the merge.
	sources: [own, health, files],
	store: undefined,
	gate: 'gate',
	listener: node({ port }),
	handlers: {
		failed: (name, error) => { console.error(`${name} failed:`, error); },
	},
});

await server.start();
console.log(`torrin.me serving on http://localhost:${String(port)}`);
