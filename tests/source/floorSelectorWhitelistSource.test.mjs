import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../../main/main-function/index.ts', import.meta.url), 'utf8');

test('floor selector imports the shared whitelist helper', () => {
  assert.match(
    source,
    /import\s*\{\s*selectFloorsForDropdown\s*\}\s*from\s*["']\.\.\/\.\.\/src\/config\/selectableFloors\.js["']/
  );
});

test('initial population and programmatic rebuild both use the shared whitelist', () => {
  const usages = source.match(/selectFloorsForDropdown\(/g) || [];
  assert.equal(usages.length, 2);

  assert.match(
    source,
    /selectFloorsForDropdown\(mapData\.getByType\(["']floor["']\),\s*overviewFloor\?\.id\)[\s\S]*?\.sort\(\(b, a\)/
  );
  assert.match(
    source,
    /const selectableFloors\s*=\s*selectFloorsForDropdown\(allFloors,\s*overviewFloor\?\.id\)/
  );
});
