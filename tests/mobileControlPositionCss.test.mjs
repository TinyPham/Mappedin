import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../responsive.css', import.meta.url), 'utf8');

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
