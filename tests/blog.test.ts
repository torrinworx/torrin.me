// The blog's build step, on posts written for the test and on the real ones, and the pages and
// feeds the build wrote.
//
// The dist half needs `npm run build` (or `npm run content`, then
// `vite build --configLoader native && npm run pages`) first.

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { Markdown, Theme, Typography, context, h, render, slugger } from '@aweftjs/ui';
import { chromium } from 'playwright';

import {
	PostError, buildBlog, headings, inlineReferences, isDate, markNotes, markYoutube, minutesOf, readPost, readPosts, slugOf, stripInline, words, youtubeId,
} from '../content/blog.ts';
import { renderBody, summaryOf } from '../frontend/feeds.ts';
import { codeOf, dateShown, modifiersOf } from '../frontend/pages/blog.tsx';
import type { Listed } from '../frontend/posts.ts';
import { siteTheme } from '../frontend/theme.ts';
import { boot } from './boot.ts';

const repo = fileURLToPath(new URL('../', import.meta.url));
const dist = `${repo}dist/`;

/** The h1 a written page holds for a title, with the title escaped the way the render writes text. */
const h1Of = (title: string): RegExp => {
	const escaped = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	return new RegExp(`<h1[^>]*>${escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`);
};

// A one-pixel JPEG, enough for a poster the build hashes and copies.
const JPEG = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64');

const scratch = (): { content: string; data: string; public: string } => {
	const dir = mkdtempSync(join(tmpdir(), 'torrin-me-blog-'));
	const content = join(dir, 'content');
	mkdirSync(content);
	return { content, data: join(dir, 'data'), public: join(dir, 'public') };
};

const write = (dir: string, name: string, front: string, body: string): string => {
	const file = join(dir, name);
	writeFileSync(file, `---\n${front}\n---\n\n${body}\n`);
	return file;
};

const okFetch = (): Promise<Response> => Promise.resolve(new Response(JPEG, { status: 200 }));

describe('reading a post', () => {
	it('slugs the old file names: spaces and apostrophes go, case folds', () => {
		assert.equal(slugOf('Hello World.md'), 'hello-world');
		assert.equal(slugOf("don't-panic.md"), 'dont-panic');
		assert.equal(slugOf('2026-notes.md'), '2026-notes');
	});

	it('refuses a post with no front matter, no title, no date, or a date that does not parse', () => {
		const { content } = scratch();
		writeFileSync(join(content, 'bare.md'), '# No front matter\n');
		assert.throws(() => readPost(join(content, 'bare.md')), (error: unknown) => error instanceof PostError && /no front matter/.test(error.message));
		assert.throws(() => readPost(write(content, 'untitled.md', 'date: 2026-01-01\ndescription: d', 'x')), /no title/);
		assert.throws(() => readPost(write(content, 'undated.md', 'title: T\ndescription: d', 'x')), /no date/);
		assert.throws(() => readPost(write(content, 'baddate.md', 'title: T\ndescription: d\ndate: someday', 'x')), /does not parse: someday/);
	});

	it('refuses a published post with no description and lets a draft go without one', () => {
		const { content } = scratch();
		assert.throws(() => readPost(write(content, 'a.md', 'title: T\ndate: 2026-01-01', 'x')), /needs a description/);
		const draft = readPost(write(content, 'b.md', 'title: T\ndate: 2026-01-01\ndraft: true', 'x'));
		assert.equal(draft.front.draft, true);
		assert.equal(draft.front.description, '');
	});

	it('takes draft and future as YAML booleans only: yes or "true" is refused, not read either way', () => {
		const { content } = scratch();
		assert.throws(() => readPost(write(content, 'a.md', 'title: T\ndescription: d\ndate: 2026-01-01\ndraft: yes', 'x')), /a\.md: draft has to be true or false, the YAML boolean, and it is "yes"/);
		assert.throws(() => readPost(write(content, 'b.md', 'title: T\ndescription: d\ndate: 2026-01-01\ndraft: "true"', 'x')), /draft has to be true or false/);
		assert.throws(() => readPost(write(content, 'c.md', 'title: T\ndescription: d\ndate: 2026-01-01\nfuture: 1', 'x')), /future has to be true or false/);
		assert.equal(readPost(write(content, 'd.md', 'title: T\ndescription: d\ndate: 2026-01-01\ndraft: false', 'x')).front.draft, false);
	});

	it('takes a date only as a real ISO day, with or without a time and zone', () => {
		for (const good of ['2026-02-20', '2026-02-20T01:21:00-05:00', '2026-02-20T01:21Z', '2024-02-29']) assert.equal(isDate(good), true, good);
		for (const bad of ['02/20/2026', '2026-2-5', '2026-02-30', '2023-02-29', '2026-13-01', '2026-02-20T25:00Z', '2026-02-20T01:21:00', '2026-02-20 01:21', 'someday']) assert.equal(isDate(bad), false, bad);
		const { content } = scratch();
		assert.throws(() => readPost(write(content, 'a.md', 'title: T\ndescription: d\ndate: 02/20/2026', 'x')), /the date does not parse: 02\/20\/2026; write YYYY-MM-DD/);
		assert.throws(() => readPost(write(content, 'b.md', 'title: T\ndescription: d\ndate: 2026-2-5', 'x')), /does not parse: 2026-2-5/);
		assert.throws(() => readPost(write(content, 'c.md', 'title: T\ndescription: d\ndate: 2026-02-30', 'x')), /does not parse: 2026-02-30/);
		assert.throws(() => readPost(write(content, 'd.md', 'title: T\ndescription: d\ndate: 2026-02-20\nupdated: 2026-02-30', 'x')), /the updated date does not parse: 2026-02-30/);
	});

	it('refuses a published post dated after now unless it says future: true; a draft may be', () => {
		const { content } = scratch();
		assert.throws(() => readPost(write(content, 'a.md', 'title: T\ndescription: d\ndate: 2999-01-01', 'x')), /a\.md: dated 2999-01-01, which is after now; fix the date, or say future: true/);
		assert.equal(readPost(write(content, 'b.md', 'title: T\ndescription: d\ndate: 2999-01-01\nfuture: true', 'x')).front.future, true);
		assert.equal(readPost(write(content, 'c.md', 'title: T\ndescription: d\ndate: 2999-01-01\ndraft: true', 'x')).front.draft, true);
	});

	it('takes discuss only as a Hacker News thread', () => {
		const { content } = scratch();
		assert.throws(() => readPost(write(content, 'a.md', 'title: T\ndescription: d\ndate: 2026-01-01\ndiscuss: "javascript:alert(1)"', 'x')), /a\.md: discuss has to be a Hacker News thread, https:\/\/news\.ycombinator\.com\/item\?id=<number>, and it is javascript:alert\(1\)/);
		assert.throws(() => readPost(write(content, 'b.md', 'title: T\ndescription: d\ndate: 2026-01-01\ndiscuss: https://example.com/thread', 'x')), /discuss has to be a Hacker News thread/);
		assert.equal(readPost(write(content, 'c.md', 'title: T\ndescription: d\ndate: 2026-01-01\ndiscuss: https://news.ycombinator.com/item?id=42', 'x')).front.discuss, 'https://news.ycombinator.com/item?id=42');
	});

	it('reads the optional fields and drops the marks from the description', () => {
		const { content } = scratch();
		const post = readPost(write(content, 'c.md',
			'title: "A: title"\ndescription: "Runs `docker` and **more**"\ndate: 2026-01-28T23:17:00-05:00\nupdated: 2026-02-01\ndiscuss: https://news.ycombinator.com/item?id=1\nimage: Short',
			'body'));
		assert.equal(post.front.title, 'A: title');
		assert.equal(post.front.description, 'Runs docker and more');
		assert.equal(post.front.date, '2026-01-28T23:17:00-05:00');
		assert.equal(post.front.updated, '2026-02-01');
		assert.equal(post.front.discuss, 'https://news.ycombinator.com/item?id=1');
		assert.equal(post.front.image, 'Short');
		assert.equal(post.body.trim(), 'body');
	});

	it('refuses two files that would share a URL', () => {
		const { content } = scratch();
		write(content, 'Hello World.md', 'title: A\ndescription: d\ndate: 2026-01-01', 'x');
		write(content, 'hello-world.md', 'title: B\ndescription: d\ndate: 2026-01-01', 'x');
		assert.throws(() => readPosts(content), /collides with/);
	});
});

