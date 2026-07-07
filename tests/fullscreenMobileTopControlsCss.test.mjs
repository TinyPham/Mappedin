import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../main/css/styles.css', import.meta.url), 'utf8');

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

test('mobile fullscreen keeps brightness and theme controls below search header', () => {
  const mobileFullscreenIndex = css.lastIndexOf(':fullscreen #brightness-selector-wrapper');
  assert.notEqual(mobileFullscreenIndex, -1, 'Missing mobile fullscreen brightness rule');

  const brightnessBlock = getRuleBlock(':fullscreen #brightness-selector-wrapper', mobileFullscreenIndex);
  const themeIndex = css.lastIndexOf(':fullscreen .theme-selector-wrapper');
  assert.notEqual(themeIndex, -1, 'Missing mobile fullscreen theme rule');
  const themeBlock = getRuleBlock(':fullscreen .theme-selector-wrapper', themeIndex);

  assert.match(brightnessBlock, /top:\s*190px\s*!important/);
  assert.match(brightnessBlock, /bottom:\s*auto\s*!important/);
  assert.match(themeBlock, /top:\s*190px\s*!important/);
  assert.match(themeBlock, /bottom:\s*auto\s*!important/);
});

test('webkit mobile fullscreen uses the same top offset for brightness and theme controls', () => {
  const webkitBrightnessIndex = css.lastIndexOf(':-webkit-full-screen #brightness-selector-wrapper');
  assert.notEqual(webkitBrightnessIndex, -1, 'Missing webkit fullscreen brightness rule');

  const webkitThemeIndex = css.lastIndexOf(':-webkit-full-screen .theme-selector-wrapper');
  assert.notEqual(webkitThemeIndex, -1, 'Missing webkit fullscreen theme rule');

  const brightnessBlock = getRuleBlock(':-webkit-full-screen #brightness-selector-wrapper', webkitBrightnessIndex);
  const themeBlock = getRuleBlock(':-webkit-full-screen .theme-selector-wrapper', webkitThemeIndex);

  assert.match(brightnessBlock, /top:\s*190px\s*!important/);
  assert.match(themeBlock, /top:\s*190px\s*!important/);
});
