import assert from 'node:assert/strict';
import {
    buildUniqueUploadName,
    parseImageDataUrl,
    sanitizeUploadFilename
} from './uploads';

(() => {
    assert.equal(sanitizeUploadFilename('../secret/appsettings.json'), 'appsettings.json');
    assert.equal(sanitizeUploadFilename('my image<>.png'), 'my_image.png');
})();

(() => {
    const parsed = parseImageDataUrl('data:image/png;base64,aGVsbG8=');
    assert.equal(parsed.extension, 'png');
    assert.equal(parsed.buffer.toString('utf8'), 'hello');
})();

(() => {
    assert.throws(() => parseImageDataUrl('data:text/plain;base64,aGVsbG8='), /invalid image/i);
})();

(() => {
    const name = buildUniqueUploadName('../bad.exe', 'png');
    assert.match(name, /^\d+_[a-f0-9]{16}_bad\.png$/);
})();

console.log('uploads tests passed');
