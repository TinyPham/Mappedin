import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../../backend/categoryAreaRepository.ts', import.meta.url), 'utf8');

test('read-only category and area SQL lives in categoryAreaRepository', () => {
  assert.match(repositorySource, /getSubCategoryLocations/);
  assert.match(repositorySource, /getAssignedAreas/);
  assert.match(repositorySource, /getActiveCategories/);
  assert.match(repositorySource, /FROM AreaList AL/);
  assert.match(repositorySource, /SELECT DISTINCT C\.\*/);
});

test('server read-only category and area routes delegate to repository functions', () => {
  assert.match(serverSource, /getSubCategoryLocations\(db,\s*sql,\s*id\)/);
  assert.match(serverSource, /getAssignedAreas\(db\)/);
  assert.match(serverSource, /getActiveCategories\(db\)/);

  const subCategoryRoute = serverSource.slice(
    serverSource.indexOf("app.get('/api/categories/subcategory/:id/locations'"),
    serverSource.indexOf('// UPDATE Assignments for a SubCategory')
  );
  assert.doesNotMatch(subCategoryRoute, /FROM AreaList AL/);

  const assignedRoute = serverSource.slice(
    serverSource.indexOf("app.get('/api/areas/assigned'"),
    serverSource.indexOf("// GET active categories")
  );
  assert.doesNotMatch(assignedRoute, /JOIN AreaCategory/);

  const activeCategoriesRoute = serverSource.slice(
    serverSource.indexOf("app.get('/api/categories/active'"),
    serverSource.indexOf('async function scanAndSyncModels')
  );
  assert.doesNotMatch(activeCategoriesRoute, /SELECT DISTINCT C\.\*/);
});
