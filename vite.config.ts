import { join } from 'node:path';

import { defineConfig } from 'vite';

import { aweft } from '@aweftjs/build';

export default defineConfig({
	root: join(import.meta.dirname, 'frontend'),
	plugins: [aweft({ release: process.env['NODE_ENV'] === 'production' })],
	base: '/',
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
