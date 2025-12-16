import { Observer } from 'destam';
import { mount as domMount } from 'destam-dom';

import compileHTMLLiteral from './htmlLiteral';

import {
	h as hRaw,
	Paper,
	Typography,
	Button,
	Shown,
	ThemeContext,
	RichArea,
	TextModifiers,
	Theme,
	is_node,
} from 'destamatic-ui';

const codeColours = {
	fg: '#D4D4D4',
	comment: '#6A9955',
	keyword: '#569CD6',
	string: '#CE9178',
	number: '#B5CEA8',
	function: '#DCDCAA',
	property: '#9CDCFE',
	variable: '#9CDCFE',
	classOrComponent: '#4EC9B0',
	tag: '#569CD6',
	attr: '#9CDCFE',
	punctuation: '#D4D4D4',
	operator: '#D4D4D4',
	jsxBraces: '#FFD700',
};

const codeStyles = (style) => ({ display: 'inline', ...style });

const JSX_TAG_RE =
	/<\/?[A-Za-z](?:[^<>"'{}]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\{(?:[^{}"'`]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\{[^{}]*\})*\})*\/?>/g;

/** Small tokenizer for stuff inside `{ ... }` in JSX attributes */
const highlightInlineExpr = (expr) => {
	const out = [];
	const token =
		/(\s+|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|new|class|extends|super|import|from|export|default|as|in|of|await|async|yield)\b|\b(?:true|false|null|undefined)\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?n?\b|=>|===|!==|==|!=|<=|>=|\+\+|--|\|\||&&|\?\?|\.\.\.|[+\-*/%<>=!&|^~?:.,;()[\]{}])/g;

	let last = 0;
	let m;

	while ((m = token.exec(expr)) !== null) {
		if (m.index > last) out.push(expr.slice(last, m.index));

		const t = m[0];
		let style = null;

		if (/^\s+$/.test(t)) style = null;
		else if (t.startsWith('"') || t.startsWith("'") || t.startsWith('`')) style = codeStyles({ color: codeColours.string });
		else if (/^\b\d/.test(t)) style = codeStyles({ color: codeColours.number });
		else if (/^\b(true|false|null|undefined)\b$/.test(t)) style = codeStyles({ color: codeColours.keyword });
		else if (
			/^\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|new|class|extends|super|import|from|export|default|as|in|of|await|async|yield)\b$/.test(
				t
			)
		)
			style = codeStyles({ color: codeColours.keyword });
		else if (/^(\.\.\.|=>|===|!==|==|!=|<=|>=|\+\+|--|\|\||&&|\?\?)$/.test(t)) style = codeStyles({ color: codeColours.operator });
		else if (/^[+\-*/%<>=!&|^~?:.,;()[\]{}]$/.test(t)) style = codeStyles({ color: codeColours.punctuation });

		out.push(style ? <span style={style}>{t}</span> : t);
		last = m.index + t.length;
	}

	if (last < expr.length) out.push(expr.slice(last));
	return out;
};

/**
 * JSX tag renderer:
 * - colors < / > punctuation
 * - tag name (component vs html)
 * - attributes
 * - quoted values
 * - {...} values w/ basic inner highlighting
 */
