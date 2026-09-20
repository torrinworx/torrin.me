// The three feeds, written beside the sitemap: feed.xml (Atom 1.0, full text), feed.json (JSON
// Feed 1.1, full text) and feed-summary.xml (Atom, the first two paragraphs and a link, for
// dev.to's import). The text is each post's twin rendered through `Markdown`, the way the page
// renders it, with the feed's own modifiers so a video is a link with its poster.

import { Markdown, Theme, context, h, render } from '@aweftjs/ui';

import { runs } from '../content/blog.ts';
import { AUTHOR_NAME, SITE_URL } from './head.tsx';
import { modifiersOf, codeOf, urlOf } from './pages/blog.tsx';
import type { Body, Listed } from './posts.ts';
import { siteTheme } from './theme.ts';

const FEED_TITLE = "Torrin Leonard's blog";
const FEED_DESCRIPTION = 'Notes on building software, running a homelab and the tools worth owning.';

const escape = (text: string): string => text
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A date as RFC 3339, which a bare day makes midnight UTC. */
const stamp = (iso: string): string => new Date(iso).toISOString();

/** Every root-relative `src` and `href` made absolute: a feed reader has no origin to resolve against. */
const absolute = (html: string): string => html.replace(/(src|href)="\/(?!\/)/g, `$1="${SITE_URL}/`);

/** One post's markdown as HTML, the way the page renders it. */
export const renderBody = async (post: Listed, markdown: string, fences: Body['fences']): Promise<string> => {
	const html = await render(
		h(Theme, { value: siteTheme }, h(Markdown, { source: markdown, code: codeOf(fences), modifiers: modifiersOf(post, true) })),
		{ context: context() },
	);
	return absolute(html);
};

/** The first two prose paragraphs of a body: what the summary feed carries. No heading, quote, list, figure, table or fence. */
export const summaryOf = (markdown: string): string => {
	const held: string[] = [];
	const prose = runs(markdown).filter((run) => run.kind === 'prose').map((run) => run.text).join('\n');
	for (const chunk of prose.split(/\n\s*\n/)) {
		const text = chunk.trim();
		if (text === '' || /^(#|>|[-*+]\s|\d+[.)]\s|!\[|\||\[[^\]]*\]\()/.test(text)) continue;
		held.push(text);
		if (held.length === 2) break;
	}
	return held.join('\n\n');
};

export interface Feeds {
	readonly atom: string;
	readonly json: string;
	readonly summary: string;
}

/**
 * The three feeds of the published posts, newest first.
 *
 * Params:
 *   posts: the index, newest first
 *   bodies: each post's body by slug
 */
export const feeds = async (posts: readonly Listed[], bodies: ReadonlyMap<string, Body>): Promise<Feeds> => {
	const updated = posts.length === 0 ? new Date().toISOString() : stamp(posts.map((post) => post.updated ?? post.date).sort().reverse()[0]!);
	const full: { post: Listed; html: string; summary: string }[] = [];
	for (const post of posts) {
		const body = bodies.get(post.slug);
		if (body === undefined) throw new Error(`${post.slug}: no body to put in the feed`);
		full.push({
			post,
			html: await renderBody(post, body.markdown, body.fences),
			summary: await renderBody(post, summaryOf(body.markdown), []),
		});
	}

	const entry = (post: Listed, content: string): string => [
		'\t<entry>',
		`\t\t<title>${escape(post.title)}</title>`,
		`\t\t<link rel="alternate" type="text/html" href="${urlOf(post)}"/>`,
		`\t\t<id>${urlOf(post)}</id>`,
		`\t\t<published>${stamp(post.date)}</published>`,
		`\t\t<updated>${stamp(post.updated ?? post.date)}</updated>`,
		`\t\t<summary>${escape(post.description)}</summary>`,
		`\t\t<content type="html">${escape(content)}</content>`,
		'\t</entry>',
	].join('\n');

	const atom = (self: string, entries: string): string => [
		'<?xml version="1.0" encoding="utf-8"?>',
		'<feed xmlns="http://www.w3.org/2005/Atom">',
		`\t<title>${escape(FEED_TITLE)}</title>`,
		`\t<subtitle>${escape(FEED_DESCRIPTION)}</subtitle>`,
		`\t<link rel="self" type="application/atom+xml" href="${SITE_URL}/${self}"/>`,
		`\t<link rel="alternate" type="text/html" href="${SITE_URL}/blog"/>`,
		`\t<id>${SITE_URL}/blog</id>`,
		`\t<updated>${updated}</updated>`,
		`\t<author><name>${escape(AUTHOR_NAME)}</name><uri>${SITE_URL}</uri></author>`,
		entries,
		'</feed>',
		'',
	].join('\n');

	const read = (post: Listed): string => `<p><a href="${urlOf(post)}">Read the whole post on torrin.me.</a></p>`;

	return {
		atom: atom('feed.xml', full.map(({ post, html }) => entry(post, html)).join('\n')),
		summary: atom('feed-summary.xml', full.map(({ post, summary }) => entry(post, `${summary}\n${read(post)}`)).join('\n')),
		json: `${JSON.stringify({
			version: 'https://jsonfeed.org/version/1.1',
			title: FEED_TITLE,
			home_page_url: `${SITE_URL}/blog`,
			feed_url: `${SITE_URL}/feed.json`,
			description: FEED_DESCRIPTION,
			language: 'en-CA',
			authors: [{ name: AUTHOR_NAME, url: SITE_URL }],
			items: full.map(({ post, html }) => ({
				id: urlOf(post),
				url: urlOf(post),
				title: post.title,
				summary: post.description,
				content_html: html,
				date_published: stamp(post.date),
				...(post.updated === undefined ? {} : { date_modified: stamp(post.updated) }),
				...(post.og === null ? {} : { image: `${SITE_URL}${post.og}` }),
			})),
		}, null, '\t')}\n`,
	};
};
