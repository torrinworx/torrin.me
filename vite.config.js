import path from 'path';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

import assertRemove from 'destam-dom/transform/assertRemove';
import compileHTMLLiteral from 'destam-dom/transform/htmlLiteral';

import buildBlog from './buildBlog';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
	}
});

const plugins = [];

plugins.push(createTransform('transform-literal-html', compileHTMLLiteral, true, {
	jsx_auto_import: {
		h: 'destamatic-ui',
		'mark': 'destamatic-ui',
		raw: {
			name: 'h',
			location: 'destam-dom'
		}
	},
}));

if (process.env.ENV === 'production') {
	plugins.push(createTransform('assert-remove', assertRemove));
}

// ---- blog index generator plugin (dev) ----
plugins.push({
	name: 'blog-index-generator',
	apply: 'serve',
	async configureServer(server) {
		const srcDir = path.resolve(__dirname, 'frontend/public/blog');
		const outFile = path.join(srcDir, 'index.json');

		// initial build
		await buildBlog({ srcDir, outFile });

		// watch .md files and rebuild on change/add/remove
		const onChange = async (file) => {
			if (!file.endsWith('.md')) return;
			if (!file.startsWith(srcDir)) return;
			await buildBlog();
		};

		server.watcher.on('add', onChange);
		server.watcher.on('change', onChange);
		server.watcher.on('unlink', onChange);
	}
});

export default defineConfig({
	root: './frontend',
	plugins,
	esbuild: {
		jsx: 'preserve',
	},
	base: '',
	resolve: {
		extensions: ['.js', '.ts', '.tsx', '.jsx'],
		alias: {
			util: 'util/',
		},
	},
	define: {
		'process.env': {},
		'process.env.NODE_ENV': '"development"',
		global: 'globalThis',
	},
	server: {
		host: true,
		port: process.env.PORT || 3000,
	},
	optimizeDeps: {
		include: ['@babel/parser', '@babel/generator', '@babel/types', 'util'],
		exclude: ['destamatic-ui', 'destam-dom', 'destam'],
	},
	build: {
		target: 'esnext',
		outDir: '../build/dist',
		rollupOptions: {
			output: {
				entryFileNames: '[name].js',
				chunkFileNames: 'assets/[name].[hash].js',
				assetFileNames: 'assets/[name].[hash][extname]',
			},
		},
	},
});
