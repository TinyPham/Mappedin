import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../backend/server.ts', import.meta.url), 'utf8');

test('available models endpoint is declared once', () => {
  const matches = source.match(/app\.get\('\/api\/available-models'/g) || [];
  assert.equal(matches.length, 1);
});

test('available models endpoint does not print database rows in debug logs', () => {
  assert.doesNotMatch(source, /DEBUG AvailableModels/);
  assert.doesNotMatch(source, /DEBUG First row/);
  assert.doesNotMatch(source, /DEBUG Models response/);
});
