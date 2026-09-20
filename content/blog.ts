// The blog's build step: every post in content/blog/ read, checked and written out as what the
// site renders from.
//
// Run: npm run content, before vite, so what it writes under frontend/public is copied into
// dist/ beside the pages. It writes the index the bundle imports (frontend/data/posts.json, no
// bodies), a markdown twin and the tokens of its fences per post (frontend/public/blog/), the
// post's media under a hashed name (frontend/public/media/<slug>/), the card a link to the post
// unfurls to, and the site's own card and dark profile image.
//
// A post is `content/blog/<slug>.md` with YAML front matter (`title`, `description`, `date`,
// `updated`, `draft`, `future`, `discuss`, `image`) and its media in `content/blog/<slug>/`. The
// body is the markdown as written; the rewrites below are mechanical and happen here, never in
// the file.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Markdown, context, h, render } from '@aweftjs/ui';
import { parse as parseYaml } from 'yaml';

import { OG, PROFILE, cardHtml, openCards, profileHtml, templatesOf } from './cards.ts';
import { highlight } from './highlight.ts';
import type { Fence } from './highlight.ts';

/** A heading of a post, with the id `Markdown` gives it. */
export interface Heading {
	readonly level: number;
	readonly text: string;
	readonly id: string;
}

/** One line of the index: everything the site knows about a post but its body. */
export interface Post {
	readonly slug: string;
	readonly title: string;
	readonly description: string;
	/** As written: an ISO date, with or without a time. */
	readonly date: string;
	readonly updated?: string;
	/** A Hacker News thread to point the "Discuss" line at. */
	readonly discuss?: string;
	/** The headline on the card, when the title is too long for one. */
	readonly image?: string;
	readonly draft: boolean;
	readonly words: number;
	/** Reading time, in whole minutes, never under one. */
	readonly minutes: number;
	readonly headings: readonly Heading[];
	/** The self-hosted poster per YouTube id the post embeds. */
	readonly posters: Readonly<Record<string, string>>;
	/** The card's path under the site root, for a published post. */
	readonly og: string | null;
	/** Whether the post has a fenced block, so the client knows to fetch its tokens. */
	readonly code: boolean;
}

/** A post as read from its file, before any rewrite. */
export interface Source {
	readonly file: string;
	readonly slug: string;
	readonly front: Front;
	readonly body: string;
}

export interface Front {
	readonly title: string;
	readonly description: string;
	readonly date: string;
	readonly updated?: string;
	readonly draft: boolean;
	/** True for a post published ahead of its date, which is otherwise refused. */
	readonly future: boolean;
	readonly discuss?: string;
	readonly image?: string;
}

/** A refusal: the file, and what is wrong with it. */
export class PostError extends Error {
	constructor(file: string, what: string) {
		super(`${file}: ${what}`);
		this.name = 'PostError';
	}
}

// --- reading ------------------------------------------------------------------------------

