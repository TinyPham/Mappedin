import crypto from 'crypto';
import path from 'path';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
    png: 'png',
    jpeg: 'jpg',
    jpg: 'jpg',
    webp: 'webp',
    gif: 'gif'
};

export function sanitizeUploadFilename(filename: string): string {
    const parsed = path.parse(path.basename(filename || 'upload'));
    const baseName = (parsed.name || 'upload')
        .normalize('NFKD')
        .replace(/[^\w.-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 80) || 'upload';
    const ext = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, '');
    return `${baseName}${ext}`;
}

export function parseImageDataUrl(image: string) {
    const match = /^data:image\/(png|jpe?g|webp|gif);base64,([a-z0-9+/=\s]+)$/i.exec(image || '');
    if (!match) {
        throw new Error('Invalid image data URL');
    }

    const extension = ALLOWED_IMAGE_EXTENSIONS[match[1].toLowerCase()];
    if (!extension) {
        throw new Error('Unsupported image type');
    }

    const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    if (buffer.length === 0) {
        throw new Error('Image payload is empty');
    }
    if (buffer.length > MAX_UPLOAD_BYTES) {
        throw new Error('Image payload exceeds 5MB limit');
    }

    return { buffer, extension };
}

export function buildUniqueUploadName(filename: string, extension: string): string {
    const safeName = sanitizeUploadFilename(filename);
    const parsed = path.parse(safeName);
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    return `${Date.now()}_${randomSuffix}_${parsed.name}.${extension}`;
}
