import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../backend/initDataRepository.ts', import.meta.url), 'utf8');

test('init data stored procedure call lives in initDataRepository', () => {
  assert.match(repositorySource, /SP_GetInitialData/);
  assert.doesNotMatch(serverSource, /SP_GetInitialData/);
});

test('init-data route delegates payload loading to repository', () => {
  assert.match(serverSource, /getInitialData\(db\)/);
});
