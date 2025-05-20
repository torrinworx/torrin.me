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
console.log("THIS IS ROOT PATH: ", root);
let server = http();

const start = async () => {
    if (process.env.ENV === 'production') server.production({ root });
    else {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({ server: { middlewareMode: 'html' } });
        server.development({ vite });
    }

    server.listen();
};

start();
