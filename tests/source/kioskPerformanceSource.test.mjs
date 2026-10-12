import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { functionText, findNodes, sourceFile, ts } from '../helpers/mainSource.mjs';

const source = readFileSync(new URL('../../main/main-function/index.ts', import.meta.url), 'utf8');

test('camera bearing/pitch logs remain enabled as requested, independently of debug switches', () => {
  const handler = findNodes(node => ts.isCallExpression(node) &&
    node.expression.getText(sourceFile) === 'mapView.on' && node.arguments[0]?.text === 'camera-change' &&
    ts.isArrowFunction(node.arguments[1]) && node.arguments[1].parameters[0]?.name.getText(sourceFile) === 'transform')[0]?.arguments[1];
  assert.ok(handler, 'Missing camera transform handler');
  const logging = handler.body.statements.find(statement => ts.isExpressionStatement(statement) &&
    ts.isCallExpression(statement.expression) && statement.expression.expression.getText(sourceFile) === 'console.log');
  assert.ok(logging, 'Camera logging must be unconditional, matching the approved console feature');
  assert.match(logging.getText(sourceFile), /\[Camera\].*Bearing.*Pitch/);
});

test('map dumps remain callable manually without automatic printing', () => {
  assert.match(source, /\(window as any\)\.logMapData = logComprehensiveMapContent/);
  const scheduled = findNodes(node => ts.isCallExpression(node) && node.expression.getText(sourceFile) === 'setTimeout' &&
    node.arguments[0]?.getText(sourceFile) === 'logComprehensiveMapContent');
  assert.equal(scheduled.length, 0);
  const automaticCalls = findNodes(node => ts.isCallExpression(node) &&
    ['logComprehensiveMapContent', 'logMapImageLinks'].includes(node.expression.getText(sourceFile)));
  assert.equal(automaticCalls.length, 0);
  assert.match(source, /\(window as any\)\.logMapImageLinks = logMapImageLinks/);
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

test('category diagnostics require their own explicit switch while other runtime diagnostics remain gated', () => {
  assert.doesNotMatch(functionText('isCategoryDebugEnabled'), /checkIsLocal\(\)/);
  assert.match(functionText('isCategoryDebugEnabled'), /__CATEGORY_DEBUG__\s*===\s*true/);
  assert.doesNotMatch(functionText('isCategoryDebugEnabled'), /isMapRuntimeDebugEnabled\(\)/);

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
