import { Observer, TextModifiers, Typography, Button, Checkbox, Theme, Icon } from '@destamatic/ui';

Theme.define({
	markdown: {
		display: 'block',
	},

	markdown_block: {
		marginBottom: 12,
	},

	markdown_codeblock: {
		display: 'block',
		marginTop: 10,
		marginBottom: 10,
		padding: 10,
		borderRadius: 8,
		overflowX: 'auto',
		whiteSpace: 'pre',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
		background: 'rgba(0, 0, 0, 0.08)',
		width: '100%',
		maxWidth: '100%',
		minWidth: 0,
		boxSizing: 'border-box',
		overflowWrap: 'normal',
	},

	markdown_inlinecode: {
		padding: '1px 6px',
		borderRadius: 6,
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
		background: 'rgba(0, 0, 0, 0.10)',
	},

	markdownimg: {
		extends: 'radius',
		display: 'block',
		maxWidth: '100%',
		height: 'auto',
		marginTop: 20,
		marginBottom: 20,
	},

	markdown_video: {
		extends: 'radius',
		display: 'block',
		maxWidth: '100%',
		height: 'auto',
		maxHeight: 'clamp(600px, 35vw, 800px)',
		marginTop: 20,
		marginBottom: 20,
	},

	markdown_embed: {
		extends: 'radius',
		display: 'block',
		maxWidth: '100%',
		height: 'clamp(600px, 35vw, 800px)',
		marginTop: 20,
		marginBottom: 20,
		overflow: 'hidden',
	},

	markdown_ul: {
		marginTop: 6,
		marginBottom: 6,
		paddingLeft: 22,
		listStyleType: 'disc',
		listStylePosition: 'outside',
		color: '$color',
	},

	markdown_ol: {
		marginTop: 6,
		marginBottom: 6,
		paddingLeft: 22,

		listStyleType: 'decimal',
		listStylePosition: 'outside',

		color: '$color',
	},

	markdown_li: {
		display: 'list-item',
		color: '$color',
		marginTop: 4,
		marginBottom: 4,
	},

	markdown_task: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: 8,
	},

	markdown_quote: {
		borderLeft: '3px solid rgba(0, 0, 0, 0.2)',
		paddingLeft: 12,
		marginTop: 10,
		marginBottom: 10,
		opacity: 0.95,
	},

	markdown_sup: {
		extends: 'typography_p1',
		display: 'inline-flex',
		alignItems: 'baseline',
		gap: 4,
	},

	markdown_cite: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: 4,
		margin: 0,
		lineHeight: 1,
		whiteSpace: 'nowrap',
	},

	markdown_footnotes: {
		marginTop: 8,
	},

	markdown_footnote_label: {
		display: 'inline-block',
		minWidth: 28,
		opacity: 0.7,
	},
});

