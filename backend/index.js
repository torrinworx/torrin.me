import fs from 'fs';
import path from 'path';
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';

const root = process.env.ENV === 'production' ? './dist' : './frontend';
const PORT = process.env.PORT || 3000;
const IMAGES_DIR = './images';

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

// Function to load and sort files
let jpgFiles = [];
const loadFiles = () => {
    fs.readdir(IMAGES_DIR, (err, files) => {
        if (err) {
            console.error('Unable to scan directory:', err);
            return;
        }

        jpgFiles = files.filter(file => file.endsWith('.jpg')).sort((a, b) => {
            const aTime = fs.statSync(path.join(IMAGES_DIR, a)).birthtime;
            const bTime = fs.statSync(path.join(IMAGES_DIR, b)).birthtime;
            return aTime - bTime;
        });
    });
};

// Load files initially
loadFiles();

// Monitor directory for changes
fs.watch(IMAGES_DIR, (eventType, filename) => {
    if (filename && filename.endsWith('.jpg')) {
        console.log(`File ${eventType}: ${filename}`);
        loadFiles(); // Refresh the file list
    }
});

// Create and Attach WebSocket Server
const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
    console.log("THIS IS A CONNECTION")
    ws.on('message', msg => {
        console.log(msg)
        // Parse the incoming message
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

        // Stream the requested range of images
        const filesToSend = jpgFiles.slice(index, index + num);
        filesToSend.forEach(file => {
            const filePath = path.join(IMAGES_DIR, file);
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    console.error('Error reading file:', filePath, err);
                    return ws.send(`Error reading file: ${file}`);
                }
                ws.send(JSON.stringify({ fileName: file, data: data.toString('base64') }));
            });
        });
    });
});