const FRONT = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** The URL segment a file name becomes: lowercased, apostrophes dropped, anything else a hyphen. */
export const slugOf = (name: string): string => basename(name, '.md')
	.toLowerCase()
	.replace(/['’]/g, '')
	.replace(/[^a-z0-9]+/g, '-')
	.replace(/^-+|-+$/g, '');

// A day, or a day with a time and its zone. `Date.parse` would take `02/20/2026` and `2026-2-5`
// too, and the page would show the wrong day or "Invalid Date" for them.
const DATE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?(?:Z|[+-]\d{2}:\d{2}))?$/;
const DATE_SHAPE = 'YYYY-MM-DD, with or without THH:MM(:SS) and Z or ±HH:MM';

/** Whether a date is written in the shape above and names a day the calendar has. */
export const isDate = (value: string): boolean => {
	const found = DATE.exec(value);
	if (found === null) return false;
	const [year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0] = found.slice(1).map((part) => Number(part ?? 0));
	if (month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) return false;
	return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
};

const DISCUSS = 'https://news.ycombinator.com/item?id=';

/** The inline marks dropped: a link's text, a code span's text, bold and italic as plain words. */
export const stripInline = (value: string): string => value
	.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
	.replace(/`([^`]*)`/g, '$1')
	.replace(/\*\*([^*]*)\*\*/g, '$1')
	.replace(/\*([^*]*)\*/g, '$1')
	.replace(/_([^_]*)_/g, '$1');

const text = (front: Record<string, unknown>, key: string): string | undefined => {
	const value = front[key];
	if (value === undefined || value === null) return undefined;
	return String(value instanceof Date ? value.toISOString() : value).trim();
};

/** A flag: absent is false, and only the YAML booleans count, so `yes` or `"true"` do not publish a draft by mistake. */
const flag = (file: string, front: Record<string, unknown>, key: string): boolean => {
	const value = front[key];
	if (value === undefined || value === null) return false;
	if (typeof value !== 'boolean') throw new PostError(file, `${key} has to be true or false, the YAML boolean, and it is ${JSON.stringify(value)}`);
	return value;
};

/**
 * Read one post: the front matter, checked, and the body after it.
 *
 * Throws: `PostError` for a file with no front matter, no title, no date, a date not written as
 * a real ISO day, `draft` or `future` that is not a boolean, a `discuss` that is not a Hacker
 * News thread, or a published post with no description or dated after now without `future`.
 */
export const readPost = (file: string): Source => {
	const raw = readFileSync(file, 'utf8');
	const match = FRONT.exec(raw);
	if (match === null) throw new PostError(file, 'no front matter: the file has to start with a --- block holding title, description and date');
	const parsed: unknown = parseYaml(match[1]!);
	const front = (parsed !== null && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;

	const title = text(front, 'title');
	if (title === undefined || title === '') throw new PostError(file, 'no title in the front matter');
	const date = text(front, 'date');
	if (date === undefined || date === '') throw new PostError(file, 'no date in the front matter');
	if (!isDate(date)) throw new PostError(file, `the date does not parse: ${date}; write ${DATE_SHAPE}`);
	const updated = text(front, 'updated');
	if (updated !== undefined && !isDate(updated)) throw new PostError(file, `the updated date does not parse: ${updated}; write ${DATE_SHAPE}`);
	const draft = flag(file, front, 'draft');
	const future = flag(file, front, 'future');
	// A post dated ahead would sit at the top of the index until its day comes, so it is a mistake
	// unless the front matter says otherwise.
	if (!draft && !future && Date.parse(date) > Date.now()) throw new PostError(file, `dated ${date}, which is after now; fix the date, or say future: true to publish it ahead of its day`);
	// Plain words: the description is a meta tag and a line in the index, and neither runs markdown.
	const description = stripInline(text(front, 'description') ?? '');
	if (!draft && description === '') throw new PostError(file, 'a published post needs a description: it is the page\'s meta description and its line in the index');
	const discuss = text(front, 'discuss');
	// The value goes into an href as written, so it is one thread on the one site the line names.
	if (discuss !== undefined && discuss !== '' && !discuss.startsWith(DISCUSS)) throw new PostError(file, `discuss has to be a Hacker News thread, ${DISCUSS}<number>, and it is ${discuss}`);
	const image = text(front, 'image');

	return {
		file,
		slug: slugOf(file),
		front: {
			title,
			description,
			date,
			draft,
			future,
			...(updated === undefined ? {} : { updated }),
			...(discuss === undefined || discuss === '' ? {} : { discuss }),
			...(image === undefined || image === '' ? {} : { image }),
		},
		body: raw.slice(match[0].length),
	};
};

/**
 * Every post of a directory, by file name.
 *
 * Throws: the first `PostError`, or one naming two files that would share a URL.
 */
export const readPosts = (dir: string): Source[] => {
	const files = readdirSync(dir).filter((name) => name.endsWith('.md')).sort();
	const posts = files.map((name) => readPost(join(dir, name)));
	const seen = new Map<string, string>();
	for (const post of posts) {
		const other = seen.get(post.slug);
		if (other !== undefined) throw new PostError(post.file, `its URL /blog/${post.slug} collides with ${other}; rename one`);
		seen.set(post.slug, post.file);
	}
	return posts;
};

// --- the body, fence-aware ------------------------------------------------------------------

/** One run of a body: prose, or a fenced block with its fence lines. */
export interface Run {
	readonly kind: 'prose' | 'fence';
	readonly text: string;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/;

/** The runs of a body, in order; joining their texts with newlines gives the body back. */
export const runs = (markdown: string): Run[] => {
	const out: Run[] = [];
	let held: string[] = [];
	let kind: Run['kind'] = 'prose';
	let closing: string | null = null;
	const flush = (): void => {
		if (held.length > 0) out.push({ kind, text: held.join('\n') });
		held = [];
	};
	for (const line of markdown.split('\n')) {
		if (kind === 'prose') {
			const opened = FENCE.exec(line);
			if (opened !== null) {
				flush();
				kind = 'fence';
				closing = opened[1]!;
			}
			held.push(line);
		} else {
			held.push(line);
			const trimmed = line.trim();
			if (closing !== null && trimmed.startsWith(closing[0]!) && /^(`{3,}|~{3,})$/.test(trimmed) && trimmed.length >= closing.length) {
				flush();
				kind = 'prose';
				closing = null;
			}
		}
	}
	flush();
	return out;
};

