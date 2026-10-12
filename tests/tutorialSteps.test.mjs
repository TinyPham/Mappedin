import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

import { tutorialSteps } from '../src/tutorial/tutorialSteps.js';

const html = readFileSync(new URL('../main/html/index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');

// Exercise the runtime's selector normalization and visibility filtering without
// initializing the map SDK or maintaining a second implementation in this test.
const helpersStart = source.indexOf('  const getGuideTargetSelectors =');
const helpersEnd = source.indexOf('  const clearUserGuideArrowPaths =', helpersStart);
assert.ok(helpersStart >= 0 && helpersEnd > helpersStart, 'Missing tutorial target helpers');
const targetHelpers = ts.transpileModule(
  `${source.slice(helpersStart, helpersEnd)}\n({ getGuideTargetSelectors, getVisibleTargetRects });`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }
).outputText;

function runtimeTargets(document = {}) {
  return runInNewContext(targetHelpers, { document });
}

const { getGuideTargetSelectors } = runtimeTargets();
const selectorsFor = step => Array.from(getGuideTargetSelectors(step));

function stepFor(device, id) {
  const step = tutorialSteps[device].find(item => item.id === id);
  assert.ok(step, `Missing ${device} tutorial step: ${id}`);
  return step;
}

const openingTags = Array.from(html.matchAll(/<[a-z][^>]*>/gi), match => match[0]);

function selectorExists(selector) {
  const attribute = selector.startsWith('#') ? 'id' : 'class';
  return openingTags.some(tag => {
    const value = tag.match(new RegExp(`\\b${attribute}="([^"]*)"`))?.[1];
    return value?.split(/\s+/).includes(selector.slice(1));
  });
}

