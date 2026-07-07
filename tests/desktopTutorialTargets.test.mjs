import test from 'node:test';
import assert from 'node:assert/strict';

import { tutorialSteps } from '../src/tutorial/tutorialSteps.js';

function desktopStep(id) {
  const step = tutorialSteps.desktop.find(item => item.id === id);
  assert.ok(step, `Missing desktop tutorial step: ${id}`);
  return step;
}

test('desktop search tutorial draws one merged box around search and categories', () => {
  const step = desktopStep('desktop-search');

  assert.deepEqual(step.targetSelectors, ['.modern-search-wrapper', '#category-section']);
  assert.equal(step.mergeHighlight, true);
});

test('desktop wayfinding tutorial switches to directions before highlighting controls', () => {
  const step = desktopStep('desktop-wayfinding');

  assert.equal(step.autoSwitchTab, 'directions');
  assert.deepEqual(step.targetSelectors, ['#tab-directions', '#wayfinding-header-target']);
});

test('desktop floor and flight tutorials point arrows at the requested top controls', () => {
  const floorStep = desktopStep('desktop-floor');
  const flightStep = desktopStep('desktop-flight-info');

  assert.deepEqual(floorStep.targetSelectors, ['#custom-lang-wrapper', '#custom-floor-wrapper']);
  assert.deepEqual(flightStep.targetSelectors, ['#btn-flight-info-topleft', '#btn-open-flight-info']);
});
