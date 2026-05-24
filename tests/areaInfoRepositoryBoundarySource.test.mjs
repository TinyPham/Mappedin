import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../backend/areaInfoRepository.ts', import.meta.url), 'utf8');

test('area information stored procedure call lives in areaInfoRepository', () => {
  assert.match(repositorySource, /upsertAreaInformation/);
  assert.match(repositorySource, /SP_UpsertAreaInformation/);
  assert.match(repositorySource, /MappedinImageUrl/);
  assert.match(repositorySource, /LocationDetail_KO/);

  const routeBlock = serverSource.slice(
    serverSource.indexOf("app.post('/api/update-area-info'"),
    serverSource.indexOf("app.post('/api/area-colors'")
  );
  assert.doesNotMatch(routeBlock, /SP_UpsertAreaInformation/);
  assert.doesNotMatch(routeBlock, /LocationDetail_KO/);
});

test('update-area-info route delegates to repository and remains admin-only', () => {
  assert.match(serverSource, /app\.post\('\/api\/update-area-info', requireAdmin/);
  assert.match(serverSource, /upsertAreaInformation\(db,\s*sql,\s*req\.body\)/);
});