/** The body with every prose run rewritten and every fence left as it stands. */
export const mapProse = (markdown: string, change: (prose: string) => string): string =>
	runs(markdown).map((run) => (run.kind === 'prose' ? change(run.text) : run.text)).join('\n');

/** The fenced blocks of a body, in order, with their language and their text. */
export const fences = (markdown: string): { language: string | null; text: string }[] => runs(markdown)
	.filter((run) => run.kind === 'fence')
	.map((run) => {
		const lines = run.text.split('\n');
		const opened = FENCE.exec(lines[0]!)!;
		const last = lines[lines.length - 1]!.trim();
		const closed = /^(`{3,}|~{3,})$/.test(last) && lines.length > 1;
		return { language: opened[2] === '' ? null : opened[2]!, text: lines.slice(1, closed ? -1 : undefined).join('\n') };
	});

const DEFINITION = /^ {0,3}\[([^\]]+)\]:\s*(\S+)(?:\s+"[^"]*")?\s*$/;

/**
 * Reference links inlined: `[text][n]` becomes `[text](url)` from a `[n]: url` line, and the
 * definition lines go. A reference no line defines is left as written.
 */
export const inlineReferences = (markdown: string): string => {
	const urls = new Map<string, string>();
	for (const run of runs(markdown)) {
		if (run.kind !== 'prose') continue;
		for (const line of run.text.split('\n')) {
			const found = DEFINITION.exec(line);
			if (found !== null) urls.set(found[1]!.toLowerCase(), found[2]!);
		}
	}
	if (urls.size === 0) return markdown;
	return mapProse(markdown, (prose) => prose
		.split('\n')
		.filter((line) => !DEFINITION.test(line))
		.join('\n')
		.replace(/\[([^\]\n]+)\]\[([^\]\n]+)\]/g, (whole: string, label: string, name: string) => {
			const url = urls.get(name.toLowerCase());
			return url === undefined ? whole : `[${label}](${url})`;
		}));
};

// An image alone on its line: the alt, the source, an optional title, an optional size.
const IMAGE_LINE = /^!\[((?:[^[\]\n]|\[[^[\]\n]*\])*)\]\(((?:[^()\s]|\([^()\s]*\))+)((?:\s+"[^"]*")?(?:\s+=\d+x\d+)?)\)$/;
const IMAGE = /!\[((?:[^[\]\n]|\[[^[\]\n]*\])*)\]\(((?:[^()\s]|\([^()\s]*\))+)((?:\s+"[^"]*")?(?:\s+=\d+x\d+)?)\)/g;
const YOUTUBE = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#\s]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/;

/** The YouTube id a URL names, or null for any other URL. */
export const youtubeId = (url: string): string | null => YOUTUBE.exec(url)?.[1] ?? null;

/**
 * Every image line whose source is a YouTube URL, as a link on its own line: `[alt](watch URL)`,
 * which the site's modifier turns into the click-to-load poster. A figure it would be otherwise,
 * and a figure is a block no modifier sees.
 */
export const markYoutube = (markdown: string): { markdown: string; ids: string[] } => {
	const ids: string[] = [];
	const marked = mapProse(markdown, (prose) => prose.split('\n').map((line) => {
		const found = IMAGE_LINE.exec(line.trim());
		if (found === null) return line;
		const id = youtubeId(found[2]!);
		if (id === null) return line;
		if (!ids.includes(id)) ids.push(id);
		const alt = found[1]!.trim();
		return `[${alt === '' ? 'Watch on YouTube' : alt}](https://www.youtube.com/watch?v=${id})`;
	}).join('\n'));
	return { markdown: marked, ids };
};

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

