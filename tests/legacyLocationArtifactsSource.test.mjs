import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const filesThatMustNotRecreateDroppedLocationObjects = [
  'backend/scripts/generate_seed.js',
  'database/optimized_procedures.sql',
  'database/seeds/generated_translations.sql',
  'scripts/extract_schema.py',
  'scripts/search_tables.py'
];

test('active maintenance scripts do not recreate dropped legacy location objects', () => {
  for (const filePath of filesThatMustNotRecreateDroppedLocationObjects) {
    const source = readFileSync(filePath, 'utf8');
    assert.doesNotMatch(source, /MasterData_Locations/, `${filePath} must not reference MasterData_Locations`);
    assert.doesNotMatch(source, /SP_Admin_UpsertLocation/, `${filePath} must not reference SP_Admin_UpsertLocation`);
  }
});
