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

test('backend env loader supports ts-node and compiled dist entrypoints', () => {
  assert.match(
    dbSource,
    /process\.cwd\(\)[\s\S]*['"]\.env['"]/,
    'backend should try the current working directory .env used by root-launched dist/server.js'
  );
  assert.match(
    dbSource,
    /\.\.\/\.\.\/\.env/,
    'backend should try ../../.env so backend/dist/db.js can load the root .env'
  );
});

test('backend TypeScript build includes nested source folders', () => {
  assert.ok(
    tsconfig.include.some((pattern) => pattern.includes('**/*.ts')),
    'backend tsconfig must compile nested modules such as backend/auth and backend/flights'
  );
});
