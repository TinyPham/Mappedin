import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bindMobileFlightFilterAccordion } from '../src/ui/mobileFlightFilterAccordion.mjs';

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

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    contains(name) {
      return classes.has(name);
    },
    toggle(name, force) {
      const shouldAdd = force === undefined ? !classes.has(name) : Boolean(force);
      if (shouldAdd) classes.add(name);
      else classes.delete(name);
      return shouldAdd;
    }
  };
}

function createToggle() {
  const attributes = new Map([['aria-expanded', 'false']]);
  const listeners = new Map();
  return {
    classList: createClassList(),
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    click() {
      listeners.get('click')?.();
    }
  };
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
  assert.match(
    html,
    /<span data-i18n="flight_filter_toggle">Bộ lọc chuyến bay<\/span>/,
    'Vietnamese default markup must remain useful when translations cannot load'
  );
  assert.match(html, /class="flight-filter-chevron"[^>]*aria-hidden="true"/);
  assert.match(html, /<aside[^>]*id="flight-primary-filters"[^>]*class="flight-modal-sidebar"/);
  assert.match(html, /<div[^>]*id="flight-status-filters"[^>]*class="flight-results-toolbar"/);
});

test('filter label has static fallbacks in all five supported languages', () => {
  const fallbackBlock = getBalancedBlock(source, "'flight_filter_toggle':");
  const expectedLabels = {
    vn: 'Bộ lọc chuyến bay',
    en: 'Flight filters',
    zh: '航班筛选',
    ja: 'フライトフィルター',
    ko: '항공편 필터'
  };

  for (const [language, label] of Object.entries(expectedLabels)) {
    assert.ok(label.trim().length > 0, `${language} label must be meaningful`);
    assert.ok(
      fallbackBlock.includes(`'${language}': '${label}'`),
      `Missing expected ${language} fallback label`
    );
  }
});

test('controller toggles actual accordion state without resetting filters or reloading flights', () => {
  const toggle = createToggle();
  const body = { classList: createClassList(['flight-filters-collapsed']) };
  const chevron = { classList: createClassList() };
  const searchInput = { value: 'VN123' };
  const statusSelect = { value: 'DELAYED' };
  let reloadCalls = 0;

  const accordion = bindMobileFlightFilterAccordion({
    toggle,
    body,
    chevron,
    loadFlights: () => { reloadCalls += 1; }
  });

  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.classList.contains('expanded'), true);
  assert.equal(body.classList.contains('flight-filters-collapsed'), false);
  assert.equal(chevron.classList.contains('open'), true);
  assert.equal(searchInput.value, 'VN123');
  assert.equal(statusSelect.value, 'DELAYED');
  assert.equal(reloadCalls, 0);

  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(toggle.classList.contains('expanded'), false);
  assert.equal(body.classList.contains('flight-filters-collapsed'), true);
  assert.equal(chevron.classList.contains('open'), false);
  assert.equal(searchInput.value, 'VN123');
  assert.equal(statusSelect.value, 'DELAYED');
  assert.equal(reloadCalls, 0);

  accordion.disconnect();
});

test('flight UI delegates accordion behavior to the tested controller', () => {
  assert.match(source, /import\s+\{\s*bindMobileFlightFilterAccordion\s*\}/);
  assert.match(source, /const\s+flightFilterAccordion\s*=\s*bindMobileFlightFilterAccordion\(\{/);
  assert.doesNotMatch(source, /filterToggle\.addEventListener\('click'/);
});

test('every modal open collapses filters before revealing the modal', () => {
  const openModalBlock = getBalancedBlock(source, 'const openModal = () =>');
  const collapseIndex = openModalBlock.indexOf('flightFilterAccordion.setExpanded(false)');
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
  assert.equal(
    [...responsiveCss.matchAll(/\.flight-modal-body\.flight-filters-collapsed\s+#flight-primary-filters/g)].length,
    1,
    'Primary filter hiding selector must exist only in the smartphone media block'
  );
  assert.equal(
    [...responsiveCss.matchAll(/\.flight-modal-body\.flight-filters-collapsed\s+#flight-status-filters/g)].length,
    1,
    'Status filter hiding selector must exist only in the smartphone media block'
  );
  assert.equal(
    [...responsiveCss.matchAll(/\.flight-filter-toggle\.expanded/g)].length,
    1,
    'Expanded visual selector must not leak into later or global rules'
  );
  assert.equal(
    [...responsiveCss.matchAll(/\.flight-filter-chevron\.open/g)].length,
    1,
    'Chevron open selector must not leak into later or global rules'
  );
  assert.equal(
    [...responsiveCss.matchAll(/\.flight-filter-toggle\s*\{/g)].length,
    2,
    'Toggle must have exactly one hidden base rule and one smartphone rule'
  );
  assert.equal(
    [...responsiveCss.matchAll(/\.flight-filter-chevron\s*\{/g)].length,
    1,
    'Chevron base styling must exist only in the smartphone media block'
  );
});
