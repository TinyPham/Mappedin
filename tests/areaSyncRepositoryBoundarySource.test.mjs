import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../backend/areaSyncRepository.ts', import.meta.url), 'utf8');

test('area sync SQL lives in areaSyncRepository', () => {
  assert.match(repositorySource, /syncMappedinAreas/);
  assert.match(repositorySource, /INSERT INTO AreaList/);
  assert.doesNotMatch(repositorySource, /UPDATE AreaList/);

  const routeBlock = serverSource.slice(
    serverSource.indexOf("app.post('/api/areas/sync'"),
    serverSource.indexOf('// GET Locations for a SubCategory')
  );
  assert.doesNotMatch(routeBlock, /INSERT INTO AreaList/);
  assert.doesNotMatch(routeBlock, /UPDATE AreaList/);
});

test('area sync route delegates persistence and keeps admin protection', () => {
  assert.match(serverSource, /app\.post\('\/api\/areas\/sync', requireAdmin/);
  assert.match(serverSource, /syncMappedinAreas\(db,\s*sql,\s*areas\)/);
});
