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
  assert.match(ts, /startupGatePromise/);
  assert.match(ts, /runStartupCameraSequence/);
  assert.match(ts, /_isStartupCameraAnimating/);
  assert.match(ts, /withStartupTimeout/);
  assert.match(ts, /mapView\.Camera\.animateTo\(\{\s*bearing:\s*322\.85,\s*pitch:\s*33\.08,\s*\},\s*\{\s*duration:\s*STARTUP_CAMERA_ROTATION_DURATION_MS\s*\}\)/);
  assert.match(ts, /duration:\s*STARTUP_CAMERA_ZOOM_DURATION_MS/);
  assert.match(ts, /},\s*STARTUP_CAMERA_ZOOM_DELAY_MS\)/);
  assert.match(ts, /Promise\.all\(\[\s*waitForStartupCameraRotation\(cameraRotationResult\),\s*startupCameraSequenceCompletedPromise,\s*loadingOverlayDismissedPromise\s*\]\)/);
  assert.match(ts, /setTimeout\(\(\)\s*=>\s*\{\s*console\.log\("🚀 Mappedin: Startup camera sequence completed\. Popping up User Guide\."\);\s*openUserGuide\(\);\s*\},\s*STARTUP_GUIDE_OPEN_DELAY_MS\)/);
  assert.match(ts, /openUserGuide\(\)/);
});

test('startup camera pauses background streaming work while it animates', () => {
  assert.match(ts, /\(window as any\)\._isStartupCameraAnimating = true/);
  assert.match(ts, /\(window as any\)\._isStartupCameraAnimating = false/);
  assert.match(ts, /if \(\(window as any\)\._isStartupCameraAnimating\) return/);
  assert.match(ts, /while \(\(window as any\)\._isStartupCameraAnimating\)/);
});

test('overview model streaming starts only after startup camera completes', () => {
  assert.match(ts, /const currentFloorType = getFloorType\(mapView\.currentFloor\)/);
  assert.match(ts, /if \(currentFloorId && currentFloorType === "overview"\) \{\s*_loadModelsForFloor\(currentFloorId\);\s*\}/);
  assert.doesNotMatch(ts, /skipStreaming/);
  assert.doesNotMatch(ts, /MAP_INTERACTION_IDLE_MS/);
});

test('startup user guide auto-open has no incognito/private browsing branch', () => {
  assert.doesNotMatch(ts, /incognito|private browsing|webkitRequestFileSystem|indexedDB.*user guide/i);
});

test('PWA install prompt is guarded so it cannot appear on mobile', () => {
  assert.match(html, /function shouldShowPwaInstallPrompt/);
  assert.match(html, /if \(installContainer && shouldShowPwaInstallPrompt\(\)\)/);
  assert.match(html, /window\.addEventListener\('resize', \(\) => \{\s*if \(!shouldShowPwaInstallPrompt\(\) && installContainer\)/);
});
