import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const serverSource = await readFile(new URL('../../backend/server.ts', import.meta.url), 'utf8');

test('backend lets the deployment PORT environment variable override appsettings', () => {
  assert.match(
    serverSource,
    /const PORT\s*=\s*process\.env\.PORT\s*\|\|\s*appSettings\.AppSettings\?\.Port\s*\|\|\s*3002/
  );
});