function assertValidSteps(device, steps, expectedPrefix) {
  assert.ok(Array.isArray(steps), `${device} steps must be an array`);
  assert.ok(steps.length > 0, `${device} flow must not be empty`);
  assert.match(steps[0].id, /overview$/, `${device} flow starts with orientation`);
  assert.equal(steps.at(-1).id, `${device}-finish`, `${device} flow ends with completion`);
  assert.deepEqual(selectorsFor(steps.at(-1)), ['#btn-user-guide']);

  const ids = new Set();
  steps.forEach((step, index) => {
    assert.equal(typeof step.id, 'string', `${device} step ${index} id`);
    assert.ok(step.id.startsWith(`${device}-`), `${device} step ${index} id prefix`);
    assert.equal(typeof step.title, 'string', `${device} step ${index} title`);
    assert.ok(step.title.length > 0, `${device} step ${index} title is empty`);
    assert.equal(typeof step.description, 'string', `${device} step ${index} description`);
    assert.ok(step.description.length > 20, `${device} step ${index} description is too short`);
    assert.equal(typeof step.image, 'string', `${device} step ${index} image`);
    assert.ok(step.image.startsWith(expectedPrefix), `${device} step ${index} image should use ${expectedPrefix}`);
    assert.ok(existsSync(new URL(`../public${step.image}`, import.meta.url)), `${device} step ${index} image file is missing`);
    if (step.targetSelector !== undefined) {
      assert.equal(typeof step.targetSelector, 'string');
      assert.ok(step.targetSelector.trim().length > 0);
    }
    if (step.targetSelectors !== undefined) {
      assert.ok(Array.isArray(step.targetSelectors));
      assert.ok(step.targetSelectors.length > 0, `${device} step ${index} targetSelectors is empty`);
    }
    const selectors = selectorsFor(step);
    assert.ok(selectors.length > 0, `${device} step ${index} needs target selector(s)`);
    selectors.forEach(selector => {
      assert.equal(typeof selector, 'string');
      assert.match(selector, /^[#.][\w-]+$/, `${step.id} uses a supported UI selector`);
      assert.ok(selectorExists(selector), `${step.id} target ${selector} is missing from HTML`);
    });
    assert.equal(new Set(selectors).size, selectors.length, `${step.id} has duplicate targets`);
    assert.ok(['center', 'top', 'bottom', 'left', 'right'].includes(step.placement), `${step.id} placement`);
    if (step.autoSwitchTab !== undefined) {
      assert.ok(['search', 'directions'].includes(step.autoSwitchTab), `${step.id} tab`);
    }
    assert.ok(!ids.has(step.id), `${device} duplicate step id: ${step.id}`);
    ids.add(step.id);
  });
}

test('tutorial flows have valid targets, assets, orientation and completion', () => {
  assertValidSteps('mobile', tutorialSteps.mobile, '/tutorial/mobile/');
  assertValidSteps('desktop', tutorialSteps.desktop, '/tutorial/desktop/');
  assert.notEqual(tutorialSteps.mobile[0].id, tutorialSteps.desktop[0].id);
});

// Coverage belongs to the instructions and their controls, not to page counts or
// ID keywords: a combined page can teach several workflows.
const workflows = [
  { name: 'search', copy: /tìm kiếm/i, mobile: '#search-tab-header', desktop: '.modern-search-wrapper' },
  { name: 'category', copy: /danh mục|nhóm dịch vụ/i, mobile: '#category-section', desktop: '#category-section' },
  { name: 'floor', copy: /chuyển đổi.*tầng|chuyển.*tầng/i, mobile: '#custom-floor-wrapper', desktop: '#custom-floor-wrapper' },
  { name: 'language', copy: /ngôn ngữ/i, mobile: '#custom-lang-wrapper', desktop: '#custom-lang-wrapper' },
  { name: 'theme', copy: /chủ đề/i, mobile: '#search-tab-header', desktop: '#desktop-map-settings-toggle' },
  { name: 'brightness', copy: /độ sáng/i, mobile: '#search-tab-header', desktop: '#desktop-map-settings-toggle' },
  { name: 'wayfinding', copy: /điểm xuất phát.*(?:điểm đến|đích đến)/i, mobile: '#wayfinding-header-target', desktop: '#wayfinding-header-target' },
  { name: 'flight', copy: /chuyến bay/i, mobile: '#btn-open-flight-info', desktop: '#btn-open-flight-info' }
];

for (const device of ['mobile', 'desktop']) {
  test(`${device} definitions teach each key workflow at its control`, () => {
    for (const workflow of workflows) {
      assert.ok(tutorialSteps[device].some(step =>
        selectorsFor(step).includes(workflow[device]) && workflow.copy.test(step.description)
      ), `${device} flow missing ${workflow.name} instructions at ${workflow[device]}`);
    }
  });
}

test('desktop map controls keep precise highlights and rotation instructions', () => {
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
});

test('combined desktop settings instructions point to the popover opener', () => {
  const settings = stepFor('desktop', 'desktop-theme');
  assert.deepEqual(selectorsFor(settings), ['#desktop-map-settings-toggle']);
  assert.match(settings.description, /mở menu Cài đặt/i);
  assert.match(settings.description, /chủ đề/i);
  assert.match(settings.description, /kéo thanh trượt.*độ sáng/i);
});

test('combined mobile instructions explain search, categories, theme and brightness', () => {
  const step = stepFor('mobile', 'mobile-search-explore-theme');
  assert.deepEqual(selectorsFor(step), ['#search-tab-header']);
  assert.match(step.description, /nhập.*ô tìm kiếm/i);
  assert.match(step.description, /mũi tên.*danh mục/i);
  assert.match(step.description, /nút Cài đặt.*chủ đề/i);
  assert.match(step.description, /kéo thanh trượt.*độ sáng/i);
});

test('search highlights cover the mobile toolbar and merged desktop controls', () => {
  const mobileSearch = stepFor('mobile', 'mobile-search-explore-theme');
  const desktopSearch = stepFor('desktop', 'desktop-search');
  assert.deepEqual(selectorsFor(mobileSearch), ['#search-tab-header']);
  assert.deepEqual(selectorsFor(desktopSearch), ['.modern-search-wrapper', '#category-section']);
  assert.equal(desktopSearch.mergeHighlight, true);

  const headerStart = html.indexOf('<div id="search-tab-header"');
  const headerEnd = html.indexOf('<!-- Directions Tab Header -->', headerStart);
  assert.ok(headerStart >= 0 && headerEnd > headerStart);
  const header = html.slice(headerStart, headerEnd);
  assert.match(header, /class="modern-search-wrapper"/);
  assert.match(header, /id="mobile-category-toggle"/);
  assert.match(header, /id="mobile-settings-btn"/);
});

test('both settings buttons open the panel that contains theme and brightness', () => {
  for (const id of ['desktop-map-settings-toggle', 'mobile-settings-btn']) {
    const button = openingTags.find(tag => tag.includes(`id="${id}"`));
    assert.ok(button, `Missing settings button ${id}`);
    assert.match(button, /onclick="toggleDesktopMapSettings\(event\)"/);
    assert.match(button, /aria-controls="desktop-map-settings-panel"/);
  }
  const panelStart = html.indexOf('<div id="desktop-map-settings-panel"');
  const themeStart = html.indexOf('id="theme-selector-wrapper"', panelStart);
  assert.ok(panelStart >= 0 && themeStart > panelStart);
  const panelControls = html.slice(panelStart, themeStart);
  assert.match(panelControls, /id="brightness-selector-wrapper"/);
  assert.match(panelControls, /id="brightness-slider"/);
});

test('runtime supports single and multiple selectors with array precedence', () => {
  assert.deepEqual(selectorsFor({ targetSelector: '#search-tab-header' }), ['#search-tab-header']);
  assert.deepEqual(selectorsFor({ targetSelectors: ['.modern-search-wrapper', '#category-section'] }),
    ['.modern-search-wrapper', '#category-section']);
  assert.deepEqual(selectorsFor({ targetSelector: '#location-search', targetSelectors: ['#search-tab-header'] }),
    ['#search-tab-header']);
  assert.deepEqual(selectorsFor({ targetSelector: '#search-tab-header', targetSelectors: [] }), ['#search-tab-header']);
  assert.deepEqual(selectorsFor(null), []);
});

test('mobile category tutorial has a visible target when the category list is collapsed', () => {
  const step = stepFor('mobile', 'mobile-category-list');
  const toggleRect = { width: 44, height: 40 };
  const listRect = { width: 320, height: 240 };
  const rects = new Map([
    ['#category-section', { width: 0, height: 0 }],
    ['#mobile-category-toggle', toggleRect]
  ]);
  const { getVisibleTargetRects } = runtimeTargets({
    querySelector: selector => rects.has(selector)
      ? { getBoundingClientRect: () => rects.get(selector) }
      : null
  });

  assert.deepEqual(Array.from(getVisibleTargetRects(selectorsFor(step))), [toggleRect]);
  rects.set('#category-section', listRect);
  assert.equal(getVisibleTargetRects(selectorsFor(step))[0], listRect,
    'Expanded categories remain the primary arrow target');
});

test('routing pages activate Directions before targeting their inputs', () => {
  for (const [device, id] of [['mobile', 'mobile-wayfinding-combined'], ['desktop', 'desktop-wayfinding']]) {
    const step = stepFor(device, id);
    assert.equal(step.autoSwitchTab, 'directions');
    assert.ok(selectorsFor(step).includes('#wayfinding-header-target'));
  }
});
