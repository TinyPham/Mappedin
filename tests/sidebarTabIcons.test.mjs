import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function buttonMarkup(id) {
  const start = html.indexOf(`<button id="${id}"`);
  assert.notEqual(start, -1, `Missing #${id}`);
  const end = html.indexOf('</button>', start);
  assert.notEqual(end, -1, `Missing closing button for #${id}`);
  return html.slice(start, end + '</button>'.length);
}

test('search tab shows a magnifying glass icon after the label', () => {
  const markup = buttonMarkup('tab-search');
  const labelIndex = markup.indexOf('data-i18n="tab_search"');
  const iconIndex = markup.indexOf('class="tab-search-icon"');

  assert.notEqual(labelIndex, -1, 'Search tab label should exist');
  assert.notEqual(iconIndex, -1, 'Search tab icon should exist');
  assert.ok(labelIndex < iconIndex, 'Search icon should appear after the label');
  assert.match(markup, /<circle cx="11" cy="11" r="8"/);
  assert.match(markup, /<path d="m21 21-4\.35-4\.35"/);
});

test('directions tab uses a location pin icon instead of the diagonal arrow', () => {
  const markup = buttonMarkup('tab-directions');

  assert.match(markup, /class="tab-location-icon"/);
  assert.match(markup, /<path d="M20 10c0 4\.993-5\.539 10\.193-7\.399 11\.799/);
  assert.match(markup, /<circle cx="12" cy="10" r="3"/);
  assert.doesNotMatch(markup, /<path d="M7 17L17 7M17 7H7M17 7V17"/);
});
