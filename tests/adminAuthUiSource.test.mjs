import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');

test('admin query parameter opens login but does not disable viewer mode by itself', () => {
  assert.match(source, /let\s+isViewOnly\s*=\s*true/);
  assert.match(source, /const\s+isAdminLoginRequested\s*=/);
  assert.doesNotMatch(source, /if\s*\(\s*hasAdminParam\s*\)\s*return\s+false/);
});

test('frontend checks admin session through cookie-backed auth endpoint', () => {
  assert.match(source, /\/auth\/me/);
  assert.match(source, /\/auth\/logout/);
  assert.match(source, /credentials:\s*['"]include['"]/);
  assert.match(source, /setAdminAuthenticated\(true\)/);
  assert.match(source, /setAdminAuthenticated\(false\)/);
});

test('admin write requests include credentials for JWT cookies', () => {
  const writeMarkers = [
    '/models/sync-overview-floor',
    '/models`,',
    '/models/${uuid}',
    '/areas/sync',
    '/categories/subcategory/${subCatId}/assign',
    '/sync-locations',
    '/api/upload-image',
    '/api/update-area-info',
    '/area-colors'
  ];

  for (const marker of writeMarkers) {
    const markerIndex = source.indexOf(marker);
    assert.notEqual(markerIndex, -1, `Missing write request marker ${marker}`);
    const requestBlock = source.slice(markerIndex, markerIndex + 500);
    assert.match(requestBlock, /credentials:\s*['"]include['"]/, `Write request ${marker} must include credentials`);
  }
});

test('admin login password field has a visibility toggle', () => {
  assert.match(source, /id="admin-login-password-toggle"/);
  assert.match(source, /passwordInput\.type\s*=\s*passwordInput\.type\s*===\s*['"]password['"]\s*\?\s*['"]text['"]\s*:\s*['"]password['"]/);
});