describe('the rewrites', () => {
	it('inlines reference links and drops the definitions, leaving fences alone', () => {
		const source = 'See [the paper][1] and [again][1].\n\n```\n[1]: not-a-definition\n```\n\n[1]: https://example.com/p\n[2]: https://example.com/q "title"\n';
		const out = inlineReferences(source);
		assert.ok(out.includes('[the paper](https://example.com/p) and [again](https://example.com/p)'));
		assert.ok(!out.includes('[1]: https'));
		assert.ok(!out.includes('[2]: https'));
		assert.ok(out.includes('```\n[1]: not-a-definition\n```'));
	});

	it('turns an image line with a YouTube source into a link on its own line, and nothing else', () => {
		const { markdown, ids } = markYoutube('Intro.\n\n![The demo](https://youtu.be/D2d7aqB4eHY)\n\n![A picture](/pic.png)\n\nInline ![x](https://youtu.be/D2d7aqB4eHY) stays.');
		assert.deepEqual(ids, ['D2d7aqB4eHY']);
		assert.ok(markdown.includes('\n[The demo](https://www.youtube.com/watch?v=D2d7aqB4eHY)\n'));
		assert.ok(markdown.includes('![A picture](/pic.png)'));
		assert.ok(markdown.includes('Inline ![x](https://youtu.be/D2d7aqB4eHY) stays.'));
		assert.equal(youtubeId('https://www.youtube.com/watch?v=D2d7aqB4eHY&t=4s'), 'D2d7aqB4eHY');
		assert.equal(youtubeId('https://www.youtube.com/shorts/D2d7aqB4eHY'), 'D2d7aqB4eHY');
		assert.equal(youtubeId('https://vimeo.com/123'), null);
	});

	it('lists the headings with the ids Markdown gives them, off a render, so a # line the parser folds into a list item is no heading', async () => {
		const source = '## The `theme`\n\ntext\n\n```\n## not a heading\n```\n\n- an item\n## folded into the item\n\n### The theme\n\n## The theme\n\n## A & B <c>\n';
		const found = await headings(source);
		const id = slugger();
		assert.deepEqual(found.map((heading) => heading.id), [id('The `theme`'), id('The theme'), id('The theme'), id('A & B <c>')]);
		assert.deepEqual(found.map((heading) => heading.text), ['The theme', 'The theme', 'The theme', 'A & B <c>']);
		assert.deepEqual(found.map((heading) => heading.level), [2, 3, 2, 2]);
		// Every id listed is an id the rendered page carries.
		const html = await render(h(Markdown, { source }), { context: context() });
		for (const heading of found) assert.ok(html.includes(`id="${heading.id}"`), heading.id);
		assert.ok(!html.includes('folded-into-the-item'));
	});

	it('marks a quote whose first word is Note: for the callout, and nothing else', () => {
		const marked = markNotes('> Note: read this.\n\nNote: a paragraph.\n\n> A quote.\n> Note: on its second line.\n\n- an item\n> Note: inside the list\n\nText\n> Note: after a paragraph\n\n```\n> Note: in a fence\n```\n');
		assert.ok(marked.includes('> [!NOTE] read this.\n'), 'the quote is marked');
		assert.ok(marked.includes('\nNote: a paragraph.\n'), 'the paragraph is left as written');
		assert.ok(marked.includes('> Note: on its second line.'), 'a second line of a quote is not its first word');
		assert.ok(marked.includes('> Note: inside the list'), 'a line the parser folds into a list item is no quote');
		assert.ok(marked.includes('Text\n> [!NOTE] after a paragraph'), 'a quote that ends a paragraph is a quote');
		assert.ok(marked.includes('```\n> Note: in a fence\n```'), 'a fence is left alone');
	});

	it('counts words and rounds the reading time up to a whole minute, never under one', () => {
		assert.equal(words('one two  three\n\nfour'), 4);
		assert.equal(minutesOf(0), 1);
		assert.equal(minutesOf(200), 1);
		assert.equal(minutesOf(201), 2);
		assert.equal(stripInline('a [b](c) `d` **e** *f* _g_'), 'a b d e f g');
	});

	it('shows the day the front matter names, whatever its time zone', () => {
		assert.equal(dateShown('2026-01-28T23:17:00-05:00'), 'January 28, 2026');
		assert.equal(dateShown('2025-07-15'), 'July 15, 2025');
	});

	it('takes the description and the first prose paragraph that is more than a label for the summary feed', () => {
		const source = '## Heading\n\n> a quote\n\n**`.env`**\n\n```\ncode\n```\n\nFirst paragraph, long enough to be one,\nover two lines.\n\nSecond paragraph.';
		assert.equal(summaryOf('The description.', source), 'The description.\n\nFirst paragraph, long enough to be one,\nover two lines.');
		assert.equal(summaryOf('The description.', '1) A list\n\n**`docker-compose.yml`**\n\n- another'), 'The description.');
	});
});

