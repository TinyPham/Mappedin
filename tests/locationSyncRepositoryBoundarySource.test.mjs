import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../backend/locationSyncRepository.ts', import.meta.url), 'utf8');

test('mappedin location sync logic lives in locationSyncRepository', () => {
  assert.match(repositorySource, /syncMappedinLocations/);
  assert.match(repositorySource, /SP_SyncMappedinLocation/);
  assert.match(repositorySource, /updated\+\+/);

  const routeBlock = serverSource.slice(
    serverSource.indexOf("app.post('/api/sync-locations'"),
    serverSource.indexOf('// CATCH-ALL ROUTE')
  );
  assert.doesNotMatch(routeBlock, /for \(const loc of locations\)/);
  assert.doesNotMatch(routeBlock, /SP_SyncMappedinLocation/);
});

test('sync-locations route delegates to repository and remains admin-only', () => {
  assert.match(serverSource, /app\.post\('\/api\/sync-locations', requireAdmin/);
  assert.match(serverSource, /syncMappedinLocations\(db,\s*sql,\s*locations\)/);
});
