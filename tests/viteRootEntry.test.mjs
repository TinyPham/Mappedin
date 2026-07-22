import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAIN_HTML_PATH,
  createRootEntryRewritePlugin,
  rewriteRootRequestUrl
} from '../src/config/viteRootEntry.mjs';

test('root requests are internally rewritten to the organized main HTML entry', () => {
  assert.equal(MAIN_HTML_PATH, '/main/html/index.html');
  assert.equal(rewriteRootRequestUrl('/'), MAIN_HTML_PATH);
  assert.equal(rewriteRootRequestUrl('/?mode=kiosk&kioskId=LT-KIOSK-01'), `${MAIN_HTML_PATH}?mode=kiosk&kioskId=LT-KIOSK-01`);
});

test('non-root requests and invalid request values remain unchanged', () => {
  assert.equal(rewriteRootRequestUrl('/main/html/admin.html'), '/main/html/admin.html');
  assert.equal(rewriteRootRequestUrl('/vn/map?location=ABC'), '/vn/map?location=ABC');
  assert.equal(rewriteRootRequestUrl(undefined), undefined);
});

test('plugin installs the same rewrite for dev and preview servers', () => {
  const plugin = createRootEntryRewritePlugin();
  assert.equal(plugin.name, 'rewrite-root-to-main-html');

  for (const install of [plugin.configureServer, plugin.configurePreviewServer]) {
    let middleware;
    install({ middlewares: { use: (handler) => { middleware = handler; } } });
    const request = { url: '/?admin=true' };
    let nextCalled = false;
    middleware(request, {}, () => { nextCalled = true; });
    assert.equal(request.url, `${MAIN_HTML_PATH}?admin=true`);
    assert.equal(nextCalled, true);
  }
});
