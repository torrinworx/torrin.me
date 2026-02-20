import * as destamCore from 'destam';
import { Observer } from 'destam';
import * as destamDom from 'destam-dom';
import { mount as domMount } from 'destam-dom';

import { h as hRaw } from '@destamatic/ui';
import { h as domH } from 'destam-dom';

import compileHTMLLiteral from './htmlLiteral';

import {
	Typography,
	Button,
	Shown,
	ThemeContext,
	RichArea,
	TextModifiers,
	Theme,
	is_node,
	Icon,
} from '@destamatic/ui';

import * as destamaticUI from '@destamatic/ui';
import IconifyIcons from '@destamatic/ui/components/icons/IconifyIcons/IconifyIcons';

import { modifiers, codeColours } from '../utils/JsxModifiers.jsx';

const rewriteImports = (src) => {
	const lines = String(src || '').split('\n');
	const out = [];

	const parseSpecifiers = (s) => {
		// "a, b as c" -> "a, b: c"
		return s
			.split(',')
			.map(x => x.trim())
			.filter(Boolean)
			.map(x => {
				const m = x.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
				return m ? `${m[1]}: ${m[2]}` : x;
			})
			.join(', ');
	};

	for (const line of lines) {
		// side-effect import
		let m = line.match(/^\s*import\s+['"]([^'"]+)['"]\s*;?\s*$/);
		if (m) {
			out.push(`__runtime.require(${JSON.stringify(m[1])});`);
			continue;
		}

		// import * as ns from 'mod'
		m = line.match(/^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/);
		if (m) {
			const [, ns, mod] = m;
			out.push(`const ${ns} = __runtime.require(${JSON.stringify(mod)});`);
			continue;
		}

		// import { a, b as c } from 'mod'
		m = line.match(/^\s*import\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/);
		if (m) {
			const [, spec, mod] = m;
			out.push(`const { ${parseSpecifiers(spec)} } = __runtime.require(${JSON.stringify(mod)});`);
			continue;
		}

		// import defaultName from 'mod'
		m = line.match(/^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/);
		if (m) {
			const [, def, mod] = m;
			out.push(`const ${def} = (__runtime.require(${JSON.stringify(mod)}).default ?? __runtime.require(${JSON.stringify(mod)}));`);
			continue;
		}

		// import defaultName, { a as b } from 'mod'
		m = line.match(/^\s*import\s+([A-Za-z_$][\w$]*)\s*,\s*\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/);
		if (m) {
			const [, def, spec, mod] = m;
			const modVar = `__mod_${Math.random().toString(36).slice(2)}`;
			out.push(`const ${modVar} = __runtime.require(${JSON.stringify(mod)});`);
			out.push(`const ${def} = (${modVar}.default ?? ${modVar});`);
			out.push(`const { ${parseSpecifiers(spec)} } = ${modVar};`);
			continue;
		}

		out.push(line);
	}

	return out.join('\n');
};

const rewriteExports = (src) => {
	let s = String(src || '');

	// `export default <JSX />;` or `export default expr;`
	// Turn into: `__runtime.exports.default = <JSX />;`
	s = s.replace(/^\s*export\s+default\s+/m, '__runtime.exports.default = ');

	// (optional) handle `export { foo as default }`
	s = s.replace(/^\s*export\s*\{\s*([A-Za-z_$][\w$]*)\s+as\s+default\s*\}\s*;?\s*$/m,
		'__runtime.exports.default = $1;'
	);

	return s;
};

