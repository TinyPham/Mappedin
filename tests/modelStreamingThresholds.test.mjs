import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getModelStreamingZoomThresholds } from '../src/performance/modelStreamingThresholds.js';

test('desktop model streaming keeps existing zoom thresholds', () => {
  assert.deepEqual(getModelStreamingZoomThresholds(false), {
    load: 19.2,
    unload: 18.8,
    loadRadius: 120,
    unloadRadius: 150
  });
});

test('mobile model streaming loads 3D models at lower zoom for wider map context', () => {
  assert.deepEqual(getModelStreamingZoomThresholds(true), {
    load: 16.8,
    unload: 16.6,
    loadRadius: 180,
    unloadRadius: 230
  });
});

test('model streaming thresholds keep zoom hysteresis gaps', () => {
  const desktop = getModelStreamingZoomThresholds(false);
  const mobile = getModelStreamingZoomThresholds(true);

  assert.equal(Number((desktop.load - desktop.unload).toFixed(1)), 0.4);
  assert.equal(Number((mobile.load - mobile.unload).toFixed(1)), 0.2);
});

test('mobile model streaming uses a wider center radius for lower zoom overview', () => {
  const desktop = getModelStreamingZoomThresholds(false);
  const mobile = getModelStreamingZoomThresholds(true);

  assert.ok(mobile.loadRadius > desktop.loadRadius);
  assert.ok(mobile.unloadRadius > mobile.loadRadius);
  assert.equal(mobile.unloadRadius - mobile.loadRadius, 50);
});

test('map streaming code uses device-specific model streaming thresholds', () => {
  const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');

  assert.match(source, /import\s+\{\s*getModelStreamingZoomThresholds\s*\}\s+from\s+["']\.\.\/\.\.\/src\/performance\/modelStreamingThresholds\.js["']/);
  assert.match(source, /loadRadius:\s*LOAD_RADIUS/);
  assert.match(source, /unloadRadius:\s*UNLOAD_RADIUS/);
  assert.doesNotMatch(source, /const\s+LOAD_RADIUS\s*=\s*120/);
  assert.doesNotMatch(source, /const\s+UNLOAD_RADIUS\s*=\s*150/);
});
