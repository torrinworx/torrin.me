import { join } from 'node:path';

import { defineConfig } from 'vite';

import { aweft } from '@aweftjs/build';

export default defineConfig({
	root: join(import.meta.dirname, 'frontend'),
	plugins: [aweft({ release: process.env['NODE_ENV'] === 'production' })],
	base: '/',
	// The bundler has its own resolver, so the condition in `.npmrc` does not reach it: name it
	// here too, or every `@aweftjs/*` import lands on a `dist/` the submodule does not carry.
	resolve: { conditions: ['aweft-source', 'module', 'browser', 'development|production'] },
	server: {
		host: true,
		port: Number(process.env['PORT'] ?? 3000),
	},
	build: {
		target: 'esnext',
		outDir: join(import.meta.dirname, 'dist'),
		emptyOutDir: true,
		rollupOptions: {
			output: {
				entryFileNames: 'assets/[name].[hash].js',
				chunkFileNames: 'assets/[name].[hash].js',
				assetFileNames: 'assets/[name].[hash][extname]',
			},
		},
	},
});
