import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../backend/areaColorRepository.ts', import.meta.url), 'utf8');

test('area color SQL lives in the repository instead of route handlers', () => {
  assert.doesNotMatch(serverSource, /AreaColorOverrides/);
  assert.match(repositorySource, /AreaColorOverrides/);
});

test('area color routes delegate persistence to repository functions', () => {
  assert.match(serverSource, /fetchAreaColorMap\(db\)/);
  assert.match(serverSource, /upsertAreaColors\(/);
  assert.match(serverSource, /deleteAreaColors\(/);
  assert.match(serverSource, /ensureAreaColorTableExists\(db\)/);
});
