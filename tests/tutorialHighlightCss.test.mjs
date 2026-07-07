import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../main/css/styles.css', import.meta.url), 'utf8');

function getLastRuleBlock(selector) {
  const selectorIndex = css.lastIndexOf(selector);
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

test('tutorial overlay does not blur the highlighted UI behind the popup', () => {
  const modalBlock = getLastRuleBlock('.user-guide-modal');

  assert.doesNotMatch(modalBlock, /backdrop-filter:\s*blur/i);
  assert.doesNotMatch(modalBlock, /-webkit-backdrop-filter:\s*blur/i);
  assert.match(modalBlock, /background:\s*rgba\(15,\s*23,\s*42,\s*0\.10\)/);
});

test('tutorial highlight uses a bright spotlight above the dim layer', () => {
  const highlightBlock = getLastRuleBlock('.user-guide-highlight-box');

  assert.match(highlightBlock, /z-index:\s*1/);
  assert.match(highlightBlock, /background:\s*transparent/);
  assert.match(highlightBlock, /border:\s*4px solid #ffffff/);
  assert.match(highlightBlock, /0 0 0 9999px rgba\(15,\s*23,\s*42,\s*0\.48\)/);
  assert.match(highlightBlock, /0 0 0 5px rgba\(33,\s*76,\s*166,\s*0\.9\)/);
});

test('tutorial copy card is glass style and image media is hidden by default', () => {
  const cardBlock = getLastRuleBlock('.user-guide-copy-card');
  assert.match(cardBlock, /background:\s*rgba\(255,\s*255,\s*255,\s*0\.72\)/);
  assert.match(cardBlock, /backdrop-filter:\s*blur\(14px\)/);

  const mediaBlock = getLastRuleBlock('.user-guide-media');
  assert.match(mediaBlock, /display:\s*none\s*!important/);
});

test('tutorial arrow layer draws red curved connector above highlight', () => {
  const arrowBlock = getLastRuleBlock('.user-guide-arrow-layer');
  assert.match(arrowBlock, /z-index:\s*1/);
  assert.match(arrowBlock, /pointer-events:\s*none/);
  assert.match(arrowBlock, /overflow:\s*visible/);

  const pathBlock = getLastRuleBlock('.user-guide-arrow-path');
  assert.match(pathBlock, /stroke-dasharray:\s*12 10/);
  assert.match(pathBlock, /stroke-width:\s*4/);
});
