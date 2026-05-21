import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

function getRuleBlock(selector, startIndex = 0) {
  const selectorIndex = css.indexOf(selector, startIndex);
  assert.notEqual(selectorIndex, -1, `Missing selector: ${selector}`);

  const blockStart = css.indexOf('{', selectorIndex);
  assert.notEqual(blockStart, -1, `Missing block start for: ${selector}`);

  let depth = 0;
  for (let i = blockStart; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') depth -= 1;
    if (depth === 0) {
      return css.slice(blockStart + 1, i);
    }
  }

  assert.fail(`Missing block end for: ${selector}`);
}

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

test('desktop settings popover opens from the sidebar edge on desktop only', () => {
  const desktopIndex = css.indexOf('@media (min-width: 1201px)');
  assert.notEqual(desktopIndex, -1, 'Missing desktop media query');

  const panelBlock = getRuleBlock('#desktop-map-settings-panel', desktopIndex);
  assert.match(panelBlock, /position:\s*absolute/);
  assert.match(panelBlock, /left:\s*0\s*!important/);
  assert.match(panelBlock, /top:\s*20px\s*!important/);
  assert.match(panelBlock, /display:\s*none/);

  const openBlock = getRuleBlock('#desktop-map-settings-panel.open', desktopIndex);
  assert.match(openBlock, /display:\s*flex/);

  const themeWrapperBlock = getRuleBlock('#desktop-map-settings-panel .theme-selector-wrapper', desktopIndex);
  assert.match(themeWrapperBlock, /position:\s*static\s*!important/);
  assert.match(themeWrapperBlock, /left:\s*auto\s*!important/);

  const brightnessWrapperBlock = getRuleBlock('#desktop-map-settings-panel .brightness-selector-wrapper', desktopIndex);
  assert.match(brightnessWrapperBlock, /position:\s*static\s*!important/);
  assert.match(brightnessWrapperBlock, /left:\s*auto\s*!important/);
});
