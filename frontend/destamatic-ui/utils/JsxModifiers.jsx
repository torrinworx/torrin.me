export const codeColours = {
	fg: '#D4D4D4',
	comment: '#6A9955',
	keyword: '#569CD6',
	string: '#CE9178',
	number: '#B5CEA8',
	function: '#DCDCAA',
	property: '#9CDCFE',
	classOrComponent: '#4EC9B0',
	tag: '#569CD6',
	attr: '#9CDCFE',
	punctuation: '#D4D4D4',
	operator: '#D4D4D4',
	jsxBraces: '#FFD700',
};

export const codeStyles = (style) => ({
	display: 'inline',
	color: codeColours.fg,
	...style,
});

// JSX tag matcher that allows `>` inside {...} (so `=>` doesn't terminate the tag)

const JSX_TAG_RE =
	/<\/?[A-Za-z](?:[^<>"'{}]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\{(?:[^{}"'`]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\{[^{}]*\})*\})*\/?>/g;

const highlightInlineExpr = (expr, typographyTheme) => {
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
		else if (/^\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|new|class|extends|super|import|from|export|default|as|in|of|await|async|yield)\b$/.test(t)) style = codeStyles({ color: codeColours.keyword });
		else if (/^(\.\.\.|=>|===|!==|==|!=|<=|>=|\+\+|--|\|\||&&|\?\?)$/.test(t)) style = codeStyles({ color: codeColours.operator });
		else if (/^[+\-*/%<>=!&|^~?:.,;()[\]{}]$/.test(t)) style = codeStyles({ color: codeColours.punctuation });

		out.push(style ? <span theme={typographyTheme} style={style}>{t}</span> : t);

		last = m.index + t.length;
	}

	if (last < expr.length) out.push(expr.slice(last));
	return out;
};

const renderJsxTag = (tagText, typographyTheme) => {
	const out = [];
	const push = (text, style) =>
		out.push(style ? <span theme={typographyTheme} style={codeStyles(style)}>{text}</span> : text);

	let i = 0;
	const len = tagText.length;

	const isIdentStart = (ch) => /[A-Za-z_:$]/.test(ch);
	const isIdent = (ch) => /[A-Za-z0-9_:$.\-]/.test(ch);

	const readWhile = (pred) => {
		const start = i;
		while (i < len && pred(tagText[i])) i++;
		return tagText.slice(start, i);
	};

	if (tagText.startsWith('</')) {
		push('</', { color: codeColours.punctuation });
		i = 2;
	} else {
		push('<', { color: codeColours.punctuation });
		i = 1;
	}

	const name = readWhile((ch) => isIdent(ch));
	const isComponent = !!name && /[A-Z]/.test(name[0]);
	push(name, { color: isComponent ? codeColours.classOrComponent : codeColours.tag });

	while (i < len) {
		const ws = readWhile((ch) => /\s/.test(ch));
		if (ws) push(ws);

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

		if (tagText[i] === '{') {
			let depth = 0;
			const start = i;

			while (i < len) {
				const ch = tagText[i];

				if (ch === '"' || ch === "'") {
					const quote = ch;
					i++;
					while (i < len) {
						const cc = tagText[i++];
						if (cc === '\\') i++;
						else if (cc === quote) break;
					}
					continue;
				}

				if (ch === '{') depth++;
				if (ch === '}') depth--;
				i++;

				if (depth === 0) break;
			}

			const chunk = tagText.slice(start, i);
			push('{', { color: codeColours.jsxBraces });
			const inner = chunk.slice(1, -1);
			out.push(...highlightInlineExpr(inner, typographyTheme));
			push('}', { color: codeColours.jsxBraces });
			continue;
		}

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

				if (tagText[i] === '"' || tagText[i] === "'") {
					const quote = tagText[i];
					const start = i;
					i++;
					while (i < len) {
						const ch = tagText[i];
						i++;
						if (ch === '\\') { if (i < len) i++; continue; }
						if (ch === quote) break;
					}
					const val = tagText.slice(start, i);
					push(val, { color: codeColours.string });
					continue;
				}

				if (tagText[i] === '{') {
					let depth = 0;
					const start = i;

					while (i < len) {
						const ch = tagText[i];

						if (ch === '"' || ch === "'") {
							const quote = ch;
							i++;
							while (i < len) {
								const cc = tagText[i++];
								if (cc === '\\') i++;
								else if (cc === quote) break;
							}
							continue;
						}

						if (ch === '{') depth++;
						if (ch === '}') depth--;
						i++;
						if (depth === 0) break;
					}

					const chunk = tagText.slice(start, i);
					push('{', { color: codeColours.jsxBraces });
					const inner = chunk.slice(1, -1);
					out.push(...highlightInlineExpr(inner, typographyTheme));
					push('}', { color: codeColours.jsxBraces });
					continue;
				}
			}

			continue;
		}

		push(tagText[i], { color: codeColours.fg });
		i++;
	}

	return <span theme={typographyTheme} style={codeStyles({ color: codeColours.fg })}>{out}</span>;
};

