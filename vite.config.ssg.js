import { defineConfig } from 'vite';
import assertRemove from 'destam-dom/transform/assertRemove';
import compileHTMLLiteral from 'destam-dom/transform/htmlLiteral';
import path from 'node:path';

const createTransform = (name, transform, jsx, options) => ({
	name,
	transform(code, id) {
		if (id.endsWith('.js') || (jsx && id.endsWith('.jsx'))) {
			const transformed = transform(code, {
				sourceFileName: id,
				plugins: id.endsWith('.jsx') ? ['jsx'] : [],
				...options,
			});
			return {
				code: transformed.code,
				map: transformed.map,
			};
		}
	},
});

const plugins = [];

plugins.push(
	createTransform('transform-literal-html', compileHTMLLiteral, true, {
		jsx_auto_import: {
			h: '@destamatic/ui',
			mark: '@destamatic/ui',
			raw: {
				name: 'h',
				location: 'destam-dom',
			},
		},
	}),
);

if (process.env.ENV === 'production') {
	plugins.push(createTransform('assert-remove', assertRemove));
}

// This config builds a Node-usable server bundle
export default defineConfig({
	root: './frontend',
	plugins,
	esbuild: {
		jsx: 'preserve',
	},
	server: {
		port: 3000
	},
	resolve: {
		extensions: ['.js', '.ts', '.tsx', '.jsx'],
	},
	ssr: {
		noExternal: ['country-region-data'],
	},
	build: {
		ssr: true,
		outDir: '../build/dist',
		rollupOptions: {
			input: path.resolve(__dirname, './frontend/index.ssg.jsx'),
			output: {
				entryFileNames: 'index.ssg.js'
			},
		},
	},
});