export const Editor = ThemeContext.use(h => ({ code, h: hSelector = 'destam-dom', ...props }, cleanup, mounted) => {
	if (is_node()) return null;

	if (!(code instanceof Observer)) code = Observer.mutable(code);

	const rootRef = Observer.mutable(null);
	const error = Observer.mutable('');
	const running = Observer.mutable(false);

	// Keep destroy handle for reruns
	// --- TODO #2: safer hot reload (keep last good preview) ------------
	// Keep last "good" mounted output. On errors, keep it and only show error text.
	let activeHost = null;
	let activeDestroys = [];

	const killAll = (arr) => {
		for (const d of arr) {
			try { if (typeof d === 'function') d(); } catch { /* ignore */ }
		}
		arr.length = 0;
	};
	const run = () => {
		try {
			running.set(true);

			let root = rootRef.get();
			if (!root) return;
			if (root && root.elem_) root = root.elem_;

			if (!root.insertBefore || !root.replaceChild || !root.removeChild) {
				throw new Error('Editor root is not a mountable DOM node');
			}

			// ensure there's always an active host attached (so preview isn't blank on errors)
			if (!activeHost || !activeHost.isConnected) {
				root.innerHTML = '';
				activeHost = document.createElement('div');
				root.appendChild(activeHost);
			}

			// staging host for this run
			const stagingHost = document.createElement('div');
			const stagingDestroys = [];

			// runtime mount wrapper: track destroys for this run
			const runtimeMount = (elem, node) => {
				if (elem && elem.elem_) elem = elem.elem_;
				const d = domMount(elem, node);
				stagingDestroys.push(d);
				return d;
			};

			// modules map for import-mimicking
			const modules = {
				'@destamatic/ui': { ...destamaticUI, h: hRaw },
				'@destamatic/ui/components/icons/IconifyIcons/IconifyIcons': IconifyIcons,

				'destam-dom': { ...destamDom, mount: runtimeMount, h: domH },

				'destam': destamCore,
				'destam/Object': destamCore.OObject,
				'destam/Array': destamCore.OArray,
				'destam/Network': { ...destamCore.Network },
				'destam/Observer': destamCore.Observer,
			};
			const runtimeRequire = (name) => {
				const mod = modules[name];
				if (!mod) throw new Error(`Editor: unknown module "${name}"`);
				return mod;
			};

			const runtimeH =
				hSelector === 'destam-dom' ? domH
					: hSelector === '@destamatic/ui' ? hRaw
						: null;

			const propKeys = Object.keys(props);
			const headerParts = [
				`"use strict";`,
				hSelector === null
					? `const { root, require, ${propKeys.join(", ")} } = __runtime;`
					: `const { h, root, require, ${propKeys.join(", ")} } = __runtime;`
			];
			const runtimeHeader = headerParts.join("\n") + "\n";

			const userSrc = String(code.get() || '');
			const rewritten = rewriteExports(rewriteImports(userSrc));
			const source = runtimeHeader + '\n' + rewritten;
			// compile step first — if this throws, do NOT touch the active preview
			let compiled;
			try {
				({ code: compiled } = compileHTMLLiteral(source, {
					sourceFileName: 'Editor.jsx',
					plugins: ['jsx'],
				}));
			} catch (e) {
				console.error(e);
				error.set(String(e?.stack || e?.message || e));
				// discard anything created in this run
				killAll(stagingDestroys);
				return;
			}
			const exportsBag = {};
			const fn = new Function('__runtime', compiled);

			// runtime execute — only commit to preview if this run fully succeeds
			try {
				const runtimeObj = {
					root: stagingHost,
					mount: runtimeMount,
					require: runtimeRequire,
					exports: exportsBag,
					...props,
				};

				if (hSelector !== null) runtimeObj.h = runtimeH;

				fn(runtimeObj);
			} catch (e) {
				console.error(e);
				error.set(String(e?.stack || e?.message || e));
				killAll(stagingDestroys);
				return;
			}

			// success: swap staging into active
			error.set('');
			killAll(activeDestroys);

			if (exportsBag.default != null) {
				// Clear whatever the script may have appended, then mount the export.
				stagingHost.innerHTML = '';
				runtimeMount(stagingHost, exportsBag.default);
			}
			// Replace active host element in DOM
			if (activeHost && activeHost.isConnected) {
				activeHost.replaceWith(stagingHost);
			} else {
				root.innerHTML = '';
				root.appendChild(stagingHost);
			}
			activeHost = stagingHost;
			activeDestroys = stagingDestroys;
		} catch (e) {
			console.error(e);
			error.set(String(e?.stack || e?.message || e));
		} finally {
			running.set(false);
		}
	};

	const RichAreaTheme = {
		field: {
			extends: 'radius_typography_p1_regular',
			outline: 0,
			padding: 10,
			background: '$contrast_text($color_top)',
			color: codeColours.fg,
		},
	};

	// effect renders initial dom and any changes when `code` changes.
	let codeEffect;
	mounted(() => {
		codeEffect = code.effect(() => run())
	});

	cleanup(() => {
		codeEffect()
		killAll(activeDestroys);
		activeHost = null;
	});

	const codeCheck = Observer.mutable(false);
	cleanup(codeCheck.watch(() => {
		if (codeCheck.get()) {
			setTimeout(() => {
				codeCheck.set(false);
			}, 1500);
		}
	}));

	// TODO: make rendered output appear in an iframe so that it doesn't interact with the rest of the app.
	// TODO: allow for pure js running and in preview just show the console output without any dom rendering 
	return <div theme="column_fill" style={{ gap: 12, padding: 12 }}>
		<div theme="row_fill" style={{ gap: 10, ualignItems: 'stretch' }}>
			<div theme='column' style={{ gap: 10, flex: 1, minWidth: 320 }}>
				<div theme="row_spread" style={{ gap: 10, padding: 10 }}>
					<Typography type="p2" label="Code" />

					<Button
						title='Copy example to clipboard'
						type='icon'
						iconPosition='right'
						icon={codeCheck.map(c => c
							? <Icon name='check' style={{ fill: 'none' }} size={'clamp(0.50rem, 0.50vw + 0.375rem, 1.25rem)'} />
							: <Icon name='copy' style={{ fill: 'none' }} size={'clamp(0.50rem, 0.50vw + 0.375rem, 1.25rem)'} />)}
						onClick={async () => {
							codeCheck.set(true);
							await navigator.clipboard.writeText(code.get());
						}}
						loading={false}
						style={{ padding: 3 }}
					/>
				</div>

				<Theme value={RichAreaTheme}>
					<TextModifiers value={modifiers}>
						<RichArea value={code} type="p1" style={{ height: 1000 }} maxHeight={1000} />
					</TextModifiers>
				</Theme>
			</div>

			<div theme='column' style={{ gap: 10, flex: 1, minWidth: 320 }}>
				<div theme='row_spread' style={{ gap: 10, padding: 10 }}>
					<Typography type="p2" label="Preview" />
				</div>
				<div
					theme='radius_field'
					ref={rootRef}
					style={{
						height: 1000,
						minHeight: 1000,
						background: 'none',
						position: 'relative',
						width: '100%',
						overflow: 'auto',
					}}
				/>
			</div>
		</div>

		<Shown value={error.map((e) => !!e)}>
			<Typography type="p2" label={error} style={{ whiteSpace: 'pre-wrap' }} />
		</Shown>
	</div>;
});

export default Editor;
