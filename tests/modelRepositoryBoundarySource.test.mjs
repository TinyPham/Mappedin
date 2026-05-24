import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../backend/modelRepository.ts', import.meta.url), 'utf8');

test('model stored procedure calls live in modelRepository', () => {
  [
    'SP_GetAllModels',
    'SP_UpdateOverviewModelFloorId',
    'SP_GetModelByUUID',
    'SP_UpsertModel',
    'SP_DeleteModel',
    'SP_GetAvailableModels'
  ].forEach((proc) => {
    assert.match(repositorySource, new RegExp(proc));
    assert.doesNotMatch(serverSource, new RegExp(proc));
  });
});

test('model routes delegate to modelRepository functions and keep admin protection', () => {
  assert.match(serverSource, /getAllModels\(db\)/);
  assert.match(serverSource, /syncOverviewModelFloorId\(db,\s*sql,\s*overviewFloorId\)/);
  assert.match(serverSource, /getModelByUuid\(db,\s*sql,\s*uuid\)/);
  assert.match(serverSource, /upsertModel\(db,\s*sql,\s*req\.body\)/);
  assert.match(serverSource, /deleteModel\(db,\s*sql,\s*uuid\)/);
  assert.match(serverSource, /upsertModels\(db,\s*sql,\s*models\)/);
  assert.match(serverSource, /getAvailableModels\(db\)/);

  assert.match(serverSource, /app\.post\('\/api\/models', requireAdmin/);
  assert.match(serverSource, /app\.delete\('\/api\/models\/:uuid', requireAdmin/);
  assert.match(serverSource, /app\.post\('\/api\/models\/batch', requireAdmin/);
});
