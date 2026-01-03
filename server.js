import http from 'http';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';

/**
 * Load a simple KEY=VALUE .env file into process.env
 * Only used in development.
 */
const loadEnv = async (filePath = path.join(__dirname, '.env')) => {
    console.log(filePath);
    try {
        const data = await fsp.readFile(filePath, { encoding: 'utf8' });
        for (const rawLine of data.split('\n')) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;
            const eqIdx = line.indexOf('=');
            if (eqIdx === -1) continue;
            const key = line.slice(0, eqIdx).trim();
            const value = line.slice(eqIdx + 1).trim();
            if (!key) continue;
            process.env[key] = value;
        }
    } catch (e) {
        console.error(`Failed to load .env file (${filePath}): ${e.message}`);
    }
}

// in dev, load .env before anything else
if (!isProd) {
    await loadEnv();
}

const resend = new Resend(process.env.RESEND_API);

// paths / config
const rootDir = path.resolve(
    __dirname,
    process.argv[2] || (isProd ? './dist' : './frontend')
);
const port = Number(process.argv[3] || process.env.PORT || 3001);
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

// Helper to parse JSON body from POST
const parseJsonBody = (req) =>
    new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
            if (body.length > 1e6) {
                req.destroy();
                reject(new Error('Body too large'));
            }
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                resolve(data);
            } catch (err) {
                reject(err);
            }
        });
        req.on('error', reject);
    });

let vite = null;
if (!isProd) {
    const { createServer: createViteServer } = await import('vite');

    vite = await createViteServer({
        configFile: path.resolve(__dirname, 'vite.config.js'),
        server: {
            middlewareMode: 'html',
        },
    });
}

const serveFile = (filePath, res, statusCode = 200) => {
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
};

const sendFallback = (res) => {
    fs.stat(fallbackFile, (err, stats) => {
        if (!err && stats.isFile()) {
            serveFile(fallbackFile, res, 404);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
        }
    });
};

const handleStatic = (req, res) => {
    const parsedUrl = url.parse(req.url || '/');
    let pathname = decodeURIComponent(parsedUrl.pathname || '/');
    pathname = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(rootDir, pathname);

    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isDirectory()) {
            const indexPath = path.join(filePath, 'index.html');
            return fs.stat(indexPath, (indexErr, indexStats) => {
                if (!indexErr && indexStats.isFile()) {
                    serveFile(indexPath, res);
                } else {
                    sendFallback(res);
                }
            });
        }

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

        serveFile(filePath, res);
    });
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url || '/');
    const pathname = decodeURIComponent(parsedUrl.pathname || '/');

    if (pathname === '/contact' && req.method === 'POST') {
        try {
            const data = await parseJsonBody(req);
            const { email, fullName, phone, message } = data;

            if (!email || !fullName || !message) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: 'Missing required fields' }));
                return;
            }

            resend.emails.send({
                from: `"${fullName}" <${process.env.SMTP_USER}>`,
                to: process.env.SMTP_TO || process.env.SMTP_USER,
                subject: 'New contact form submission',
                text: `
New message from torrin.me/services form:

Name: ${fullName}
Email: ${email}
Phone: ${phone || 'N/A'}

Message:
${message}
`.trim()
            });

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true }));
        } catch (err) {
            console.error('Error in /contact handler:', err);
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
        }
        return;
    }

    // Dev: pass everything else through Vite dev server
    if (!isProd && vite) {
        vite.middlewares(req, res, (err) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Error: ${err.message}`);
                vite.ssrFixStacktrace(err);
                console.error('Error in Vite middlewares:', err);
            }
        });
        return;
    }

    // Prod: static file handler
    handleStatic(req, res);
});

server.listen(port, () => {
    console.log(
        `${isProd ? 'Production' : 'Development'} server serving "${rootDir}" at http://localhost:${port}`
    );
});
