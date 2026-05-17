import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

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

test('desktop brightness control matches theme floor and language button height', () => {
  const desktopBrightnessIndex = css.lastIndexOf('@media (min-width: 1201px)');
  assert.notEqual(desktopBrightnessIndex, -1, 'Missing desktop brightness height override');
  const brightnessRuleIndex = css.indexOf('.brightness-toggle', desktopBrightnessIndex);
  assert.notEqual(brightnessRuleIndex, -1, 'Missing desktop brightness toggle rule');
  const lastBrightnessRule = css.slice(brightnessRuleIndex, css.indexOf('}', brightnessRuleIndex) + 1);

  assert.match(lastBrightnessRule, /height:\s*40px\s*!important/);
  assert.match(lastBrightnessRule, /min-height:\s*40px\s*!important/);
});
