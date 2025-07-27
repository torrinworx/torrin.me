import path from 'path';
import fs from 'fs/promises';
import http from './http.js';

const loadEnv = async (filePath = './.env') => {
    try {
        const data = await fs.readFile(filePath, { encoding: 'utf8' });
        data.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) process.env[key.trim()] = value.trim();
        });
    } catch (e) {
        console.error(`Failed to load .env file: ${e.message}`);
    }
};

if (!process.env.ENV) await loadEnv();

let root = path.resolve(process.env.ENV === 'production' ? './dist' : './frontend');
let server = http();

const blogs = {};
const blogIndex = (req, res, next) => {

    if (req.url === '/blog/index.json' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(blogs));
    } else if (next) {
        next();
    }
};

(async () => {
    const blogPath = path.join(root, process.env.ENV === 'production' ? 'blog' : path.join('public', 'blog'));
    const files = await fs.readdir(blogPath);

    for (const file of files) {
        if (path.extname(file) === '.md') {
            const filePath = path.join(blogPath, file);

            try {
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const fileStats = await fs.stat(filePath);

                const headerMatch = fileContent.match(/#\s*header\s*\n([^#]*)\n+/i);
                const descriptionMatch = fileContent.match(/#\s*description\s*\n((?:[^\n]+\n?)*)/i);

                const header = headerMatch ? headerMatch[1].trim() : '';
                const description = descriptionMatch ? descriptionMatch[1].trim() : '';

                blogs[file] = {
                    name: file,
                    header: header,
                    description: description,
                    modified: fileStats.mtime.toISOString(),
                    created: fileStats.birthtime.toISOString(),
                };
            } catch (fileError) {
                console.error(`Error reading file ${file}:`, fileError.message);
            }
        }
    }

    if (process.env.ENV === 'production') server.production({ root });
    else {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({ server: { middlewareMode: 'html' } });
        server.development({ vite });
    }

    server.middleware(blogIndex);
    server.listen(process.env.PORT);
})();
