import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const serverSource = readFileSync(new URL('../backend/server.ts', import.meta.url), 'utf8');

test('backend does not serve the repository root as a static directory', () => {
  assert.doesNotMatch(
    serverSource,
    /app\.use\(\s*['"]\/['"]\s*,\s*express\.static\(\s*ROOT_DIR\s*\)\s*\)/,
    'Express must not expose backend, database, scripts, appsettings, or backup files by serving ROOT_DIR'
  );
});

test('admin write endpoints are protected by requireAdmin middleware', () => {
  const protectedRoutes = [
    "app.post('/api/upload-image', requireAdmin",
    "app.post('/api/update-area-info', requireAdmin",
    "app.post('/api/area-colors', requireAdmin",
    "app.delete('/api/area-colors', requireAdmin",
    "app.post('/api/models/sync-overview-floor', requireAdmin",
    "app.post('/api/models', requireAdmin",
    "app.delete('/api/models/:uuid', requireAdmin",
    "app.post('/api/models/batch', requireAdmin",
    "app.post('/api/areas/sync', requireAdmin",
    "app.post('/api/categories/subcategory/:id/assign', requireAdmin",
    "app.post('/api/admin/locations', requireAdmin"
  ];

  for (const route of protectedRoutes) {
    assert.ok(serverSource.includes(route), `Missing admin middleware on ${route}`);
  }
});

test('public viewer read endpoints remain public', () => {
  const publicRoutes = [
    "app.get('/api/init-data'",
    "app.get('/api/flights'",
    "app.get('/api/flights/:id/navigation-targets'",
    "app.get('/api/models'",
    "app.get('/api/models/:uuid'",
    "app.get('/api/categories'",
    "app.get('/api/categories/active'",
    "app.get('/api/areas/assigned'",
    "app.get('/health'"
  ];

  for (const route of publicRoutes) {
    assert.ok(serverSource.includes(route), `Public route disappeared: ${route}`);
  }
});
