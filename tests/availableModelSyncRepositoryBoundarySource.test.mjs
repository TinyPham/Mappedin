import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../backend/availableModelSyncRepository.ts', import.meta.url), 'utf8');

test('available model sync stored procedure call lives in availableModelSyncRepository', () => {
  assert.match(repositorySource, /SP_SyncAvailableModel/);
  assert.doesNotMatch(serverSource, /SP_SyncAvailableModel/);
});

test('model library scanner delegates database sync to repository', () => {
  assert.match(serverSource, /syncAvailableModel\(db,\s*sql,/);
});
