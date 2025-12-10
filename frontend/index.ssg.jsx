import path from 'path';
import { fileURLToPath } from 'url';

import App from './App';
import { render } from 'destamatic-ui';

import buildBlog from '../buildBlog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderAppToString = async () => {
	await buildBlog({
		srcDir: path.resolve(__dirname, '../dist/blog'),
		outFile: path.resolve(__dirname, '../dist/blog/index.json'),
	});

	return await render(App);
};
