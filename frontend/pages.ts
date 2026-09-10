// Writes every page of the site as a file, plus 404.html, shell.html and sitemap.xml.
//
// Run: npm run pages, after `vite build` has written the shell into dist/. That directory sits
// beside main.ts, which is where the server looks for it, locally and on the droplet alike.

import { readFileSync } from 'node:fs';

import { createSite } from '@aweftjs/ssg';
import { h } from '@aweftjs/ui';

import { Site } from './site.tsx';

const dist = 'dist';

const site = createSite({
	page: (router) => h(Site, { router }),
	shell: readFileSync(`${dist}/index.html`, 'utf8'),
	out: dist,
	base: 'https://torrin.me',
});

const written = await site.write();
console.log(`${String(written.urls.length)} pages, ${String(written.files.length)} files in ${dist}`);
if (written.unenumerated.length > 0) throw new Error(`acts nothing could list: ${written.unenumerated.join(', ')}`);
