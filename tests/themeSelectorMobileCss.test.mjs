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

test('mobile theme selector menu stays hidden until wrapper is open', () => {
  const mobileMediaIndex = css.indexOf('@media (max-width: 768px)');
  assert.notEqual(mobileMediaIndex, -1, 'Missing mobile media query');

  const mobileMenuBlock = getRuleBlock('.theme-selector-menu', mobileMediaIndex);
  assert.match(mobileMenuBlock, /display:\s*none\b/);
  assert.doesNotMatch(mobileMenuBlock, /display:\s*grid\b/);

  const mobileOpenMenuBlock = getRuleBlock('.theme-selector-wrapper.open .theme-selector-menu', mobileMediaIndex);
  assert.match(mobileOpenMenuBlock, /display:\s*grid\b/);
});

test('mobile theme selector menu spans the viewport width', () => {
  const mobileMediaIndex = css.indexOf('@media (max-width: 768px)');
  const mobileMenuBlock = getRuleBlock('.theme-selector-menu', mobileMediaIndex);

  assert.match(mobileMenuBlock, /left:\s*0\s*!important/);
  assert.match(mobileMenuBlock, /right:\s*0\s*!important/);
  assert.match(mobileMenuBlock, /width:\s*100vw\s*!important/);
  assert.match(mobileMenuBlock, /box-sizing:\s*border-box/);
});

test('mobile theme selector uses compact floor and language dropdown styling', () => {
  const mobileMediaIndex = css.indexOf('@media (max-width: 768px)');
  const mobileToggleBlock = getRuleBlock('.theme-selector-toggle', mobileMediaIndex);
  const mobileToggleTextBlock = getRuleBlock('.theme-selector-toggle span', mobileMediaIndex);
  const mobileToggleIconBlock = getRuleBlock('.theme-selector-toggle svg', mobileMediaIndex);

  assert.match(mobileToggleBlock, /height:\s*40px/);
  assert.match(mobileToggleBlock, /padding:\s*0 14px/);
  assert.match(mobileToggleBlock, /gap:\s*6px/);
  assert.match(mobileToggleBlock, /background:\s*#fff/);
  assert.match(mobileToggleBlock, /border:\s*1px solid rgba\(0,\s*0,\s*0,\s*0\.05\)/);
  assert.match(mobileToggleBlock, /box-shadow:\s*0 4px 15px rgba\(0,\s*0,\s*0,\s*0\.1\)/);
  assert.match(mobileToggleTextBlock, /font-size:\s*13px/);
  assert.match(mobileToggleTextBlock, /font-weight:\s*600/);
  assert.match(mobileToggleTextBlock, /color:\s*#333/);
  assert.match(mobileToggleIconBlock, /width:\s*16px/);
  assert.match(mobileToggleIconBlock, /height:\s*16px/);
  assert.match(mobileToggleIconBlock, /stroke:\s*#333/);
});

test('mobile theme selector sits closer to the iframe corner and below active panels', () => {
  const mobileMediaIndex = css.indexOf('@media (max-width: 768px)');
  const mobileWrapperBlock = getRuleBlock('.theme-selector-wrapper', mobileMediaIndex);
  const mobileMenuBlock = getRuleBlock('.theme-selector-menu', mobileMediaIndex);

  assert.match(mobileWrapperBlock, /top:\s*142px/);
  assert.match(mobileWrapperBlock, /right:\s*8px/);
  assert.match(mobileWrapperBlock, /z-index:\s*1900\s*!important/);
  assert.match(mobileMenuBlock, /top:\s*190px/);
  assert.match(mobileMenuBlock, /z-index:\s*1900\s*!important/);
  assert.match(mobileMenuBlock, /max-height:\s*calc\(100dvh - 190px\)/);
});
