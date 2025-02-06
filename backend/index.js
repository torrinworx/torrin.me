import fs from 'fs';
import path from 'path';

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';

import sharp from 'sharp';
import ExifReader from 'exifreader';

import { ODB } from 'destam-web-core';
import { OArray, OObject } from 'destam';
import { initODB } from 'destam-web-core';
import { ODir } from 'destam-web-core/server';

import images from './images.js';

const IMAGES_DIR = path.resolve('./images');
const CACHE_DIR = path.resolve('./cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Read and parse EXIF (for dateTimeOriginal, keywords)

function imageMetadata(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const tags = ExifReader.load(fileBuffer, { expanded: true });

    let dateTimeOriginal = '';
    if (tags.exif && tags.exif.DateTimeOriginal) {
        dateTimeOriginal = tags.exif.DateTimeOriginal.description;
    } else if (tags.xmp && tags.xmp.DateTimeOriginal) {
        dateTimeOriginal = tags.xmp.DateTimeOriginal.description;
    }

    // Parse keywords from a variety of possible fields
    let keywords = [];
    if (tags.Keywords && typeof tags.Keywords.description === 'string') {
        keywords = tags.Keywords.description
            .split(';')
            .map(k => k.trim())
            .filter(Boolean);
    } else if (tags.Subject && tags.Subject.value) {
        const subjectVal = Array.isArray(tags.Subject.value)
            ? tags.Subject.value
            : [tags.Subject.value];
        keywords = subjectVal.map(
            item => (typeof item === 'object' ? item.value : item)
        );
    } else if (tags.xmp && tags.xmp.subject && tags.xmp.subject.value) {
        const xmpVal = Array.isArray(tags.xmp.subject.value)
            ? tags.xmp.subject.value
            : [tags.xmp.subject.value];
        keywords = xmpVal.map(
            item => (typeof item === 'object' ? item.value : item)
        );
    } else if (tags.iptc && tags.iptc.Keywords && tags.iptc.Keywords.value) {
        const iptcVal = Array.isArray(tags.iptc.Keywords.value)
            ? tags.iptc.Keywords.value
            : [tags.iptc.Keywords.value];
        keywords = iptcVal.map(
            item => (typeof item === 'object' ? item.value : item)
        );
    }

    keywords = keywords.map(k => k.trim()).filter(Boolean);

    return {
        dateTimeOriginal,
        keywords,
    };
}

// create low-res version if it doesn't exist
async function createLowResImage(filename) {
    const inputPath = path.join(IMAGES_DIR, filename);
    const outputPath = path.join(CACHE_DIR, filename);
    if (fs.existsSync(outputPath)) return;
    
    try {
        await sharp(inputPath)
            .resize({
                width: 1000,
                height: 1000,
                fit: 'inside',
                withoutEnlargement: true,
            })
            .toFile(outputPath);
        console.log(`Low-res image created: ${outputPath}`);
    } catch (err) {
        console.error('Error creating low-res image:', err);
    }
}

// handleFileChange (add/remove) => update imagesList, keywordsList
function handleFileChange(change, imagesList, keywordsList) {
    const { ref, value } = change;
    const existing = imagesList.find(i => i.name === ref);

    if (value) {
        // File added or confirmed to exist
        if (!existing) {
            const meta = imageMetadata(path.join(IMAGES_DIR, ref));
            imagesList.push({
                name: ref,
                dateTimeOriginal: meta.dateTimeOriginal,
                keywords: meta.keywords,
            });
            console.log('FILE ADDED', ref);

            // Create low-res in the background
            createLowResImage(ref).catch(err =>
                console.error(`Error resizing new file ${ref}:`, err)
            );
        }
    } else {
        // File removed
        const idx = imagesList.findIndex(i => i.name === ref);
        if (idx !== -1) {
            imagesList.splice(idx, 1);

            // Remove from cache
            const cachedPath = path.join(CACHE_DIR, ref);
            if (fs.existsSync(cachedPath)) {
                fs.unlink(cachedPath, err => {
                    if (err) {
                        console.error('Failed to remove cached file:', ref, err);
                    } else {
                        console.log('Cached file removed:', ref);
                    }
                });
            }
        }
    }

    // Recalculate keywords
    const uniqueSet = new Set();
    imagesList.forEach(img => {
        (img.keywords || []).forEach(k => uniqueSet.add(k));
    });

    // Remove old keywords
    for (let i = keywordsList.length - 1; i >= 0; i--) {
        if (!uniqueSet.has(keywordsList[i])) {
            keywordsList.splice(i, 1);
        }
    }
    // Add new ones
    uniqueSet.forEach(k => {
        if (!keywordsList.includes(k)) {
            keywordsList.push(k);
        }
    });
}

// rectifyMissingCache => create cache for any images lacking it
async function rectifyMissingCache(imagesList) {
    for (const img of imagesList) {
        const cachedPath = path.join(CACHE_DIR, img.name);
        if (!fs.existsSync(cachedPath)) {
            createLowResImage(img.name).catch(err =>
                console.error(`Error creating low-res: ${img.name}`, err)
            );
        }
    }
}

// syncImages => do initial scanning & cleanup, set watchers
async function syncImages() {
    // Use destam to store images list in Mongo
    const imagesObj = await ODB('mongodb','images',
        { name: 'images' },
        OObject({ name: 'images', list: OArray([]) })
    );
    const imagesList = imagesObj.list; // OArray
    const keywordsList = OArray([]);

    // 1) Scan the current files in the images directory
    const files = fs.readdirSync(IMAGES_DIR);
    files.forEach(file => {
        handleFileChange({ ref: file, value: file }, imagesList, keywordsList);
    });

    // 2) Remove anything in imagesList that no longer exists on disk
    for (let i = imagesList.length - 1; i >= 0; i--) {
        if (!files.includes(imagesList[i].name)) {
            handleFileChange({ ref: imagesList[i].name, value: undefined }, imagesList, keywordsList);
        }
    }

    // 3) Remove stale cache files
    const cacheFiles = fs.readdirSync(CACHE_DIR);
    cacheFiles.forEach(file => {
        if (!imagesList.some(img => img.name === file)) {
            const stalePath = path.join(CACHE_DIR, file);
            fs.unlink(stalePath, err => {
                if (err) {
                    console.error(`Error removing stale cache file: ${stalePath}`, err);
                } else {
                    console.log(`Removed stale cache file: ${stalePath}`);
                }
            });
        }
    });

    // 4) Ensure every image in imagesList has a cached copy
    await rectifyMissingCache(imagesList);

    // 5) Watch for add/remove changes in the images dir
    ODir(IMAGES_DIR).watch(d => handleFileChange(d, imagesList, keywordsList));

    return { imagesList, keywordsList };
}

//──────────────────────────────────────────────────────────────────────────────────
// EXPRESS + WEBSOCKET SERVER
//──────────────────────────────────────────────────────────────────────────────────

const root = process.env.ENV === 'production' ? './dist' : './frontend';
const app = express();

if (process.env.ENV === 'production') {
    app.use(express.static(root));
    console.log('Serving from:', path.join(root, 'index.html'));

    app.get('*', (req, res) => {
        res.sendFile(path.join(root, 'index.html'), (err) => {
            if (err) {
                res.status(500).send(err);
                console.error('Error serving index.html:', err);
            }
        });
    });
} else {
    const vitePromise = createViteServer({ server: { middlewareMode: 'html' } })
        .then(vite => {
            app.use(vite.middlewares);
            app.get('*', async (req, res, next) => {
                try {
                    const html = await vite.transformIndexHtml(
                        req.originalUrl,
                        fs.readFileSync(path.resolve(root, 'index.html'), 'utf-8')
                    );
                    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
                } catch (e) {
                    vite.ssrFixStacktrace(e);
                    next(e);
                }
            });
        })
        .catch(err => console.error('Error creating Vite server:', err));

    // We’ll await that later in the main start routine
}

let imagesList, keywordsList;
const server = app.listen(process.env.PORT || 3000, async () => {
    // 1) Init DB
    await initODB();

    // 2) Sync images => sets up watchers, etc.
    const result = await syncImages();
    imagesList = result.imagesList;
    keywordsList = result.keywordsList;

    console.log(`Server running at http://localhost:${process.env.PORT || 3000}/`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
    ws.on('message', (msg) => {
        // Delegate streaming to images.js
        images(ws, msg, imagesList, keywordsList);
    });
});
