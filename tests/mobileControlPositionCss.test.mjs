import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const responsiveCss = readFileSync(new URL('../responsive.css', import.meta.url), 'utf8');
const appCss = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
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
