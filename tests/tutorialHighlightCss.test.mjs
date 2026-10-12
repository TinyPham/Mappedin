import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cssDeclarations, parseCssRules } from './helpers/cssRules.mjs';

const css = readFileSync(new URL('../main/css/styles.css', import.meta.url), 'utf8');
const rules = parseCssRules(css);

test('tutorial overlay does not blur the highlighted UI behind the popup', () => {
  const modal = cssDeclarations(rules, ['.user-guide-modal']);
  assert.equal(modal['backdrop-filter'], 'none');
  assert.equal(modal['-webkit-backdrop-filter'], 'none');
  assert.equal(modal.background, 'rgba(15, 23, 42, 0.10)');
});

test('tutorial multi-highlight boxes glow without dimming other highlighted targets', () => {
  const highlight = cssDeclarations(rules, ['.user-guide-highlight-box']);
  assert.equal(highlight.position, 'fixed');
  assert.equal(highlight['z-index'], '1');
  assert.equal(highlight.background, 'transparent');
  assert.equal(highlight.border, '4px solid #ffffff');
  assert.equal(highlight['pointer-events'], 'none');
  assert.equal(highlight['box-shadow'], '0 0 0 5px rgba(33, 76, 166, 0.9), 0 0 28px rgba(255, 255, 255, 0.95)');
  assert.doesNotMatch(highlight['box-shadow'], /9999px/, 'Individual boxes must not dim neighboring highlights');
  const modal = cssDeclarations(rules, ['.user-guide-modal']);
  assert.equal(modal.background, 'rgba(15, 23, 42, 0.10)');
  assert.equal(modal['backdrop-filter'], 'none');
  assert.equal(modal['-webkit-backdrop-filter'], 'none');
});

test('tutorial copy card is glass style and image media is hidden by default', () => {
  const card = cssDeclarations(rules, ['.user-guide-copy-card']);
  assert.equal(card.background, 'rgba(255, 255, 255, 0.72)');
  assert.equal(card['backdrop-filter'], 'blur(14px)');
  assert.equal(card['-webkit-backdrop-filter'], 'blur(14px)');
  const media = cssDeclarations(rules, ['.user-guide-media']);
  assert.equal(media.display, 'none');
});

test('tutorial arrow layer draws red curved connector above highlight', () => {
  const arrow = cssDeclarations(rules, ['.user-guide-arrow-layer']);
  assert.equal(arrow['z-index'], '1');
  assert.equal(arrow['pointer-events'], 'none');
  assert.equal(arrow.overflow, 'visible');
  const path = cssDeclarations(rules, ['.user-guide-arrow-path']);
  assert.equal(path.stroke, '#e11d48');
  assert.equal(path['stroke-dasharray'], '12 10');
  assert.equal(path['stroke-width'], '4');
});
