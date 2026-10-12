import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../database/patches/add_airport_route_notice_translations.sql', import.meta.url), 'utf8');
const expectedKeys = [
  'rn_title', 'rn_staff_access', 'rn_security_checkpoint',
  'rn_intl_arrival_area', 'rn_dom_arrival_area',
  'rn_transfer_dd', 'rn_transfer_di', 'rn_transfer_id', 'rn_transfer_ii',
  'rn_intl_from_domestic_checkin', 'rn_dom_from_international_checkin',
  'rn_intl_departure', 'rn_dom_departure', 'rn_departure_check', 'rn_leave_airside',
  'rn_checkin_intl_from_dom', 'rn_checkin_dom_from_intl',
  'rn_intl_arrival_exit', 'rn_dom_arrival_exit'
];

test('route notices are stored with nonempty VN/EN/ZH/JA/KO translations', () => {
  const keys = [...migration.matchAll(/\('(rn_[a-z0-9_]+)',\s*'(?:title|notice)'/g)].map(match => match[1]);
  assert.deepEqual(keys, expectedKeys);

  // All five language columns use N'' Unicode literals in KeyCode order.
  const values = [...migration.matchAll(/N'((?:''|[^'])*)'/g)].map(match => match[1].replaceAll("''", "'"));
  assert.equal(values.length, keys.length * 5);
  for (const [index, value] of values.entries()) {
    assert.ok(value.trim().length > 0, `${keys[Math.floor(index / 5)]} is empty`);
    assert.ok(value.length <= 500, `${keys[Math.floor(index / 5)]} exceeds NVARCHAR(500)`);
  }
  assert.match(migration, /MERGE dbo\.Translation_UI WITH \(HOLDLOCK\)/);
  assert.match(migration, /WHEN MATCHED THEN/);
  assert.match(migration, /WHEN NOT MATCHED BY TARGET THEN/);
});
