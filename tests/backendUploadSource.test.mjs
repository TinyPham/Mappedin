import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../backend/server.ts', import.meta.url), 'utf8');

test('upload endpoint uses validated upload helpers and async file writes', () => {
  assert.match(serverSource, /parseImageDataUrl/);
  assert.match(serverSource, /buildUniqueUploadName/);
  assert.match(serverSource, /await\s+fs\.promises\.writeFile/);
  assert.doesNotMatch(serverSource, /fs\.writeFileSync\(filePath,\s*buffer\)/);
});