// The lines that end a quote or a paragraph, as `Markdown`'s block parser reads them, and the
// item line that starts a list, which runs to the next blank line with every line inside it.
const HEADING = /^ {0,3}(#{1,6})(?:\s+(.*?))?\s*$/;
const RULE = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE = /^ {0,3}>\s?/;
const ITEM = /^(\s*)(?:[-+*]|\d{1,9}[.)])\s+/;
const DELIMITER = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;
const opens = (line: string, next: string | undefined): boolean =>
	FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || ITEM.test(line)
	|| (line.includes('|') && next !== undefined && DELIMITER.test(next) && next.includes('-'));

const NOTE_QUOTE = /^( {0,3}>\s?)Note:(?=\s)/;

/**
 * Every quote whose first word is `Note:` with that word as `[!NOTE]`, GitHub's own callout mark,
 * which the site's modifier turns into the callout's label. The modifier sees text alone and
 * cannot tell a quote from a paragraph, so the word an author writes stays a word in a
 * paragraph and only what this rewrite emits is a callout.
 */
export const markNotes = (markdown: string): string => mapProse(markdown, (prose) => {
	const lines = prose.split('\n');
	let inQuote = false;
	let inList = false;
	return lines.map((line, at) => {
		if (line.trim() === '') {
			inQuote = false;
			inList = false;
			return line;
		}
		if (inQuote) {
			inQuote = QUOTE.test(line) || !opens(line, lines[at + 1]);
			if (inQuote) return line;
		}
		if (inList) return line;
		if (ITEM.test(line) && ITEM.exec(line)![1]!.length < 4) {
			inList = true;
			return line;
		}
		if (!QUOTE.test(line)) return line;
		inQuote = true;
		return line.replace(NOTE_QUOTE, '$1[!NOTE]');
	}).join('\n');
});

// A line that reads as an image but is not one the page would show as a figure: a space in the
// source, a size that is not two numbers, two images on the line. `Markdown` shows such a line
// as the characters written.
const IMAGE_LOOSE = /^!\[.*\]\(.*\)$/;

/** Every image line of a body the page would show as text instead of a figure. */
export const brokenImageLines = (markdown: string): string[] => {
	const found: string[] = [];
	for (const run of runs(markdown)) {
		if (run.kind !== 'prose') continue;
		for (const line of run.text.split('\n')) {
			const trimmed = line.trim();
			if (IMAGE_LOOSE.test(trimmed) && !IMAGE_LINE.test(trimmed)) found.push(trimmed);
		}
	}
	return found;
};

