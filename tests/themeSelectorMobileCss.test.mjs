import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cssDeclarations, cssRule, parseCssRules } from './helpers/cssRules.mjs';

const rules = parseCssRules(readFileSync(new URL('../main/css/styles.css', import.meta.url), 'utf8'));
const mobile = { width: 390, height: 844 };
const menuSelectors = ['.theme-selector-menu', '#desktop-map-settings-panel .theme-selector-menu'];

test('mobile theme selector menu stays hidden until wrapper is open', () => {
  const closed = cssDeclarations(rules, menuSelectors, mobile);
  assert.equal(closed.display, 'none');
  const open = cssDeclarations(rules, [...menuSelectors, '.theme-selector-wrapper.open .theme-selector-menu'], mobile);
  assert.equal(open.display, 'grid');
  assert.equal(open['grid-template-columns'], 'repeat(2, 1fr)');
});

test('mobile theme selector menu fits the viewport with 8px insets', () => {
  for (const width of [320, 390, 768]) {
    const menu = cssDeclarations(rules, menuSelectors, { width, height: 844 });
    assert.equal(menu.position, 'fixed');
    assert.equal(menu.left, '8px');
    assert.equal(menu.right, '8px');
    assert.equal(menu.width, 'calc(100vw - 16px)');
    assert.equal(menu['max-width'], 'calc(100vw - 16px)');
    assert.equal(menu['box-sizing'], 'border-box');
    assert.equal(menu['overflow-y'], 'auto');
  }
});

test('mobile theme selector keeps compact typography inside the settings panel', () => {
  const toggle = cssDeclarations(rules, ['.theme-selector-toggle', '#desktop-map-settings-panel .theme-selector-toggle'], mobile);
  assert.equal(toggle.height, '40px');
  assert.equal(toggle.padding, '0 14px');
  assert.equal(toggle.gap, '6px');
  assert.equal(toggle.background, '#fff');
  assert.equal(toggle.border, '1px solid #e6edf7');
  assert.equal(toggle['border-radius'], '8px');
  assert.equal(toggle['box-shadow'], 'none');
  assert.equal(toggle.width, '100%');
  const text = cssDeclarations(rules, ['.theme-selector-toggle span'], mobile);
  assert.equal(text['font-size'], '12px');
  assert.equal(text['font-weight'], '600');
  assert.equal(text.color, '#333');
  const icon = cssDeclarations(rules, ['.theme-selector-toggle svg'], mobile);
  assert.equal(icon.width, '16px');
  assert.equal(icon.height, '16px');
  assert.equal(icon.stroke, '#333');
});

test('mobile brightness control has the same final height as the theme button', () => {
  for (const width of [320, 390, 768]) {
    const viewport = { width, height: 844 };
    const brightness = cssDeclarations(rules, ['.brightness-toggle', '#desktop-map-settings-panel .brightness-toggle'], viewport);
    const theme = cssDeclarations(rules, ['.theme-selector-toggle', '#desktop-map-settings-panel .theme-selector-toggle'], viewport);
    assert.equal(brightness.height, '40px');
    assert.equal(brightness['min-height'], '40px');
    assert.equal(theme.height, brightness.height);
    assert.equal(theme['min-height'], brightness['min-height']);
    assert.equal(brightness.padding, '0 8px');
    assert.equal(brightness['box-sizing'], 'border-box');
    assert.equal(theme['box-sizing'], 'border-box');
  }
});


test('mobile settings and theme menu remain below the search header', () => {
  const panel = cssDeclarations(rules, ['#desktop-map-settings-panel'], mobile);
  assert.equal(panel.top, 'calc(126px + env(safe-area-inset-top, 0px))');
  assert.equal(panel.visibility, 'hidden');
  assert.equal(panel['pointer-events'], 'none');
  const wrapper = cssDeclarations(rules, ['.theme-selector-wrapper', '#desktop-map-settings-panel .theme-selector-wrapper'], mobile);
  assert.equal(wrapper.position, 'static');
  assert.equal(wrapper.top, 'auto');
  assert.equal(wrapper['z-index'], 'auto');
  const menu = cssDeclarations(rules, menuSelectors, mobile);
  assert.equal(menu.top, 'calc(190px + env(safe-area-inset-top, 0px))');
  assert.equal(menu['max-height'], 'calc(100dvh - 205px)');
});

test('open mobile theme menu retains its elevated layer inside the settings panel', () => {
  const menu = cssDeclarations(rules, [...menuSelectors, '.theme-selector-wrapper.open .theme-selector-menu'], mobile);
  assert.equal(menu['z-index'], '6500');
  const panel = cssDeclarations(rules, ['#desktop-map-settings-panel'], mobile);
  assert.equal(panel['z-index'], '6200');
  const camera = cssDeclarations(rules, ['#camera-actions'], mobile);
  assert.ok(Number(panel['z-index']) > Number(camera['z-index']), 'Settings stacking context must be above camera controls');
});

test('open mobile floor and language menus retain their elevated layers', () => {
  for (const selector of ['#map-top-controls:has(.pro-dropdown-wrapper.open)', '.pro-dropdown-wrapper.open',
    '.pro-dropdown-wrapper.open .pro-dropdown-menu']) {
    const rule = cssRule(rules, selector, ['(max-width: 768px)']);
    assert.ok(rule.includes('z-index: 6500 !important;'), selector + ' must stay above camera controls');
  }
});
