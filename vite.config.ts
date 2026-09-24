import { join } from 'node:path';

import { defineConfig } from 'vite';

import { aweft } from '@aweftjs/build';

export default defineConfig({
	root: join(import.meta.dirname, 'frontend'),
	plugins: [aweft({ release: process.env['NODE_ENV'] === 'production' })],
	base: '/',
	// What the page tells the logs battery it is, so a visit says which build it hit. build.sh
	// exports BUILD_ID for this and writes the same id into build.json for the server.
	define: { __BUILD__: JSON.stringify(process.env['BUILD_ID'] ?? null) },
	// The bundler has its own resolver, so the condition in `.npmrc` does not reach it: name it
	// here too, or every `@aweftjs/*` import lands on a `dist/` the submodule does not carry.
	resolve: { conditions: ['aweft-source', 'module', 'browser', 'development|production'] },
	server: {
		host: true,
		port: Number(process.env['PORT'] ?? 3000),
		// The radio is its own process (`npm run radio`); in production nginx puts it here.
		proxy: { '/radio/stream': { target: `http://127.0.0.1:${process.env['RADIO_PORT'] ?? '3010'}`, rewrite: () => '/stream' } },
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