const renderJsxTag = (tagText) => {
	const out = [];
	const push = (text, style) => out.push(style ? <span style={codeStyles(style)}>{text}</span> : text);

	let i = 0;
	const len = tagText.length;

	const isIdentStart = (ch) => /[A-Za-z_:$]/.test(ch);
	const isIdent = (ch) => /[A-Za-z0-9_:$.\-]/.test(ch);

	const readWhile = (pred) => {
		const start = i;
		while (i < len && pred(tagText[i])) i++;
		return tagText.slice(start, i);
	};

	// < or </
	if (tagText.startsWith('</')) {
		push('</', { color: codeColours.punctuation });
		i = 2;
	} else {
		push('<', { color: codeColours.punctuation });
		i = 1;
	}

	// tag name
	const name = readWhile((ch) => isIdent(ch));
	const isComponent = !!name && /[A-Z]/.test(name[0]);
	push(name, { color: isComponent ? codeColours.classOrComponent : codeColours.tag });

	while (i < len) {
		// whitespace
		const ws = readWhile((ch) => /\s/.test(ch));
		if (ws) push(ws);

		// enders
		if (tagText.slice(i, i + 2) === '/>') {
			push('/>', { color: codeColours.punctuation });
			i += 2;
			break;
		}
		if (tagText[i] === '>') {
			push('>', { color: codeColours.punctuation });
			i += 1;
			break;
		}

		// JSX spread / expression chunk: {...something}
		if (tagText[i] === '{') {
			let depth = 0;
			let start = i;

			// consume balanced braces (handles nested {{ ... }})
			while (i < len) {
				const ch = tagText[i];

				if (ch === '"' || ch === "'") {
					const quote = ch;
					i++;
					while (i < len) {
						const cc = tagText[i++];
						if (cc === '\\') i++; // skip escaped
						else if (cc === quote) break;
					}
					continue;
				}

				if (ch === '{') depth++;
				if (ch === '}') depth--;
				i++;

				if (depth === 0) break;
			}

			const chunk = tagText.slice(start, i); // includes braces
			// render: "{" + inner + "}"
			push('{', { color: codeColours.jsxBraces });
			const inner = chunk.slice(1, -1);
			out.push(...highlightInlineExpr(inner));
			push('}', { color: codeColours.jsxBraces });
			continue;
		}

		// attribute name
		if (isIdentStart(tagText[i])) {
			const attrName = readWhile((ch) => isIdent(ch));
			push(attrName, { color: codeColours.attr });

			const ws2 = readWhile((ch) => /\s/.test(ch));
			if (ws2) push(ws2);

			if (tagText[i] === '=') {
				push('=', { color: codeColours.punctuation });
				i++;

				const ws3 = readWhile((ch) => /\s/.test(ch));
				if (ws3) push(ws3);

				// quoted value (graceful while typing: stop at newline if quote isn't closed)
				if (tagText[i] === '"' || tagText[i] === "'") {
					const quote = tagText[i];
					const start = i;
					i++; // consume opening quote

					while (i < len) {
						const ch = tagText[i];

						// If the user hasn't closed the quote yet, don't eat the next line/attribute.
						if (ch === '\n' || ch === '\r') break;

						i++;
						if (ch === '\\') {
							if (i < len) i++; // escaped char
							continue;
						}
						if (ch === quote) break;
					}

					const val = tagText.slice(start, i);
					push(val, { color: codeColours.string });
					continue;
				}

				if (tagText[i] === '{') {
					const looksLikeNextAttr = (pos) => {
						// pos is right after a newline; skip indentation
						let j = pos;
						while (j < len && (tagText[j] === ' ' || tagText[j] === '\t')) j++;
						const rest = tagText.slice(j);

						// next attr-ish token: foo=  OR foo>  OR foo/>
						return /^[A-Za-z_$][\w$:\-]*\s*(=|\/?>)/.test(rest);
					};

					let depth = 0;
					const start = i;

					while (i < len) {
						const ch = tagText[i];

						// Respect strings inside the expression
						if (ch === '"' || ch === "'") {
							const quote = ch;
							i++;
							while (i < len) {
								const cc = tagText[i++];
								if (cc === '\\') i++;
								else if (cc === quote) break;
								else if (cc === '\n' || cc === '\r') break; // don’t run away while typing
							}
							continue;
						}

						if (ch === '{') depth++;
						if (ch === '}') depth--;
						i++;

						if (depth === 0) break;

						// Graceful while typing: if braces aren't closed and we hit a newline that
						// clearly starts a new attribute, stop the expression here.
						if ((ch === '\n' || ch === '\r') && depth > 0 && looksLikeNextAttr(i)) {
							break;
						}
					}

					const chunk = tagText.slice(start, i); // maybe incomplete
					push('{', { color: codeColours.jsxBraces });
					const inner = chunk.slice(1); // if incomplete, no trailing }
					out.push(...highlightInlineExpr(inner.endsWith('}') ? inner.slice(0, -1) : inner));
					if (chunk.endsWith('}')) push('}', { color: codeColours.jsxBraces });

					continue;
				}
			}

			continue;
		}

		// fallback: unknown char
		push(tagText[i], { color: codeColours.fg });
		i++;
	}

	return <span style={codeStyles({ color: codeColours.fg })}>{out}</span>;
};