describe('the build', () => {
	it('publishes a post: media hashed, sources rewritten, the poster fetched once, tokens stored, the draft left out', async () => {
		const where = scratch();
		mkdirSync(join(where.content, 'first'));
		writeFileSync(join(where.content, 'first', 'pic.png'), Buffer.from('not really a png'));
		write(where.content, 'first.md', 'title: First\ndescription: One\ndate: 2026-02-01',
			'Intro [ref][1].\n\n![A caption](pic.png)\n\n![Demo](https://youtu.be/D2d7aqB4eHY)\n\n## Section\n\n```bash\necho "$HOME"\n```\n\n[1]: https://example.com\n');
		write(where.content, 'second.md', 'title: Second\ndescription: Two\ndate: 2026-01-01\ndraft: true', 'Has ![gone](missing.png) in it.\n');
		let fetched = 0;
		const built = await buildBlog({ ...where, cards: false, fetch: ((url: string) => { fetched += 1; assert.equal(url, 'https://i.ytimg.com/vi/D2d7aqB4eHY/hqdefault.jpg'); return okFetch(); }) as unknown as typeof fetch });

		assert.deepEqual(built.posts.map((post) => [post.slug, post.draft]), [['first', false], ['second', true]]);
		assert.deepEqual(built.warnings.length, 1);
		assert.match(built.warnings[0]!, /second\.md: the image missing\.png is not at/);

		const first = built.posts[0]!;
		assert.equal(first.code, true);
		assert.equal(first.minutes, 1);
		assert.deepEqual(first.headings, [{ level: 2, text: 'Section', id: 'section' }]);
		assert.equal(first.og, null);
		const poster = first.posters['D2d7aqB4eHY'];
		assert.ok(poster !== undefined && /^\/media\/first\/youtube-D2d7aqB4eHY\.[0-9a-f]{8}\.jpg$/.test(poster), `the poster is under media: ${String(poster)}`);
		assert.ok(existsSync(join(where.public, poster)), 'and the file is there');
		assert.ok(existsSync(join(where.content, 'first', 'youtube-D2d7aqB4eHY.jpg')), 'and kept beside the post as a source');
		assert.equal(fetched, 1);

		const twin = readFileSync(join(where.public, 'blog', 'first.md'), 'utf8');
		assert.ok(twin.includes('Intro [ref](https://example.com).'), 'the reference is inline');
		assert.ok(!twin.includes('[1]: https'), 'and its definition gone');
		assert.match(twin, /\n\[A caption\]\(\/media\/first\/pic\.[0-9a-f]{8}\.png\)\n/, 'the image is a link to its hashed copy, for the viewer');
		assert.ok(twin.includes('\n[Demo](https://www.youtube.com/watch?v=D2d7aqB4eHY)\n'), 'the video is the marker');
		const media = twin.match(/\/media\/first\/pic\.[0-9a-f]{8}\.png/)![0];
		assert.ok(existsSync(join(where.public, media)));

		const tokens = JSON.parse(readFileSync(join(where.public, 'blog', 'first.tokens.json'), 'utf8')) as { language: string; lines: string[][][] }[];
		assert.equal(tokens[0]!.language, 'bash');
		assert.ok(tokens[0]!.lines[0]!.some((token) => token[1] === 'variable'), 'a token is kinded');

		const index = JSON.parse(readFileSync(join(where.data, 'posts.json'), 'utf8')) as { slug: string }[];
		assert.deepEqual(index.map((post) => post.slug), ['first']);
		assert.ok(!existsSync(join(where.public, 'blog', 'second.md')), 'a draft has no twin');

		// A second run fetches nothing: the poster is beside the post now.
		fetched = 0;
		await buildBlog({ ...where, cards: false, fetch: (() => { fetched += 1; return okFetch(); }) as unknown as typeof fetch });
		assert.equal(fetched, 0);
	});

	it('fails a published post whose image is missing, naming it', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](nope.png)\n');
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: the image nope\.png is not at/);
	});

	it('fails a published post whose poster cannot be fetched, with the reason', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](https://youtu.be/D2d7aqB4eHY)\n');
		const refused = (() => Promise.resolve(new Response('', { status: 404 }))) as typeof fetch;
		await assert.rejects(buildBlog({ ...where, cards: false, fetch: refused }), /poster for YouTube video D2d7aqB4eHY answered 404/);
		const down = (() => Promise.reject(new Error('ENOTFOUND i.ytimg.com'))) as typeof fetch;
		await assert.rejects(buildBlog({ ...where, cards: false, fetch: down }), /could not be fetched .*ENOTFOUND/);
	});

	it('refuses an image whose path climbs out of the post\'s folder, draft or not', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](../../../etc/hostname)\n');
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: the image \.\.\/\.\.\/\.\.\/etc\/hostname reaches outside the post's folder/);
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01\ndraft: true', '![x](/../b/pic.png)\n');
		await assert.rejects(buildBlog({ ...where, cards: false }), /reaches outside the post's folder/);
	});

	it('refuses a published post that links a draft or no post; a draft\'s links go unchecked', async () => {
		const where = scratch();
		write(where.content, 'live.md', 'title: L\ndescription: d\ndate: 2026-01-01', 'See [the other](/blog/other) and [the index](/blog).\n');
		write(where.content, 'other.md', 'title: O\ndescription: d\ndate: 2026-01-02\ndraft: true', 'Links [nowhere](/blog/nowhere) and [live](/blog/live).\n');
		await assert.rejects(buildBlog({ ...where, cards: false }), /live\.md: links \/blog\/other, which is a draft: publish it first, or drop the link/);
		write(where.content, 'live.md', 'title: L\ndescription: d\ndate: 2026-01-01', 'See [nothing](/blog/nowhere#top).\n');
		await assert.rejects(buildBlog({ ...where, cards: false }), /live\.md: links \/blog\/nowhere, which is no post/);
		write(where.content, 'live.md', 'title: L\ndescription: d\ndate: 2026-01-01', 'See [me](/blog/live), [the index](/blog) and the span `[x](/blog/nowhere)`.\n');
		const built = await buildBlog({ ...where, cards: false });
		assert.deepEqual(built.warnings, []);
	});

	it('refuses a published post whose image line would show as text, and warns for a draft', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](my pic.png)\n');
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: the image line !\[x\]\(my pic\.png\) would show as text, not a figure: one image alone on its line, no space in its source, and a size as =WxH with two numbers/);
		mkdirSync(join(where.content, 'a'));
		writeFileSync(join(where.content, 'a', 'pic.png'), Buffer.from('not really a png'));
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](pic.png =800xauto)\n');
		await assert.rejects(buildBlog({ ...where, cards: false }), /the image line !\[x\]\(pic\.png =800xauto\) would show as text/);
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01\ndraft: true', '![x](pic.png =800xauto)\n');
		const built = await buildBlog({ ...where, cards: false });
		assert.equal(built.warnings.length, 1);
		assert.match(built.warnings[0]!, /a\.md: the image line .* would show as text/);
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](pic.png "a title" =800x600)\n\nA sentence with ![x](my pic.png) inside is text as written.\n');
		assert.deepEqual((await buildBlog({ ...where, cards: false })).warnings, []);
	});

	it('lists in the index the headings the page has: a # line folded into a list item is none', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '## One\n\n- an item\n## folded\n\n## Two\n');
		const built = await buildBlog({ ...where, cards: false });
		assert.deepEqual(built.posts[0]!.headings.map((heading) => heading.id), ['one', 'two']);
	});

	it('renders the built twin: a callout from a quote only, and a fence named constructor as plain code', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '> Note: read this.\n\nNote: a paragraph.\n\n```constructor\nx = 1\n```\n');
		const built = await buildBlog({ ...where, cards: false });
		const post = built.posts[0]! as unknown as Listed;
		const fences = built.fences.get('a')!;
		assert.deepEqual(fences[0]!.lines, [[['x = 1']]], 'a fence shiki has no grammar for is one plain token per line');
		const html = (await render(
			h(Theme, { value: siteTheme }, h(Markdown, { source: built.twins.get('a')!, code: codeOf(fences), modifiers: modifiersOf(post) })),
			{ context: context() },
		)).replace(/<!--[^>]*-->/g, '');
		assert.match(html, /<blockquote[^>]*><p[^>]*><strong[^>]*data-callout[^>]*>Note<\/strong> read this\./);
		assert.match(html, /<p[^>]*>Note: a paragraph\.<\/p>/, 'the paragraph keeps its first word');
		assert.equal((html.match(/data-callout/g) ?? []).length, 1);
		assert.match(html, /<pre[^>]*data-language="constructor"[^>]*><code[^>]*>x = 1<\/code><\/pre>/);
	});

	const PIPELINE = 'caption: How it goes\nlanes:\n  - label: Upload\n    steps:\n      - kind: files\n        items: [a.pdf]\n      - kind: database\n        name: Store\n        line: kept\n';

	it('writes a scene\'s checked data beside the post, with the tokens, and leaves its YAML out of the reading time', async () => {
		const where = scratch();
		const prose = Array.from({ length: 190 }, () => 'word').join(' ');
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', `${prose}\n\n\`\`\`scene:pipeline\n${PIPELINE}\`\`\`\n\n\`\`\`bash\necho hi\n\`\`\`\n`);
		const built = await buildBlog({ ...where, cards: false });
		const post = built.posts[0]!;
		assert.equal(post.words, 190 + 4, 'the prose and the code fence, and not the scene');
		assert.equal(post.minutes, 1, 'the scene\'s YAML would take it over 200 words and two minutes');
		assert.equal(post.scenes, 1);
		const tokens = JSON.parse(readFileSync(join(where.public, 'blog', 'a.tokens.json'), 'utf8')) as { language: string; scene?: { name: string; data: { lanes: { steps: { name?: string; items?: string[] }[] }[]; frame: string; words: string[] } } }[];
		const scene = tokens.find((fence) => fence.language === 'scene:pipeline')?.scene;
		assert.equal(scene?.name, 'pipeline');
		assert.deepEqual(scene?.data.lanes[0]!.steps.map((step) => step.name ?? step.items), [['a.pdf'], 'Store']);
		assert.deepEqual(scene?.data.words, ['Upload', 'a.pdf', 'Store', 'kept'], 'the words a feed lists, in reading order');
		assert.ok(tokens.some((fence) => fence.language === 'bash' && fence.scene === undefined), 'a code fence still gets its tokens');
	});

	it('writes each scene\'s still frame for the feeds, and the feed shows it with the scene\'s words as a list', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', `Text.\n\n\`\`\`scene:pipeline\n${PIPELINE}\`\`\`\n`);
		const built = await buildBlog({ ...where, cards: false });
		const scene = built.fences.get('a')!.find((fence) => fence.scene !== undefined)!.scene!;
		assert.match(scene.data.frame ?? '', /^\/media\/a\/scene-1\.[0-9a-f]{8}\.png$/);
		const png = readFileSync(join(where.public, scene.data.frame!));
		assert.deepEqual([...png.subarray(1, 4)], [...Buffer.from('PNG')], 'the frame is a PNG');
		assert.ok(png.readUInt32BE(16) >= 240 * 3, 'drawn three times its pixel size');
		const html = await renderBody(built.posts[0]! as unknown as Listed, built.twins.get('a')!, built.fences.get('a')!);
		assert.match(html, /<img src="https:\/\/torrin\.me\/media\/a\/scene-1\.[0-9a-f]{8}\.png" alt="How it goes"/);
		assert.match(html, /<li[^>]*>a\.pdf<\/li>/);
		assert.ok(!html.includes('<canvas'), 'no canvas in a feed');
	});

	it('refuses a published post\'s scene that does not check, naming the line in the file; a draft\'s is a warning', async () => {
		const where = scratch();
		// The front matter is lines 1 to 5, the blank line 6, the paragraph 7, the fence opens on 9.
		const bad = (yaml: string, draft = false): string => write(where.content, 'a.md', `title: A\ndescription: d\ndate: 2026-01-01${draft ? '\ndraft: true' : ''}`, `First paragraph.\n\n\`\`\`scene:pipeline\n${yaml}\`\`\`\n`);
		bad(PIPELINE.replace('line: kept', 'lin: kept'));
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: line 18: scene:pipeline: lane 1, step 2: there is no field "lin"; the fields are kind, name, line, badge, text, shows, reach, items/);
		bad(PIPELINE.replace('caption: How it goes', 'caption: ""'));
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: line 10: scene:pipeline: caption is empty/);
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', 'Text.\n\n```scene:maze\ncaption: x\n```\n');
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: line 9: scene:maze: there is no scene called "maze"; the scenes are pipeline, cluster, fanout, toggle, match, numbers, schedule/);
		bad(PIPELINE.replace('line: kept', `line: kept\n${'      - kind: cloud\n        name: x\n'.repeat(4)}`));
		await assert.rejects(buildBlog({ ...where, cards: false }), /line 13: scene:pipeline: lane 1: steps holds 6 steps, and it holds 1 to 5/);
		bad(PIPELINE.replace('kind: database', 'kind: datbase'));
		await assert.rejects(buildBlog({ ...where, cards: false }), /line 16: scene:pipeline: lane 1, step 2: kind is "datbase", and it is one of files, model, database/);
		bad(PIPELINE.replace('line: kept', 'lin: kept'), true);
		const built = await buildBlog({ ...where, cards: false });
		assert.equal(built.warnings.length, 1);
		assert.match(built.warnings[0]!, /a\.md: line 19: scene:pipeline: lane 1, step 2: there is no field "lin"/);
	});

	it('refuses a fanout whose map is no cluster in the post, and a term the post never says, at the fence', async () => {
		const where = scratch();
		const cluster = 'caption: c\nid: meanings\nregions:\n  - name: A\n    snippets: [one]\n  - name: B\n    snippets: [two]\nsearches:\n  - words: w\n    at: [A]\n';
		const fanout = (map: string, at = 'A'): string => `caption: f\nmap: ${map}\nfrom:\n  name: ask\ninto:\n  - name: x\n    at: [${at}]\n  - name: y\n    at: [B]\n`;
		const post = (body: string): string => write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', body);
		post(`The words.\n\n\`\`\`scene:cluster\n${cluster}\`\`\`\n\n\`\`\`scene:fanout\n${fanout('meaning')}\`\`\`\n`);
		await assert.rejects(buildBlog({ ...where, cards: false }), /line 22: scene:fanout: map names "meaning", which is the id of no cluster in this post/);
		post(`The words.\n\n\`\`\`scene:cluster\n${cluster}\`\`\`\n\n\`\`\`scene:fanout\n${fanout('meanings', 'C')}\`\`\`\n`);
		await assert.rejects(buildBlog({ ...where, cards: false }), /scene:fanout: a branch lands at "C", which is no region of the map "meanings"; its regions are A, B/);
		post(`The words.\n\n\`\`\`scene:cluster\n${cluster.replace('id: meanings', 'terms:\n  - text: the wordz\n    as: found')}\`\`\`\n`);
		await assert.rejects(buildBlog({ ...where, cards: false }), /line 9: scene:cluster: term "the wordz" is not in the post's own words/);
		post(`The words.\n\n\`\`\`scene:cluster\n${cluster.replace('id: meanings', 'terms:\n  - text: The words\n    as: found')}\`\`\`\n\n\`\`\`scene:fanout\n${fanout('meanings').replace('caption: f', 'caption: f\nterms:\n  - text: words\n    as: search')}\`\`\`\n`);
		await assert.rejects(buildBlog({ ...where, cards: false }), /map names "meanings", which is the id of no cluster/, 'a cluster with no id is no map');
		post(`The words.\n\n\`\`\`scene:cluster\n${cluster.replace('caption: c', 'caption: c\nterms:\n  - text: The words\n    as: found')}\`\`\`\n\n\`\`\`scene:fanout\n${fanout('meanings')}\`\`\`\n`);
		const built = await buildBlog({ ...where, cards: false });
		assert.deepEqual(built.posts[0]!.terms, [{ text: 'The words', as: 'found' }]);
		const fanoutScene = built.fences.get('a')!.find((fence) => fence.scene?.name === 'fanout')!.scene!;
		assert.deepEqual(fanoutScene.name === 'fanout' ? fanoutScene.data.regions : null, [{ name: 'A', snippets: ['one'] }, { name: 'B', snippets: ['two'] }], 'the fanout carries its map\'s regions');
		post(`The words.\n\n\`\`\`scene:cluster\n${cluster}\`\`\`\n\n\`\`\`scene:cluster\n${cluster.replace('snippets: [one]', 'snippets: [three]')}\`\`\`\n`);
		await assert.rejects(buildBlog({ ...where, cards: false }), /line 9: scene:cluster: id "meanings" names another cluster in this post too/);
	});

	it('refuses a figure a scene shows that the post never states, unless the scene says it is an example, and a term or a figure only in a link or in code', async () => {
		const where = scratch();
		const numbers = 'caption: Clicks\nfigures:\n  - label: clicks\n    from: under 1,000\n    to: 52,100\n';
		const deploy = 'caption: A deploy\nkind: deploy\nfirst: Every page\nsecond: Changed pages\nstore: Storage\npages: "48"\nchanged: "5"\n';
		const post = (prose: string, fence: string, yaml: string): Promise<unknown> => {
			write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', `${prose}\n\n\`\`\`scene:${fence}\n${yaml}\`\`\`\n`);
			return buildBlog({ ...where, cards: false });
		};
		await post('Clicks grew from under 1000 to 52,100.', 'numbers', numbers);
		await assert.rejects(post('Clicks grew from under 1,000 to 52,000.', 'numbers', numbers), /line 9: scene:numbers: the figure 52,100 is not in the post's own words/);
		await assert.rejects(post('A deploy uploads only the pages that changed.', 'toggle', deploy), /scene:toggle: the figure 48 is not in the post's own words, and a scene shows only figures the post states; a scene that invents one says so in example/);
		await post('A deploy uploads only the pages that changed.', 'toggle', deploy.replace('caption: A deploy', 'caption: A deploy\nexample: "Example: 48 pages, 5 changed"'));
		await assert.rejects(post('Clicks grew [a lot](https://example.com/52100) from under `1,000`.', 'numbers', numbers.replace('52,100', '52100')), /the figure 1,000 is not in the post's own words/);
		const pipeline = 'caption: c\nterms:\n  - text: query expansion\n    as: search\nlanes:\n  - steps:\n      - kind: files\n        items: [a.pdf]\n';
		await post('It uses query expansion.', 'pipeline', pipeline);
		await assert.rejects(post('It uses [this](https://example.com/query expansion).', 'pipeline', pipeline), /term "query expansion" is not in the post's own words, and a term marks the post's own words; a link's target and code do not count/);
		await assert.rejects(post('It uses `query expansion`.', 'pipeline', pipeline), /term "query expansion" is not in the post's own words/);
	});

	it('gives two scenes with the same words a stage each', async () => {
		const where = scratch();
		const numbers = 'caption: Commits\nfigures:\n  - label: of the commits\n    value: 56%\n';
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', `I made 56% of the commits.\n\n\`\`\`scene:numbers\n${numbers}\`\`\`\n\nAgain.\n\n\`\`\`scene:numbers\n${numbers}\`\`\`\n`);
		const built = await buildBlog({ ...where, cards: false });
		const html = await render(
			h(Theme, { value: siteTheme }, h(Markdown, { source: built.twins.get('a')!, code: codeOf(built.fences.get('a')!), modifiers: modifiersOf(built.posts[0]! as unknown as Listed) })),
			{ context: context() },
		);
		const ids = [...html.matchAll(/id="(scene-[^"]+)"/g)].map((found) => found[1]);
		assert.equal(ids.length, 2);
		assert.notEqual(ids[0], ids[1]);
	});
});

describe('a gallery', () => {
	const GALLERY = 'caption: The stage and a slide\nimages:\n  - file: stage.jpg\n    alt: The founder on stage\n  - file: slide.jpg\n    alt: "One orchard in 2025, 13 in 2026"\n';
	const post = (where: ReturnType<typeof scratch>, front = '', gallery = GALLERY, files = ['stage.jpg', 'slide.jpg']): void => {
		mkdirSync(join(where.content, 'a'), { recursive: true });
		for (const file of files) writeFileSync(join(where.content, 'a', file), Buffer.from(`not really ${file}`));
		write(where.content, 'a.md', `title: A\ndescription: d\ndate: 2026-01-01${front}`, `Text.\n\n\`\`\`gallery\n${gallery}\`\`\`\n`);
	};

	it('publishes each image under its hash, writes where it went beside the post, and leaves the YAML out of the reading time', async () => {
		const where = scratch();
		post(where);
		const built = await buildBlog({ ...where, cards: false });
		assert.deepEqual(built.warnings, []);
		assert.equal(built.posts[0]!.words, 1, 'the paragraph alone');
		const gallery = built.fences.get('a')!.find((fence) => fence.gallery !== undefined)?.gallery;
		assert.equal(gallery?.caption, 'The stage and a slide');
		assert.deepEqual(gallery?.images.map((image) => image.alt), ['The founder on stage', 'One orchard in 2025, 13 in 2026']);
		for (const image of gallery!.images) {
			assert.match(image.src ?? '', new RegExp(`^/media/a/${image.file.replace('.jpg', '')}\\.[0-9a-f]{8}\\.jpg$`));
			assert.ok(existsSync(join(where.public, image.src!)), `${image.file} is published`);
		}
		const tokens = JSON.parse(readFileSync(join(where.public, 'blog', 'a.tokens.json'), 'utf8')) as { language: string; gallery?: unknown }[];
		assert.ok(tokens.some((fence) => fence.language === 'gallery' && fence.gallery !== undefined), 'the browser gets it too');
	});

	it('renders the photos as a grid of links to each whole photo, each with its alt text, and in a feed as plain images', async () => {
		const where = scratch();
		post(where);
		const built = await buildBlog({ ...where, cards: false });
		const fences = built.fences.get('a')!, src = fences.find((fence) => fence.gallery !== undefined)!.gallery!.images.map((image) => image.src!);
		const html = (await render(
			h(Theme, { value: siteTheme }, h(Markdown, { source: built.twins.get('a')!, code: codeOf(fences), modifiers: modifiersOf(built.posts[0]! as unknown as Listed) })),
			{ context: context() },
		)).replace(/<!--[^>]*-->/g, '');
		assert.match(html, /<figure[^>]*data-gallery[ >]/);
		assert.match(html, new RegExp(`<a[^>]*href="${src[0]!}"[^>]*><img[^>]*src="${src[0]!}"[^>]*alt="The founder on stage"`));
		assert.match(html, new RegExp(`<a[^>]*href="${src[1]!}"[^>]*><img[^>]*src="${src[1]!}"[^>]*alt="One orchard in 2025, 13 in 2026"`));
		assert.match(html, /<figcaption[^>]*>.*The stage and a slide/);
		assert.ok(!html.includes('stage.jpg'), 'no YAML shows as code');
		const feed = await renderBody(built.posts[0]! as unknown as Listed, built.twins.get('a')!, fences);
		assert.match(feed, new RegExp(`<img src="https://torrin\\.me${src[0]!}" alt="The founder on stage"`));
		assert.match(feed, new RegExp(`<img src="https://torrin\\.me${src[1]!}" alt="One orchard in 2025, 13 in 2026"`));
		assert.ok(!feed.includes('<a '), 'nothing to click in a feed');
	});

	it('fails a published post whose gallery image is missing, naming it; a draft\'s is a warning', async () => {
		const where = scratch();
		post(where, '', GALLERY, ['stage.jpg']);
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: the image slide\.jpg is not at/);
		post(where, '\ndraft: true', GALLERY, ['stage.jpg']);
		const built = await buildBlog({ ...where, cards: false });
		assert.equal(built.warnings.length, 1);
		assert.match(built.warnings[0]!, /a\.md: the image slide\.jpg is not at/);
	});

	it('refuses a gallery image whose path climbs out of the post\'s folder, draft or not', async () => {
		const where = scratch();
		const climbing = GALLERY.replace('file: slide.jpg', 'file: ../../etc/hostname');
		post(where, '', climbing);
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: the image \.\.\/\.\.\/etc\/hostname reaches outside the post's folder/);
		post(where, '\ndraft: true', climbing);
		await assert.rejects(buildBlog({ ...where, cards: false }), /reaches outside the post's folder/);
	});

	it('refuses a gallery that does not check, naming the line in the file', async () => {
		const where = scratch();
		// The front matter is lines 1 to 5, the blank line 6, the paragraph 7, the fence opens on 9.
		post(where, '', 'images:\n  - file: stage.jpg\n    alt: The founder on stage\n');
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: line 10: gallery: images holds 1 image, and it holds 2 to 8/);
		post(where, '', GALLERY.replace('alt: The founder on stage', 'alt: ""'));
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: line 13: gallery: image 1: alt is empty/);
		post(where, '', GALLERY.replace('file: stage.jpg', 'file: https://example.com/stage.jpg'));
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: line 12: gallery: image 1: file is a file in the post's folder, not a URL/);
	});
});

describe('a photo', () => {
	it('is a link to its whole file the viewer opens, at its own size when the post gives one, and a plain image in a feed', async () => {
		const where = scratch();
		mkdirSync(join(where.content, 'a'));
		writeFileSync(join(where.content, 'a', 'wide.jpg'), Buffer.from('not really a jpeg'));
		writeFileSync(join(where.content, 'a', 'pin.jpg'), Buffer.from('not really a pin'));
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', 'Text.\n\n![The stage](wide.jpg)\n\n![The pin](pin.jpg =360x289)\n');
		const built = await buildBlog({ ...where, cards: false });
		const twin = built.twins.get('a')!, post = built.posts[0]! as unknown as Listed;
		assert.match(twin, /\n\[The pin\]\(\/media\/a\/pin\.[0-9a-f]{8}\.jpg#360x289\)\n/, 'the size rides on the link');
		const html = (await render(h(Theme, { value: siteTheme }, h(Markdown, { source: twin, modifiers: modifiersOf(post) })), { context: context() })).replace(/<!--[^>]*-->/g, '');
		const wide = /<a[^>]*href="(\/media\/a\/wide\.[0-9a-f]{8}\.jpg)"[^>]*>(<img[^>]*>)<\/a>/.exec(html), pin = /<a[^>]*href="(\/media\/a\/pin\.[0-9a-f]{8}\.jpg)"[^>]*>(<img[^>]*>)<\/a>/.exec(html);
		assert.ok(wide !== null && pin !== null, `each photo is a link to its file: ${html}`);
		for (const found of [wide, pin]) {
			assert.match(found[0], /data-no-route/, 'which the router leaves to the browser');
			assert.ok(found[2]!.includes(`src="${found[1]!}"`));
		}
		assert.ok(!/width=/.test(wide[2]!) && !/style=/.test(wide[2]!), 'a photo with no size fills the column');
		assert.match(pin[2]!, /width="360"/);
		assert.match(pin[2]!, /style="width: ?360px;?"/, 'one with a size is that wide');
		assert.match(html, /The stage<\/span>/, 'its alt text under it');
		const feed = await renderBody(post, twin, []);
		assert.match(feed, /<img src="https:\/\/torrin\.me\/media\/a\/wide\.[0-9a-f]{8}\.jpg" alt="The stage">/);
		assert.ok(!feed.includes('<a '), 'nothing to click in a feed');
	});
});

describe('an animated heading', () => {
	const BODY = 'Intro.\n\n## Atoms {animate: atoms}\n\nText.\n\n### Bits and bytes {animate: bits}\n\nMore.\n\n```md\n## In code {animate: nothing}\n```\n';

	it('is the heading with its own text and id in the twin and the contents, and the index says how it plays', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', BODY);
		const built = await buildBlog({ ...where, cards: false });
		assert.deepEqual(built.warnings, []);
		const post = built.posts[0]!;
		assert.deepEqual(post.headings, [{ level: 2, text: 'Atoms', id: 'atoms' }, { level: 3, text: 'Bits and bytes', id: 'bits-and-bytes' }]);
		assert.deepEqual(post.animated, [{ text: 'Atoms', style: 'atoms' }, { text: 'Bits and bytes', style: 'bits' }]);
		const twin = built.twins.get('a')!;
		assert.ok(twin.includes('\n## Atoms\n') && twin.includes('\n### Bits and bytes\n'), 'the marker is gone from the twin');
		assert.ok(twin.includes('## In code {animate: nothing}'), 'and a fence is left as written');
	});

	it('refuses a name that is no animation in a published post, and warns for a draft', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '## Atoms {animate: atom}\n');
		await assert.rejects(buildBlog({ ...where, cards: false }), /a\.md: a heading animates as "atom", which is no animation; the animations are atoms, qubits, bits/);
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01\ndraft: true', '## Atoms {animate: atom}\n');
		assert.match((await buildBlog({ ...where, cards: false })).warnings[0]!, /a\.md: a heading animates as "atom"/);
	});

	it('renders as the same heading with its words once, the box its emblem stands in and a canvas, and as a plain heading in a feed', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', BODY);
		const built = await buildBlog({ ...where, cards: false });
		const post = built.posts[0]! as unknown as Listed, twin = built.twins.get('a')!;
		const html = (await render(h(Theme, { value: siteTheme }, h(Markdown, { source: twin, modifiers: modifiersOf(post) })), { context: context() })).replace(/<!--[^>]*-->/g, '');
		const atoms = /<h2 id="atoms"[^>]*>(.*?)<\/h2>/.exec(html)?.[1] ?? '';
		assert.match(atoms, /data-animated="atoms"/);
		assert.match(atoms, /<span[^>]*>Atoms<\/span>/, 'its words, as text');
		assert.match(atoms, /<canvas[^>]*aria-hidden="true"/, 'and a canvas hidden from a screen reader');
		assert.match(atoms, /<span[^>]*data-mark[^>]*><\/span>/, 'beside the empty box its emblem is painted over');
		assert.equal(atoms.match(/Atoms/g)?.length, 1, 'the words once');
		assert.match(html, /<h3 id="bits-and-bytes"[^>]*><span[^>]*data-animated="bits"/);
		const feed = await renderBody(post, twin, []);
		assert.match(feed, /<h2 id="atoms"[^>]*>Atoms<\/h2>/);
		assert.ok(!feed.includes('data-animated'), 'a feed has the plain heading');
	});
});