const escapeRe = /\\([\\`*_{}\[\]()#+\-.!|<>])/g;

// supports 1-level nested parentheses inside the url
const imgRe = /!\[[^\]]*?\]\((?:[^()\n]|(?:\([^()\n]*\)))*\)/g;
const linkRe = /\[[^\]]+?\]\((?:[^()\n]|(?:\([^()\n]*\)))*\)/g;

const parseLinkToken = (token) => {
	// token: [text](href "optional title")
	if (!token.startsWith('[') || !token.endsWith(')')) return null;

	const mid = token.indexOf('](');
	if (mid === -1) return null;

	const text = token.slice(1, mid);
	const inner = token.slice(mid + 2, -1); // inside (...)

	// optional title: [text](href "title")
	const m = inner.match(/^(.*?)(?:\s+"([^"]*)")?\s*$/);
	if (!m) return null;

	const href = (m[1] || '').trim();
	const title = m[2] ?? null;

	return { text, href, title };
};

const parseImageToken = (token) => {
	// token: ![alt](src "optional title")
	if (!token.startsWith('![') || !token.endsWith(')')) return null;

	const mid = token.indexOf('](');
	if (mid === -1) return null;

	const alt = token.slice(2, mid);
	const inner = token.slice(mid + 2, -1);

	const m = inner.match(/^(.*?)(?:\s+"([^"]*)")?\s*$/);
	if (!m) return null;

	const src = (m[1] || '').trim();
	const title = m[2] ?? null;

	return { alt, src, title };
};

const videoMimeTypes = {
	mp4: 'video/mp4',
	webm: 'video/webm',
	ogg: 'video/ogg',
};

const getVideoMimeType = (src) => {
	if (!src) return null;
	const cleaned = src.split('?')[0].split('#')[0];
	const match = cleaned.match(/\.([a-z0-9]+)$/i);
	if (!match) return null;
	const ext = match[1].toLowerCase();
	return videoMimeTypes[ext] || null;
};

const getYoutubeEmbedUrl = (src) => {
	if (!src) return null;
	const match = src.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*?&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
	if (!match) return null;
	return `https://www.youtube.com/embed/${match[1]}?rel=0`;
};

const inlineCodeDoubleRe = /``([\s\S]+?)``/g;
const inlineCodeSingleRe = /`([^`\n]+?)`/g;

const superscriptRe = /\^([^\n^]+?)\^/g;
const citationRefRe = /\[([^\]\n]+?)\]\[([^\]\n]+?)\]/g;
const citationBareRe = /\[(\^?[^\]\n]+?)\](?!\()/g;
const citationRefSingleRe = /^\[([^\]\n]+?)\]\[([^\]\n]+?)\]$/;
const citationBareSingleRe = /^\[(\^?[^\]\n]+?)\]$/;

const boldItalicARe = /(?<!\*)\*\*\*([^\n]+?)\*\*\*(?!\*)/g;
const boldItalicBRe = /(?<!_)___([^\n]+?)___(?!_)/g;
const boldItalicCRe = /__\*([^\n]+?)\*__/g;
const boldItalicDRe = /\*\*_([^\n]+?)_\*\*/g;

const boldARe = /(?<!\*)\*\*([^\n]+?)\*\*(?!\*)/g;
const boldBRe = /(?<!_)__([^\n]+?)__(?!_)/g;

const italicARe = /(?<!\*)\*([^*\n]+?)\*(?!\*)/g;
const italicBRe = /(?<!_)_([^_\n]+?)_(?!_)/g;

const normalizeFootnoteId = (id) => (id || '').trim().replace(/^\^/, '');

const renderCitationButton = ({ href, title, label, compact = false }) => {
	const inlineLabel = compact
		? <Typography
			type='inline'
			label={Observer.immutable(label)}
			theme='typography_inline'
		/>
		: label;

	const iconSize = compact ? '0.65em' : '0.8em';
	const buttonStyle = compact
		? { fontSize: '0.7em', padding: 0, minHeight: 'auto', lineHeight: 1 }
		: { lineHeight: 1 };

	return (
		<span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
			<Button
				type="link"
				inline
				track={false}
				href={href}
				title={title || href}
				label={inlineLabel}
				iconPosition="right"
				style={buttonStyle}
				icon={<Icon name="feather:external-link" style={{ display: 'inline-block', width: iconSize, height: iconSize }} />}
			/>
		</span>
	);
};

const makeDefaultModifiers = (footnotes) => {
	const hasFootnotes = footnotes instanceof Map && footnotes.size > 0;

	const citationModifiers = hasFootnotes
		? [
			{
				check: citationRefRe,
				atomic: true,
				return: (match, ctx) => {
					const m = match.match(citationRefSingleRe);
					if (!m) return match;

					const rawLabel = m[1];
					const rawId = m[2];
					const id = normalizeFootnoteId(rawId);
					const footnote = footnotes.get(id);
					if (!footnote || !footnote.href) return match;

					const compact = ctx?.parentModifier === 'superscript';

					return (
						<cite theme='markdown_cite'>
							{renderCitationButton({
								href: footnote.href,
								title: footnote.title,
								label: rawLabel,
								compact,
							})}
						</cite>
					);
				},
			},
			{
				check: citationBareRe,
				atomic: true,
				return: (match, ctx) => {
					const m = match.match(citationBareSingleRe);
					if (!m) return match;

					const rawId = m[1];
					const id = normalizeFootnoteId(rawId);
					const footnote = footnotes.get(id);
					if (!footnote || !footnote.href) return match;

					const compact = ctx?.parentModifier === 'superscript';

					return (
						<cite theme='markdown_cite'>
							{renderCitationButton({
								href: footnote.href,
								title: footnote.title,
								label: `[${rawId}]`,
								compact,
							})}
						</cite>
					);
				},
			},
		]
		: [];

	return [
		// escapes like \* \_ \[ etc
		{
			check: escapeRe,
			atomic: true,
			return: match => match.slice(1),
		},

		// citations (must come before links)
		...citationModifiers,

		// superscript
		{
			check: superscriptRe,
			atomic: false,
			return: (match, ctx) => {
				const inner = match.slice(1, -1);
				const render = typeof ctx?.renderWithModifiers === 'function'
					? ctx.renderWithModifiers(inner, { parentModifier: 'superscript' })
					: inner;

				return (
					<sup theme='markdown_sup'>
						{render}
					</sup>
				);
			},
		},

		// images
		{
			check: imgRe,
			atomic: true,
			return: match => {
				const p = parseImageToken(match);
				if (!p) return match;

				const label = p.title || p.alt || undefined;
				const embedUrl = getYoutubeEmbedUrl(p.src);
				if (embedUrl) {
					return <div theme='markdown_embed'>
						<iframe
							title={label}
							aria-label={label}
							src={embedUrl}
							frameBorder={0}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
							style={{ width: '100%', height: '100%', display: 'block', border: 0 }}
						/>
					</div>;
				}
				const videoMime = getVideoMimeType(p.src);
				if (videoMime) {
					return <video
						theme='markdown_video'
						controls
						preload='metadata'
						title={label}
						aria-label={label}
					>
						<source src={p.src} type={videoMime} />
					</video>;
				}

				return <img
					theme='markdownimg'
					src={p.src}
					alt={p.alt}
					title={p.title || p.alt}
				/>;
			},
		},

		// links -> link Buttons
		{
			check: linkRe,
			atomic: true,
			return: (match, ctx) => {
				const p = parseLinkToken(match);
				if (!p) return match;

				const compact = ctx?.parentModifier === 'superscript';
				const iconSize = compact ? '0.65em' : undefined;
				const buttonStyle = compact
					? { fontSize: '0.75em', padding: 0, minHeight: 'auto', lineHeight: 1 }
					: { lineHeight: 1 };
				const labelNode = compact
					? <span style={{ fontSize: '0.75em', lineHeight: 1 }}>{p.text}</span>
					: p.text;

				return <span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
					<Button
						type="link"
						inline
						track={false}
						href={p.href}
						title={p.title || p.href}
						label={labelNode}
						style={buttonStyle}
						iconPosition="right"
						icon={<Icon name="feather:external-link" style={{ display: 'inline-block', width: iconSize, height: iconSize }} />}
					/>
				</span>;
			},
		},

		// inline code (prefer double-backtick)
		{
			check: inlineCodeDoubleRe,
			atomic: true,
			return: match => {
				const inner = match.slice(2, -2);
				return <code theme='markdown_inlinecode'>{inner}</code>;
			},
		},

		{
			check: inlineCodeSingleRe,
			atomic: true,
			return: match => {
				const inner = match.slice(1, -1);
				return <code theme='markdown_inlinecode'>{inner}</code>;
			},
		},

		// bold+italic combos
		{
			check: boldItalicARe,
			atomic: false,
			return: match =>
				<span theme={['typography', 'bold', 'italic']}>
					{match.slice(3, -3)}
				</span>,
		},

		{
			check: boldItalicBRe,
			atomic: false,
			return: match =>
				<span theme={['typography', 'bold', 'italic']}>
					{match.slice(3, -3)}
				</span>,
		},

		{
			check: boldItalicCRe,
			atomic: false,
			return: match =>
				<span theme={['typography', 'bold', 'italic']}>
					{match.slice(3, -3)}
				</span>,
		},

		{
			check: boldItalicDRe,
			atomic: false,
			return: match =>
				<span theme={['typography', 'bold', 'italic']}>
					{match.slice(3, -3)}
				</span>,
		},

		// bold
		{
			check: boldARe,
			atomic: false,
			return: match =>
				<span theme={['typography', 'bold']}>
					{match.slice(2, -2)}
				</span>,
		},

		{
			check: boldBRe,
			atomic: false,
			return: match =>
				<span theme={['typography', 'bold']}>
					{match.slice(2, -2)}
				</span>,
		},

		// italic
		{
			check: italicARe,
			atomic: false,
			return: match =>
				<span theme={['typography', 'italic']}>
					{match.slice(1, -1)}
				</span>,
		},

		{
			check: italicBRe,
			atomic: false,
			return: match =>
				<span theme={['typography', 'italic']}>
					{match.slice(1, -1)}
				</span>,
		},
	];
};

const normalize = s => (s || '').replace(/\r\n/g, '\n').replace(/\t/g, '    ');

const isHr = line =>
	/^\s*(\*\s*){3,}\s*$/.test(line) ||
	/^\s*(-\s*){3,}\s*$/.test(line) ||
	/^\s*(_\s*){3,}\s*$/.test(line);

const isFenceStart = line => /^```/.test(line);

