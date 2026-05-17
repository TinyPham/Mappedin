import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('user guide information button exists below flight info and before fullscreen', () => {
  const flightIndex = html.indexOf('id="btn-open-flight-info"');
  const guideIndex = html.indexOf('id="btn-user-guide"');
  const fullscreenIndex = html.indexOf('id="btn-fullscreen"');

  assert.notEqual(flightIndex, -1, 'Missing flight info button');
  assert.notEqual(guideIndex, -1, 'Missing user guide button');
  assert.notEqual(fullscreenIndex, -1, 'Missing fullscreen button');
  assert.ok(flightIndex < guideIndex, 'Guide button should be below flight info');
  assert.ok(guideIndex < fullscreenIndex, 'Guide button should be above fullscreen');
  assert.match(html, /id="btn-user-guide"[^>]+title="Hướng dẫn sử dụng"/);
});

test('user guide modal skeleton contains required controls', () => {
  [
    'user-guide-modal',
    'user-guide-image',
    'user-guide-arrow-layer',
    'user-guide-title',
    'user-guide-description',
    'user-guide-progress',
    'user-guide-back',
    'user-guide-next',
    'user-guide-done',
    'user-guide-close',
    'user-guide-highlight'
  ].forEach(id => {
    assert.match(html, new RegExp(`id="${id}"`), `Missing #${id}`);
  });

  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
});

test('user guide uses compact transparent copy surface and chevron controls', () => {
  assert.match(html, /class="user-guide-copy-card"/);
  assert.match(html, /id="user-guide-back"[^>]*>‹<\/button>/);
  assert.match(html, /id="user-guide-next"[^>]*>›<\/button>/);
  assert.match(html, /markerWidth="8"/);
  assert.match(html, /markerHeight="8"/);
});

test('mobile camera stack keeps user guide directly after flight info', () => {
  assert.match(html, /const mobileButtons = \[btnFlight, btnUserGuide, btnFullscreen, btnZoomIn, btnReset, btnZoomOut\]/);
  assert.match(html, /document\.getElementById\('user-guide-container'\)/);
  assert.match(html, /const btnUserGuide = document\.getElementById\('btn-user-guide'\)/);
});
