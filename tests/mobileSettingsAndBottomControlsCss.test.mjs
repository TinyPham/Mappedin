import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
    if (depth === 0) return css.slice(blockStart + 1, i);
  }

  assert.fail(`Missing block end for: ${selector}`);
}

test('final mobile settings panel stays inside the viewport', () => {
  const finalMobileIndex = css.lastIndexOf('/* FINAL MOBILE CONTROL OVERFLOW FIX */');
  assert.notEqual(finalMobileIndex, -1, 'Missing final mobile control overflow fix');

  const panelBlock = getRuleBlock('#desktop-map-settings-panel', finalMobileIndex);
  assert.match(panelBlock, /left:\s*8px\s*!important/);
  assert.match(panelBlock, /right:\s*8px\s*!important/);
  assert.match(panelBlock, /width:\s*calc\(100vw - 16px\)\s*!important/);
  assert.match(panelBlock, /max-width:\s*calc\(100vw - 16px\)\s*!important/);

  const panelOpenBlock = getRuleBlock('#desktop-map-settings-panel.open', finalMobileIndex);
  assert.match(panelOpenBlock, /transform:\s*none\s*!important/);
});

test('final mobile header search row cannot push settings offscreen', () => {
  const finalMobileIndex = css.lastIndexOf('/* FINAL MOBILE CONTROL OVERFLOW FIX */');
  const headerRowBlock = getRuleBlock('#search-tab-header > div', finalMobileIndex);
  const searchBlock = getRuleBlock('#search-tab-header .modern-search-wrapper', finalMobileIndex);
  const settingsBlock = getRuleBlock('#mobile-settings-btn', finalMobileIndex);

  assert.match(headerRowBlock, /width:\s*100%\s*!important/);
  assert.match(headerRowBlock, /min-width:\s*0\s*!important/);
  assert.match(searchBlock, /min-width:\s*0\s*!important/);
  assert.match(settingsBlock, /flex:\s*0 0 44px\s*!important/);
  assert.match(settingsBlock, /width:\s*44px\s*!important/);
});

test('final mobile floor and language controls stay fixed at bottom and menus open upward', () => {
  const finalMobileIndex = css.lastIndexOf('/* FINAL MOBILE CONTROL OVERFLOW FIX */');
  const floorBlock = getRuleBlock('#custom-floor-wrapper', finalMobileIndex);
  const langBlock = getRuleBlock('#custom-lang-wrapper', finalMobileIndex);
  const menuBlock = getRuleBlock('#custom-floor-wrapper .pro-dropdown-menu,', finalMobileIndex);

  assert.match(floorBlock, /position:\s*fixed\s*!important/);
  assert.match(floorBlock, /bottom:\s*calc\(16px \+ env\(safe-area-inset-bottom,\s*0px\)\)\s*!important/);
  assert.match(langBlock, /position:\s*fixed\s*!important/);
  assert.match(langBlock, /bottom:\s*calc\(16px \+ env\(safe-area-inset-bottom,\s*0px\)\)\s*!important/);
  assert.match(menuBlock, /bottom:\s*calc\(100% \+ 8px\)\s*!important/);
});
