import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const responsiveCss = readFileSync(new URL('../main/css/responsive.css', import.meta.url), 'utf8');
const appCss = readFileSync(new URL('../main/css/styles.css', import.meta.url), 'utf8');
const css = `${responsiveCss}\n${appCss}`;

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

test('mobile floor and language controls sit 15px higher above the bottom edge', () => {
  const mobileMediaIndex = css.indexOf('@media (max-width: 768px)');
  assert.notEqual(mobileMediaIndex, -1, 'Missing mobile media query');

  const controlsBlock = getRuleBlock('#map-top-controls', mobileMediaIndex);
  assert.match(controlsBlock, /bottom:\s*40px\s*!important/);
});

test('mobile theme floor and language buttons keep original sizing with 12px text', () => {
  const mobileMediaIndex = css.indexOf('@media (max-width: 768px)');
  assert.notEqual(mobileMediaIndex, -1, 'Missing mobile media query');

  const toggleBlock = getRuleBlock('#custom-floor-wrapper .pro-dropdown-toggle,', mobileMediaIndex);
  assert.match(toggleBlock, /font-size:\s*12px\s*!important/);
  assert.doesNotMatch(toggleBlock, /width:\s*\d+px\s*!important/);
  assert.doesNotMatch(toggleBlock, /flex:\s*0 0 \d+px/);
  assert.doesNotMatch(toggleBlock, /text-overflow:\s*ellipsis/);

  const themeToggleBlock = getRuleBlock('.theme-selector-toggle,', mobileMediaIndex);
  assert.match(themeToggleBlock, /font-size:\s*12px\s*!important/);
  assert.doesNotMatch(themeToggleBlock, /width:\s*\d+px\s*!important/);
});

test('floor dropdown is wide enough and keeps floor names on one line', () => {
  const floorMenuBlock = getRuleBlock('#floor-options');
  assert.match(floorMenuBlock, /width:\s*max-content/);
  assert.match(floorMenuBlock, /min-width:\s*100%/);
  assert.match(floorMenuBlock, /max-width:\s*calc\(100vw - 24px\)/);

  const floorItemBlock = getRuleBlock('#floor-options .pro-dropdown-item');
  assert.match(floorItemBlock, /white-space:\s*nowrap/);
});

test('pro dropdown item typography matches toggle typography across breakpoints', () => {
  const baseItemBlock = getRuleBlock('.pro-dropdown-item');
  assert.match(baseItemBlock, /font-size:\s*14px/);

  const tabletIndex = css.indexOf('@media (min-width: 769px) and (max-width: 1200px)');
  const tabletItemBlock = getRuleBlock('.pro-dropdown-item', tabletIndex);
  assert.match(tabletItemBlock, /font-size:\s*13px/);
  const tabletFloorItemBlock = getRuleBlock('#floor-options .pro-dropdown-item,', tabletIndex);
  assert.match(tabletFloorItemBlock, /font-size:\s*13px/);

  const narrowTabletIndex = css.indexOf('@media (min-width: 769px) and (max-width: 992px)');
  const narrowTabletItemBlock = getRuleBlock('.pro-dropdown-item', narrowTabletIndex);
  assert.match(narrowTabletItemBlock, /font-size:\s*12px/);
  const narrowTabletFloorItemBlock = getRuleBlock('#floor-options .pro-dropdown-item,', narrowTabletIndex);
  assert.match(narrowTabletFloorItemBlock, /font-size:\s*12px/);

  const mobileIndex = css.lastIndexOf('@media (max-width: 768px)');
  const mobileItemBlock = getRuleBlock('.pro-dropdown-item', mobileIndex);
  assert.match(mobileItemBlock, /font-size:\s*12px\s*!important/);
});

test('open floor and language dropdowns rise above right-side camera buttons at every size', () => {
  const globalOpenControlsBlock = getRuleBlock('#map-top-controls:has(.pro-dropdown-wrapper.open)');
  assert.match(globalOpenControlsBlock, /z-index:\s*6500\s*!important/);

  const globalOpenMenuBlock = getRuleBlock('.pro-dropdown-wrapper.open .pro-dropdown-menu');
  assert.match(globalOpenMenuBlock, /z-index:\s*6500\s*!important/);
});

test('short mobile screens shrink right controls and lower floor language controls', () => {
  const shortMobileIndex = css.lastIndexOf('@media (max-width: 768px) and (max-height: 550px)');
  assert.notEqual(shortMobileIndex, -1, 'Missing short mobile height media query');

  const cameraControlsBlock = getRuleBlock('#camera-controls', shortMobileIndex);
  assert.match(cameraControlsBlock, /top:\s*calc\(50%\s*\+\s*60px\)\s*!important/);

  const cameraActionsBlock = getRuleBlock('#camera-actions', shortMobileIndex);
  assert.match(cameraActionsBlock, /gap:\s*8px\s*!important/);

  const mobileStackBlock = getRuleBlock('.mobile-camera-stack', shortMobileIndex);
  assert.match(mobileStackBlock, /gap:\s*8px\s*!important/);

  const cameraButtonBlock = getRuleBlock('.mobile-camera-stack .camera-btn', shortMobileIndex);
  assert.match(cameraButtonBlock, /width:\s*28px\s*!important/);
  assert.match(cameraButtonBlock, /height:\s*28px\s*!important/);

  const mapTopControlsBlock = getRuleBlock('#map-top-controls', shortMobileIndex);
  assert.match(mapTopControlsBlock, /bottom:\s*25px\s*!important/);

  const floorBlock = getRuleBlock('#custom-floor-wrapper', shortMobileIndex);
  assert.match(floorBlock, /bottom:\s*2px\s*!important/);

  const languageBlock = getRuleBlock('#custom-lang-wrapper', shortMobileIndex);
  assert.match(languageBlock, /bottom:\s*2px\s*!important/);
});
