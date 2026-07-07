import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { tutorialSteps } from '../src/tutorial/tutorialSteps.js';

const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');

function mobileStep(id) {
  const step = tutorialSteps.mobile.find(item => item.id === id);
  assert.ok(step, `Missing mobile tutorial step: ${id}`);
  return step;
}

test('mobile overview step shows the guide panel without drawing a highlight', () => {
  const step = mobileStep('mobile-map-overview');

  assert.equal(step.hideHighlight, true);
  assert.equal(step.autoSwitchTab, 'search');
  assert.equal(step.targetSelector, '#mappedin-map');
});

test('mobile floor and language step draws arrows to both bottom controls', () => {
  const step = mobileStep('mobile-floor-language');

  assert.deepEqual(step.targetSelectors, ['#custom-floor-wrapper', '#custom-lang-wrapper']);
  assert.equal(step.showAllArrowsOnMobile, true);
});

test('mobile wayfinding step switches to directions and highlights the from-to inputs', () => {
  const step = mobileStep('mobile-wayfinding-combined');

  assert.equal(step.autoSwitchTab, 'directions');
  assert.deepEqual(step.targetSelectors, ['#wayfinding-header-target']);
  assert.equal(step.mobileArrowTargetOffsetX, undefined);
  assert.equal(step.mobileArrowEndOffsetY, 18);
});

test('mobile guide switches tabs only for mobile steps that request it', () => {
  assert.match(source, /const isMobileGuide = window\.innerWidth <= 768/);
  assert.match(source, /isMobileGuide && step\.autoSwitchTab/);
  assert.match(source, /step\.id === 'mobile-floor-language'/);
});

test('mobile map-controls arrow gets a straight segment before curving', () => {
  assert.match(source, /isMobileMapControlsTarget/);
  assert.match(source, /mobileMapControlsStraightX/);
  assert.match(source, /mobileMapControlsStraightY/);
});

test('mobile problem steps use direct arrows to avoid bent origins', () => {
  assert.equal(mobileStep('mobile-floor-language').mobileDirectArrow, true);
  assert.equal(mobileStep('mobile-wayfinding-combined').mobileDirectArrow, true);
  assert.equal(mobileStep('mobile-map-controls').mobileDirectArrow, true);
  assert.match(source, /step\?\.mobileDirectArrow/);
  assert.match(source, /pathD = `M \$\{startX\} \$\{startY\} L \$\{arrowEndX\} \$\{arrowEndY\}`/);
});

test('mobile wayfinding arrow stays vertical without a horizontal offset', () => {
  assert.equal(mobileStep('mobile-wayfinding-combined').mobileDirectArrow, true);
  assert.equal(mobileStep('mobile-wayfinding-combined').mobileArrowTargetOffsetX, undefined);
  assert.equal(mobileStep('mobile-wayfinding-combined').mobileArrowEndOffsetY, 18);
  assert.match(source, /mobileArrowEndOffsetY/);
  assert.match(source, /arrowEndY = Math\.min\(targetY \+ hh - 18, arrowEndY \+ step\.mobileArrowEndOffsetY\)/);
});
