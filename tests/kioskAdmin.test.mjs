import assert from 'node:assert/strict';
import test from 'node:test';

import {
  KioskAdminApiError,
  KioskAdminValidationError,
  applyCoordinatePick,
  applyObjectPick,
  buildKioskPayload,
  createKioskAdminApi,
  createKioskAdminController,
  normalizeKioskDraft,
  resolveKioskPickObject,
  validateKioskDraft
} from '../src/kiosk/kioskAdmin.js';

const mappedinDraft = {
  kioskId: ' lt-kiosk_01 ',
  displayName: '  Sảnh chính  ',
  description: '  Kiosk cạnh cửa vào  ',
  originType: 'mappedinObject',
  originMappedinId: '  mappedin-object-1  ',
  floorId: 'floor-ignored',
  latitude: '10.75',
  longitude: '106.67',
  heading: '0',
  defaultZoom: '19',
  isActive: true
};

test('normalizeKioskDraft trims text, uppercases kioskId and preserves numeric zero', () => {
  assert.deepEqual(normalizeKioskDraft({
    ...mappedinDraft,
    description: '   ',
    heading: 0,
    defaultZoom: ''
  }), {
    kioskId: 'LT-KIOSK_01',
    displayName: 'Sảnh chính',
    description: null,
    originType: 'mappedinObject',
    originMappedinId: 'mappedin-object-1',
    floorId: 'floor-ignored',
    latitude: 10.75,
    longitude: 106.67,
    heading: 0,
    defaultZoom: null,
    isActive: true
  });
});

test('buildKioskPayload matches mappedinObject contract and nulls coordinate fields', () => {
  assert.deepEqual(buildKioskPayload(mappedinDraft), {
    kioskId: 'LT-KIOSK_01',
    displayName: 'Sảnh chính',
    description: 'Kiosk cạnh cửa vào',
    originType: 'mappedinObject',
    originMappedinId: 'mappedin-object-1',
    floorId: null,
    latitude: null,
    longitude: null,
    heading: 0,
    defaultZoom: 19,
    isActive: true
  });
});

test('buildKioskPayload matches coordinate contract, accepts zero and nulls object ID', () => {
  assert.deepEqual(buildKioskPayload({
    kioskId: 'gate-0',
    displayName: 'Gate zero',
    description: '',
    originType: 'coordinate',
    originMappedinId: 'ignored',
    floorId: ' floor-1 ',
    latitude: '0',
    longitude: 0,
    heading: '',
    defaultZoom: null,
    isActive: false
  }), {
    kioskId: 'GATE-0',
    displayName: 'Gate zero',
    description: null,
    originType: 'coordinate',
    originMappedinId: null,
    floorId: 'floor-1',
    latitude: 0,
    longitude: 0,
    heading: null,
    defaultZoom: null,
    isActive: false
  });
});

test('validateKioskDraft mirrors backend lengths, ranges and origin requirements', () => {
  const errors = validateKioskDraft({
    kioskId: `bad id${'X'.repeat(100)}`,
    displayName: 'N'.repeat(201),
    description: 'D'.repeat(501),
    originType: 'coordinate',
    floorId: '',
    latitude: -91,
    longitude: 181,
    heading: 360,
    defaultZoom: 31,
    isActive: 'yes'
  });

  assert.deepEqual(Object.keys(errors).sort(), [
    'defaultZoom', 'description', 'displayName', 'floorId', 'heading',
    'isActive', 'kioskId', 'latitude', 'longitude'
  ]);
  assert.equal(errors.kioskId.includes('A-Z'), true);
});

test('buildKioskPayload throws field-addressable validation errors', () => {
  assert.throws(
    () => buildKioskPayload({ ...mappedinDraft, originMappedinId: '' }),
    (error) => error instanceof KioskAdminValidationError &&
      typeof error.fieldErrors.originMappedinId === 'string'
  );
});

test('applyObjectPick uses mappedinId first, falls back to id and switches origin type', () => {
  assert.deepEqual(
    applyObjectPick({ floorId: 'keep-until-payload' }, { mappedinId: 'MAPPEDIN-1', id: 'fallback' }),
    { floorId: 'keep-until-payload', originType: 'mappedinObject', originMappedinId: 'MAPPEDIN-1' }
  );
  assert.equal(applyObjectPick({}, { id: 'object-2' }).originMappedinId, 'object-2');
  assert.throws(() => applyObjectPick({}, {}), KioskAdminValidationError);
});

