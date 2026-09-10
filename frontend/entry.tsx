// What the browser runs: one router, the site taken over in place, and the anchors handed to the
// router. The same file serves the dev server, where there is no written page to take over.
//
// Analytics live here and nowhere else. This half is the only one with a page to measure, which is
// what the old `is_node()` guard around the Plausible import was standing in for.

import { createRouter } from '@aweftjs/dom/router';
import { attach } from '@aweftjs/ssg/client';
import { h } from '@aweftjs/ui';
import { init, track } from '@plausible-analytics/tracker';

import { Site } from './site.tsx';

init({
	domain: 'torrin.me',
	endpoint: 'https://stats.torrin.me/api/event',
});

const router = createRouter();
attach(document.body as never, <Site router={router} track={track} />);
router.links(document.body as never);
