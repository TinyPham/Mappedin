import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../../main/main-function/index.ts', import.meta.url), 'utf8');

test('camera-change handler does not log every camera frame', () => {
  const cameraBlockStart = source.indexOf('mapView.on("camera-change", (transform: any) => {');
  assert.notEqual(cameraBlockStart, -1, 'camera-change handler not found');
  const cameraBlock = source.slice(cameraBlockStart, source.indexOf('});', cameraBlockStart) + 3);
  assert.doesNotMatch(cameraBlock, /console\.log/, 'camera-change handler must not log on every camera update');
});

test('large map content dump is exposed manually but not scheduled automatically', () => {
  assert.match(source, /\(window as any\)\.logMapData = logComprehensiveMapContent/);
  assert.doesNotMatch(source, /setTimeout\(logComprehensiveMapContent,\s*2000\)/);
});

test('admin polling starts only after authenticated admin state and can be stopped', () => {
  assert.match(source, /let\s+adminPollingInterval/);
  assert.match(source, /function\s+startAdminPolling/);
  assert.match(source, /function\s+stopAdminPolling/);
  assert.match(source, /if\s*\(authenticated\)\s*{\s*startAdminPolling\(\)/);
  assert.doesNotMatch(source, /if\s*\(!isViewOnly\)\s*{\s*setInterval\(async \(\) =>/);
});

test('model streaming has a kiosk-safe concurrent model cap', () => {
  assert.match(source, /const\s+MAX_CONCURRENT_MODELS\s*=\s*80/);
});

test('kiosk runtime diagnostics are gated behind explicit debug flag', () => {
  assert.doesNotMatch(source, /const\s+isCategoryDebugEnabled\s*=\s*\(\)\s*=>\s*{[\s\S]*?checkIsLocal\(\)/);

  const noisyRuntimePatterns = [
    /console\.log\(`[^`]*\[CONNECTIONS\]/,
    /console\.log\("[^"]*\[CONNECTIONS\]/,
    /console\.log\(`[^`]*\[STREAMING\]/,
    /console\.log\("[^"]*\[STREAMING\]/,
    /console\.log\(".*Current floor:/,
    /console\.log\(`.*Manual floor switch/,
    /console\.log\(`.*Background geometric cache completed/,
    /console\.log\(".*Removed map name marker/,
    /console\.log\(".*Manual floor switch completed/
  ];

  for (const pattern of noisyRuntimePatterns) {
    assert.doesNotMatch(source, pattern, `noisy runtime log must be behind debug flag: ${pattern}`);
  }
});

test('wayfinding highlight reset preserves original color refresh behavior', () => {
  const colorableStart = source.indexOf('const isColorableMapObject = (obj: any) => {');
  assert.notEqual(colorableStart, -1, 'isColorableMapObject not found');
  const colorableBlock = source.slice(colorableStart, source.indexOf('  const getColorRenderObjects', colorableStart));
  assert.doesNotMatch(colorableBlock, /obj\.id\.startsWith\("s_"\)/, 'space objects must remain available for area coloring');

  const updateHighlightsStart = source.indexOf('const updateHighlights = () => {');
  assert.notEqual(updateHighlightsStart, -1, 'updateHighlights not found');
  const updateHighlightsBlock = source.slice(updateHighlightsStart, source.indexOf('    // Chá»‰ highlight origin', updateHighlightsStart));
  assert.doesNotMatch(updateHighlightsBlock, /if\s*\(!isColorableMapObject\(obj\)\)\s*return/, 'highlight reset must keep original broad color refresh');
  assert.doesNotMatch(updateHighlightsBlock, /obj\.id\.startsWith\("s_"\)/, 'highlight reset must not skip space objects');

  const resetStart = source.indexOf('const resetObjectHighlight = (obj: any) => {');
  assert.notEqual(resetStart, -1, 'resetObjectHighlight not found');
  const resetBlock = source.slice(resetStart, source.indexOf('  /**\r\n   * Highlight', resetStart));
  assert.doesNotMatch(resetBlock, /if\s*\(!isColorableMapObject\(objectToReset\)\)\s*return/);

  const highlightStart = source.indexOf('const highlightObject = (obj: any) => {');
  assert.notEqual(highlightStart, -1, 'highlightObject not found');
  const highlightBlock = source.slice(highlightStart, source.indexOf('  /**\r\n   * Qu', highlightStart));
  assert.doesNotMatch(highlightBlock, /if\s*\(!isColorableMapObject\(obj\)\)\s*return/);
});
