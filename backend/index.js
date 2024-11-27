import fs from 'fs';
import path from 'path';

import express from 'express';
import { createServer as createViteServer } from 'vite';

const root = process.env.ENV === 'production' ? './dist' : './frontend'

const app = express();

if (process.env.ENV === 'production') {
    app.use(express.static(root));
    console.log('Serving from:', path.join(root, 'index.html'));

    app.get('*', (req, res) => {
        res.sendFile(path.join(root, 'index.html'), err => {
            if (err) {
                res.status(500).send(err);
                console.error('Error serving index.html:', err);
            }
        });
    });
} else {

    const vite = await createViteServer({ server: { middlewareMode: 'html' } });

    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
        try {
            console.log("TEST")

            const html = await vite.transformIndexHtml(
                req.originalUrl,
                fs.readFileSync(
                    path.resolve(root, 'index.html'),
                    'utf-8'
                )
            );

            res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        } catch (e) {
            vite.ssrFixStacktrace(e);
            next(e);
        }
    });
}

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
})