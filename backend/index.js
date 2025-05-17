import fs from 'fs';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';

import http from './http.js';


let root = process.env.ENV === 'production' ? './dist' : './frontend';
// const app = express();

// if (process.env.ENV === 'production') {
//     app.use(express.static(root));
//     console.log('Serving from:', path.join(root, 'index.html'));

//     app.get('*', (_, res) => {
//         res.sendFile(path.join(root, 'index.html'), (err) => {
//             if (err) {
//                 res.status(500).send(err);
//                 console.error('Error serving index.html:', err);
//             }
//         });
//     });
// } else {
//     createViteServer({ server: { middlewareMode: 'html' } })
//         .then(vite => {
//             app.use(vite.middlewares);
//             app.get('*', async (req, res, next) => {
//                 try {
//                     const html = await vite.transformIndexHtml(
//                         req.originalUrl,
//                         fs.readFileSync(path.resolve(root, 'index.html'), 'utf-8')
//                     );
//                     res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
//                 } catch (e) {
//                     vite.ssrFixStacktrace(e);
//                     next(e);
//                 }
//             });
//         })
//         .catch(err => console.error('Error creating Vite server:', err));
// };

// app.listen(process.env.PORT || 3000, async () => console.log(`\x1b[32mServer running at http://localhost:${process.env.PORT || 3000}/\x1b[0m`));




let server = http();

if (process.env.NODE_ENV === 'production') {
    server.production({ root });
} else {
    const vite = await createViteServer({ server: { middlewareMode: 'html' } });
    server.development({ vite });
}

server = server.listen();

