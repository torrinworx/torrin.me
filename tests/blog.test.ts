// The blog's build step, on posts written for the test and on the real ones, and the pages and
// feeds the build wrote.
//
// The dist half needs `npm run build` (or `npm run content && vite build && npm run pages`) first.

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
import { summaryOf } from '../frontend/feeds.ts';
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
		const built = await buildBlog({ ...where, studio: null, fetch: ((url: string) => { fetched += 1; assert.equal(url, 'https://i.ytimg.com/vi/D2d7aqB4eHY/hqdefault.jpg'); return okFetch(); }) as unknown as typeof fetch });

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
		assert.match(twin, /!\[A caption\]\(\/media\/first\/pic\.[0-9a-f]{8}\.png\)/, 'the image points at its hashed copy');
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
		await buildBlog({ ...where, studio: null, fetch: (() => { fetched += 1; return okFetch(); }) as unknown as typeof fetch });
		assert.equal(fetched, 0);
	});

	it('fails a published post whose image is missing, naming it', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](nope.png)\n');
		await assert.rejects(buildBlog({ ...where, studio: null }), /a\.md: the image nope\.png is not at/);
	});

	it('fails a published post whose poster cannot be fetched, with the reason', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](https://youtu.be/D2d7aqB4eHY)\n');
		const refused = (() => Promise.resolve(new Response('', { status: 404 }))) as typeof fetch;
		await assert.rejects(buildBlog({ ...where, studio: null, fetch: refused }), /poster for YouTube video D2d7aqB4eHY answered 404/);
		const down = (() => Promise.reject(new Error('ENOTFOUND i.ytimg.com'))) as typeof fetch;
		await assert.rejects(buildBlog({ ...where, studio: null, fetch: down }), /could not be fetched .*ENOTFOUND/);
	});

	it('names a studio checkout that is not there', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', 'x\n');
		await assert.rejects(buildBlog({ ...where, studio: join(where.content, 'no-studio') }), /kit\/templates\/og\.html/);
	});

	it('refuses an image whose path climbs out of the post\'s folder, draft or not', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](../../../etc/hostname)\n');
		await assert.rejects(buildBlog({ ...where, studio: null }), /a\.md: the image \.\.\/\.\.\/\.\.\/etc\/hostname reaches outside the post's folder/);
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01\ndraft: true', '![x](/../b/pic.png)\n');
		await assert.rejects(buildBlog({ ...where, studio: null }), /reaches outside the post's folder/);
	});

	it('refuses a published post that links a draft or no post; a draft\'s links go unchecked', async () => {
		const where = scratch();
		write(where.content, 'live.md', 'title: L\ndescription: d\ndate: 2026-01-01', 'See [the other](/blog/other) and [the index](/blog).\n');
		write(where.content, 'other.md', 'title: O\ndescription: d\ndate: 2026-01-02\ndraft: true', 'Links [nowhere](/blog/nowhere) and [live](/blog/live).\n');
		await assert.rejects(buildBlog({ ...where, studio: null }), /live\.md: links \/blog\/other, which is a draft: publish it first, or drop the link/);
		write(where.content, 'live.md', 'title: L\ndescription: d\ndate: 2026-01-01', 'See [nothing](/blog/nowhere#top).\n');
		await assert.rejects(buildBlog({ ...where, studio: null }), /live\.md: links \/blog\/nowhere, which is no post/);
		write(where.content, 'live.md', 'title: L\ndescription: d\ndate: 2026-01-01', 'See [me](/blog/live), [the index](/blog) and the span `[x](/blog/nowhere)`.\n');
		const built = await buildBlog({ ...where, studio: null });
		assert.deepEqual(built.warnings, []);
	});

	it('refuses a published post whose image line would show as text, and warns for a draft', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](my pic.png)\n');
		await assert.rejects(buildBlog({ ...where, studio: null }), /a\.md: the image line !\[x\]\(my pic\.png\) would show as text, not a figure: one image alone on its line, no space in its source, and a size as =WxH with two numbers/);
		mkdirSync(join(where.content, 'a'));
		writeFileSync(join(where.content, 'a', 'pic.png'), Buffer.from('not really a png'));
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](pic.png =800xauto)\n');
		await assert.rejects(buildBlog({ ...where, studio: null }), /the image line !\[x\]\(pic\.png =800xauto\) would show as text/);
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01\ndraft: true', '![x](pic.png =800xauto)\n');
		const built = await buildBlog({ ...where, studio: null });
		assert.equal(built.warnings.length, 1);
		assert.match(built.warnings[0]!, /a\.md: the image line .* would show as text/);
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '![x](pic.png "a title" =800x600)\n\nA sentence with ![x](my pic.png) inside is text as written.\n');
		assert.deepEqual((await buildBlog({ ...where, studio: null })).warnings, []);
	});

	it('lists in the index the headings the page has: a # line folded into a list item is none', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '## One\n\n- an item\n## folded\n\n## Two\n');
		const built = await buildBlog({ ...where, studio: null });
		assert.deepEqual(built.posts[0]!.headings.map((heading) => heading.id), ['one', 'two']);
	});

	it('renders the built twin: a callout from a quote only, and a fence named constructor as plain code', async () => {
		const where = scratch();
		write(where.content, 'a.md', 'title: A\ndescription: d\ndate: 2026-01-01', '> Note: read this.\n\nNote: a paragraph.\n\n```constructor\nx = 1\n```\n');
		const built = await buildBlog({ ...where, studio: null });
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
});

describe('the posts in content/blog', () => {
	it('every one parses, and every image a published post names is there', async () => {
		const where = scratch();
		const built = await buildBlog({ content: `${repo}content/blog`, data: where.data, public: where.public, studio: null });
		assert.equal(built.posts.length, 3, 'the three published posts');
		const published = built.posts.filter((post) => !post.draft);
		assert.deepEqual(published.map((post) => post.slug).sort(), ['kimai-setup', 'nrth-day-one', 'when-to-open-source']);
		assert.deepEqual(built.warnings, []);
	});
});

describe('what the modifiers render', () => {
	const post: Listed = {
		slug: 'p', title: 'P', description: '', date: '2026-01-01', words: 1, minutes: 1, headings: [], og: null, code: false,
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
