import { createServer as createViteServer } from 'vite';

import http from './http.js';

let root = process.env.ENV === 'production' ? './dist' : './frontend';
let server = http();

if (process.env.NODE_ENV === 'production') {
    server.production({ root });
} else {
    const vite = await createViteServer({ server: { middlewareMode: 'html' } });
    server.development({ vite });
}

server = server.listen();
