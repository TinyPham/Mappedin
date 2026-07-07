import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../main/html/index.html', import.meta.url), 'utf8');

function getRuleBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `${selector} rule should exist in index.html styles`);
  return match[1];
}

test('PWA install prompt is a fixed sidebar footer outside scrollable sidebar content', () => {
  const sidebarContentStart = html.indexOf('<div id="sidebar-content"');
  const installStart = html.indexOf('<div id="pwa-install-container"');
  const routePreviewStart = html.indexOf('<div id="route-preview-bar"');

  assert.notEqual(sidebarContentStart, -1, 'sidebar content should exist');
  assert.notEqual(installStart, -1, 'PWA install container should exist');
  assert.notEqual(routePreviewStart, -1, 'route preview bar should exist');

  const sidebarContentBeforeInstall = html.slice(sidebarContentStart, installStart);
  const openDivs = sidebarContentBeforeInstall.match(/<div\b/g)?.length ?? 0;
  const closeDivs = sidebarContentBeforeInstall.match(/<\/div>/g)?.length ?? 0;

  assert.ok(
    openDivs === closeDivs,
    'PWA install prompt should be outside the scrollable sidebar content',
  );
  assert.ok(
    installStart < routePreviewStart,
    'PWA install prompt should remain in the sidebar footer area before route preview',
  );
  assert.match(
    html.slice(installStart, installStart + 180),
    /class="[^"]*sidebar-install-footer[^"]*"/,
    'PWA install prompt should use the sidebar footer layout class',
  );

  const footerRule = getRuleBlock('.sidebar-install-footer');
  assert.match(footerRule, /flex-shrink:\s*0/);
  assert.match(footerRule, /margin-top:\s*auto/);
  assert.match(footerRule, /border-top:\s*1px solid #eee/);
});
