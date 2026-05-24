import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const dbSource = readFileSync(new URL('../backend/db.ts', import.meta.url), 'utf8');
const tsconfig = JSON.parse(readFileSync(new URL('../backend/tsconfig.json', import.meta.url), 'utf8'));

test('database config prefers environment connection string before appsettings', () => {
  const envIndex = dbSource.indexOf('process.env.DB_CONNECTION_STRING');
  const appsettingsIndex = dbSource.indexOf('appsettings.json');
  assert.notEqual(envIndex, -1, 'DB_CONNECTION_STRING must be supported');
  assert.ok(envIndex < appsettingsIndex, 'environment connection string must be checked before appsettings');
});

test('backend TypeScript build includes nested source folders', () => {
  assert.ok(
    tsconfig.include.some((pattern) => pattern.includes('**/*.ts')),
    'backend tsconfig must compile nested modules such as backend/auth and backend/flights'
  );
});