// A link as `Markdown` reads one: the text, the URL with one level of parentheses, a title.
const LINK = /(?<!!)\[[^\]\n]+\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"]*")?\)/g;
const CODE_SPAN = /`[^`\n]+`/g;

/** The slug of every `/blog/<slug>` link in a body's prose, once each, in order; a code span holds none. */
export const postLinks = (markdown: string): string[] => {
	const found: string[] = [];
	for (const run of runs(markdown)) {
		if (run.kind !== 'prose') continue;
		for (const match of run.text.replace(CODE_SPAN, '').matchAll(LINK)) {
			const slug = /^\/blog\/([^/#?]+)/.exec(match[1]!)?.[1];
			if (slug !== undefined && !found.includes(slug)) found.push(slug);
		}
	}
	return found;
};

/** Every local image source of a body, as written, once each, in order. */
export const localImages = (markdown: string): string[] => {
	const found: string[] = [];
	for (const run of runs(markdown)) {
		if (run.kind !== 'prose') continue;
		for (const match of run.text.matchAll(IMAGE)) {
			const src = match[2]!;
			if (SCHEME.test(src) || found.includes(src)) continue;
			found.push(src);
		}
	}
	return found;
};

/** The body with every local image source replaced, by the map handed in. */
export const rewriteImages = (markdown: string, to: ReadonlyMap<string, string>): string =>
	mapProse(markdown, (prose) => prose.replace(IMAGE, (whole: string, alt: string, src: string, rest: string) => {
		const moved = to.get(src);
		return moved === undefined ? whole : `![${alt}](${moved}${rest})`;
	}));

const HEADING_TAG = /<h([1-6])\b[^>]*\sid="([^"]*)"[^>]*>([\s\S]*?)<\/h\1>/g;

const unescape = (html: string): string => html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/**
 * Every heading of a body with the id the page gives it, read off a render of the body through
 * `Markdown`: a `#` line the parser folds into the list item above it is no heading there, so a
 * contents list built from a scan of the lines could point at an id the page lacks.
 */
export const headings = async (markdown: string): Promise<Heading[]> => {
	const html = await render(h(Markdown, { source: markdown }), { context: context() });
	return [...html.matchAll(HEADING_TAG)].map((match) => ({
		level: Number(match[1]),
		text: unescape(match[3]!.replace(/<!--[^>]*-->|<[^>]+>/g, '')),
		id: match[2]!,
	}));
};

/** The words of a body, fences included: they are read too. */
export const words = (markdown: string): number => markdown.split(/\s+/).filter((word) => word !== '').length;

// At 200 words a minute, the figure most readers of a technical post are quoted.
export const minutesOf = (count: number): number => Math.max(1, Math.ceil(count / 200));

// --- media ----------------------------------------------------------------------------------

const hashOf = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex').slice(0, 8);

/**
 * Where a local source lives: under the post's own folder, with a leading `/` or `./` dropped.
 * Null for a source that climbs out of the folder, which would copy any file on the machine
 * into the site.
 */
