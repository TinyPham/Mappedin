import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../main/html/index.html', import.meta.url), 'utf8');

function getRuleBlock(selector, startIndex = 0) {
  const selectorIndex = html.indexOf(selector, startIndex);
  assert.notEqual(selectorIndex, -1, `Missing selector: ${selector}`);

  const blockStart = html.indexOf('{', selectorIndex);
  assert.notEqual(blockStart, -1, `Missing block start for: ${selector}`);

  let depth = 0;
  for (let i = blockStart; i < html.length; i += 1) {
    if (html[i] === '{') depth += 1;
    if (html[i] === '}') depth -= 1;
    if (depth === 0) {
      return html.slice(blockStart + 1, i);
    }
  }

  assert.fail(`Missing block end for: ${selector}`);
}

test('mobile camera controls sit 40px below vertical center away from bottom language controls', () => {
  const mobileMediaIndex = html.indexOf('@media (max-width: 768px)');
  assert.notEqual(mobileMediaIndex, -1, 'Missing mobile media query');

  const cameraControlsBlock = getRuleBlock('#camera-controls', mobileMediaIndex);
  assert.match(cameraControlsBlock, /position:\s*fixed/);
  assert.match(cameraControlsBlock, /right:\s*10px/);
  assert.match(cameraControlsBlock, /top:\s*calc\(50% \+ 40px\)/);
  assert.match(cameraControlsBlock, /bottom:\s*auto/);
  assert.match(cameraControlsBlock, /transform:\s*translateY\(-50%\)/);
});
