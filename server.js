import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, process.argv[2] || './dist');
const port = Number(process.argv[3]) || 3001;

const fallbackFile = path.join(rootDir, 'fallback.html');

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url || '/');
    let pathname = decodeURIComponent(parsedUrl.pathname || '/');

    // Normalize and prevent directory traversal
    pathname = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');

    // Map URL to filesystem path
    let filePath = path.join(rootDir, pathname);

    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isDirectory()) {
            // Directory: look for index.html
            const indexPath = path.join(filePath, 'index.html');
            return fs.stat(indexPath, (indexErr, indexStats) => {
                if (!indexErr && indexStats.isFile()) {
                    serveFile(indexPath, res);
                } else {
                    sendFallback(res);
                }
            });
        }

        // If not found as-is, try .html extension
        if (err || !stats.isFile()) {
            const htmlPath = filePath + '.html';
            return fs.stat(htmlPath, (htmlErr, htmlStats) => {
                if (!htmlErr && htmlStats.isFile()) {
                    serveFile(htmlPath, res);
                } else {
                    sendFallback(res);
                }
            });
        }

        // Regular file
        serveFile(filePath, res);
    });
});

function serveFile(filePath, res, statusCode = 200) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.createReadStream(filePath)
        .on('open', () => {
            res.writeHead(statusCode, { 'Content-Type': contentType });
        })
        .on('error', () => {
            sendFallback(res);
        })
        .pipe(res);
}

function sendFallback(res) {
    fs.stat(fallbackFile, (err, stats) => {
        if (!err && stats.isFile()) {
            // Still respond with 404, just render fallback.html
            serveFile(fallbackFile, res, 404);
        } else {
            // If fallback is missing, fall back to plain text 404
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
        }
    });
}

server.listen(port, () => {
    console.log(`Serving "${rootDir}" at http://localhost:${port}`);
});