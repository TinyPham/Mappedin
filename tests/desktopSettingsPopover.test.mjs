import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cssDeclarations, parseCssRules } from './helpers/cssRules.mjs';

const html = readFileSync(new URL('../main/html/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../main/css/styles.css', import.meta.url), 'utf8');
const rules = parseCssRules(css);

test('desktop settings button sits in the sidebar tabs after directions', () => {
  const tabsStart = html.indexOf('<div class="sidebar-tabs"');
  const tabsEnd = html.indexOf('</div>', tabsStart);
  assert.notEqual(tabsStart, -1, 'Missing sidebar tabs');
  assert.notEqual(tabsEnd, -1, 'Missing sidebar tabs end');

  const tabsMarkup = html.slice(tabsStart, tabsEnd);
  const directionsIndex = tabsMarkup.indexOf('id="tab-directions"');
  const settingsIndex = tabsMarkup.indexOf('id="desktop-map-settings-toggle"');

  assert.notEqual(directionsIndex, -1, 'Missing directions tab');
  assert.notEqual(settingsIndex, -1, 'Missing desktop settings toggle');
  assert.ok(directionsIndex < settingsIndex, 'Settings button should sit after directions');
  assert.match(tabsMarkup, /class="[^"]*desktop-map-settings-toggle[^"]*"/);
  assert.match(tabsMarkup, /aria-controls="desktop-map-settings-panel"/);
});

test('desktop settings popover contains theme and brightness controls beside sidebar', () => {
  const mainContentStart = html.indexOf('<div id="main-content">');
  const panelStart = html.indexOf('<div id="desktop-map-settings-panel"', mainContentStart);
  const mapTopControlsStart = html.indexOf('<div id="map-top-controls"', mainContentStart);

  assert.notEqual(mainContentStart, -1, 'Missing main content');
  assert.notEqual(panelStart, -1, 'Missing desktop settings panel');
  assert.notEqual(mapTopControlsStart, -1, 'Missing map top controls');
  assert.ok(panelStart < mapTopControlsStart, 'Settings panel should be before map top controls');

  const panelEnd = html.indexOf('<!-- MAP CONTROLS HEADER', panelStart);
  const panelMarkup = html.slice(panelStart, panelEnd);
  assert.match(panelMarkup, /id="theme-selector-wrapper"/);
  assert.match(panelMarkup, /id="brightness-selector-wrapper"/);
});

test('settings popover follows the expanded and collapsed sidebar and animates visibility', () => {
  for (const [width, edge] of [[769, '340px'], [1200, '340px'], [1201, '380px'], [1440, '380px']]) {
    const viewport = { width, height: 900 };
    const selectors = ['#desktop-map-settings-panel'];
    const closed = cssDeclarations(rules, selectors, viewport);
    assert.equal(closed.position, 'fixed');
    assert.equal(closed.left, edge);
    assert.equal(closed.top, '20px');
    assert.equal(closed.display, 'flex');
    assert.equal(closed.visibility, 'hidden');
    assert.equal(closed.opacity, '0');
    assert.equal(closed['pointer-events'], 'none');
    const open = cssDeclarations(rules, [...selectors, '#desktop-map-settings-panel.open'], viewport);
    assert.equal(open.visibility, 'visible');
    assert.equal(open.opacity, '1');
    assert.equal(open['pointer-events'], 'auto');
    assert.equal(open.transform, 'scale(1) translate(0, 0)');
    const collapsed = cssDeclarations(rules, [...selectors,
      '.sidebar-collapsed ~ #main-content #desktop-map-settings-panel',
      '#main-sidebar-left.sidebar-collapsed ~ #main-content #desktop-map-settings-panel'
    ], viewport);
    assert.equal(collapsed.left, '0');
    for (const wrapper of ['theme', 'brightness']) {
      const declarations = cssDeclarations(rules, [`.${wrapper}-selector-wrapper`,
        `#desktop-map-settings-panel .${wrapper}-selector-wrapper`
      ], viewport);
      assert.equal(declarations.position, 'static');
      assert.equal(declarations.left, 'auto');
      assert.equal(declarations.top, 'auto');
      assert.equal(declarations.width, '100%');
    }
  }
});

test('mobile settings panel keeps its 8px inset when the sidebar is collapsed', () => {
  for (const width of [320, 390, 768]) {
    const panel = cssDeclarations(rules, ['#desktop-map-settings-panel',
      '.sidebar-collapsed ~ #main-content #desktop-map-settings-panel',
      '#main-sidebar-left.sidebar-collapsed ~ #main-content #desktop-map-settings-panel'
    ], { width, height: 844 });
    assert.equal(panel.left, '8px', `Collapsed sidebar must not move the mobile panel at ${width}px`);
    assert.equal(panel.right, '8px');
    assert.equal(panel.width, 'calc(100vw - 16px)');
  }
});
