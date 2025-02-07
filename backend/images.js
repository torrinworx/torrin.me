import fs from 'fs';
import path from 'path';

const IMAGES_DIR = path.resolve('./images');
const CACHE_DIR = path.resolve('./cache');


const getImageDate = (image) => {
    if (image.dateTimeOriginal) {
        // Exif date strings often "YYYY:MM:DD HH:MM:SS"
        const safeStr = image.dateTimeOriginal.replace(/:/g, '-');
        const parsed = Date.parse(safeStr);
        if (!Number.isNaN(parsed)) {
            return new Date(parsed);
        }
    }
    // Fallback: check file's mtime
    try {
        const stats = fs.statSync(path.join(IMAGES_DIR, image.name));
        return stats.mtime;
    } catch (err) {
        return new Date(0);
    }
}

export default (ws, msg, imagesList) => {
    let request;
    try {
        request = JSON.parse(msg);
    } catch (e) {
        console.error('Invalid JSON:', e);
        return ws.send('Error: invalid JSON');
    }

    const { num, index, tags } = request;
    if (
        typeof num !== 'number' ||
        typeof index !== 'number' ||
        !Array.isArray(tags) ||
        !tags.every(tag => typeof tag === 'string')
    ) {
        return ws.send('Error: invalid request format');
    }

    // Filter by tags => must contain all
    const filtered = imagesList.filter(img =>
        tags.every(t => img.keywords.includes(t))
    );

    // Sort newest first
    filtered.sort((a, b) => getImageDate(b) - getImageDate(a));

    // Slice
    const slice = filtered.slice(index, index + num);

    if (slice.length === 0) return ws.send(JSON.stringify({ error: 'No images in this slice' }));

    // Send each image in two messages: low-res first, then high-res
    slice.forEach(image => {
        const cachedPath = path.join(CACHE_DIR, image.name);
        const fullPath = path.join(IMAGES_DIR, image.name);

        // Low-res
        fs.readFile(cachedPath, (err, lowData) => {
            if (err) {
                console.error(`Error reading low-res file: ${cachedPath}`, err);
                return;
            }
            ws.send(JSON.stringify({
                fileName: image.name,
                data: lowData.toString('base64'),
                type: 'low'
            }));
        });

        // High-res
        fs.readFile(fullPath, (err, highData) => {
            if (err) {
                console.error(`Error reading high-res file: ${fullPath}`, err);
                return;
            }
            ws.send(JSON.stringify({
                fileName: image.name,
                data: highData.toString('base64'),
                type: 'high'
            }));
        });
    });
}
