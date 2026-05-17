import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ts = fs.readFileSync('index.ts', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

test('startup user guide waits for loading overlay and camera rotation before opening', () => {
  assert.match(ts, /import\s+\{\s*shouldAutoOpenUserGuide\s*\}\s+from\s+"\.\/tutorialAutoOpen\.js"/);
  assert.match(ts, /loadingOverlayDismissedPromise/);
  assert.match(ts, /Promise\.all\(\[\s*cameraRotationPromise\.catch\(\(\)\s*=>\s*undefined\),\s*loadingOverlayDismissedPromise\s*\]\)/);
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
