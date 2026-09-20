// The blog: the index at /blog and a page per post at /blog/<slug>.
//
// Both are rendered from the index the build step wrote (frontend/data/posts.json) and, for a
// post, from its markdown twin through `Markdown`. The site adds around the markdown what the
// markdown cannot say: the head tags, the structured data, the date line, the contents list,
// and three modifiers (the YouTube poster, superscript, the callout). The same components render
// the post's body for the feeds, in `feed` mode, where nothing can be clicked.

import { mutable } from '@aweftjs/core';
import { Button, Head, Icon, Link, Markdown, Meta, Script, Title, Typography, h, suspend } from '@aweftjs/ui';
import type { Act, TextModifier } from '@aweftjs/ui';

import { AUTHOR_ID, SITE_URL, WEBSITE_ID } from '../head.tsx';
import { ContentContext, posts, postAt } from '../posts.ts';
import type { Body, Content, Fence, Listed } from '../posts.ts';

const BLOG_URL = `${SITE_URL}/blog`;
const BLOG_ID = `${BLOG_URL}#blog`;
const BLOG_TITLE = 'Blog';
const BLOG_DESCRIPTION = 'Notes from Torrin Leonard on building software, running a homelab and the tools worth owning.';

/** The absolute URL of a post. */
export const urlOf = (post: Listed): string => `${BLOG_URL}/${post.slug}`;

/** A date as the page shows it, from the day the front matter names, whatever its time zone. */
export const dateShown = (iso: string): string => {
	const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
	return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1))
		.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

/** The line under a title: the date and the reading time, in the label face. */
const PostMeta = (props: { post: Listed }): unknown => (
	<Typography type="date" theme="post_meta">
		<time datetime={props.post.date}>{dateShown(props.post.date)}</time>
		{` · ${String(props.post.minutes)} min read`}
	</Typography>
);

// --- the fences ---------------------------------------------------------------------------

/** The `code` hook for a post: each fence's tokens, looked up by what the block says. */
export const codeOf = (fences: readonly Fence[]) => {
	const held = new Map(fences.map((fence) => [`${fence.language ?? ''}\u0000${fence.text}`, fence]));
	return (text: string, language: string | null): unknown => {
		const fence = held.get(`${language ?? ''}\u0000${text}`);
		if (fence === undefined) return <code>{text}</code>;
		const last = fence.lines.length - 1;
		return (
			<code>
				{fence.lines.flatMap((line, at) => [
					...line.map((token) => (token[1] === undefined ? token[0] : <span theme={['code', token[1]]}>{token[0]}</span>)),
					at < last ? '\n' : null,
				])}
			</code>
		);
	};
};

// --- the modifiers ------------------------------------------------------------------------

// A paragraph that is one link to a YouTube video, which is what the build step turns an image
// line with a YouTube source into (content/blog.ts).
const VIDEO = /^\[([^\]\n]*)\]\(https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})\)$/g;
const SUPERSCRIPT = /\^([^\s^][^^\n]*?)\^/g;
const NOTE = /^Note:(?=\s)/g;
const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/** A run of text with its links as anchors, for the inside of a superscript. */
const linked = (text: string): unknown[] => {
	const out: unknown[] = [];
	let at = 0;
	for (const match of text.matchAll(LINK)) {
		if (match.index > at) out.push(text.slice(at, match.index));
		out.push(<a theme="markdown_link" href={match[2]!}>{match[1]!}</a>);
		at = match.index + match[0].length;
	}
	if (at < text.length) out.push(text.slice(at));
	return out;
};

/**
 * The site's modifiers for a post's markdown, run ahead of the markdown's own.
 *
 * Params:
 *   post: the index line, for the posters the build fetched
 *   feed: true for a feed body, where the video is a link with its poster and nothing waits for
 *         a click
 */
export const modifiersOf = (post: Listed, feed = false): TextModifier[] => [
	{
		check: VIDEO,
		return: (match) => {
			const parts = /^\[([^\]\n]*)\]\(https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})\)$/.exec(match)!;
			const label = parts[1]!;
			const id = parts[2]!;
			const poster = post.posters[id];
			const watch = `https://www.youtube.com/watch?v=${id}`;
			if (poster === undefined) return <a theme="markdown_link" href={watch}>{label}</a>;
			if (feed) return <a href={watch}><img src={poster} alt={label} width="480" height="270" /></a>;
			const playing = mutable(false);
			return playing.map((on) => (on
				? (
					<iframe
						theme="video_frame"
						src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
						title={label}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen={true}
						referrerpolicy="strict-origin-when-cross-origin"
					/>
				)
				: (
					<button
						type="button"
						theme="video"
						aria-label={`Play video: ${label}`}
						onClick={() => { playing.set(true); }}
					>
						<img theme="video_poster" src={poster} alt="" />
						<span theme="video_play">Play</span>
					</button>
				)));
		},
	},
	{
		check: SUPERSCRIPT,
		return: (match) => <sup theme="sup">{linked(match.slice(1, -1))}</sup>,
	},
	{
		check: NOTE,
		return: () => <strong theme="callout_label" data-callout="">Note</strong>,
	},
];