test('applyCoordinatePick captures current floor and event coordinate including zero', () => {
  assert.deepEqual(
    applyCoordinatePick({ originMappedinId: 'old' }, { latitude: 0, longitude: 106.5 }, 'floor-current'),
    {
      originMappedinId: 'old',
      originType: 'coordinate',
      floorId: 'floor-current',
      latitude: 0,
      longitude: 106.5
    }
  );
  assert.throws(() => applyCoordinatePick({}, { latitude: NaN, longitude: 10 }, 'floor-1'), KioskAdminValidationError);
  assert.throws(() => applyCoordinatePick({}, { latitude: 10, longitude: 10 }, ''), KioskAdminValidationError);
});

for (const collection of [
  'markers', 'spaces', 'locations', 'objects', 'connections', 'paths',
  'doors', 'points', 'elevators', 'stairways', 'customObjects', 'areas',
  'shapes', 'models', 'polygons'
]) {
  test(`resolveKioskPickObject finds the first identified object in ${collection}`, () => {
    const expected = { mappedinId: `${collection}-mappedin` };
    assert.equal(resolveKioskPickObject({ [collection]: [{ name: 'skip' }, expected] }), expected);
  });
}

test('resolveKioskPickObject resolves marker lookup and nested marker targets before marker id', () => {
  const lookedUp = { id: 'mapped-object' };
  const marker = { id: 'visual-marker', target: { id: 'nested-target' } };
  assert.equal(resolveKioskPickObject(
    { markers: [marker] },
    { resolveMarker: (value) => value === marker ? lookedUp : null }
  ), lookedUp);
  assert.deepEqual(resolveKioskPickObject({ markers: [{ target: { id: 'target' } }] }), { id: 'target' });
});

test('resolveKioskPickObject returns null when no collection has an identified object', () => {
  assert.equal(resolveKioskPickObject({ spaces: [{}], doors: [{ name: 'Door' }] }), null);
  assert.equal(resolveKioskPickObject(null), null);
});

test('admin API uses four routes, encoded IDs, JSON and credentials include', async () => {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push([url, options]);
    return { ok: true, status: 200, json: async () => url.endsWith('/active') ? { success: true } : [] };
  };
  const api = createKioskAdminApi({ apiBase: '/api/', fetch });
  const payload = buildKioskPayload(mappedinDraft);

  await api.list();
  await api.get('A/B ?');
  await api.upsert(payload.kioskId, payload);
  await api.setActive('A/B ?', false);

  assert.equal(calls[0][0], '/api/admin/kiosks');
  assert.equal(calls[0][1].method, 'GET');
  assert.equal(calls[1][0], '/api/admin/kiosks/A%2FB%20%3F');
  assert.equal(calls[2][1].method, 'PUT');
  assert.equal(calls[2][1].headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[2][1].body), payload);
  assert.equal(calls[3][0], '/api/admin/kiosks/A%2FB%20%3F/active');
  assert.equal(calls[3][1].method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[3][1].body), { isActive: false });
  for (const [, options] of calls) assert.equal(options.credentials, 'include');
});

test('admin API exposes generic errors with status but never response secrets', async () => {
  const api = createKioskAdminApi({
    apiBase: '/api',
    fetch: async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: 'SQL password and private table detail' })
    })
  });

  await assert.rejects(api.list(), (error) => {
    assert.equal(error instanceof KioskAdminApiError, true);
    assert.equal(error.status, 503);
    assert.equal(error.message, 'Không thể hoàn tất yêu cầu quản lý kiosk (HTTP 503).');
    assert.equal(error.message.includes('SQL password'), false);
    return true;
  });
});