describe('the posts in content/blog', () => {
	it('every one parses, and every image a published post names is there', async () => {
		const where = scratch();
		const built = await buildBlog({ content: `${repo}content/blog`, data: where.data, public: where.public, cards: false });
		assert.equal(built.posts.length, 12, 'the twelve published posts');
		const published = built.posts.filter((post) => !post.draft);
		assert.deepEqual(published.map((post) => post.slug).sort(), ['aweft-for-agents', 'builderloo-rebrand', 'builderloo-with-claude-code', 'equator-ai-proposal-writer', 'harvest-to-kimai', 'jev-commit-rules', 'kik-v-rim', 'kimai-setup', 'nrth-day-one', 'techtoberfest-2026-day-one', 'techtoberfest-2026-day-two', 'when-to-open-source']);
		assert.deepEqual(built.warnings, []);
	});
});

describe('what the modifiers render', () => {
	const post: Listed = {
		slug: 'p', title: 'P', description: '', date: '2026-01-01', words: 1, minutes: 1, headings: [], og: null, code: false, scenes: 0, terms: [], animated: [],
		posters: { D2d7aqB4eHY: '/media/p/youtube-D2d7aqB4eHY.abcdef12.jpg' },
	};
	// The render's own markers between nodes are dropped, so a pattern reads the elements alone.
	const markup = async (source: string, feed = false): Promise<string> =>
		(await render(h(Theme, { value: siteTheme }, h(Markdown, { source, modifiers: modifiersOf(post, feed) })), { context: context() }))
			.replace(/<!--[^>]*-->/g, '');

	it('a video is its poster in a button, and no frame until the click', async () => {
		const html = await markup('[Demo](https://www.youtube.com/watch?v=D2d7aqB4eHY)');
		assert.match(html, /<button[^>]*aria-label="Play video: Demo"/);
		assert.ok(html.includes('src="/media/p/youtube-D2d7aqB4eHY.abcdef12.jpg"'), 'the poster is the site\'s own file');
		assert.ok(!html.includes('<iframe'), 'nothing from YouTube is on the page');
		assert.ok(!html.includes('youtube.com'), 'not even a link to it');
	});

	it('a video in a feed is a link to YouTube around the poster', async () => {
		const html = await markup('[Demo](https://www.youtube.com/watch?v=D2d7aqB4eHY)', true);
		assert.match(html, /<a href="https:\/\/www\.youtube\.com\/watch\?v=D2d7aqB4eHY"><img src="\/media\/p\/youtube-D2d7aqB4eHY\.abcdef12\.jpg"/);
		assert.ok(!html.includes('<button'));
	});

	it('a video link inside a sentence, or with no poster, is a link', async () => {
		const html = await markup('Watch [Demo](https://www.youtube.com/watch?v=D2d7aqB4eHY) now.\n\n[Other](https://www.youtube.com/watch?v=AAAAAAAAAAA)');
		assert.ok(!html.includes('<button'));
		assert.ok(html.includes('href="https://www.youtube.com/watch?v=D2d7aqB4eHY"'));
		assert.ok(html.includes('href="https://www.youtube.com/watch?v=AAAAAAAAAAA"'));
	});

	it('superscript, with a link inside it, and the callout label', async () => {
		const html = await markup('Fact.^[Source](https://example.com/s)^ And 2^10^.\n\n> Note: read this.\n\n> Just a quote.');
		assert.match(html, /<sup[^>]*><a[^>]*href="https:\/\/example\.com\/s"[^>]*>Source<\/a><\/sup>/);
		assert.match(html, /<sup[^>]*>10<\/sup>/);
		assert.match(html, /<blockquote[^>]*><p[^>]*>Note: read this\./, 'the word alone is no callout: the build marks a quote for one');
		assert.equal((html.match(/data-callout/g) ?? []).length, 0);
	});

	it('the h1 pattern the page test reads with matches a title the render escapes', async () => {
		const html = await render(h(Typography, { type: 'h1', label: 'A & B <c>' }), { context: context() });
		assert.match(html, h1Of('A & B <c>'));
		assert.doesNotMatch(html, h1Of('A & B'));
	});
});

