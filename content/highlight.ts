// A fenced block as tokens, at build time, so the page bundle carries no grammar and the server
// and the browser render one tree from the same data.
//
// shiki reads the grammar; the colours are not its. Its theme here paints each kind of token a
// placeholder colour that is read straight back into a kind name, and the site's theme gives a
// kind its colour (`code_keyword`, `code_string`, ...) beside every other colour on the page.

import { bundledLanguages, createHighlighter } from 'shiki';
import type { BundledLanguage, ThemeRegistration } from 'shiki';

/** What a token is: one of these, or plain text when the grammar names nothing the theme colours. */
export type Kind = 'comment' | 'string' | 'keyword' | 'number' | 'function' | 'tag' | 'variable';

/** One token: its text, and its kind when it has one. */
export type Token = readonly [text: string] | readonly [text: string, kind: Kind];

/** One fenced block: what it was called with, and its lines of tokens. */
export interface Fence {
	readonly language: string | null;
	readonly text: string;
	readonly lines: readonly (readonly Token[])[];
}

// A placeholder colour per kind, and the scopes the grammars put under it.
const KINDS: readonly (readonly [Kind, string, readonly string[]])[] = [
	['comment', '#000001', ['comment', 'punctuation.definition.comment']],
	['string', '#000002', ['string', 'punctuation.definition.string']],
	['keyword', '#000003', ['keyword', 'storage', 'storage.type']],
	['number', '#000004', ['constant.numeric', 'constant.language', 'constant.character']],
	['function', '#000005', ['entity.name.function', 'support.function', 'meta.function-call']],
	['tag', '#000006', ['entity.name.tag', 'entity.name.type', 'support.type', 'support.class']],
	['variable', '#000007', ['variable', 'punctuation.definition.variable']],
];
const PLAIN = '#000000';

const theme: ThemeRegistration = {
	name: 'kinds',
	type: 'light',
	fg: PLAIN,
	bg: '#ffffff',
	colors: {},
	tokenColors: KINDS.map(([, foreground, scope]) => ({ scope: [...scope], settings: { foreground } })),
};
const kindOf = new Map<string, Kind>(KINDS.map(([kind, colour]) => [colour, kind]));

/** Whether shiki has a grammar under this fence name. */
export const known = (language: string | null): language is BundledLanguage => language !== null && language in bundledLanguages;

/**
 * Tokenize every fenced block of a site.
 *
 * Params:
 *   fences: each block's language and text, in any order
 *
 * Returns: the same blocks with their lines of tokens. A block whose language shiki has no
 * grammar for is one plain token per line.
 *
 * Example:
 *   await highlight([{ language: 'bash', text: 'echo "$HOME"' }]);
 *   // [{ language: 'bash', text: ..., lines: [[['echo '], ['"', 'string'], ['$HOME', 'variable'], ['"', 'string']]] }]
 */
export const highlight = async (fences: readonly { language: string | null; text: string }[]): Promise<Fence[]> => {
	const langs = [...new Set(fences.map((fence) => fence.language).filter(known))];
	if (langs.length === 0) return fences.map((fence) => ({ ...fence, lines: plain(fence.text) }));
	const highlighter = await createHighlighter({ themes: [theme], langs });
	try {
		return fences.map((fence) => {
			if (!known(fence.language)) return { ...fence, lines: plain(fence.text) };
			const { tokens } = highlighter.codeToTokens(fence.text, { lang: fence.language, theme: 'kinds' });
			const lines = tokens.map((line) => line.map((token): Token => {
				const kind = token.color === undefined ? undefined : kindOf.get(token.color.toLowerCase());
				return kind === undefined ? [token.content] : [token.content, kind];
			}));
			return { ...fence, lines };
		});
	} finally {
		highlighter.dispose();
	}
};

const plain = (text: string): (readonly Token[])[] => text.split('\n').map((line) => [[line]]);
