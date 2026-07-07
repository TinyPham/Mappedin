import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');

test('flight date picker is limited to today and the previous three days', () => {
  assert.match(source, /const\s+getFlightDateRange\s*=\s*\(\s*\)\s*=>/);
  assert.match(source, /minDate\.setDate\(today\.getDate\(\)\s*-\s*3\)/);
  assert.match(source, /dateInput\.min\s*=\s*range\.minValue/);
  assert.match(source, /dateInput\.max\s*=\s*range\.maxValue/);
});

test('flight date input changes are clamped before loading flights', () => {
  assert.match(source, /const\s+clampFlightDateToAllowedRange\s*=\s*\(value:\s*string\)/);
  assert.match(source, /state\.date\s*=\s*clampFlightDateToAllowedRange\(dateInput\.value\s*\|\|\s*state\.date\)/);
  assert.match(source, /params\.set\('date',\s*clampFlightDateToAllowedRange\(state\.date\)\)/);
});
