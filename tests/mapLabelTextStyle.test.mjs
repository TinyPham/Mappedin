import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');

test('map area and connection labels use crisp white outline without wide white glow', () => {
  assert.doesNotMatch(source, /text-shadow:0 0 4px rgba\(255,255,255,0\.9\),\s*0 0 8px rgba\(255,\s*255,\s*255,\s*0\.8\)/);
  assert.doesNotMatch(source, /text-shadow:0 0 4px rgba\(255,255,255,0\.9\),0 0 8px rgba\(255,255,255,0\.8\)/);
  assert.match(source, /-webkit-text-stroke:3px #fff/);
  assert.match(source, /paint-order:stroke fill/);
  assert.match(source, /text-shadow:0 1px 1px rgba\(0,0,0,0\.22\)/);
});
