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
    if (depth === 0) {
      return css.slice(blockStart + 1, i);
    }
  }

  assert.fail(`Missing block end for: ${selector}`);
}

test('tablet top controls use compact one-row sizing between 769px and 1200px', () => {
  const tabletMediaIndex = css.indexOf('@media (min-width: 769px) and (max-width: 1200px)');
  assert.notEqual(tabletMediaIndex, -1, 'Missing tablet controls media query');

  const sharedButtonBlock = getRuleBlock('.theme-selector-toggle,', tabletMediaIndex);
  assert.match(sharedButtonBlock, /height:\s*40px/);
  assert.match(sharedButtonBlock, /padding:\s*0 12px/);
  assert.match(sharedButtonBlock, /font-size:\s*13px/);
  assert.match(sharedButtonBlock, /gap:\s*6px/);

  const brightnessBlock = getRuleBlock('.brightness-toggle', tabletMediaIndex);
  assert.match(brightnessBlock, /height:\s*40px/);
  assert.match(brightnessBlock, /padding:\s*0 10px/);
  assert.match(brightnessBlock, /gap:\s*6px/);

  const sliderBlock = getRuleBlock('#brightness-slider', tabletMediaIndex);
  assert.match(sliderBlock, /width:\s*58px/);
});

test('tablet top controls are spaced to fit alongside floor and language controls', () => {
  const tabletMediaIndex = css.indexOf('@media (min-width: 769px) and (max-width: 1200px)');

  const themeWrapperBlock = getRuleBlock('.theme-selector-wrapper', tabletMediaIndex);
  const brightnessWrapperBlock = getRuleBlock('.brightness-selector-wrapper', tabletMediaIndex);
  const mapControlsBlock = getRuleBlock('#map-top-controls', tabletMediaIndex);

  assert.match(themeWrapperBlock, /left:\s*12px\s*!important/);
  assert.match(brightnessWrapperBlock, /left:\s*142px\s*!important/);
  assert.match(mapControlsBlock, /right:\s*12px\s*!important/);
  assert.match(mapControlsBlock, /gap:\s*8px\s*!important/);
});

test('narrow tablet top controls use extra compact sizing between 769px and 992px', () => {
  const narrowTabletMediaIndex = css.indexOf('@media (min-width: 769px) and (max-width: 992px)');
  assert.notEqual(narrowTabletMediaIndex, -1, 'Missing narrow tablet controls media query');

  const sharedButtonBlock = getRuleBlock('.theme-selector-toggle,', narrowTabletMediaIndex);
  assert.match(sharedButtonBlock, /height:\s*36px/);
  assert.match(sharedButtonBlock, /padding:\s*0 9px/);
  assert.match(sharedButtonBlock, /font-size:\s*12px/);
  assert.match(sharedButtonBlock, /gap:\s*4px/);

  const brightnessBlock = getRuleBlock('.brightness-toggle', narrowTabletMediaIndex);
  assert.match(brightnessBlock, /height:\s*36px/);
  assert.match(brightnessBlock, /padding:\s*0 8px/);
  assert.match(brightnessBlock, /gap:\s*4px/);

  const sliderBlock = getRuleBlock('#brightness-slider', narrowTabletMediaIndex);
  assert.match(sliderBlock, /width:\s*44px/);
});