// --- the head and the structured data ---------------------------------------------------------

const absolute = (path: string): string => `${SITE_URL}${path}`;

const postJsonLd = (post: Listed): unknown => ({
	'@context': 'https://schema.org',
	'@type': 'BlogPosting',
	'@id': `${urlOf(post)}#post`,
	headline: post.title,
	description: post.description,
	url: urlOf(post),
	mainEntityOfPage: { '@type': 'WebPage', '@id': urlOf(post) },
	datePublished: post.date,
	dateModified: post.updated ?? post.date,
	author: { '@id': AUTHOR_ID },
	publisher: { '@id': AUTHOR_ID },
	...(post.og === null ? {} : { image: absolute(post.og) }),
	wordCount: post.words,
	inLanguage: 'en-CA',
	isPartOf: { '@id': BLOG_ID },
	...(post.discuss === undefined ? {} : { discussionUrl: post.discuss }),
});

const PostHead = (props: { post: Listed }): unknown => {
	const post = props.post;
	const url = urlOf(post);
	const image = post.og === null ? undefined : absolute(post.og);
	return (
		<Head>
			<Title>{`${post.title} | Torrin Leonard`}</Title>
			<Meta name="description" content={post.description} />
			<Meta property="og:title" content={post.title} />
			<Meta property="og:description" content={post.description} />
			<Meta property="og:type" content="article" />
			<Meta property="og:url" content={url} />
			{image === undefined ? null : <Meta property="og:image" content={image} />}
			<Meta property="article:published_time" content={post.date} />
			{post.updated === undefined ? null : <Meta property="article:modified_time" content={post.updated} />}
			<Meta property="article:author" content={SITE_URL} />
			<Meta name="twitter:title" content={post.title} />
			<Meta name="twitter:description" content={post.description} />
			{image === undefined ? null : <Meta name="twitter:image" content={image} />}
			<Link rel="canonical" href={url} />
			<Script key="post" type="application/ld+json">{JSON.stringify(postJsonLd(post))}</Script>
		</Head>
	);
};

const indexJsonLd = {
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'CollectionPage',
			'@id': `${BLOG_URL}#webpage`,
			url: BLOG_URL,
			name: `${BLOG_TITLE} | Torrin Leonard`,
			description: BLOG_DESCRIPTION,
			inLanguage: 'en-CA',
			isPartOf: { '@id': WEBSITE_ID },
			about: { '@id': AUTHOR_ID },
			mainEntity: { '@id': BLOG_ID },
		},
		{
			'@type': 'Blog',
			'@id': BLOG_ID,
			url: BLOG_URL,
			name: 'Torrin Leonard',
			description: BLOG_DESCRIPTION,
			inLanguage: 'en-CA',
			author: { '@id': AUTHOR_ID },
			publisher: { '@id': AUTHOR_ID },
			blogPost: posts.map((post) => ({
				'@type': 'BlogPosting',
				'@id': `${urlOf(post)}#post`,
				headline: post.title,
				url: urlOf(post),
				datePublished: post.date,
			})),
		},
	],
};

const IndexHead = (): unknown => (
	<Head>
		<Title>{`${BLOG_TITLE} | Torrin Leonard`}</Title>
		<Meta name="description" content={BLOG_DESCRIPTION} />
		<Meta property="og:title" content={`${BLOG_TITLE} | Torrin Leonard`} />
		<Meta property="og:description" content={BLOG_DESCRIPTION} />
		<Meta property="og:url" content={BLOG_URL} />
		<Meta name="twitter:title" content={`${BLOG_TITLE} | Torrin Leonard`} />
		<Meta name="twitter:description" content={BLOG_DESCRIPTION} />
		<Link rel="canonical" href={BLOG_URL} />
		<Script key="blog" type="application/ld+json">{JSON.stringify(indexJsonLd)}</Script>
	</Head>
);

// --- the pages ----------------------------------------------------------------------------

