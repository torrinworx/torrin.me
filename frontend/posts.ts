// What a blog page reads: the index of every published post, bundled, and the body of one post,
// from memory on the server and from the post's twin in the browser.
//
// The index is content/blog.ts's output (frontend/data/posts.json), written before the bundle so
// both halves import the same file. A body is the markdown twin beside the pages plus, for a
// post with a fenced block, the tokens of its fences; both are files the same step wrote.

import { createContext } from '@aweftjs/ui';

import type { Fence, Token } from '../content/highlight.ts';
import index from './data/posts.json' with { type: 'json' };

/** A heading of a post, with the id the page gives it. */
export interface Heading {
	readonly level: number;
	readonly text: string;
	readonly id: string;
}

/** One line of the index: everything the site knows about a post but its body. */
export interface Listed {
	readonly slug: string;
	readonly title: string;
	readonly description: string;
	readonly date: string;
	readonly updated?: string;
	readonly discuss?: string;
	readonly image?: string;
	readonly words: number;
	readonly minutes: number;
	readonly headings: readonly Heading[];
	readonly posters: Readonly<Record<string, string>>;
	readonly og: string | null;
	readonly code: boolean;
}

export type { Fence, Token };

/** Every published post, newest first. */
export const posts: readonly Listed[] = index as readonly Listed[];

const bySlug = new Map(posts.map((post) => [post.slug, post]));

/** The index line of a post, or undefined for a slug that is not one. */
export const postAt = (slug: string): Listed | undefined => bySlug.get(slug);

/** The URL of a post's markdown twin, and of its tokens, under the site root. */
export const twinOf = (slug: string): string => `/blog/${slug}.md`;
export const tokensOf = (slug: string): string => `/blog/${slug}.tokens.json`;

/** A post's body: its markdown after the build's rewrites, and its fences as tokens. */
export interface Body {
	readonly markdown: string;
	readonly fences: readonly Fence[];
}

/** Where a post's body comes from. */
export interface Content {
	/** The body, when it is already here; the server always has it, the browser after a fetch. */
	peek(slug: string): Body | undefined;
	/** The body, fetched if need be. */
	read(slug: string): Promise<Body>;
	/**
	 * The page the server wrote for a post whose twin could not be read, to show as it stands so
	 * the reader keeps the post while the page around it comes alive. Answered once: a later
	 * visit to the post reads the twin again. Only the browser ever holds one.
	 */
	written?(slug: string): Node | undefined;
}

const nothing: Content = { peek: () => undefined, read: () => Promise.reject(new Error('no content')) };

/** The content a page reads. The server render and the browser entry each provide their own. */
export const ContentContext = createContext<Content>(nothing);

/** Content held whole in memory: what the server render reads. */
export const memory = (bodies: ReadonlyMap<string, Body>): Content => ({
	peek: (slug) => bodies.get(slug),
	read: (slug) => {
		const held = bodies.get(slug);
		return held === undefined ? Promise.reject(new Error(`${slug}: no such post`)) : Promise.resolve(held);
	},
});

/** Fetch one post's twin and, when it has code, its tokens. */
export const fetchBody = async (post: Listed): Promise<Body> => {
	const [twin, tokens] = await Promise.all([
		fetch(twinOf(post.slug)),
		post.code ? fetch(tokensOf(post.slug)) : Promise.resolve(null),
	]);
	if (!twin.ok) throw new Error(`${post.slug}: the twin answered ${String(twin.status)}`);
	if (tokens !== null && !tokens.ok) throw new Error(`${post.slug}: the tokens answered ${String(tokens.status)}`);
	return {
		markdown: await twin.text(),
		fences: tokens === null ? [] : (await tokens.json()) as Fence[],
	};
};

/**
 * Content fetched from each post's twin, with the first post's body handed in so the hydration
 * renders what the server rendered without waiting, or, when that twin could not be read, the
 * post's page as the server wrote it.
 */
export const fetching = (seed: readonly (readonly [string, Body])[], written?: readonly [slug: string, page: Node]): Content => {
	const held = new Map<string, Body>(seed);
	const pending = new Map<string, Promise<Body>>();
	let kept = written;
	return {
		peek: (slug) => held.get(slug),
		written: (slug) => {
			if (kept === undefined || kept[0] !== slug) return undefined;
			const page = kept[1];
			kept = undefined;
			return page;
		},
		read: (slug) => {
			const known = held.get(slug);
			if (known !== undefined) return Promise.resolve(known);
			const open = pending.get(slug);
			if (open !== undefined) return open;
			const post = postAt(slug);
			if (post === undefined) return Promise.reject(new Error(`${slug}: no such post`));
			// A failure is not kept: the next read asks again, so a post that was unreachable once
			// is not unreachable for the life of the tab.
			const promise = fetchBody(post).then((body) => {
				held.set(slug, body);
				return body;
			}).finally(() => { pending.delete(slug); });
			pending.set(slug, promise);
			return promise;
		},
	};
};