describe('the pages and feeds the build wrote', () => {
	const posts = (): Listed[] => JSON.parse(readFileSync(`${repo}frontend/data/posts.json`, 'utf8')) as Listed[];

	it('an index page, a page per published post, and the twins beside them', () => {
		assert.ok(existsSync(`${dist}blog/index.html`), 'run the build before this suite');
		for (const post of posts()) {
			assert.ok(existsSync(`${dist}blog/${post.slug}/index.html`), `${post.slug} has a page`);
			assert.ok(existsSync(`${dist}blog/${post.slug}.md`), `${post.slug} has a twin`);
			assert.equal(existsSync(`${dist}blog/${post.slug}.tokens.json`), post.code, `${post.slug} has tokens when it has code`);
			assert.ok(post.og !== null && existsSync(`${dist}${post.og}`), `${post.slug} has its card`);
		}
	});

	it('the post page holds the title as its h1 and the body the twin holds', () => {
		const newest = posts()[0]!;
		const html = readFileSync(`${dist}blog/${newest.slug}/index.html`, 'utf8');
		assert.match(html, h1Of(newest.title));
		assert.ok(html.includes('data-aweft-ssg'), 'written by the ssg');
	});

	it('a post with scenes holds every word of every scene in the page the server wrote, and the feed holds each one\'s still frame', () => {
		const escape = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
		const unmark = (html: string): string => html.replace(/<!--[\s\S]*?-->/g, '').replace(/&#x27;|&#39;|&apos;/g, '\'').replace(/&quot;/g, '"');
		const feed = unmark(readFileSync(`${dist}feed.xml`, 'utf8'));
		for (const post of posts().filter((listed) => (listed as Listed).scenes > 0)) {
			const html = unmark(readFileSync(`${dist}blog/${post.slug}/index.html`, 'utf8'));
			const fences = JSON.parse(readFileSync(`${dist}blog/${post.slug}.tokens.json`, 'utf8')) as { scene?: { data: { words: string[]; frame: string } } }[];
			const scenes = fences.filter((fence) => fence.scene !== undefined);
			assert.equal(scenes.length, (post as Listed).scenes);
			// Every text the scene's data holds, but the fields that say how it is drawn rather than what it says.
			const STRUCTURE = new Set(['kind', 'as', 'reach', 'at', 'map', 'id', 'frame', 'words', 'terms', 'answers', 'pages', 'changed']);
			const texts = (value: unknown, key = ''): string[] => (STRUCTURE.has(key) ? []
				: typeof value === 'string' ? [value]
					: Array.isArray(value) ? value.flatMap((item) => texts(item))
						: value !== null && typeof value === 'object' ? Object.entries(value).flatMap(([name, inner]) => texts(inner, name)) : []);
			for (const scene of scenes) {
				for (const text of texts(scene.scene!.data)) assert.ok(html.includes(unmark(escape(text))), `${post.slug}: the page shows "${text}"`);
				assert.ok(feed.includes(scene.scene!.data.frame), `${post.slug}: the feed shows ${scene.scene!.data.frame}`);
			}
		}
	});

	it('a post with galleries links every photo from the page the server wrote, and the feed shows each one', () => {
		const feed = readFileSync(`${dist}feed.xml`, 'utf8');
		const galleries = posts().filter((post) => post.code).map((post) => ({
			post,
			fences: (JSON.parse(readFileSync(`${dist}blog/${post.slug}.tokens.json`, 'utf8')) as { gallery?: { images: { src: string }[] } }[]).filter((fence) => fence.gallery !== undefined),
		})).filter((found) => found.fences.length > 0);
		assert.ok(galleries.length > 0, 'a published post has a gallery');
		for (const { post, fences } of galleries) {
			const html = readFileSync(`${dist}blog/${post.slug}/index.html`, 'utf8');
			for (const image of fences.flatMap((fence) => fence.gallery!.images)) {
				assert.ok(html.includes(`href="${image.src}"`), `${post.slug}: the page links ${image.src}`);
				assert.ok(existsSync(`${dist}${image.src}`), `${post.slug}: ${image.src} is published`);
				assert.ok(feed.includes(`src=&quot;https://torrin.me${image.src}&quot;`), `${post.slug}: the feed shows ${image.src}`);
			}
		}
	});

	it('the site card and the dark profile image head.tsx names are real PNGs', () => {
		for (const [file, width, height] of [['site-card.png', 1200, 630], ['profile.dark.png', 1080, 1080]] as const) {
			const png = readFileSync(`${dist}${file}`);
			assert.equal(png.readUInt32BE(16), width, `${file} width`);
			assert.equal(png.readUInt32BE(20), height, `${file} height`);
		}
		const card = readFileSync(`${dist}${posts()[0]!.og!}`);
		assert.equal(card.readUInt32BE(16), 1200);
		assert.equal(card.readUInt32BE(20), 630);
	});

	it('feed.xml is Atom with every post in full, escaped, with no hydration marker', () => {
		const atom = readFileSync(`${dist}feed.xml`, 'utf8');
		assert.ok(atom.startsWith('<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">'));
		assert.equal((atom.match(/<entry>/g) ?? []).length, posts().length);
		assert.ok(atom.includes('<link rel="self" type="application/atom+xml" href="https://torrin.me/feed.xml"/>'));
		assert.ok(atom.includes('<id>https://torrin.me/blog</id>'));
		assert.ok(!/&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-f]+;)/i.test(atom), 'no bare ampersand');
		assert.ok(!/<content type="html">[^<]*<[a-z]/.test(atom), 'the html is escaped, not inline');
		assert.ok(atom.includes('&lt;pre'), 'a code block made it in');
		assert.ok(!atom.includes('href=&quot;/'), 'every link is absolute');
		assert.ok(!atom.includes('&lt;!--'), 'no comment of the render in the content');
	});

	it('feed.json is JSON Feed 1.1 with the same posts', () => {
		const json = JSON.parse(readFileSync(`${dist}feed.json`, 'utf8')) as { version: string; items: { url: string; content_html: string; date_published: string }[] };
		assert.equal(json.version, 'https://jsonfeed.org/version/1.1');
		assert.deepEqual(json.items.map((item) => item.url), posts().map((post) => `https://torrin.me/blog/${post.slug}`));
		for (const item of json.items) {
			assert.ok(item.content_html.includes('<p'));
			assert.ok(!item.content_html.includes('<!--'), 'no comment of the render in the content');
			assert.match(item.date_published, /^\d{4}-\d{2}-\d{2}T/);
		}
	});

	it('feed-summary.xml carries the description, a paragraph and a link back, per post, under its own id', () => {
		const summary = readFileSync(`${dist}feed-summary.xml`, 'utf8');
		assert.equal((summary.match(/<entry>/g) ?? []).length, posts().length);
		assert.equal((summary.match(/Read the whole post on torrin\.me/g) ?? []).length, posts().length);
		assert.ok(!summary.includes('&lt;pre'), 'no code block in a summary');
		assert.ok(!summary.includes('&lt;!--'), 'no comment of the render in the content');
		assert.ok(summary.includes('<id>https://torrin.me/blog/summary</id>'), 'its own id');
		assert.ok(!summary.includes('<id>https://torrin.me/blog</id>'), 'not the full feed\'s');
		// The Kimai post opens with a quote, a list and two file labels, so the description is what a
		// reader of the summary gets.
		const kimai = posts().find((post) => post.slug === 'kimai-setup');
		if (kimai !== undefined) {
			const entry = summary.slice(summary.indexOf('<id>https://torrin.me/blog/kimai-setup</id>'));
			const content = /<content type="html">([^<]*)<\/content>/.exec(entry)![1]!;
			assert.ok(content.includes(kimai.description), `its description is in the content: ${content}`);
		}
	});
});

