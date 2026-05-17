import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ts = fs.readFileSync('index.ts', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

test('startup user guide waits for loading overlay and camera rotation before opening', () => {
  assert.match(ts, /shouldAutoOpenUserGuide/);
  assert.match(ts, /waitForStartupCameraRotation/);
  assert.match(ts, /STARTUP_CAMERA_ROTATION_DURATION_MS/);
  assert.match(ts, /STARTUP_CAMERA_ZOOM_DELAY_MS/);
  assert.match(ts, /STARTUP_CAMERA_ZOOM_DURATION_MS/);
  assert.match(ts, /STARTUP_GUIDE_OPEN_DELAY_MS/);
  assert.match(ts, /loadingOverlayDismissedPromise/);
  assert.match(ts, /startupCameraSequenceCompletedPromise/);
  assert.match(ts, /mapView\.Camera\.animateTo\(\{\s*bearing:\s*mapView\.Camera\.bearing - 36\.7,\s*\},\s*\{\s*duration:\s*STARTUP_CAMERA_ROTATION_DURATION_MS\s*\}\)/);
  assert.match(ts, /duration:\s*STARTUP_CAMERA_ZOOM_DURATION_MS/);
  assert.match(ts, /},\s*STARTUP_CAMERA_ZOOM_DELAY_MS\)/);
  assert.match(ts, /Promise\.all\(\[\s*waitForStartupCameraRotation\(cameraRotationResult\),\s*startupCameraSequenceCompletedPromise,\s*loadingOverlayDismissedPromise\s*\]\)/);
  assert.match(ts, /setTimeout\(\(\)\s*=>\s*\{\s*console\.log\("🚀 Mappedin: Startup camera sequence completed\. Popping up User Guide\."\);\s*openUserGuide\(\);\s*\},\s*STARTUP_GUIDE_OPEN_DELAY_MS\)/);
  assert.match(ts, /openUserGuide\(\)/);
});

test('startup user guide auto-open has no incognito/private browsing branch', () => {
  assert.doesNotMatch(ts, /incognito|private browsing|webkitRequestFileSystem|indexedDB.*user guide/i);
});

test('PWA install prompt is guarded so it cannot appear on mobile', () => {
  assert.match(html, /function shouldShowPwaInstallPrompt/);
  assert.match(html, /if \(installContainer && shouldShowPwaInstallPrompt\(\)\)/);
  assert.match(html, /window\.addEventListener\('resize', \(\) => \{\s*if \(!shouldShowPwaInstallPrompt\(\) && installContainer\)/);
});
