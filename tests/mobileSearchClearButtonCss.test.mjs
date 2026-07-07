import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../main/html/index.html', import.meta.url), 'utf8');
const responsiveCss = readFileSync(new URL('../main/css/responsive.css', import.meta.url), 'utf8');

function getRuleBlock(css, selector, startIndex = 0) {
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

test('mobile search clear button sits inside input before category toggle', () => {
  const mobileMediaIndex = responsiveCss.indexOf('@media (max-width: 768px)');
  assert.notEqual(mobileMediaIndex, -1, 'Missing mobile media query');

  const clearBlock = getRuleBlock(responsiveCss, '#search-clear-btn', mobileMediaIndex);
  assert.match(clearBlock, /right:\s*54px\s*!important/);
  assert.match(clearBlock, /z-index:\s*2\s*!important/);

  const toggleBlock = getRuleBlock(responsiveCss, '#mobile-category-toggle', mobileMediaIndex);
  assert.match(toggleBlock, /width:\s*44px\s*!important/);
  assert.match(toggleBlock, /flex:\s*0 0 44px\s*!important/);
});

test('location search input reserves room for mobile clear button', () => {
  const inputMatch = html.match(/<input[^>]+id="location-search"[^>]+style="([^"]+)"/);
  assert.ok(inputMatch, 'Missing location search input inline style');
  assert.match(inputMatch[1], /padding:\s*12px 44px 12px 10px !important/);
});
