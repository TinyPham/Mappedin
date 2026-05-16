import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');

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