const makeJsxModifiers = () => {
	const tok = (regex, style) => ({
		check: regex,
		atomic: false,
		return: (match, { typographyTheme }) =>
			<span theme={typographyTheme} style={codeStyles(style)}>{match}</span>,
	});

	return [
		{
			check: JSX_TAG_RE,
			atomic: true,
			return: (match, { typographyTheme }) => renderJsxTag(match, typographyTheme),
		},

		// ligatures
		{
			check: /-->|->|=>|<=|>=|!=/g,
			atomic: true,
			return: (s, { typographyTheme }) =>
				<span theme={typographyTheme} style={codeStyles({ color: codeColours.operator })}>{s}</span>,
		},

		// comments
		tok(/\/\*[\s\S]*?\*\//g, { color: codeColours.comment, fontStyle: 'italic' }),
		tok(/\/\/.*$/gm, { color: codeColours.comment, fontStyle: 'italic' }),

		// template strings
		tok(/`(?:\\.|[^`\\])*`/g, { color: codeColours.string }),

		// normal strings
		tok(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, { color: codeColours.string }),

		// numbers
		tok(/\b0[xX][0-9a-fA-F]+\b/g, { color: codeColours.number }),
		tok(/\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?n?\b/g, { color: codeColours.number }),

		// keywords + literals
		tok(/\b(?:const|let|var|function|return|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|new|class|extends|super|import|from|export|default|as|in|of|await|async|yield)\b/g, { color: codeColours.keyword }),
		tok(/\b(?:true|false|null|undefined)\b/g, { color: codeColours.keyword }),

		// function name
		{
			check: /\b[A-Za-z_$][\w$]*(?=\s*\()/g,
			atomic: false,
			return: (match, { typographyTheme }) =>
				<span theme={typographyTheme} style={codeStyles({ color: codeColours.function })}>{match}</span>,
		},

		// property access: .map
		{
			check: /\.[A-Za-z_$][\w$]*/g,
			atomic: false,
			return: (match, { typographyTheme }) => (
				<span theme={typographyTheme} style={codeStyles({ color: codeColours.fg })}>
					<span theme={typographyTheme} style={codeStyles({ color: codeColours.punctuation })}>.</span>
					<span theme={typographyTheme} style={codeStyles({ color: codeColours.property })}>{match.slice(1)}</span>
				</span>
			),
		},

		// operators
		tok(/===|!==|==|!=|<=|>=|\+\+|--|\|\||&&|\?\?|\.\.\.|=>|[+\-*/%<>=!&|^~?:]/g, { color: codeColours.operator }),

		// punctuation
		tok(/[()[\]{},.;]/g, { color: codeColours.punctuation }),
	];
};

export const modifiers = makeJsxModifiers();
