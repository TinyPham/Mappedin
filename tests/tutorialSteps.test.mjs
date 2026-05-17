import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

import { tutorialSteps } from '../tutorialSteps.js';

function assertValidSteps(device, steps, expectedPrefix, minimumLength) {
  assert.ok(Array.isArray(steps), `${device} steps must be an array`);
  assert.ok(steps.length >= minimumLength, `${device} needs at least ${minimumLength} steps`);

  const ids = new Set();
  steps.forEach((step, index) => {
    assert.equal(typeof step.id, 'string', `${device} step ${index} id`);
    assert.ok(step.id.length > 0, `${device} step ${index} id is empty`);
    assert.equal(typeof step.title, 'string', `${device} step ${index} title`);
    assert.ok(step.title.length > 0, `${device} step ${index} title is empty`);
    assert.equal(typeof step.description, 'string', `${device} step ${index} description`);
    assert.ok(step.description.length > 20, `${device} step ${index} description is too short`);
    assert.equal(typeof step.image, 'string', `${device} step ${index} image`);
    assert.ok(step.image.startsWith(expectedPrefix), `${device} step ${index} image should use ${expectedPrefix}`);
    assert.ok(existsSync(new URL(`../public${step.image}`, import.meta.url)), `${device} step ${index} image file is missing`);
    assert.ok(step.targetSelector || Array.isArray(step.targetSelectors), `${device} step ${index} should define target selector(s)`);
    if (Array.isArray(step.targetSelectors)) {
      assert.ok(step.targetSelectors.length > 0, `${device} step ${index} targetSelectors is empty`);
    }
    assert.ok(!ids.has(step.id), `${device} duplicate step id: ${step.id}`);
    ids.add(step.id);
  });
}

test('tutorial steps define full mobile and desktop flows', () => {
  assertValidSteps('mobile', tutorialSteps.mobile, '/tutorial/mobile/', 12);
  assertValidSteps('desktop', tutorialSteps.desktop, '/tutorial/desktop/', 10);
  assert.notEqual(tutorialSteps.mobile[0].id, tutorialSteps.desktop[0].id);
});

test('tutorial steps include key airport map workflows', () => {
  const allMobileIds = tutorialSteps.mobile.map(step => step.id).join(' ');
  const allDesktopIds = tutorialSteps.desktop.map(step => step.id).join(' ');

  ['search', 'category', 'floor', 'language', 'theme', 'brightness', 'wayfinding', 'flight'].forEach(keyword => {
    assert.match(allMobileIds, new RegExp(keyword), `mobile flow missing ${keyword}`);
    assert.match(allDesktopIds, new RegExp(keyword), `desktop flow missing ${keyword}`);
  });
});

test('desktop map controls and theme steps use precise multi-target highlights', () => {
  const mapButtons = tutorialSteps.desktop.find(step => step.id === 'desktop-map-buttons');
  assert.ok(mapButtons, 'Missing desktop map buttons tutorial step');
  assert.deepEqual(mapButtons.targetSelectors, ['#camera-actions']);
  assert.equal(mapButtons.highlightPadding, 14);

  const mapRotation = tutorialSteps.desktop.find(step => step.id === 'desktop-map-rotation');
  assert.ok(mapRotation, 'Missing desktop map rotation tutorial step');
  assert.deepEqual(mapRotation.targetSelectors, ['#nav-cross-container']);
  assert.equal(mapRotation.highlightPadding, 12);
  assert.match(mapRotation.description, /chuột phải/i);
  assert.match(mapRotation.description, /xoay/i);

  const theme = tutorialSteps.desktop.find(step => step.id === 'desktop-theme');
  assert.ok(theme, 'Missing desktop theme tutorial step');
  assert.deepEqual(theme.targetSelectors, ['#theme-selector-wrapper']);

  const brightness = tutorialSteps.desktop.find(step => step.id === 'desktop-brightness');
  assert.ok(brightness, 'Missing desktop brightness tutorial step');
  assert.deepEqual(brightness.targetSelectors, ['#brightness-selector-wrapper']);
});

test('mobile theme and brightness are separate tutorial pages', () => {
  const theme = tutorialSteps.mobile.find(step => step.id === 'mobile-theme');
  const brightness = tutorialSteps.mobile.find(step => step.id === 'mobile-brightness');

  assert.ok(theme, 'Missing mobile theme tutorial step');
  assert.ok(brightness, 'Missing mobile brightness tutorial step');
  assert.deepEqual(theme.targetSelectors, ['#theme-selector-wrapper']);
  assert.deepEqual(brightness.targetSelectors, ['#brightness-selector-wrapper']);
});

test('search tutorial highlights the visible search wrapper instead of the inner input', () => {
  const mobileSearch = tutorialSteps.mobile.find(step => step.id === 'mobile-search');
  const desktopSearch = tutorialSteps.desktop.find(step => step.id === 'desktop-search');

  assert.equal(mobileSearch?.targetSelector, '.modern-search-wrapper');
  assert.equal(desktopSearch?.targetSelector, '.modern-search-wrapper');
});
