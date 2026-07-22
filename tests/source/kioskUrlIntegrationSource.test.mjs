import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../../main/main-function/index.ts', import.meta.url), 'utf8');

test('map runtime imports the map URL builder', () => {
  assert.match(
    source,
    /import\s*\{\s*buildMapUrl\s*\}\s*from\s*["']\.\.\/\.\.\/src\/kiosk\/kioskMode\.js["']/
  );
});

test('syncURL delegates final URL construction to the pure builder', () => {
  const syncStart = source.indexOf('const syncURL = (forceReplace = false) =>');
  const syncEnd = source.indexOf('(window as any).syncURL = syncURL;', syncStart);

  assert.notEqual(syncStart, -1, 'syncURL function must exist');
  assert.notEqual(syncEnd, -1, 'syncURL assignment must exist');

  const syncBlock = source.slice(syncStart, syncEnd);
  assert.match(syncBlock, /const\s+fullURL\s*=\s*buildMapUrl\(window\.location\.search,\s*\{/);
});