const mediaPath = (folder: string, src: string): string | null => {
	const file = resolve(folder, src.replace(/^\.?\//, ''));
	return file.startsWith(resolve(folder) + sep) ? file : null;
};

/** The hashed name a media file is published under: `<name>.<8-hex>.<ext>`. */
export const hashedName = (file: string, bytes: Buffer): string => {
	const ext = extname(file);
	return `${basename(file, ext)}.${hashOf(bytes)}${ext}`;
};

export const POSTER = (id: string): string => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// --- the build ------------------------------------------------------------------------------

export interface BuildOptions {
	/** The posts: content/blog. */
	readonly content: string;
	/** Where the index goes: frontend/data. */
	readonly data: string;
	/** The directory vite copies as it is: frontend/public. */
	readonly public: string;
	/** The studio checkout holding the card template, or null to render no card. */
	readonly studio: string | null;
	/** How a poster is fetched; the platform's `fetch` outside a test. */
	readonly fetch?: typeof fetch;
}

export interface Built {
	/** Every post read, drafts included, newest first. */
	readonly posts: readonly Post[];
	/** The markdown twin of every post, by slug, after the rewrites. */
	readonly twins: ReadonlyMap<string, string>;
	/** The fences of every post, by slug. */
	readonly fences: ReadonlyMap<string, readonly Fence[]>;
	readonly warnings: readonly string[];
	/** Every file written under `public` and `data`. */
	readonly files: readonly string[];
}

const byDate = (a: { date: string }, b: { date: string }): number => Date.parse(b.date) - Date.parse(a.date);

/**
 * Build the blog: read every post, refuse a broken one, rewrite the bodies, publish the media
 * and write the index, the twins, the tokens and the cards.
 *
 * A draft is read and checked, and its missing media or an image line the page would show as
 * text is a warning; it is not in the index, its media is not published, its twin is not written
 * and its links are not checked. A published post with a missing image, an image line the page
 * would show as text, a link to a draft or to no post, or a poster that cannot be fetched, fails
 * the build with the reason. An image that climbs out of the post's folder fails it either way.
 *
 * Throws: `PostError` for a post the build refuses; an error naming the studio checkout when the
 * card template is not where `studio` says.
 */
export const buildBlog = async (options: BuildOptions): Promise<Built> => {
	const warnings: string[] = [];
	const fetchPoster = options.fetch ?? fetch;
	const sources = readPosts(options.content).sort((a, b) => byDate(a.front, b.front));
	const templates = options.studio === null ? null : templatesOf(options.studio);
	const live = new Set(sources.filter((source) => !source.front.draft).map((source) => source.slug));
	const drafts = new Set(sources.filter((source) => source.front.draft).map((source) => source.slug));

	const wanted = new Map<string, () => Buffer | null>();
	const put = (file: string, bytes: () => Buffer | null): void => { wanted.set(file, bytes); };
	const posts: Post[] = [];
	const twins = new Map<string, string>();
	const allFences = new Map<string, readonly Fence[]>();
	const cards: { html: string; out: string }[] = [];

	for (const source of sources) {
		const folder = join(options.content, source.slug);
		const isDraft = source.front.draft;
		const say = (what: string): void => {
			if (isDraft) warnings.push(`${source.file}: ${what}`);
			else throw new PostError(source.file, what);
		};

		let body = markNotes(inlineReferences(source.body));
		for (const line of brokenImageLines(body)) say(`the image line ${line} would show as text, not a figure: one image alone on its line, no space in its source, and a size as =WxH with two numbers`);
		// A link to a draft is a 404 on the live site until the draft is published.
		if (!isDraft) {
			for (const slug of postLinks(body)) {
				if (live.has(slug)) continue;
				throw new PostError(source.file, drafts.has(slug)
					? `links /blog/${slug}, which is a draft: publish it first, or drop the link`
					: `links /blog/${slug}, which is no post`);
			}
		}
		const marked = markYoutube(body);
		body = marked.markdown;

		// Local images: each one has to exist; a published one is copied under its hash.
		const moved = new Map<string, string>();
		for (const src of localImages(body)) {
			const file = mediaPath(folder, src);
			if (file === null) throw new PostError(source.file, `the image ${src} reaches outside the post's folder ${folder}; media lives beside the post`);
			if (!existsSync(file)) { say(`the image ${src} is not at ${file}`); continue; }
			if (isDraft) continue;
			const bytes = readFileSync(file);
			const name = hashedName(file, bytes);
			put(join(options.public, 'media', source.slug, name), () => bytes);
			moved.set(src, `/media/${source.slug}/${name}`);
		}
		body = rewriteImages(body, moved);

		// A poster per embedded video, fetched once into the post's folder, so the page shows
		// nothing from YouTube until the reader clicks.
		const posters: Record<string, string> = {};
		for (const id of marked.ids) {
			if (isDraft) continue;
			const file = join(folder, `youtube-${id}.jpg`);
			if (!existsSync(file)) {
				let answer: Response;
				try {
					answer = await fetchPoster(POSTER(id));
				} catch (error) {
					throw new PostError(source.file, `the poster for YouTube video ${id} could not be fetched from ${POSTER(id)}: ${String((error as Error).message)}`);
				}
				if (!answer.ok) throw new PostError(source.file, `the poster for YouTube video ${id} answered ${String(answer.status)} from ${POSTER(id)}`);
				mkdirSync(folder, { recursive: true });
				writeFileSync(file, Buffer.from(await answer.arrayBuffer()));
			}
			const bytes = readFileSync(file);
			const name = hashedName(file, bytes);
			put(join(options.public, 'media', source.slug, name), () => bytes);
			posters[id] = `/media/${source.slug}/${name}`;
		}

		const own = fences(body);
		const count = words(body);
		let og: string | null = null;
		if (!isDraft && templates !== null) {
			const html = cardHtml(templates, {
				eyebrow: 'blog',
				title: source.front.image ?? source.front.title,
				handle: 'torrin.me',
				date: source.front.date.slice(0, 10),
			});
			const name = `og.${hashOf(Buffer.from(html))}.png`;
			const out = join(options.public, 'media', source.slug, name);
			og = `/media/${source.slug}/${name}`;
			put(out, () => null);
			if (!existsSync(out)) cards.push({ html, out });
		}

		const post: Post = {
			slug: source.slug,
			title: source.front.title,
			description: source.front.description,
			date: source.front.date,
			...(source.front.updated === undefined ? {} : { updated: source.front.updated }),
			...(source.front.discuss === undefined ? {} : { discuss: source.front.discuss }),
			...(source.front.image === undefined ? {} : { image: source.front.image }),
			draft: isDraft,
			words: count,
			minutes: minutesOf(count),
			headings: await headings(body),
			posters,
			og,
			code: own.length > 0,
		};
		posts.push(post);
		if (isDraft) continue;

		twins.set(source.slug, body);
		put(join(options.public, 'blog', `${source.slug}.md`), () => Buffer.from(body));
		if (own.length > 0) {
			const tokens = await highlight(own);
			allFences.set(source.slug, tokens);
			put(join(options.public, 'blog', `${source.slug}.tokens.json`), () => Buffer.from(JSON.stringify(tokens)));
		}
	}

	// The site's own two images, named by head.tsx.
	if (templates !== null) {
		cards.push({
			html: cardHtml(templates, { eyebrow: 'product engineer', title: 'Torrin Leonard', handle: 'torrin.me', date: '' }),
			out: join(options.public, 'site-card.png'),
		});
	}

	// Write what is wanted and drop what is not, so a renamed post leaves no file behind.
	const files: string[] = [];
	for (const [file, bytes] of wanted) {
		const held = bytes();
		if (held === null) continue;
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, held);
		files.push(file);
	}
	for (const dir of [join(options.public, 'media'), join(options.public, 'blog')]) {
		if (!existsSync(dir)) continue;
		for (const file of walk(dir)) {
			if (!wanted.has(file)) rmSync(file);
		}
		for (const folder of readdirSync(dir)) {
			const path = join(dir, folder);
			if (statSync(path).isDirectory() && readdirSync(path).length === 0) rmSync(path, { recursive: true });
		}
	}

	if (cards.length > 0 || templates !== null) {
		const shooter = await openCards();
		try {
			for (const card of cards) {
				mkdirSync(dirname(card.out), { recursive: true });
				await shooter.shoot(card.html, OG, card.out);
				files.push(card.out);
			}
			if (templates !== null) {
				const out = join(options.public, 'profile.dark.png');
				await shooter.shoot(profileHtml(join(options.public, 'headshot.webp')), PROFILE, out);
				files.push(out);
			}
		} finally {
			await shooter.close();
		}
	}

	const published = posts.filter((post) => !post.draft);
	mkdirSync(options.data, { recursive: true });
	const index = join(options.data, 'posts.json');
	writeFileSync(index, `${JSON.stringify(published, null, '\t')}\n`);
	files.push(index);

	return { posts, twins, fences: allFences, warnings, files };
};

const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
	(entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));

// --- the command ----------------------------------------------------------------------------

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
	const repo = fileURLToPath(new URL('..', import.meta.url));
	const started = performance.now();
	const built = await buildBlog({
		content: join(repo, 'content', 'blog'),
		data: join(repo, 'frontend', 'data'),
		public: join(repo, 'frontend', 'public'),
		studio: process.env['STUDIO_DIR'] ?? join(repo, '..', 'studio'),
	});
	for (const warning of built.warnings) console.warn(`warning: ${warning}`);
	const published = built.posts.filter((post) => !post.draft).length;
	console.log(`${String(published)} posts published of ${String(built.posts.length)}, ${String(built.files.length)} files, ${String(Math.round(performance.now() - started))} ms`);
}
