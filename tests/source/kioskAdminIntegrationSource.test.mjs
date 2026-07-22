import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../../main/html/index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../../main/main-function/index.ts', import.meta.url), 'utf8');
const moduleSource = readFileSync(new URL('../../src/kiosk/kioskAdmin.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../../main/css/styles.css', import.meta.url), 'utf8');

const requiredIds = [
  'btn-open-kiosk-admin', 'kiosk-admin-modal', 'kiosk-admin-close',
  'kiosk-admin-search', 'kiosk-admin-active-filter', 'kiosk-admin-refresh',
  'kiosk-admin-create', 'kiosk-admin-list', 'kiosk-admin-loading',
  'kiosk-admin-empty', 'kiosk-admin-error', 'kiosk-admin-status',
  'kiosk-admin-form', 'kiosk-id', 'kiosk-display-name', 'kiosk-description',
  'kiosk-origin-mappedin', 'kiosk-origin-coordinate', 'kiosk-origin-mappedin-id',
  'kiosk-floor-id', 'kiosk-latitude', 'kiosk-longitude', 'kiosk-heading',
  'kiosk-default-zoom', 'kiosk-is-active', 'kiosk-pick-object',
  'kiosk-pick-coordinate', 'kiosk-admin-save', 'kiosk-admin-reset',
  'kiosk-admin-preview', 'kiosk-pick-bar', 'kiosk-pick-cancel',
  'kiosk-preview-bar', 'kiosk-preview-return'
];

test('main map HTML contains the complete kiosk admin controls', () => {
  for (const id of requiredIds) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
  }
  assert.match(html, /Quản lý kiosk/);
  assert.match(html, /Chọn đối tượng trên bản đồ/);
  assert.match(html, /Chọn tọa độ trên bản đồ/);
});

test('kiosk modal has dedicated restrained responsive styling', () => {
  assert.match(styles, /\.kiosk-admin-shell\s*\{[\s\S]*border-radius:\s*(?:[0-8])px/);
  assert.match(styles, /\.kiosk-admin-layout\s*\{[\s\S]*grid-template-columns/);
  assert.match(styles, /@media\s*\(max-width:[\s\S]*\.kiosk-admin-layout/);
  assert.doesNotMatch(html, /kiosk-admin-shell[\s\S]{0,500}class=["'][^"']*card/);
});

test('integration delegates kiosk DOM and CRUD orchestration to the kiosk admin controller', () => {
  assert.match(source, /createKioskAdminController[\s\S]*from\s+["']\.\.\/\.\.\/src\/kiosk\/kioskAdmin\.js["']/);
  assert.match(source, /const kioskAdmin\s*=\s*createKioskAdminController\(/);
  assert.match(source, /isAuthenticated:\s*\(\)\s*=>\s*isAdminAuthenticated/);
  assert.match(source, /onUnauthorized:[\s\S]{0,200}setAdminAuthenticated\(false\)/);
  assert.doesNotMatch(source, /const renderKioskAdminList/);
  assert.match(moduleSource, /const renderKioskAdminList/);
});

test('controller gates open, list, save and toggle on admin auth', () => {
  for (const operation of ['openKioskAdmin', 'loadKioskAdminList', 'saveKioskAdmin', 'toggleKioskActive']) {
    const start = moduleSource.indexOf(`const ${operation}`);
    assert.notEqual(start, -1, `missing ${operation}`);
    assert.match(moduleSource.slice(start, start + 800), /requireAdmin\(\)|isAuthenticated\(\)/);
  }
  assert.match(moduleSource, /error\.status\s*===\s*401[\s\S]*onUnauthorized\(\)[\s\S]*onAuthRequired\(\)/);
});

test('view-only style hides the kiosk button and modal', () => {
  assert.match(source, /#btn-open-kiosk-admin/);
  assert.match(source, /#kiosk-admin-modal/);
  assert.match(source, /#kiosk-preview-bar/);
});

test('map click intercepts kiosk pick mode before normal click behavior', () => {
  const handlerStart = source.indexOf('mapView.on("click", async (event: any) =>');
  const placementStart = source.indexOf('HANDLE MULTI-MODEL PLACEMENT', handlerStart);
  const interception = source.indexOf('if (kioskPickMode)', handlerStart);
  assert.ok(handlerStart >= 0 && interception > handlerStart && interception < placementStart);
  const block = source.slice(interception, interception + 1800);
  assert.match(block, /event\.coordinate/);
  assert.match(block, /mapView\.currentFloor\?\.id/);
  assert.match(source, /resolveKioskPickObject[\s\S]*from\s+["']\.\.\/\.\.\/src\/kiosk\/kioskAdmin\.js["']/);
  assert.doesNotMatch(source, /const resolveKioskPickObject\s*=/);
  assert.match(block, /resolveKioskPickObject\(event,\s*\{[\s\S]*resolveMarker:/);
  assert.match(block, /kioskAdmin\.acceptObjectPick/);
  assert.match(block, /kioskAdmin\.acceptCoordinatePick/);
  assert.match(block, /return/);
});

test('preview validates in the controller, then adapter sets temporary wayfinding state', () => {
  const controllerStart = moduleSource.indexOf('const previewKioskRoute');
  assert.notEqual(controllerStart, -1);
  assert.match(moduleSource.slice(controllerStart, controllerStart + 1200), /buildKioskPayload/);
  assert.match(moduleSource.slice(controllerStart, controllerStart + 1200), /onPreview\(payload\)/);

  const start = source.indexOf('onPreview:');
  assert.notEqual(start, -1);
  const block = source.slice(start, start + 1600);
  assert.match(block, /wayfindingOrigin\s*=/);
  assert.match(block, /wayfindingDestination\s*=\s*null/);
  assert.match(block, /wayfindingStopovers\s*=\s*\[\]/);
  assert.match(block, /switchTab\(['"]directions['"]\)/);
  assert.match(block, /startSelectingNode\(['"]destination['"]\)/);
  assert.doesNotMatch(block, /\.upsert\(/);
});

test('preview can return to the draft and restore prior wayfinding state', () => {
  assert.match(moduleSource, /kiosk-preview-return[\s\S]*addEventListener\(['"]click['"]/);
  assert.match(moduleSource, /onPreviewEnd\(\)/);

  const start = source.indexOf('onPreview:');
  const block = source.slice(start, start + 3200);
  assert.match(block, /kioskPreviewSnapshot\s*=/);
  assert.match(block, /onPreviewEnd:/);
  assert.match(block, /wayfindingOrigin\s*=\s*snapshot\.origin/);
  assert.match(block, /wayfindingDestination\s*=\s*snapshot\.destination/);
  assert.match(block, /wayfindingStopovers\s*=\s*\[\.\.\.snapshot\.stopovers\]/);
  assert.match(block, /drawNavigation\(\)/);
});

test('database kiosk values are rendered with textContent and never raw innerHTML', () => {
  assert.doesNotMatch(moduleSource, /innerHTML/);
  const renderStart = moduleSource.indexOf('const renderKioskAdminList');
  assert.notEqual(renderStart, -1);
  const renderBlock = moduleSource.slice(renderStart, renderStart + 3200);
  assert.match(renderBlock, /textContent/);
  assert.doesNotMatch(renderBlock, /innerHTML\s*=.*kiosk/);
});

test('API implementation always includes browser credentials', () => {
  assert.match(moduleSource, /credentials:\s*['"]include['"]/);
});