function createControllerDocument() {
  class FakeElement {
    constructor(id = '') {
      this.id = id;
      this.value = '';
      this.checked = false;
      this.readOnly = false;
      this.textContent = '';
      this.dataset = {};
      this.listeners = {};
      this.attributes = new Map();
      this.children = [];
      const classes = new Set(['hidden']);
      this.classList = {
        add: (...values) => values.forEach((value) => classes.add(value)),
        remove: (...values) => values.forEach((value) => classes.delete(value)),
        contains: (value) => classes.has(value),
        toggle: (value, force) => force === undefined
          ? (classes.has(value) ? (classes.delete(value), false) : (classes.add(value), true))
          : (force ? classes.add(value) : classes.delete(value), force)
      };
    }
    addEventListener(type, listener) { this.listeners[type] = listener; }
    focus() { this.focused = true; }
    scrollTo(options) { this.scrollOptions = options; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    removeAttribute(name) { this.attributes.delete(name); }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); return child; }
    replaceChildren(...children) { this.children = children; }
  }

  const ids = [
    'kiosk-admin-modal', 'kiosk-pick-bar', 'kiosk-pick-instruction',
    'kiosk-admin-status', 'kiosk-admin-form-error', 'kiosk-id',
    'kiosk-display-name', 'kiosk-description', 'kiosk-origin-coordinate',
    'kiosk-origin-mappedin', 'kiosk-origin-mappedin-id', 'kiosk-floor-id',
    'kiosk-latitude', 'kiosk-longitude', 'kiosk-heading', 'kiosk-default-zoom',
    'kiosk-is-active', 'kiosk-origin-object-fields', 'kiosk-origin-coordinate-fields',
    'kiosk-admin-list', 'kiosk-admin-search', 'kiosk-admin-active-filter',
    'kiosk-admin-empty', 'kiosk-admin-loading', 'kiosk-admin-error',
    'kiosk-admin-save', 'btn-open-kiosk-admin', 'kiosk-admin-close',
    'kiosk-admin-refresh', 'kiosk-admin-create', 'kiosk-pick-object',
    'kiosk-pick-coordinate', 'kiosk-pick-cancel', 'kiosk-admin-preview',
    'kiosk-admin-reset', 'kiosk-admin-form', 'kiosk-admin-form-pane',
    'kiosk-preview-bar', 'kiosk-preview-return'
  ];
  const elements = new Map(ids.map((id) => [id, new FakeElement(id)]));
  const document = {
    getElementById: (id) => elements.get(id) ?? null,
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => new FakeElement(),
    addEventListener() {}
  };
  return { document, elements };
}

test('create kiosk action resets the draft, reveals the form start and focuses kiosk ID', () => {
  const { document, elements } = createControllerDocument();
  const idInput = elements.get('kiosk-id');
  idInput.value = 'OLD-KIOSK';
  idInput.readOnly = true;
  elements.get('kiosk-display-name').value = 'Old kiosk';

  const controller = createKioskAdminController({
    apiBase: '/api', document,
    isAuthenticated: () => true,
    onAuthRequired() {}, onUnauthorized() {}, onPickModeChange() {}, onPreview() {},
    fetch: async () => ({ ok: true, status: 200, json: async () => [] })
  });
  controller.init();
  elements.get('kiosk-admin-create').listeners.click();

  assert.equal(idInput.value, '');
  assert.equal(idInput.readOnly, false);
  assert.equal(elements.get('kiosk-heading').value, 90);
  assert.equal(elements.get('kiosk-default-zoom').value, 19);
  assert.equal(idInput.focused, true);
  assert.deepEqual(elements.get('kiosk-admin-form-pane').scrollOptions, {
    top: 0,
    behavior: 'smooth'
  });
  assert.equal(elements.get('kiosk-admin-status').textContent, 'Kiosk mới');
});

