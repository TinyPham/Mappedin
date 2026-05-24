import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../backend/categoryAssignmentRepository.ts', import.meta.url), 'utf8');
const procedureScript = readFileSync(new URL('../database/patches/create_sp_assign_subcategory_areas.sql', import.meta.url), 'utf8');

test('subcategory assignment transaction SQL lives in repository', () => {
  assert.match(repositorySource, /assignSubCategoryAreas/);
  assert.match(repositorySource, /new sqlTypes\.Transaction\(db\)/);
  assert.match(repositorySource, /DELETE FROM AreaCategory WHERE SubCategoryID = @SID/);
  assert.match(repositorySource, /INSERT INTO AreaCategory/);

  const routeBlock = serverSource.slice(
    serverSource.indexOf("app.post('/api/categories/subcategory/:id/assign'"),
    serverSource.indexOf('// GET all assigned areas')
  );
  assert.doesNotMatch(routeBlock, /new sql\.Transaction/);
  assert.doesNotMatch(routeBlock, /DELETE FROM AreaCategory/);
  assert.doesNotMatch(routeBlock, /INSERT INTO AreaCategory/);
});

test('subcategory assignment route delegates to repository and remains admin-only', () => {
  assert.match(serverSource, /app\.post\('\/api\/categories\/subcategory\/:id\/assign', requireAdmin/);
  assert.match(serverSource, /assignSubCategoryAreas\(db,\s*sql,\s*id,\s*areaIds\)/);
});

test('SSMS-ready stored procedure script is provided for future DB migration', () => {
  assert.match(procedureScript, /CREATE OR ALTER PROCEDURE dbo\.SP_AssignSubCategoryAreas/);
  assert.match(procedureScript, /@SubCategoryID INT/);
  assert.match(procedureScript, /@MappedinIDs dbo\.MappedinIDList READONLY/);
  assert.match(procedureScript, /BEGIN TRANSACTION/);
  assert.match(procedureScript, /COMMIT TRANSACTION/);
});
