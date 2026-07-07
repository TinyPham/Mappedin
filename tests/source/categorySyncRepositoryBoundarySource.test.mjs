import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../../backend/categorySyncRepository.ts', import.meta.url), 'utf8');

test('category sync SQL lives in categorySyncRepository', () => {
  assert.match(repositorySource, /syncCategoryDirectory/);
  assert.match(repositorySource, /SP_SyncCategoryStructure/);
  assert.match(repositorySource, /INSERT INTO Categories/);
  assert.match(repositorySource, /INSERT INTO SubCategories/);
  assert.match(repositorySource, /DELETE FROM SubCategories/);

  const start = serverSource.indexOf('async function syncCategories()');
  const end = serverSource.indexOf('// =============================================\r\n// AREA CLASSIFICATION API', start);
  const syncBlock = serverSource.slice(start, end);
  assert.doesNotMatch(syncBlock, /SP_SyncCategoryStructure/);
  assert.doesNotMatch(syncBlock, /INSERT INTO Categories/);
  assert.doesNotMatch(syncBlock, /INSERT INTO SubCategories/);
  assert.doesNotMatch(syncBlock, /DELETE FROM SubCategories/);
});

test('server category sync delegates to repository while keeping startup call', () => {
  assert.match(serverSource, /syncCategoryDirectory\(/);
  assert.match(serverSource, /await syncCategories\(\)/);
});
