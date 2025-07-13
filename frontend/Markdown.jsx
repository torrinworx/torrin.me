import { Observer } from "destam-dom";
import { ThemeContext, mark, Typography } from 'destamatic-ui'

////////////////////////////////////////////////////////////////////////////////
// 1) A Simple Block Parser (for illustrative example)
//    Splits the text into blocks such as headings, paragraphs, code fences, etc.
//    This can be heavily expanded or replaced by a more advanced parser.

function parseBlocks(md) {
	const lines = md.split('\n');
	const blocks = [];
	let currentBlock = null;

	function pushBlock() {
		if (currentBlock) {
			blocks.push(currentBlock);
			currentBlock = null;
		}
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Fenced code block toggling
		if (line.match(/^```/)) {
			if (currentBlock && currentBlock.type === 'codeFence') {
				// close code block
				currentBlock.content.push(line); // store the fence line if needed
				pushBlock();
			} else {
				// open code block
				pushBlock();
				currentBlock = {
					type: 'codeFence',
					content: [line],
				};
			}
			continue;
		}

		// If we are inside a codeFence, keep slurping lines
		if (currentBlock && currentBlock.type === 'codeFence') {
			currentBlock.content.push(line);
			continue;
		}

		// HEADINGS: e.g.  "# Title", "## Title", ...
		const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
		if (headingMatch) {
			pushBlock();
			const level = headingMatch[1].length;
			const text = headingMatch[2];
			blocks.push({
				type: 'heading',
				level,
				content: text,
			});
			continue;
		}

		// Unordered list item? e.g. "- ", "* "
		const ulMatch = line.match(/^(\s*)[-+*]\s+(.*)$/);
		// Ordered list item? e.g. "1. xyz"
		const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

		// If we detect list item, see if the previous block is also a list
		if (ulMatch || olMatch) {
			const isOrdered = !!olMatch;
			const text = isOrdered ? olMatch[3] : ulMatch[2];
			const indent = isOrdered ? olMatch[1].length : ulMatch[1].length;

			if (currentBlock && currentBlock.type === 'list' && currentBlock.ordered === isOrdered) {
				// same list
				currentBlock.items.push({ text, indent });
			} else {
				pushBlock();
				currentBlock = {
					type: 'list',
					ordered: isOrdered,
					items: [{ text, indent }],
				};
			}
			continue;
		}

		// If the line is blank or we reach a new paragraph
		if (!line.trim()) {
			pushBlock();
			continue;
		}

		// Otherwise treat as paragraph lines
		if (!currentBlock || currentBlock.type !== 'paragraph') {
			pushBlock();
			currentBlock = {
				type: 'paragraph',
				content: [line],
			};
		} else {
			// accumulate lines in paragraph
			currentBlock.content.push(line);
		}
	}
	// flush final block
	pushBlock();

	return blocks;
}

////////////////////////////////////////////////////////////////////////////////
// 2) A Simple Inline Parser
//
//    - For demonstration, we only handle bold/italic patterns with '*' / '_' or
//      checkboxes in lists, etc. In practice you'd want to handle more advanced
//      features (inline code, links, nested emphasis, etc.).

function parseInlines(text) {
	// This is a naive example, mixing bold & italic scanning.
	// In real usage, you might do a real tokenizer or use a library.
	// We'll slice the text using a regex that captures **...**, *...*, etc.
	const tokens = [];
	const re = /(\*\*\*.+?\*\*\*)|(___.+?___)|(\*\*.+?\*\*)|(__.+?__)|(\*.+?\*)|(_.+?_)/g;
	let lastIndex = 0;

	let match;
	while ((match = re.exec(text)) !== null) {
		// everything before this match is text
		if (match.index > lastIndex) {
			tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
		}
		const tokenStr = match[0];
		// figure out which pattern:
		const length = tokenStr.length;
		if ((/^\*\*\*/.test(tokenStr) || /^___/.test(tokenStr)) && length >= 6) {
			// bold + italic => remove *** or ___
			tokens.push({
				type: 'strongEmphasis',
				content: tokenStr.slice(3, -3),
			});
		} else if ((/^\*\*/.test(tokenStr) || /^__/.test(tokenStr)) && length >= 4) {
			// bold => remove ** or __
			tokens.push({
				type: 'strong',
				content: tokenStr.slice(2, -2),
			});
		} else if ((/^\*/.test(tokenStr) || /^_/.test(tokenStr)) && length >= 2) {
			// italic => remove * or _
			tokens.push({
				type: 'emphasis',
				content: tokenStr.slice(1, -1),
			});
		}
		lastIndex = re.lastIndex;
	}
	// leftover
	if (lastIndex < text.length) {
		tokens.push({ type: 'text', content: text.slice(lastIndex) });
	}
	return tokens;
}

////////////////////////////////////////////////////////////////////////////////
// 3) Build a Node Tree with Hierarchical Info
//    For example, parse block-level, then parse inline text content.

function buildAst(mdText) {
	const blocks = parseBlocks(mdText);

	return blocks.map(block => {
		switch (block.type) {
			case 'heading':
				return {
					type: 'heading',
					level: block.level,
					inlines: parseInlines(block.content),
				};
			case 'paragraph':
				return {
					type: 'paragraph',
					inlines: parseInlines(block.content.join(' ')),
				};
			case 'codeFence': {
				const content = block.content;
				// typical code fence lines:
				//   "```lang"
				//   line1
				//   line2
				//   "```"
				const maybeInfo = content[0].replace(/^```/, '').trim();
				const codeBody = content.slice(1, -1).join('\n');
				return {
					type: 'codeFence',
					language: maybeInfo || null,
					code: codeBody,
				};
			}
			case 'list':
				return {
					type: 'list',
					ordered: block.ordered,
					items: block.items.map(it => {
						// Check if it is something like [x] or [ ] at the start
						// in real usage you might parse for tasks, etc.
						let isTask = false;
						let isChecked = false;
						let text = it.text;

						const match = text.match(/^\[( |x|X)\]\s*(.*)$/);
						if (match) {
							isTask = true;
							isChecked = match[1].toLowerCase() === 'x';
							text = match[2];
						}
						return {
							textAst: parseInlines(text),
							indent: it.indent,
							isTask,
							isChecked,
						};
					}),
				};
			default:
				return {
					type: 'paragraph',
					inlines: parseInlines('[Unrecognized] ' + JSON.stringify(block)),
				};
		}
	});
}

////////////////////////////////////////////////////////////////////////////////
// 4) Default “rule set” for rendering AST => components

const defaultRules = {
	heading(node, renderInline) {
		const type = 'h' + Math.min(node.level, 6); // clamp to h6
		return <Typography type={type}>{renderInline(node.inlines)}</Typography>;
	},
	paragraph(node, renderInline) {
		return <Typography type="p1">{renderInline(node.inlines)}</Typography>;
	},
	codeFence(node) {
		// For an actual code block, you might use a real code highlighter or
		// your custom <CodeBlock language={node.language} code={node.code}/>:
		return <pre style={{ backgroundColor: '#f0f0f0', padding: 10 }}>
			{node.code}
		</pre>;
	},
	list(node, renderInline) {
		if (node.ordered) {
			return <ol style={{ color: 'white' }}>
				{node.items.map(item => {
					if (item.isTask) {
						return <li>
							<Checkbox value={item.isChecked} disabled />
							<Typography type='p1' label={renderInline(item.textAst)} />
						</li>;
					}
					return <li><Typography type='p1' label={renderInline(item.textAst)} /></li>;
				})}
			</ol>;
		} else {
			return <ul style={{ color: 'white' }}>
				{node.items.map(item => {
					if (item.isTask) {
						return <li>
							<Checkbox value={item.isChecked} disabled />
							<Typography type='p1' label={renderInline(item.textAst)} />
						</li>;
					}
					return <li><Typography type='p1' label={renderInline(item.textAst)} /></li>;
				})}
			</ul>;
		}
	},
	// If you had special blocks or fallback
	// fallback(node) {
	//   return <p>Unknown block type: {node.type}</p>;
	// },
};

const defaultInlineRules = {
	text(token) {
		return token.content;
	},
	strong(token, renderInline) {
		// Re-run inline parse in case we want nested?
		// Or you can assume text-only inside.
		return <strong>{renderInline(parseInlines(token.content))}</strong>;
	},
	emphasis(token, renderInline) {
		return <em>{renderInline(parseInlines(token.content))}</em>;
	},
	strongEmphasis(token, renderInline) {
		// *** or ___
		return <em><strong>{renderInline(parseInlines(token.content))}</strong></em>;
	},
};

/**
 * Recursively render inline tokens by delegating to inline rules.
 */
function renderInline(tokens, inlineRules = defaultInlineRules) {
	return tokens.map((token, i) => {
		const ruleFn = inlineRules[token.type] || inlineRules.text;
		return <>{ruleFn(token, (toks) => renderInline(toks, inlineRules))}</>;
	});
}

////////////////////////////////////////////////////////////////////////////////
// 5) Renderer to walk the AST => array of elements

function renderAst(ast, rules, inlineRules) {
	return ast.map((node, idx) => {
		const ruleFn = rules[node.type] || rules.fallback;
		if (!ruleFn) {
			return <div key={idx} style={{ color: 'red' }}>No rule for {node.type}</div>;
		}
		return <div key={idx}>
			{ruleFn(node, (tokens) => renderInline(tokens, inlineRules))}
		</div>;
	});
}

////////////////////////////////////////////////////////////////////////////////
// 6) The main <Markdown> component

const Markdown = ThemeContext.use(h => {
	return ({
		value,          // Observer<string> or string
		rules,          // optional override of block-level rules
		inlineRules,    // optional override of inline-level rules
		...props
	}, cleanup) => {
		if (!(value instanceof Observer)) {
			// E.g. if a string was passed, wrap it in an Observer:
			value = Observer.immutable(value || '');
		}

		// We store the parsed AST in an OArray or so if we want reactivity, or we can recalc each time:
		const ast = Observer.mutable([]);

		// Re-parse whenever 'value' changes:
		cleanup(value.effect(newVal => {
			const tree = buildAst(newVal);
			ast.set(tree);
		}));

		// Our “render function” is to map over the AST => elements
		return ast.map(tree => renderAst(
			tree,
			{ ...defaultRules, ...(rules || {}) },
			{ ...defaultInlineRules, ...(inlineRules || {}) }
		));
	};
});

export default Markdown;

////////////////////////////////////////////////////////////////////////////////
// Example usage:
// 
// <Markdown value={Observer.mutable(`# Hello
// This is a paragraph with ***bold+italic*** and so forth.
// - [x] A checked item
// - [ ] An unchecked item
// \`\`\`js
// console.log("Hello from code block");
// \`\`\`
// `)}/>
//
// You can override or expand the rules in your usage, e.g.:
// 
// <Markdown 
//   value={someTextObs} 
//   rules={{
//     heading(node, renderInline) {
//       return <Typography type={'h'+node.level} style={{color: 'blue'}}>
//         {renderInline(node.inlines)}
//       </Typography>;
//     }
//     // ... or define more
//   }}
// />
