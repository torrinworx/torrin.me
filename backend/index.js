import fs from 'fs';
import path from 'path';
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import sharp from 'sharp';

const root = process.env.ENV === 'production' ? './dist' : './frontend';
const PORT = process.env.PORT || 3000;
const IMAGES_DIR = './images';
const CACHE_DIR = './cache';

// TODO: Move image stuff to it's own file.

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR);
}

// Function to create lower-resolution images
const createLowResImages = (filename) => {
    const inputPath = path.join(IMAGES_DIR, filename);
    const outputPath = path.join(CACHE_DIR, filename);

    sharp(inputPath)
        .resize({ width: 300 })
        .toFile(outputPath, (err, info) => {
            if (err) {
                console.error('Error creating low-res image:', err);
            } else {
                console.log(`Low-res image ${outputPath} created`);
            }
        });
};

// Load and resize files initially
let jpgFiles = [];
const loadAndResizeFiles = () => {
    fs.readdir(IMAGES_DIR, (err, files) => {
        if (err) {
            console.error('Unable to scan directory:', err);
            return;
        }

        jpgFiles = files.filter(file => file.endsWith('.jpg')).sort((a, b) => {
            const aStats = fs.statSync(path.join(IMAGES_DIR, a));
            const bStats = fs.statSync(path.join(IMAGES_DIR, b));

            // Compare modification time first
            if (aStats.mtime > bStats.mtime) return 1;
            if (aStats.mtime < bStats.mtime) return -1;

            // If modification times are identical, fall back to file name comparison
            return a.localeCompare(b);
        });

        jpgFiles.forEach(file => {
            const lowResPath = path.join(CACHE_DIR, file);
            if (!fs.existsSync(lowResPath)) {
                createLowResImages(file);
            }
        });
    });
};

loadAndResizeFiles();

// Monitor directory for changes
fs.watch(IMAGES_DIR, (eventType, filename) => {
    if (filename && filename.endsWith('.jpg')) {
        console.log(`File ${eventType}: ${filename}`);
        loadAndResizeFiles();
    }
});

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

const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
    ws.on('message', msg => {
        let request;
        try {
            request = JSON.parse(msg);
        } catch (e) {
            console.error('Invalid JSON:', e);
            return ws.send('Error: invalid JSON');
        }

        const { num, index } = request;
        if (typeof num !== 'number' || typeof index !== 'number') {
            return ws.send('Error: invalid request format');
        }

        const filesToSend = jpgFiles.slice(index, index + num);
        if (filesToSend.length === 0) {
            return ws.send('Error: no files to send');
        }

        filesToSend.forEach((file, idx) => {
            const lowResPath = path.join(CACHE_DIR, file);
            const highResPath = path.join(IMAGES_DIR, file);

            fs.readFile(lowResPath, (err, data) => {
                if (err) {
                    console.error(`Error reading low-res file: ${lowResPath} - ${err}`);
                    return ws.send(`Error reading file: ${file}`);
                }
                ws.send(JSON.stringify({ fileName: file, data: data.toString('base64'), type: 'low' }));
                console.log(`Sent low-res ${file} as message ${idx}`);
            });

            fs.readFile(highResPath, (err, data) => {
                if (err) {
                    console.error(`Error reading high-res file: ${highResPath} - ${err}`);
                    return ws.send(`Error reading file: ${file}`);
                }
                ws.send(JSON.stringify({ fileName: file, data: data.toString('base64'), type: 'high' }));
                console.log(`Sent high-res ${file} as message ${idx}`);
            });
        });
    });
});
