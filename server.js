import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(
    __dirname,
    process.argv[2] || './dist'
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


console.log(process.env.SMTP_USER, process.env.SMTP_PASS);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Helper to parse JSON body from POST
const parseJsonBody = (req) =>
    new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
            // basic guard against huge payloads
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

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url || '/');
    let pathname = decodeURIComponent(parsedUrl.pathname || '/');

    if (pathname === '/contact' && req.method === 'POST') {
        try {
            const data = await parseJsonBody(req);

            const { email, fullName, phone, message } = data;

            if (!email || !fullName || !message) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: 'Missing required fields' }));
                return;
            }

            const mailOptions = {
                from: `"${fullName}" <${process.env.SMTP_USER}>`,
                to: process.env.SMTP_TO || process.env.SMTP_USER,
                subject: 'New contact form submission',
                text: `
New contact submission:

Name: ${fullName}
Email: ${email}
Phone: ${phone || 'N/A'}

Message:
${message}
`.trim(),
            };

            await transporter.sendMail(mailOptions);

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true }));
        } catch (err) {
            console.error('Error in /contact handler:', err);
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
        }
        return;
    }

    // --- STATIC FILE HANDLING (your existing stuff) ---
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
});

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

server.listen(port, () => {
    console.log(`Serving "${rootDir}" at http://localhost:${port}`);
});