test('preview return keeps the unsaved draft and reopens kiosk management', () => {
  const { document, elements } = createControllerDocument();
  const previewPayloads = [];
  let previewEndCount = 0;
  const controller = createKioskAdminController({
    apiBase: '/api', document,
    isAuthenticated: () => true,
    onAuthRequired() {}, onUnauthorized() {}, onPickModeChange() {},
    onPreview(payload) { previewPayloads.push(payload); },
    onPreviewEnd() { previewEndCount += 1; },
    fetch: async () => ({ ok: true, status: 200, json: async () => [] })
  });
  controller.init();

  elements.get('kiosk-admin-modal').classList.remove('hidden');
  elements.get('kiosk-id').value = 'LT-KIOSK-01';
  elements.get('kiosk-display-name').value = 'Kiosk sanh chinh';
  elements.get('kiosk-description').value = 'Ban nhap chua luu';
  elements.get('kiosk-origin-mappedin').checked = true;
  elements.get('kiosk-origin-mappedin-id').value = 'OBJECT-01';
  elements.get('kiosk-heading').value = '120';
  elements.get('kiosk-default-zoom').value = '20';
  elements.get('kiosk-is-active').checked = true;

  elements.get('kiosk-admin-preview').listeners.click();

  assert.equal(previewPayloads.length, 1);
  assert.equal(elements.get('kiosk-admin-modal').classList.contains('hidden'), true);
  assert.equal(elements.get('kiosk-preview-bar').classList.contains('hidden'), false);

  elements.get('kiosk-preview-return').listeners.click();

  assert.equal(previewEndCount, 1);
  assert.equal(elements.get('kiosk-preview-bar').classList.contains('hidden'), true);
  assert.equal(elements.get('kiosk-admin-modal').classList.contains('hidden'), false);
  assert.equal(elements.get('kiosk-id').value, 'LT-KIOSK-01');
  assert.equal(elements.get('kiosk-description').value, 'Ban nhap chua luu');
  assert.equal(elements.get('kiosk-heading').value, '120');
  assert.equal(elements.get('kiosk-default-zoom').value, '20');
});

test('controller marks save busy and restores the exact label and aria state after success', async () => {
  const { document, elements } = createControllerDocument();
  elements.get('kiosk-id').value = 'KIOSK-1';
  elements.get('kiosk-display-name').value = 'Kiosk 1';
  elements.get('kiosk-origin-mappedin-id').value = 'OBJECT-1';
  elements.get('kiosk-is-active').checked = true;
  const saveButton = elements.get('kiosk-admin-save');
  saveButton.textContent = 'Lưu cấu hình';
  saveButton.setAttribute('aria-busy', 'false');

  let resolvePut;
  const controller = createKioskAdminController({
    apiBase: '/api',
    document,
    isAuthenticated: () => true,
    onAuthRequired() {},
    onUnauthorized() {},
    onPickModeChange() {},
    onPreview() {},
    fetch: async (_url, options) => {
      if (options.method === 'PUT') {
        return new Promise((resolve) => { resolvePut = resolve; });
      }
      return { ok: true, status: 200, json: async () => [] };
    }
  });
  controller.init();
  elements.get('kiosk-admin-form').listeners.submit({ preventDefault() {} });

  assert.equal(saveButton.getAttribute('disabled'), 'true');
  assert.equal(saveButton.getAttribute('aria-busy'), 'true');
  assert.equal(saveButton.textContent, 'Đang lưu...');

  resolvePut({
    ok: true,
    status: 200,
    json: async () => buildKioskPayload({
      kioskId: 'KIOSK-1', displayName: 'Kiosk 1', originType: 'mappedinObject',
      originMappedinId: 'OBJECT-1', isActive: true
    })
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(saveButton.getAttribute('disabled'), null);
  assert.equal(saveButton.getAttribute('aria-busy'), 'false');
  assert.equal(saveButton.textContent, 'Lưu cấu hình');
});

test('controller restores save state and keeps a generic inline error after request failure', async () => {
  const { document, elements } = createControllerDocument();
  elements.get('kiosk-id').value = 'KIOSK-2';
  elements.get('kiosk-display-name').value = 'Kiosk 2';
  elements.get('kiosk-origin-mappedin-id').value = 'OBJECT-2';
  elements.get('kiosk-is-active').checked = true;
  const saveButton = elements.get('kiosk-admin-save');
  saveButton.textContent = 'Lưu';

  const controller = createKioskAdminController({
    apiBase: '/api', document,
    isAuthenticated: () => true,
    onAuthRequired() {}, onUnauthorized() {}, onPickModeChange() {}, onPreview() {},
    fetch: async () => ({ ok: false, status: 500, json: async () => ({ error: 'private' }) })
  });
  controller.init();
  elements.get('kiosk-admin-form').listeners.submit({ preventDefault() {} });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(saveButton.getAttribute('disabled'), null);
  assert.equal(saveButton.getAttribute('aria-busy'), null);
  assert.equal(saveButton.textContent, 'Lưu');
  assert.match(elements.get('kiosk-admin-form-error').textContent, /HTTP 500/);
  assert.equal(elements.get('kiosk-admin-form-error').textContent.includes('private'), false);
});
