import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { functionText } from '../helpers/mainSource.mjs';

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
  assert.match(functionText('startAdminPolling'), /adminPolling\?\.start\(\)/);
  assert.match(functionText('stopAdminPolling'), /adminPolling\?\.stop\(\)/);
  assert.match(functionText('setAdminAuthenticated'), /if\s*\(authenticated\)\s*{\s*startAdminPolling\(\)/);
  assert.match(functionText('setAdminAuthenticated'), /else\s*{\s*stopAdminPolling\(\)/);
  assert.match(source, /createAuthenticatedPolling\(\{\s*isAuthenticated:\s*\(\)\s*=>\s*isAdminAuthenticated/);
  assert.match(source, /canPoll:\s*\(\)\s*=>\s*!isUpdating/);
  assert.match(source, /addEventListener\('pagehide',\s*stopAdminPolling\)/);
  assert.doesNotMatch(source, /if\s*\(!isViewOnly\)\s*{\s*setInterval\(async \(\) =>/);
});

test('model streaming retains the approved concurrent model cap', () => {
  assert.match(functionText('updateModelStreaming'), /const\s+MAX_CONCURRENT_MODELS\s*=\s*300/);
});

test('kiosk runtime diagnostics are gated behind explicit debug flag', () => {
  assert.doesNotMatch(functionText('isCategoryDebugEnabled'), /checkIsLocal\(\)/);
  assert.match(functionText('isCategoryDebugEnabled'), /isMapRuntimeDebugEnabled\(\)/);

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
  for (const name of ['getColorRenderObjects', 'updateHighlights', 'resetObjectHighlight', 'highlightObject']) {
    assert.doesNotMatch(functionText(name), /\.id\.startsWith\(["']s_["']\)/, `${name} must retain space objects`);
  }
  assert.match(functionText('updateHighlights'), /getColorRenderObjects\(\)\.forEach/);
  assert.match(functionText('resetObjectHighlight'), /getObjectBaseStyle\(objectToReset\)/);
});
