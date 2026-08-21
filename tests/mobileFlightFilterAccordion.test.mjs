import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../main/html/index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');
const responsiveCss = readFileSync(new URL('../main/css/responsive.css', import.meta.url), 'utf8');

function getBalancedBlock(text, marker, startIndex = 0) {
  const markerIndex = text.indexOf(marker, startIndex);
  assert.notEqual(markerIndex, -1, `Missing marker: ${marker}`);

  const blockStart = text.indexOf('{', markerIndex);
  assert.notEqual(blockStart, -1, `Missing block start for: ${marker}`);

  let depth = 0;
  for (let index = blockStart; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    if (text[index] === '}') depth -= 1;
    if (depth === 0) return text.slice(blockStart + 1, index);
  }

  assert.fail(`Missing block end for: ${marker}`);
}

test('flight modal exposes one localized accessible toggle for both stable filter groups', () => {
  const bodyStart = html.indexOf('<div class="flight-modal-body">');
  const toggleStart = html.indexOf('id="flight-filter-toggle"', bodyStart);
  const sidebarStart = html.indexOf('id="flight-primary-filters"', bodyStart);
  const toolbarStart = html.indexOf('id="flight-status-filters"', bodyStart);

  assert.ok(bodyStart >= 0 && toggleStart > bodyStart, 'Toggle must be inside the modal body');
  assert.ok(toggleStart < sidebarStart, 'Toggle row must precede the primary filters');
  assert.ok(sidebarStart < toolbarStart, 'Existing status toolbar must remain in the results region');
  assert.match(
    html,
    /<button[^>]*id="flight-filter-toggle"[^>]*type="button"[^>]*aria-expanded="false"[^>]*aria-controls="flight-primary-filters flight-status-filters"[^>]*>/
  );
  assert.match(html, /id="flight-filter-toggle"[\s\S]*?data-i18n="flight_filter_toggle"/);
  assert.match(html, /class="flight-filter-chevron"[^>]*aria-hidden="true"/);
  assert.match(html, /<aside[^>]*id="flight-primary-filters"[^>]*class="flight-modal-sidebar"/);
  assert.match(html, /<div[^>]*id="flight-status-filters"[^>]*class="flight-results-toolbar"/);
});

test('filter label has static fallbacks in all five supported languages', () => {
  const fallbackBlock = getBalancedBlock(source, "'flight_filter_toggle':");

  for (const language of ['vn', 'en', 'zh', 'ja', 'ko']) {
    assert.match(fallbackBlock, new RegExp(`['\"]${language}['\"]\\s*:`));
  }
});

test('expanded state synchronizes the mobile body, accessibility state, and chevron', () => {
  assert.match(source, /const\s+filterToggle\s*=\s*modal\.querySelector\('#flight-filter-toggle'\)/);
  assert.match(source, /const\s+modalBody\s*=\s*modal\.querySelector\('\.flight-modal-body'\)/);
  const helperBlock = getBalancedBlock(
    source,
    'const setFlightFiltersExpanded = (expanded: boolean) =>'
  );

  assert.match(helperBlock, /modalBody\.classList\.toggle\('flight-filters-collapsed',\s*!expanded\)/);
  assert.match(helperBlock, /filterToggle\.setAttribute\('aria-expanded',\s*String\(expanded\)\)/);
  assert.match(helperBlock, /filterToggle\.classList\.toggle\('expanded',\s*expanded\)/);
  assert.match(helperBlock, /filterChevron\.classList\.toggle\('open',\s*expanded\)/);
});

test('toggle click changes expansion only and never reloads flights', () => {
  const listenerBlock = getBalancedBlock(source, "filterToggle.addEventListener('click', () =>");

  assert.match(listenerBlock, /setFlightFiltersExpanded\(/);
  assert.doesNotMatch(listenerBlock, /loadFlights\s*\(/);
});

test('every modal open collapses filters before revealing the modal', () => {
  const openModalBlock = getBalancedBlock(source, 'const openModal = () =>');
  const collapseIndex = openModalBlock.indexOf('setFlightFiltersExpanded(false)');
  const revealIndex = openModalBlock.indexOf("modal.classList.remove('hidden')");

  assert.ok(collapseIndex >= 0, 'openModal must reset filters to collapsed');
  assert.ok(revealIndex >= 0, 'openModal must reveal the modal');
  assert.ok(collapseIndex < revealIndex, 'Collapsed state must be applied before visibility changes');
});

test('accordion visibility rules are restricted to smartphones', () => {
  const mobileMarker = '@media (max-width: 768px)';
  const mobileIndex = responsiveCss.indexOf(mobileMarker);
  const mobileBlock = getBalancedBlock(responsiveCss, mobileMarker);
  const baseCss = responsiveCss.slice(0, mobileIndex);

  assert.match(baseCss, /\.flight-filter-toggle\s*\{[\s\S]*?display:\s*none\s*;/);
  assert.match(mobileBlock, /\.flight-filter-toggle\s*\{[\s\S]*?display:\s*flex\s*!important\s*;/);
  assert.match(
    mobileBlock,
    /\.flight-modal-body\.flight-filters-collapsed\s+#flight-primary-filters\s*,\s*\.flight-modal-body\.flight-filters-collapsed\s+#flight-status-filters\s*\{[\s\S]*?display:\s*none\s*!important\s*;/
  );
  assert.match(mobileBlock, /\.flight-filter-toggle\.expanded/);
  assert.match(mobileBlock, /\.flight-filter-chevron\.open/);
  assert.doesNotMatch(baseCss, /flight-filters-collapsed/);
});