/** The contents list, from the post's second-level headings, when there are three or more. */
const Contents = (props: { post: Listed }): unknown => {
	const shown = props.post.headings.filter((heading) => heading.level === 2);
	if (shown.length < 3) return null;
	return (
		<nav theme="toc" aria-label="Contents">
			<Typography type="date" theme="toc_title" label="Contents" />
			<ol theme="toc_list">
				{shown.map((heading) => <li theme="toc_item"><a theme="toc_link" href={`#${heading.id}`}>{heading.text}</a></li>)}
			</ol>
		</nav>
	);
};

const Article = (props: { post: Listed; body: Body }): unknown => {
	const post = props.post;
	return (
		<article theme={['content', 'start', 'post']}>
			<PostHead post={post} />
			<header theme={['column', 'wide']} style={{ gap: 10 }}>
				<PostMeta post={post} />
				<Typography theme={['row', 'wide', 'start']} type="h1" label={post.title} />
				<Typography theme={['row', 'wide', 'start', 'post_lede']} type="p1" label={post.description} />
				<div theme="divider" style={{ marginTop: 6 }} />
			</header>
			<Contents post={post} />
			<Markdown source={props.body.markdown} code={codeOf(props.body.fences)} modifiers={modifiersOf(post)} theme="post" />
			<footer theme={['row', 'wrap', 'wide']} style={{ gap: 10, marginTop: 20 }}>
				{post.discuss === undefined ? null : (
					<Button
						type="quiet"
						label="Discuss on Hacker News"
						icon={<Icon name="feather:message-square" />}
						iconPosition="right"
						href={post.discuss}
					/>
				)}
				<Button
					type="quiet"
					label="All posts"
					icon={<Icon name="feather:arrow-left" />}
					href="/blog"
					hrefNewTab={false}
				/>
			</footer>
		</article>
	);
};

const Loading = (): unknown => <Typography type="p1" id="post-loading" label="Loading the post." />;
const Failed = (props: { error?: unknown }): unknown => (
	<Typography type="p1" role="alert" label={`The post could not be read: ${String(props.error)}`} />
);

const Missing = (): unknown => (
	<div theme="content" style={{ height: '60vh' }}>
		<Head>
			<Title>No such post | Torrin Leonard</Title>
			<Meta name="robots" content="noindex" />
		</Head>
		<Typography type="h1" style={{ textAlign: 'center' }} label="There is no post here" />
		<Typography type="p1" style={{ textAlign: 'center' }} label="The address names nothing on the blog." />
		<Button label="All posts" href="/blog" hrefNewTab={false} iconPosition="right" icon={<Icon name="feather:arrow-right" />} />
	</div>
);

/**
 * One post. Its body is read where it stands when it is already held, which the server always
 * has and the browser has for the post it arrived on, so the hydration renders what the server
 * wrote; a post reached by a click is fetched and shows the loader meanwhile.
 */
const PostPage = ContentContext.use((content: Content) => (props: { stage?: { params: { get(): Readonly<Record<string, string>> } } }): unknown => {
	const slug = props.stage?.params.get()['slug'] ?? '';
	const post = postAt(slug);
	if (post === undefined) return <Missing />;
	const held = content.peek(slug);
	if (held !== undefined) return <Article post={post} body={held} />;
	const Later = suspend(Loading, async () => <Article post={post} body={await content.read(slug)} />, Failed);
	return <Later />;
});

const Entry = (props: { post: Listed }): unknown => (
	<li theme={['column', 'wide', 'blog_entry']}>
		<PostMeta post={props.post} />
		<a theme="blog_title" href={`/blog/${props.post.slug}`}>
			<Typography type="h2" label={props.post.title} />
		</a>
		<Typography type="p1" label={props.post.description} />
	</li>
);

const Index = (): unknown => (
	<div theme={['content', 'start']}>
		<IndexHead />
		<Typography theme={['row', 'wide', 'start']} type="h1" label={BLOG_TITLE} />
		<Typography theme={['row', 'wide', 'start']} type="p1" label={BLOG_DESCRIPTION} />
		<div theme="divider" />
		<ol theme="blog_list">
			{posts.map((post) => <Entry post={post} />)}
		</ol>
		<Button
			type="quiet"
			label="Feed"
			title="The Atom feed of every post"
			icon={<Icon name="feather:rss" />}
			iconPosition="right"
			href="/feed.xml"
		/>
	</div>
);

/** The two acts: the index, and a page per published post, which the static walk lists from the index. */
export const blogActs: Record<string, Act> = {
	blog: Index,
	'blog/:slug': Object.assign(PostPage, { entries: () => Promise.resolve(posts.map((post) => ({ slug: post.slug }))) }),
};
