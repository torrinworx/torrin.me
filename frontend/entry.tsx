// What the browser runs: one router, the site taken over in place, and the anchors handed to the
// router. The same file serves the dev server, where there is no written page to take over.
//
// A post page reads its own twin first, so the hydration renders what the server rendered
// without waiting; every other page has nothing to fetch. The index of posts is in the bundle.
//
// The page's record of itself lives here and nowhere else: the logs battery hears the page's
// errors, its console, its clicks and its URL, and posts them to this origin's /api/logs. This
// half is the only one with a page to measure. The client the log wraps carries the visit's
// binding to the server and nothing else; the site has no documents to share.

import { createClient } from '@aweftjs/client';
import { createRouter } from '@aweftjs/dom/router';
import { createLog } from '@aweftjs/logs/client';
import { attach } from '@aweftjs/ssg/client';
import { h } from '@aweftjs/ui';

import { fetchBody, fetching, postAt } from './posts.ts';
import type { Body } from './posts.ts';
import { Site } from './site.tsx';
import type { Track } from './site.tsx';

// Stamped by vite.config.ts from BUILD_ID; a dev server has none.
declare const __BUILD__: string | null;

const opened = /^\/blog\/([a-z0-9-]+)\/?$/.exec(location.pathname);
const post = opened === null ? undefined : postAt(opened[1]!);
const seed: [string, Body][] = post === undefined ? [] : [[post.slug, await fetchBody(post)]];

const router = createRouter();
const socket = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
const log = createLog(createClient({ url: socket }), { build: __BUILD__, router });

// What a click reports, beside the input the battery records on its own: the label or href the
// site gave it, so a report reads "resume" and not "a[href]".
const track: Track = (event, options) => { log.write({ kind: event, ...options.props }); };

attach(document.body as never, <Site router={router} content={fetching(seed)} track={track} />);
router.links(document.body as never);