const footnoteDefRe = /^\s*\[(\^?[^\]]+)\]:\s+(.+)\s*$/;

const parseFootnoteDefinition = (line) => {
	const m = line.match(footnoteDefRe);
	if (!m) return null;

	const rawId = m[1].trim();
	const rest = (m[2] || '').trim();
	if (!rest) return null;

	const parsed = rest.match(/^(.*?)(?:\s+"([^"]*)")?\s*$/);
	if (!parsed) return null;

	const href = (parsed[1] || '').trim();
	const title = parsed[2] ?? null;
	const id = normalizeFootnoteId(rawId);

	return { id, rawId, href, title };
};

const parseBlocks = (md) => {
	const lines = normalize(md).split('\n');
	const blocks = [];
	const footnotes = new Map();
	const footnoteOrder = [];
	let i = 0;

	const peek = () => lines[i];
	const next = () => lines[i + 1];

	const isListLine = (line) =>
		/^(\s*)([-+*])\s+(.+)$/.test(line) ||
		/^(\s*)(\d+)\.\s+(.+)$/.test(line);

	while (i < lines.length) {
		let line = peek();

		if (!line.trim()) {
			i++;
			continue;
		}

		// footnote definitions
		{
			const def = parseFootnoteDefinition(line);
			if (def) {
				if (!footnotes.has(def.id)) footnoteOrder.push(def.id);
				footnotes.set(def.id, {
					id: def.id,
					rawId: def.rawId,
					href: def.href,
					title: def.title,
				});
				i++;
				continue;
			}
		}

		// fenced code block
		{
			const m = line.match(/^```(\w+)?\s*$/);
			if (m) {
				const language = m[1] || null;
				i++;

				const codeLines = [];
				while (i < lines.length && !/^```/.test(lines[i])) {
					codeLines.push(lines[i]);
					i++;
				}
				if (i < lines.length) i++; // closing fence

				blocks.push({ type: 'codeFence', language, code: codeLines.join('\n') });
				continue;
			}
		}

		// horizontal rule
		if (isHr(line)) {
			blocks.push({ type: 'hr' });
			i++;
			continue;
		}

		// ATX heading
		{
			const m = line.match(/^(#{1,6})\s+(.+)$/);
			if (m) {
				blocks.push({ type: 'heading', level: m[1].length, text: m[2].trim() });
				i++;
				continue;
			}
		}

		// Setext heading
		{
			const n = next();
			if (n && line.trim() && (/^\s*=+\s*$/.test(n) || /^\s*-+\s*$/.test(n))) {
				blocks.push({
					type: 'heading',
					level: /^\s*=+\s*$/.test(n) ? 1 : 2,
					text: line.trim(),
				});
				i += 2;
				continue;
			}
		}

		// blockquote (simple)
		if (/^\s*>\s?/.test(line)) {
			const quoteLines = [];
			while (i < lines.length && (/^\s*>\s?/.test(lines[i]) || !lines[i].trim())) {
				if (!lines[i].trim()) {
					quoteLines.push('');
				} else {
					quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
				}
				i++;
			}
			blocks.push({ type: 'quote', text: quoteLines.join('\n').trim() });
			continue;
		}

		// list block (basic, supports nesting by indent)
		if (isListLine(line)) {
			const items = [];
			const base = line.match(/^(\s*)/)[1].length;

			const baseOrdered = !!line.match(/^(\s*)(\d+)\.\s+/);

			while (i < lines.length && isListLine(lines[i])) {
				const l = lines[i];

				const ul = l.match(/^(\s*)([-+*])\s+(.+)$/);
				const ol = l.match(/^(\s*)(\d+)\.\s+(.+)$/);

				const indent = (ul ? ul[1] : ol[1]).length;
				const ordered = !!ol;

				// if you switch list type at the base indent, end this list block
				if (indent === base && ordered !== baseOrdered) break;

				const rawText = ul ? ul[3] : ol[3];

				// github task list
				const task = rawText.match(/^\[( |x|X)\]\s+(.+)$/);
				if (task) {
					items.push({
						indent,
						ordered,
						task: true,
						checked: task[1].toLowerCase() === 'x',
						text: task[2],
					});
				} else {
					items.push({ indent, ordered, task: false, checked: false, text: rawText });
				}

				i++;
			}

			blocks.push({ type: 'list', items });
			continue;
		}

		// paragraph (consume until blank line / next block)
		{
			const parts = [line];
			i++;

			while (i < lines.length) {
				const l = lines[i];
				if (!l.trim()) break;

				if (isFenceStart(l)) break;
				if (isHr(l)) break;
				if (/^(#{1,6})\s+/.test(l)) break;
				if (/^\s*>\s?/.test(l)) break;
				if (isListLine(l)) break;

				parts.push(l);
				i++;
			}

			// basic markdown line-break rule: two trailing spaces => newline, else space
			let text = '';
			for (let p = 0; p < parts.length; p++) {
				const cur = parts[p];
				const br = /  $/.test(cur);
				text += cur.replace(/  $/, '');
				if (p !== parts.length - 1) text += br ? '\n' : ' ';
			}

			blocks.push({ type: 'paragraph', text: text.trim() });
			continue;
		}
	}

	return { blocks, footnotes, footnoteOrder };
};

const buildListTree = (flatItems) => {
	if (!flatItems || flatItems.length === 0) return null;

	const baseIndent = Math.min(...flatItems.map(x => x.indent));
	const root = {
		ordered: flatItems[0].ordered,
		indent: baseIndent,
		items: [],
	};

	const stack = [root]; // stack of list nodes

	for (const it of flatItems) {
		// normalize text (don’t keep trailing markdown “two spaces”)
		const text = (it.text || '').replace(/\s+$/, '');

		// climb up
		while (stack.length > 1 && it.indent < stack[stack.length - 1].indent) {
			stack.pop();
		}

		let list = stack[stack.length - 1];

		// go deeper
		if (it.indent > list.indent) {
			const parentItem = list.items[list.items.length - 1];

			// If there’s no parent item to nest under, just treat as same level.
			if (parentItem) {
				const nested = {
					ordered: it.ordered,
					indent: it.indent,
					items: [],
				};

				parentItem.children = parentItem.children || [];
				parentItem.children.push(nested);

				stack.push(nested);
				list = nested;
			}
		}

		// if list type switches at same indent, start a new child list under prev item
		if (it.indent === list.indent && it.ordered !== list.ordered) {
			const parentList = stack.length > 1 ? stack[stack.length - 2] : null;
			const parentItem = parentList?.items?.[parentList.items.length - 1];

			if (parentItem) {
				const sibling = {
					ordered: it.ordered,
					indent: it.indent,
					items: [],
				};

				parentItem.children = parentItem.children || [];
				parentItem.children.push(sibling);

				stack[stack.length - 1] = sibling;
				list = sibling;
			} else {
				// root flip (rare)
				list.ordered = it.ordered;
			}
		}

		list.items.push({
			task: it.task,
			checked: it.checked,
			text,
			children: null,
		});
	}

	return root;
};

const renderList = (node) => {
	const ListTag = node.ordered ? 'ol' : 'ul';

	return <ListTag theme={node.ordered ? 'markdown_ol' : 'markdown_ul'}>
		{node.items.map(item =>
			<li theme='markdown_li'>
				{item.task
					? <div theme='markdown_task'>
						<Checkbox value={item.checked} disabled />
						<Typography type='p1' label={Observer.immutable(item.text)} />
					</div>
					: <Typography type='p1' label={Observer.immutable(item.text)} />
				}

				{item.children
					? item.children.map(child => renderList(child))
					: null}
			</li>
		)}
	</ListTag>;
};

const renderBlocks = (blocks, footnotes, footnoteOrder) => {
	const rendered = blocks.map(block => {
		if (block.type === 'hr') {
			return <div theme='divider' />;
		}

		if (block.type === 'codeFence') {
			return <pre theme='markdown_codeblock'>
				<code>{block.code}</code>
			</pre>;
		}

		if (block.type === 'heading') {
			return <div theme='markdown_block'>
				<Typography
					type={'h' + Math.min(6, Math.max(1, block.level))}
					label={Observer.immutable(block.text)}
				/>
			</div>;
		}

		if (block.type === 'quote') {
			return <div theme='markdown_quote'>
				<Typography type='p1' label={Observer.immutable(block.text)} />
			</div>;
		}

		if (block.type === 'list') {
			const tree = buildListTree(block.items);
			return tree
				? <div theme='markdown_block'>{renderList(tree)}</div>
				: null;
		}

		// paragraph
		return <div theme='markdown_block'>
			<Typography type='p1' label={Observer.immutable(block.text)} />
		</div>;
	});

	if (footnoteOrder?.length) {
		rendered.push(<div theme='divider' />);
		rendered.push(
			<div theme='markdown_block'>
				<div theme='markdown_footnotes'>
					<ol theme='markdown_ol'>
						{footnoteOrder.map(id => {
							const footnote = footnotes.get(id);
							if (!footnote) return null;

							const label = footnote.title || footnote.href || footnote.rawId || id;
							return (
								<li theme='markdown_li'>
									<span theme='markdown_footnote_label'>[{footnote.rawId || id}]</span>
									{footnote.href
										? renderCitationButton({
											href: footnote.href,
											title: footnote.title,
											label,
										})
										: <span>{label}</span>
									}
								</li>
							);
						})}
					</ol>
				</div>
			</div>
		);
	}

	return rendered;
};

const Markdown = ({
	value,
	modifiers = makeDefaultModifiers,
	theme,
	...props
}) => {
	if (!(value instanceof Observer)) value = Observer.immutable(value || '');

	return <div theme={['markdown', theme]} {...props}>
		{value.map((md, index) => {
			const parsed = parseBlocks(md);
			const appliedModifiers = typeof modifiers === 'function'
				? modifiers(parsed.footnotes)
				: modifiers;

			return (
				<TextModifiers value={appliedModifiers} key={index}>
					<div>
						{renderBlocks(parsed.blocks, parsed.footnotes, parsed.footnoteOrder)}
					</div>
				</TextModifiers>
			);
		})}
	</div>;
};

export default Markdown;
