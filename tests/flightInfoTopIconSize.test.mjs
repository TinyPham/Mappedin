import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../main/html/index.html', import.meta.url), 'utf8');
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

test('top-left flight info button uses a slightly larger airplane icon', () => {
  const buttonStart = html.indexOf('id="btn-flight-info-topleft"');
  assert.notEqual(buttonStart, -1, 'Missing top-left flight info button');

  const buttonMarkup = html.slice(buttonStart, html.indexOf('</button>', buttonStart));
  assert.match(buttonMarkup, /class="airplane-icon" width="24" height="24"/);
});

test('right-side flight info camera icon is slightly larger by default', () => {
  const buttonStart = html.indexOf('id="btn-open-flight-info"');
  assert.notEqual(buttonStart, -1, 'Missing right-side flight info button');

  const buttonMarkup = html.slice(buttonStart, html.indexOf('</button>', buttonStart));
  assert.match(buttonMarkup, /class="airplane-icon" width="20" height="20"/);
});

test('responsive flight info camera icon remains enlarged across breakpoints', () => {
  const midMobileIndex = css.indexOf('@media (max-width: 768px) and (min-height: 450px) and (max-height: 550px)');
  const shortMobileIndex = css.indexOf('@media (max-width: 768px) and (max-height: 550px)');
  const veryShortDesktopIndex = css.indexOf('@media (min-width: 769px) and (max-height: 520px)');

  const compactMobileBlock = getRuleBlock('#camera-actions #btn-open-flight-info svg', midMobileIndex);
  const midMobileBlock = getRuleBlock('.mobile-camera-stack #btn-open-flight-info svg', midMobileIndex);
  const shortMobileBlock = getRuleBlock('.mobile-camera-stack #btn-open-flight-info svg', shortMobileIndex);
  const veryShortDesktopBlock = getRuleBlock('#camera-actions #btn-open-flight-info svg', veryShortDesktopIndex);

  assert.match(compactMobileBlock, /width:\s*17px\s*!important/);
  assert.match(compactMobileBlock, /height:\s*17px\s*!important/);
  assert.match(midMobileBlock, /width:\s*17px\s*!important/);
  assert.match(midMobileBlock, /height:\s*17px\s*!important/);
  assert.match(shortMobileBlock, /width:\s*17px\s*!important/);
  assert.match(shortMobileBlock, /height:\s*17px\s*!important/);
  assert.match(veryShortDesktopBlock, /width:\s*16px\s*!important/);
  assert.match(veryShortDesktopBlock, /height:\s*16px\s*!important/);
});

test('responsive top-left flight info chip keeps its icon larger than peer dropdown icons', () => {
  const mediumDesktopIndex = css.lastIndexOf('.flight-info-top-btn svg');
  const mediumDesktopBlock = getRuleBlock('.flight-info-top-btn svg', mediumDesktopIndex);

  assert.match(mediumDesktopBlock, /width:\s*18px\s*!important/);
  assert.match(mediumDesktopBlock, /height:\s*18px\s*!important/);
});