describe('the page when its twin cannot be read', () => {
	it('comes alive around the post the server wrote, the menu works, and the console says why', async () => {
		assert.ok(existsSync(`${dist}blog/index.html`), 'run the build before this suite');
		const newest = (JSON.parse(readFileSync(`${repo}frontend/data/posts.json`, 'utf8')) as Listed[])[0]!;
		const site = await boot({ 'static/Files': { dir: dist, unknown: '404' } });
		const browser = await chromium.launch();
		try {
			const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
			const said: string[] = [];
			view.on('pageerror', (error) => said.push(`thrown: ${String(error)}`));
			view.on('console', (message) => { if (message.type() === 'error') said.push(message.text()); });
			await view.route(`**/blog/${newest.slug}.md`, (route) => route.fulfill({ status: 503, body: 'down' }));
			await view.goto(`${site.url}/blog/${newest.slug}`, { waitUntil: 'networkidle' });

			assert.equal(await view.textContent('h1'), newest.title, 'the post the server wrote is still on the page');
			assert.ok(((await view.textContent('article')) ?? '').length > 200, 'with its body');
			await view.click('[aria-label="Menu"]');
			await view.waitForSelector('a[href="/contact"]', { state: 'visible', timeout: 5000 });
			assert.ok(said.some((line) => line.includes(`${newest.slug}: the twin could not be read`)), `the console names the twin: ${said.join(' | ')}`);
			assert.deepEqual(said.filter((line) => !line.includes('the twin could not be read') && !line.includes('503')), [], 'and nothing else went wrong');
			await view.close();
		} finally {
			await browser.close();
			await site.stop();
		}
	});
});

