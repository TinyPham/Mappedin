import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `${selector} rule should exist`);
  return match[1];
}

test('subcategory view keeps parent category header sticky while category rows scroll', () => {
  assert.match(source, /backBtn\.className\s*=\s*["']category-subcategory-sticky-header["']/);

  const block = ruleBody('.category-subcategory-sticky-header');
  assert.match(block, /position:\s*sticky/);
  assert.match(block, /top:\s*0/);
  assert.match(block, /z-index:\s*\d+/);
  assert.match(block, /background:\s*#fafbfd/);
});
