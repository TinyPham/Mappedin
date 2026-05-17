import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STARTUP_GUIDE_AFTER_ROTATION_BUFFER_MS,
  STARTUP_CAMERA_ROTATION_DURATION_MS,
  STARTUP_CAMERA_ZOOM_DELAY_MS,
  STARTUP_CAMERA_ZOOM_DURATION_MS,
  STARTUP_GUIDE_OPEN_DELAY_MS,
  USER_GUIDE_AUTO_SHOW_INTERVAL_MS,
  shouldAutoOpenUserGuide,
  shouldShowPwaInstallPrompt,
  waitForStartupCameraRotation
} from '../tutorialAutoOpen.js';

test('user guide auto opens on first browser visit and again after 24 hours', () => {
  const now = 1_800_000_000_000;

  assert.equal(shouldAutoOpenUserGuide(null, now), true);
  assert.equal(shouldAutoOpenUserGuide('', now), true);
  assert.equal(shouldAutoOpenUserGuide(String(now - USER_GUIDE_AUTO_SHOW_INTERVAL_MS + 1000), now), false);
  assert.equal(shouldAutoOpenUserGuide(String(now - USER_GUIDE_AUTO_SHOW_INTERVAL_MS - 1000), now), true);
});

test('user guide auto open is based only on timestamp state, not private browsing detection', () => {
  const source = shouldAutoOpenUserGuide.toString();

  assert.doesNotMatch(source, /incognito|private|indexedDB|webkitRequestFileSystem/i);
});

test('PWA install prompt is allowed on desktop but never shown on mobile', () => {
  assert.equal(shouldShowPwaInstallPrompt({
    innerWidth: 1200,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
  }), true);

  assert.equal(shouldShowPwaInstallPrompt({
    innerWidth: 390,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile Safari/604.1'
  }), false);

  assert.equal(shouldShowPwaInstallPrompt({
    innerWidth: 1024,
    userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537.36'
  }), false);
});

test('startup guide waits a minimum camera rotation duration even when SDK animation is not a promise', async () => {
  const startedAt = Date.now();
  await waitForStartupCameraRotation(undefined, 25);

  assert.ok(Date.now() - startedAt >= 20);
});

test('startup guide constants include explicit camera duration and post-rotation buffer', () => {
  assert.equal(STARTUP_CAMERA_ROTATION_DURATION_MS, 1400);
  assert.equal(STARTUP_CAMERA_ZOOM_DELAY_MS, 1000);
  assert.equal(STARTUP_CAMERA_ZOOM_DURATION_MS, 3000);
  assert.equal(STARTUP_GUIDE_AFTER_ROTATION_BUFFER_MS, 300);
  assert.equal(STARTUP_GUIDE_OPEN_DELAY_MS, 1000);
});