describe('a post\'s photos in the browser', () => {
	const listed = (): Listed[] => JSON.parse(readFileSync(`${repo}frontend/data/posts.json`, 'utf8')) as Listed[];
	const opened = (view: import('playwright').Page): Promise<boolean> => view.evaluate(() => document.querySelector('dialog[open]') !== null);

	it('open in the viewer on a click, large with their words, and close by the button, the backdrop or Escape, back to the photo', async () => {
		assert.ok(existsSync(`${dist}blog/index.html`), 'run the build before this suite');
		const post = listed().find((found) => found.code && readFileSync(`${dist}blog/${found.slug}.tokens.json`, 'utf8').includes('"gallery"'));
		assert.ok(post !== undefined, 'a published post has a gallery');
		const site = await boot({ 'static/Files': { dir: dist, unknown: '404' } });
		const browser = await chromium.launch();
		try {
			const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
			await view.goto(`${site.url}/blog/${post.slug}`, { waitUntil: 'networkidle' });
			const photos = [view.locator('[data-gallery] a').first(), view.locator('p a[data-photo]').first()];
			for (const photo of photos) {
				const href = (await photo.getAttribute('href'))!, alt = (await photo.locator('img').getAttribute('alt'))!;
				const plain = await view.request.get(`${site.url}${href}`);
				assert.equal(plain.status(), 200, `${href} is there without the viewer`);
				for (const close of ['Escape', 'button', 'backdrop'] as const) {
					await photo.click();
					await view.waitForSelector('dialog[open]', { timeout: 5000 });
					assert.equal(new URL(view.url()).pathname, `/blog/${post.slug}`, 'the page stays');
					assert.equal(await view.getAttribute('dialog[open] img', 'src'), href, 'the whole photo, large');
					assert.ok(((await view.textContent('dialog[open]')) ?? '').includes(alt), 'with its words under it');
					assert.ok(await view.evaluate(() => document.activeElement?.closest('dialog[open]') !== null), 'the keyboard is in the viewer');
					assert.equal(await view.evaluate(() => getComputedStyle(document.documentElement).overflow), 'hidden', 'the page behind does not scroll');
					if (close === 'Escape') await view.keyboard.press('Escape');
					else if (close === 'button') await view.click('dialog[open] [aria-label="Close"]');
					else await view.mouse.click(10, 450);
					// The platform fires the dialog's close event a task after it shuts, and that event puts the page back.
					await view.waitForFunction(() => document.querySelector('dialog[open]') === null && getComputedStyle(document.documentElement).overflow !== 'hidden', undefined, { timeout: 5000 });
					assert.equal(await view.evaluate(() => document.activeElement?.getAttribute('href')), href, `${close}: the keyboard is back on the photo, and the page scrolls again`);
				}
			}

			await view.setViewportSize({ width: 390, height: 844 });
			await photos[0]!.click();
			await view.waitForSelector('dialog[open]', { timeout: 5000 });
			const image = (await view.locator('dialog[open] img').boundingBox())!, button = (await view.locator('dialog[open] [aria-label="Close"]').boundingBox())!;
			assert.ok(image.x >= 0 && image.y >= 0 && image.x + image.width <= 390 && image.y + image.height <= 844, `the photo fits a phone: ${JSON.stringify(image)}`);
			assert.ok(button.width >= 44 && button.height >= 44, 'and the close button is big enough to tap');
			await view.keyboard.press('Escape');
			assert.equal(await opened(view), false);
			await view.close();
		} finally {
			await browser.close();
			await site.stop();
		}
	});

	it('shows a figure written with a size at that width, in the middle of the column, and no wider than a phone', async () => {
		const post = listed().find((found) => /\]\(\/media\/[^)]*#\d+x\d+\)/.test(readFileSync(`${dist}blog/${found.slug}.md`, 'utf8')));
		assert.ok(post !== undefined, 'a published post has a figure with a size');
		const width = Number(/\]\(\/media\/[^)]*#(\d+)x\d+\)/.exec(readFileSync(`${dist}blog/${post.slug}.md`, 'utf8'))![1]);
		const site = await boot({ 'static/Files': { dir: dist, unknown: '404' } });
		const browser = await chromium.launch();
		try {
			const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
			await view.goto(`${site.url}/blog/${post.slug}`, { waitUntil: 'networkidle' });
			const sized = view.locator(`p a[data-photo] img[width="${String(width)}"]`).first();
			const column = (await view.locator('p a[data-photo]').first().locator('xpath=ancestor::p').boundingBox())!;
			const box = (await sized.boundingBox())!;
			assert.equal(Math.round(box.width), width, 'as wide as the post says');
			assert.ok(Math.abs(box.x + box.width / 2 - (column.x + column.width / 2)) <= 1, 'in the middle of the column');
			const filled = (await view.locator('p a[data-photo] img:not([width])').first().boundingBox())!;
			assert.ok(Math.abs(filled.width - column.width) <= 1, 'and a photo with no size still fills it');
			await view.setViewportSize({ width: 320, height: 700 });
			const narrow = (await sized.boundingBox())!, page = (await view.locator('p a[data-photo]').first().locator('xpath=ancestor::p').boundingBox())!;
			assert.ok(narrow.width <= page.width + 0.5 && narrow.width < width, `on a phone it shrinks to the column: ${String(narrow.width)} of ${String(page.width)}`);
			assert.equal(await view.evaluate(() => document.documentElement.scrollWidth), 320, 'with no sideways scroll');
			await view.close();
		} finally {
			await browser.close();
			await site.stop();
		}
	});

	it('plays an animated heading once a reader scrolls it into view, a curtain of pixels over its words that clears, then an emblem beside the bare words', async () => {
		const post = listed().find((found) => found.animated.length > 0);
		assert.ok(post !== undefined, 'a published post has an animated heading');
		const site = await boot({ 'static/Files': { dir: dist, unknown: '404' } });
		const browser = await chromium.launch();
		try {
			const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
			await view.goto(`${site.url}/blog/${post.slug}`, { waitUntil: 'networkidle' });
			const heading = view.locator('h2:has([data-animated]), h3:has([data-animated])').first();
			// What the canvas paints over the words and over the emblem's box, in pixels that are not see-through.
			const painted = (): Promise<{ words: number; mark: number }> => heading.evaluate((el) => {
				const canvas = el.querySelector('canvas')!, context = canvas.getContext('2d')!, scale = canvas.getBoundingClientRect().width / canvas.width;
				const mark = Math.ceil(el.querySelector('[data-mark]')!.getBoundingClientRect().width / scale) + 2;
				const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
				let words = 0, emblem = 0;
				for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) if (data[(y * canvas.width + x) * 4 + 3]! > 0) { if (x >= mark) words += 1; else emblem += 1; }
				return { words, mark: emblem };
			});
			// A reader's scroll, a wheel notch at a time, until the heading is a third of the way down.
			let notches = 0;
			while ((await heading.evaluate((el) => el.getBoundingClientRect().top)) > 300 && notches < 400) { await view.mouse.wheel(0, 100); await view.waitForTimeout(20); notches += 1; }
			await view.waitForTimeout(300);
			const playing = await painted();
			assert.ok(playing.words > 50, `the words are under the curtain while it plays: ${JSON.stringify(playing)}`);
			assert.ok(playing.mark > 20, 'and the emblem is drawn');
			await view.waitForTimeout(2600);
			const rested = await painted();
			assert.equal(rested.words, 0, 'then the words are bare');
			assert.ok(rested.mark > 20, 'beside the still emblem');
			assert.equal(await view.evaluate(() => document.documentElement.scrollWidth), 1280);

			const still = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
			await still.goto(`${site.url}/blog/${post.slug}`, { waitUntil: 'networkidle' });
			const quiet = still.locator('h2:has([data-animated]), h3:has([data-animated])').first();
			await quiet.scrollIntoViewIfNeeded();
			await still.waitForTimeout(400);
			const shown = await quiet.evaluate((el) => {
				const canvas = el.querySelector('canvas')!, data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data, scale = canvas.getBoundingClientRect().width / canvas.width;
				const mark = Math.ceil(el.querySelector('[data-mark]')!.getBoundingClientRect().width / scale) + 2;
				let words = 0;
				for (let y = 0; y < canvas.height; y++) for (let x = mark; x < canvas.width; x++) if (data[(y * canvas.width + x) * 4 + 3]! > 0) words += 1;
				return words;
			});
			assert.equal(shown, 0, 'with reduced motion the words are bare from the start');
			await still.close();
			await view.close();
		} finally {
			await browser.close();
			await site.stop();
		}
	});
});