const makeJsxModifiers = () => {
	const tok = (regex, style) => ({
		check: regex,
		atomic: false,
		return: (match) => <span style={codeStyles(style)}>{match}</span>,
	});

	return [
		// Comments first so nothing inside them gets highlighted
		tok(/\/\*[\s\S]*?\*\//g, { color: codeColours.comment, fontStyle: 'italic' }),
		tok(/\/\/.*$/gm, { color: codeColours.comment, fontStyle: 'italic' }),

		// JSX tags (multi-line, non-greedy)
		{
			check: /<\/?[A-Za-z][\s\S]*?>/g,
			atomic: false,
			return: (match) => renderJsxTag(match),
		},

		// Template strings (basic)
		tok(/`(?:\\.|[^`\\])*`/g, { color: codeColours.string }),

		// Regular strings
		tok(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, { color: codeColours.string }),

		// Numbers
		tok(/\b0[xX][0-9a-fA-F]+\b/g, { color: codeColours.number }),
		tok(/\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?n?\b/g, { color: codeColours.number }),

		// Keywords
		tok(
			/\b(?:const|let|var|function|return|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|new|class|extends|super|import|from|export|default|as|in|of|await|async|yield)\b/g,
			{ color: codeColours.keyword }
		),
		tok(/\b(?:true|false|null|undefined)\b/g, { color: codeColours.keyword }),

		// Common globals / builtins
		tok(
			/\b(?:Array|Object|String|Number|Boolean|Promise|Map|Set|Date|RegExp|Error|Math|JSON|console|document|window|Symbol|BigInt)\b/g,
			{ color: codeColours.property }
		),

		// Function call name: foo(
		{
			check: /\b[A-Za-z_$][\w$]*(?=\s*\()/g,
			atomic: false,
			return: (match) => <span style={codeStyles({ color: codeColours.function })}>{match}</span>,
		},

		// Property access: .map
		{
			check: /\.[A-Za-z_$][\w$]*/g,
			atomic: false,
			return: (match) => (
				<span style={codeStyles({ color: codeColours.fg })}>
					<span style={codeStyles({ color: codeColours.punctuation })}>.</span>
					<span style={codeStyles({ color: codeColours.property })}>{match.slice(1)}</span>
				</span>
			),
		},

		// Operators (rough)
		tok(/===|!==|==|!=|<=|>=|\+\+|--|\|\||&&|\?\?|\.\.\.|=>|[+\-*/%<>=!&|^~?:]/g, { color: codeColours.operator }),

		// Punctuation
		tok(/[()[\]{},.;]/g, { color: codeColours.punctuation }),

		{
			check: JSX_TAG_RE,
			atomic: false,
			return: (match) => renderJsxTag(match),
		},
	];
};

const modifiers = makeJsxModifiers();

export const Playground = ThemeContext.use((h) => ({ code }, cleanup, mounted) => {
	if (is_node()) return null;

	if (!(code instanceof Observer)) code = Observer.mutable(code);

	const rootRef = Observer.mutable(null);
	const error = Observer.mutable('');
	const running = Observer.mutable(false);

	// Keep destroy handle for reruns
	let destroy = null;

	const run = () => {
		try {
			running.set(true);
			error.set('');

			let root = rootRef.get();
			if (!root) return;
			if (root && root.elem_) root = root.elem_;

			if (!root.insertBefore || !root.replaceChild || !root.removeChild) {
				throw new Error('Playground root is not a mountable DOM node');
			}

			if (destroy) {
				destroy();
				destroy = null;
			}
			root.innerHTML = '';

			const runtimeHeader = `
"use strict";
const { h, Observer, Button, Typography, mount, root } = __runtime;
`;

			const source = runtimeHeader + '\n' + (code.get() || '');

			const { code: compiled } = compileHTMLLiteral(source, {
				sourceFileName: 'Playground.jsx',
				plugins: ['jsx'],
			});

			const fn = new Function('__runtime', compiled);

			fn({
				h: hRaw,
				Observer,
				Button,
				Typography,
				root,
				mount: (elem, node) => {
					if (elem && elem.elem_) elem = elem.elem_;
					destroy = domMount(elem, node);
					return destroy;
				},
			});
		} catch (e) {
			console.error(e);
			error.set(String(e?.stack || e?.message || e));
		} finally {
			running.set(false);
		}
	};

	// effect renders initial dom and any changes when `code` changes.
	let codeEffect;
	mounted(() => codeEffect = code.effect(() => run()));
	cleanup(codeEffect);

	cleanup(() => {
		if (destroy) destroy();
		destroy = null;
	});

	const RichAreaTheme = {
		field: {
			extends: 'radius_typography_p1_regular_focusable',
			outline: 0,
			padding: 10,
			background: 'none',
			color: codeColours.fg,
		},
	};

	return <Paper theme="column_fill" style={{ gap: 12, padding: 12 }}>
		<div theme="row_spread" style={{gap: 10 }}>
			<Typography type="h4" label="Playground" />
			<Button type='text' label='test' />
		</div>

		<div theme="row_fill" style={{ gap: 10, ualignItems: 'stretch' }}>
			<div theme='column' style={{ gap: 10,flex: 2, minWidth: 320 }}>
				<Typography type="p2" label="Code" />

				<Theme value={RichAreaTheme}>
					<TextModifiers value={modifiers}>
						<RichArea value={code} type="p1" style={{ background: '#0E0E0E', height: 500 }} maxHeight={500} />
					</TextModifiers>
				</Theme>
			</div>

			<div theme='column' style={{ gap: 10, flex: 1, minWidth: 320 }}>
				<Typography type="p2" label="Preview" />
				<div
					theme='radius_field'
					ref={rootRef}
					style={{
						minHeight: 500,
						background: 'none',
					}}
				/>
			</div>
		</div>

		<Shown value={error.map((e) => !!e)}>
			<Typography type="p2" label={error} style={{ whiteSpace: 'pre-wrap' }} />
		</Shown>
	</Paper>;
});

export default Playground;

/*
TODO: Library import mimicking, mimic 'import { Button } from 'destamatic-ui'', all exports from destamatic-ui, destam-dom, and destam.

TODO: Update hot reloading logic:
hot reloading on each character change of code string, however, if any given update results in a compiling error, display the error and don't
update until in a safe compile state again. normal console errors should just appear as normal in the actual console.
*/
