import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../../main/main-function/index.ts', import.meta.url), 'utf8');

test('public map startup never calls the admin-only overview floor sync route', () => {
  assert.match(
    source,
    /if\s*\(isAdminAuthenticated\s*&&\s*!_hasSyncedOverviewModelFloor\s*&&\s*overviewFloor\?\.id\)\s*\{\s*await ApiService\.syncOverviewFloor/
  );
});
