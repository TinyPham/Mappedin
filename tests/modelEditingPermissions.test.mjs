import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');

test('model edit click shortcuts are ignored in view-only mode', () => {
  const modelSelectionBlockIndex = source.indexOf('if (!isViewOnly && event.models && event.models.length > 0)');
  assert.notEqual(modelSelectionBlockIndex, -1, 'Model Alt/Shift click selection must be guarded by !isViewOnly');

  const altClickIndex = source.indexOf('Alt+Click: Select model');
  const shiftClickIndex = source.indexOf('Shift+Click: Multi-select model');

  assert.ok(modelSelectionBlockIndex < shiftClickIndex, 'View-only guard must wrap Shift+Click model selection');
  assert.ok(modelSelectionBlockIndex < altClickIndex, 'View-only guard must wrap Alt+Click model selection');
});

test('model label selection cannot open controls in view-only mode', () => {
  const exposedSelectorIndex = source.indexOf('(window as any).selectModelByUUID = (uuid: string) => {');
  assert.notEqual(exposedSelectorIndex, -1, 'Missing selectModelByUUID handler');

  const handlerBody = source.slice(exposedSelectorIndex, source.indexOf('// ============================================', exposedSelectorIndex));
  assert.match(handlerBody, /if\s*\(isViewOnly\)\s*return;/, 'selectModelByUUID must return in view-only mode');
});
