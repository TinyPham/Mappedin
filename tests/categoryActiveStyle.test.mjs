import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'g'));
  return match?.at(-1) || '';
}

test('active main category highlights the label while keeping the icon panel neutral', () => {
  const activeItem = ruleBody('.category-item.active');
  const activeIcon = ruleBody('.category-item.active .category-icon-box');
  const activeLabel = ruleBody('.category-item.active .category-label-box');

  assert.doesNotMatch(activeItem, /background-color:\s*#214ca6\s*!important/i);
  assert.match(activeItem, /background:\s*#ffffff\s*!important/i);
  assert.match(activeIcon, /background-color:\s*#f4f7fa\s*!important/i);
  assert.match(activeIcon, /color:\s*#214ca6\s*!important/i);
  assert.match(activeLabel, /background-color:\s*#214ca6\s*!important/i);
  assert.match(activeLabel, /color:\s*white\s*!important/i);
  assert.match(activeLabel, /margin:\s*-1px\s*-1px\s*-1px\s*0/i);
});
