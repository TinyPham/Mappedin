import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../../backend/adminLocationRepository.ts', import.meta.url), 'utf8');
const areaInfoRepositorySource = readFileSync(new URL('../../backend/areaInfoRepository.ts', import.meta.url), 'utf8');

test('admin location saves use AreaInformation as source of truth', () => {
  assert.doesNotMatch(repositorySource, /SP_Admin_UpsertLocation/);
  assert.doesNotMatch(repositorySource, /MasterData_Locations/);
  assert.match(areaInfoRepositorySource, /SP_UpsertAreaInformation/);

  const routeBlock = serverSource.slice(
    serverSource.indexOf("app.post('/api/admin/locations'"),
    serverSource.indexOf('// BULK SYNC: Push Mappedin locations')
  );
  assert.doesNotMatch(routeBlock, /SP_Admin_UpsertLocation/);
  assert.doesNotMatch(routeBlock, /upsertAdminLocation/);
});

test('admin location route delegates to area information repository and remains admin-only', () => {
  assert.match(serverSource, /app\.post\('\/api\/admin\/locations', requireAdmin/);
  assert.match(serverSource, /upsertAreaInformation\(db,\s*sql,/);
});
