import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../../backend/categoryTreeRepository.ts', import.meta.url), 'utf8');

test('category tree stored procedure call lives in categoryTreeRepository', () => {
  assert.match(repositorySource, /SP_GetCategoryTree/);
  assert.doesNotMatch(serverSource, /SP_GetCategoryTree/);
});

test('category route delegates tree loading to repository', () => {
  assert.match(serverSource, /getCategoryTree\(db\)/);
});
