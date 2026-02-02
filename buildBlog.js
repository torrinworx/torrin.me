import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const buildBlog = async (options = {}) => {
	const {
		srcDir = path.resolve(__dirname, '../blog'),
		outFile = path.join(srcDir, 'index.json'),
	} = options;

	const blogs = {};
	let files;

	try {
		files = await fs.readdir(srcDir);
	} catch (err) {
		console.error('Error reading blog directory:', srcDir, err);
		return blogs;
	}

	for (const file of files) {
		if (path.extname(file) !== '.md') continue;
		const filePath = path.join(srcDir, file);

		try {
			const fileContent = await fs.readFile(filePath, 'utf8');
			if (fileContent.match(/#\s*disabled\s*\n([^#]*)\n+/i)) continue;

			const headerMatch = fileContent.match(/#\s*header\s*\n([^#]*)\n+/i);
			const descriptionMatch = fileContent.match(/#\s*description\s*\n((?:[^\n]+\n?)*)/i);
			const createdMatch = fileContent.match(/#\s*created\s*\n([^\n]+)/i);
			const modifiedMatch = fileContent.match(/#\s*modified\s*\n([^\n]+)/i);

			const header = headerMatch ? headerMatch[1].trim() : '';
			const description = descriptionMatch ? descriptionMatch[1].trim() : '';
			const created = createdMatch ? createdMatch[1].trim() : '';
			const modified = modifiedMatch ? modifiedMatch[1].trim() : '';

			blogs[file] = {
				name: file,
				header,
				description,
				modified,
				created,
			};
		} catch (err) {
			console.error(`Error reading blog file ${filePath}:`, err);
		}
	}

	await fs.mkdir(path.dirname(outFile), { recursive: true });
	await fs.writeFile(outFile, JSON.stringify(blogs, null, 2), 'utf8');
	return blogs;
};

export default buildBlog;
