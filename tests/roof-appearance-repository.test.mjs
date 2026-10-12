import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'Node16', moduleResolution: 'Node16' }
});
const { fetchRoofAppearances } = require('../backend/roofAppearanceRepository.ts');
const { getInitialData } = require('../backend/initDataRepository.ts');

test('roof appearance loading tolerates an absent table and bad JSON without changing initial data', async () => {
  const mapId = '693687f4f176dd000ba13a3b';
  const config = { mapId, version: 1, enabled: true, roof: { color: '#ABCDEF' } };
  const rows = [
    { MapID: mapId, ConfigJson: JSON.stringify(config) },
    { MapID: 'broken', ConfigJson: '{invalid' },
    { MapID: 'null', ConfigJson: 'null' },
    { MapID: 'array', ConfigJson: '[]' },
    { MapID: 'scalar', ConfigJson: 'true' },
    { MapID: '__proto__', ConfigJson: '{"enabled":false}' }
  ];
  const database = roofRows => ({ request: () => ({
    execute: async name => {
      assert.equal(name, 'SP_GetInitialData');
      return { recordsets: [[], [], [], [], [], []] };
    },
    query: async statement => {
      assert.doesNotMatch(statement, /\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER)\b/i);
      if (statement.includes('dbo.MapRoofAppearance')) {
        assert.match(statement, /OBJECT_ID\(N'dbo\.MapRoofAppearance',\s*N'U'\) IS NULL/);
        assert.match(statement, /WHERE 1 = 0/);
        return { recordset: roofRows };
      }
      return { recordset: [] };
    }
  }) });

  assert.deepEqual(await fetchRoofAppearances(database([])), {});
  const appearances = await fetchRoofAppearances(database(rows));
  assert.deepEqual(Object.keys(appearances).sort(), ['__proto__', mapId].sort());
  assert.deepEqual(appearances[mapId], config);
  assert.deepEqual(appearances.__proto__, { enabled: false });
  assert.equal(Object.getPrototypeOf(appearances), Object.prototype);

  const baseline = await getInitialData(database([]));
  assert.deepEqual(baseline.roofAppearances, {});
  const { roofAppearances, ...existingFields } = await getInitialData(database(rows));
  const { roofAppearances: empty, ...baselineFields } = baseline;
  assert.deepEqual(existingFields, baselineFields);
  assert.deepEqual(roofAppearances, appearances);

  const error = new Error('database unavailable');
  await assert.rejects(fetchRoofAppearances({ request: () => ({ query: async () => { throw error; } }) }), error);
});
