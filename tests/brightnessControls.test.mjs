import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cssDeclarations, parseCssRules } from './helpers/cssRules.mjs';

const html = readFileSync(new URL('../main/html/index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');
const css = readFileSync(new URL('../main/css/styles.css', import.meta.url), 'utf8');
const rules = parseCssRules(css);

test('brightness slider is capped at 100 with single-unit steps', () => {
  const sliderMatch = html.match(/<input[^>]+id="brightness-slider"[^>]+>/);
  assert.ok(sliderMatch, 'Missing brightness slider input');

  const slider = sliderMatch[0];
  assert.match(slider, /min="50"/);
  assert.match(slider, /max="100"/);
  assert.match(slider, /step="1"/);
  assert.match(slider, /value="100"/);
});

test('brightness plus and minus buttons adjust one unit and never exceed 100', () => {
  assert.match(source, /if\s*\(val\s*<\s*100\)\s*updateMapDisplay\(val\s*\+\s*1\)/);
  assert.match(source, /if\s*\(val\s*>\s*50\)\s*updateMapDisplay\(val\s*-\s*1\)/);
});

test('desktop settings theme and brightness controls keep equal 40px heights', () => {
  for (const width of [1201, 1250, 1300, 1440]) {
    const viewport = { width, height: 900 };
    for (const selectors of [
      ['.brightness-toggle', '#desktop-map-settings-panel .brightness-toggle'],
      ['.theme-selector-toggle', '#desktop-map-settings-panel .theme-selector-toggle']
    ]) {
      const declarations = cssDeclarations(rules, selectors, viewport);
      assert.equal(declarations.height, '40px', `${selectors[0]} at ${width}px`);
      assert.equal(declarations['min-height'], '40px', `${selectors[0]} minimum at ${width}px`);
      assert.equal(declarations['box-sizing'], 'border-box');
    }
  }
});
