const KIOSK_ID_PATTERN = /^[A-Z0-9_-]+$/;

export const KIOSK_ADMIN_LIMITS = Object.freeze({
  kioskId: 100,
  displayName: 200,
  description: 500,
  originId: 100,
  latitude: [-90, 90],
  longitude: [-180, 180],
  heading: [0, 360],
  defaultZoom: [1, 30]
});

export class KioskAdminValidationError extends Error {
  constructor(fieldErrors) {
    super('Dữ liệu kiosk chưa hợp lệ.');
    this.name = 'KioskAdminValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class KioskAdminApiError extends Error {
  constructor(status = null) {
    const suffix = Number.isInteger(status) ? ` (HTTP ${status})` : '';
    super(`Không thể hoàn tất yêu cầu quản lý kiosk${suffix}.`);
    this.name = 'KioskAdminApiError';
    this.status = status;
  }
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

export function normalizeKioskDraft(draft = {}) {
  return {
    kioskId: normalizeText(draft.kioskId).toUpperCase(),
    displayName: normalizeText(draft.displayName),
    description: normalizeOptionalText(draft.description),
    originType: draft.originType,
    originMappedinId: normalizeOptionalText(draft.originMappedinId),
    floorId: normalizeOptionalText(draft.floorId),
    latitude: normalizeOptionalNumber(draft.latitude),
    longitude: normalizeOptionalNumber(draft.longitude),
    heading: normalizeOptionalNumber(draft.heading),
    defaultZoom: normalizeOptionalNumber(draft.defaultZoom),
    isActive: draft.isActive === undefined ? true : draft.isActive
  };
}

function validateRequiredText(errors, field, value, maxLength, requiredMessage) {
  if (!value) {
    errors[field] = requiredMessage;
  } else if (value.length > maxLength) {
    errors[field] = `Tối đa ${maxLength} ký tự.`;
  }
}

function validateOptionalText(errors, field, value, maxLength) {
  if (value && value.length > maxLength) errors[field] = `Tối đa ${maxLength} ký tự.`;
}

function validateNumberRange(errors, field, value, minimum, maximum, maximumInclusive = true) {
  if (value === null) return;
  const exceedsMaximum = maximumInclusive ? value > maximum : value >= maximum;
  if (!Number.isFinite(value) || value < minimum || exceedsMaximum) {
    const end = maximumInclusive ? maximum : `${maximum} (không bao gồm)`;
    errors[field] = `Giá trị phải trong khoảng ${minimum} đến ${end}.`;
  }
}

export function validateKioskDraft(draft = {}) {
  const value = normalizeKioskDraft(draft);
  const errors = {};

  if (!value.kioskId) {
    errors.kioskId = 'Mã kiosk là bắt buộc.';
  } else if (!KIOSK_ID_PATTERN.test(value.kioskId)) {
    errors.kioskId = 'Chỉ dùng A-Z, 0-9, dấu gạch ngang và gạch dưới.';
  } else if (value.kioskId.length > KIOSK_ADMIN_LIMITS.kioskId) {
    errors.kioskId = `Tối đa ${KIOSK_ADMIN_LIMITS.kioskId} ký tự.`;
  }

  validateRequiredText(
    errors,
    'displayName',
    value.displayName,
    KIOSK_ADMIN_LIMITS.displayName,
    'Tên hiển thị là bắt buộc.'
  );
  validateOptionalText(errors, 'description', value.description, KIOSK_ADMIN_LIMITS.description);

  if (value.originType !== 'mappedinObject' && value.originType !== 'coordinate') {
    errors.originType = 'Chọn một loại điểm xuất phát.';
  } else if (value.originType === 'mappedinObject') {
    validateRequiredText(
      errors,
      'originMappedinId',
      value.originMappedinId,
      KIOSK_ADMIN_LIMITS.originId,
      'Cần chọn hoặc nhập đối tượng Mappedin.'
    );
  } else {
    validateRequiredText(
      errors,
      'floorId',
      value.floorId,
      KIOSK_ADMIN_LIMITS.originId,
      'Tầng là bắt buộc cho tọa độ.'
    );
    if (value.latitude === null) errors.latitude = 'Vĩ độ là bắt buộc.';
    if (value.longitude === null) errors.longitude = 'Kinh độ là bắt buộc.';
    validateNumberRange(errors, 'latitude', value.latitude, ...KIOSK_ADMIN_LIMITS.latitude);
    validateNumberRange(errors, 'longitude', value.longitude, ...KIOSK_ADMIN_LIMITS.longitude);
  }

  validateNumberRange(errors, 'heading', value.heading, ...KIOSK_ADMIN_LIMITS.heading, false);
  validateNumberRange(errors, 'defaultZoom', value.defaultZoom, ...KIOSK_ADMIN_LIMITS.defaultZoom);
  if (typeof value.isActive !== 'boolean') errors.isActive = 'Trạng thái hoạt động không hợp lệ.';

  return errors;
}

export function buildKioskPayload(draft) {
  const value = normalizeKioskDraft(draft);
  const fieldErrors = validateKioskDraft(value);
  if (Object.keys(fieldErrors).length > 0) throw new KioskAdminValidationError(fieldErrors);

  if (value.originType === 'mappedinObject') {
    value.floorId = null;
    value.latitude = null;
    value.longitude = null;
  } else {
    value.originMappedinId = null;
  }
  return value;
}

export function applyObjectPick(draft, object) {
  const originMappedinId = normalizeOptionalText(object?.mappedinId) || normalizeOptionalText(object?.id);
  if (!originMappedinId) {
    throw new KioskAdminValidationError({ originMappedinId: 'Đối tượng không có mã Mappedin hợp lệ.' });
  }
  return { ...draft, originType: 'mappedinObject', originMappedinId };
}

export function applyCoordinatePick(draft, coordinate, currentFloorId) {
  const floorId = normalizeOptionalText(currentFloorId);
  const latitude = normalizeOptionalNumber(coordinate?.latitude);
  const longitude = normalizeOptionalNumber(coordinate?.longitude);
  const fieldErrors = {};
  if (!floorId) fieldErrors.floorId = 'Không xác định được tầng hiện tại.';
  validateNumberRange(fieldErrors, 'latitude', latitude, ...KIOSK_ADMIN_LIMITS.latitude);
  validateNumberRange(fieldErrors, 'longitude', longitude, ...KIOSK_ADMIN_LIMITS.longitude);
  if (latitude === null) fieldErrors.latitude = 'Không xác định được vĩ độ.';
  if (longitude === null) fieldErrors.longitude = 'Không xác định được kinh độ.';
  if (Object.keys(fieldErrors).length > 0) throw new KioskAdminValidationError(fieldErrors);

  return { ...draft, originType: 'coordinate', floorId, latitude, longitude };
}

const KIOSK_PICK_COLLECTIONS = Object.freeze([
  'markers',
  'spaces',
  'locations',
  'objects',
  'connections',
  'paths',
  'doors',
  'points',
  'elevators',
  'stairways',
  'customObjects',
  'areas',
  'shapes',
  'models',
  'polygons'
]);

function hasMappedinIdentifier(value) {
  return value && typeof value === 'object' && (
    normalizeOptionalText(value.mappedinId) !== null || normalizeOptionalText(value.id) !== null
  );
}

export function resolveKioskPickObject(event, { resolveMarker } = {}) {
  if (!event || typeof event !== 'object') return null;

  for (const collectionName of KIOSK_PICK_COLLECTIONS) {
    const collection = Array.isArray(event[collectionName]) ? event[collectionName] : [];
    for (const item of collection) {
      const candidates = collectionName === 'markers'
        ? [
            typeof resolveMarker === 'function' ? resolveMarker(item) : null,
            item?.target,
            item?.object,
            item?.space,
            item?.location,
            item
          ]
        : [item];
      const match = candidates.find(hasMappedinIdentifier);
      if (match) return match;
    }
  }

  return null;
}

export function createKioskAdminApi({ apiBase, fetch: fetchImpl = globalThis.fetch }) {
  const base = String(apiBase || '').replace(/\/$/, '');

  async function request(path, options = {}) {
    let response;
    try {
      response = await fetchImpl(`${base}/admin/kiosks${path}`, {
        credentials: 'include',
        ...options
      });
    } catch {
      throw new KioskAdminApiError();
    }
    if (!response?.ok) throw new KioskAdminApiError(response?.status ?? null);
    try {
      return await response.json();
    } catch {
      throw new KioskAdminApiError(response.status ?? null);
    }
  }

  function jsonOptions(method, body) {
    return {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    };
  }

  return {
    list: () => request('', { method: 'GET' }),
    get: (kioskId) => request(`/${encodeURIComponent(kioskId)}`, { method: 'GET' }),
    upsert: (kioskId, payload) => request(`/${encodeURIComponent(kioskId)}`, jsonOptions('PUT', payload)),
    setActive: (kioskId, isActive) => request(
      `/${encodeURIComponent(kioskId)}/active`,
      jsonOptions('PATCH', { isActive })
    )
  };
}

export function createKioskAdminController({
  apiBase,
  fetch: fetchImpl = globalThis.fetch,
  document: documentRef = globalThis.document,
  isAuthenticated,
  onAuthRequired,
  onUnauthorized,
  onPickModeChange,
  onPreview,
  onPreviewEnd = () => {}
}) {
  const api = createKioskAdminApi({ apiBase, fetch: fetchImpl });
  let records = [];
  let editingSnapshot = null;
  let pickMode = null;
  let previewActive = false;
  let initialized = false;

  const element = (id) => documentRef?.getElementById(id) ?? null;
  const modal = element('kiosk-admin-modal');
  const pickBar = element('kiosk-pick-bar');
  const pickInstruction = element('kiosk-pick-instruction');
  const previewBar = element('kiosk-preview-bar');

  const show = (target, visible) => target?.classList.toggle('hidden', !visible);
  const setStatus = (message) => {
    const status = element('kiosk-admin-status');
    if (status) status.textContent = message;
  };

  const requireAdmin = () => {
    if (isAuthenticated()) return true;
    onAuthRequired();
    return false;
  };

  const handleError = (error) => {
    if (error instanceof KioskAdminApiError && error.status === 401) {
      onUnauthorized();
      closeKioskAdmin();
      onAuthRequired();
      return 'Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.';
    }
    return error instanceof KioskAdminApiError
      ? error.message
      : 'Không thể hoàn tất thao tác quản lý kiosk.';
  };

  const emptyDraft = () => ({
    kioskId: '',
    displayName: '',
    description: '',
    originType: 'mappedinObject',
    originMappedinId: '',
    floorId: '',
    latitude: '',
    longitude: '',
    heading: 90,
    defaultZoom: 19,
    isActive: true
  });

  const readDraft = () => ({
    kioskId: element('kiosk-id')?.value ?? '',
    displayName: element('kiosk-display-name')?.value ?? '',
    description: element('kiosk-description')?.value ?? '',
    originType: element('kiosk-origin-coordinate')?.checked ? 'coordinate' : 'mappedinObject',
    originMappedinId: element('kiosk-origin-mappedin-id')?.value ?? '',
    floorId: element('kiosk-floor-id')?.value ?? '',
    latitude: element('kiosk-latitude')?.value ?? '',
    longitude: element('kiosk-longitude')?.value ?? '',
    heading: element('kiosk-heading')?.value ?? '',
    defaultZoom: element('kiosk-default-zoom')?.value ?? '',
    isActive: element('kiosk-is-active')?.checked ?? true
  });

  const clearFormErrors = () => {
    documentRef.querySelectorAll('#kiosk-admin-form .kiosk-field-error').forEach((target) => {
      target.textContent = '';
    });
    const alert = element('kiosk-admin-form-error');
    if (alert) alert.textContent = '';
    show(alert, false);
  };

  const showFormErrors = (fieldErrors) => {
    clearFormErrors();
    Object.entries(fieldErrors).forEach(([field, message]) => {
      const target = documentRef.querySelector(`.kiosk-field-error[data-field="${field}"]`);
      if (target) target.textContent = message;
    });
  };

  const updateOriginFields = () => {
    const coordinate = element('kiosk-origin-coordinate')?.checked === true;
    show(element('kiosk-origin-object-fields'), !coordinate);
    show(element('kiosk-origin-coordinate-fields'), coordinate);
  };

  const fillForm = (record, isExisting = false, updateSnapshot = true) => {
    const value = { ...emptyDraft(), ...record };
    const fieldIds = {
      kioskId: 'kiosk-id',
      displayName: 'kiosk-display-name',
      description: 'kiosk-description',
      originMappedinId: 'kiosk-origin-mappedin-id',
      floorId: 'kiosk-floor-id',
      latitude: 'kiosk-latitude',
      longitude: 'kiosk-longitude',
      heading: 'kiosk-heading',
      defaultZoom: 'kiosk-default-zoom'
    };
    Object.entries(fieldIds).forEach(([field, id]) => {
      const input = element(id);
      if (input) input.value = value[field] ?? '';
    });

    const idInput = element('kiosk-id');
    if (idInput) idInput.readOnly = isExisting;
    const mappedinRadio = element('kiosk-origin-mappedin');
    const coordinateRadio = element('kiosk-origin-coordinate');
    if (mappedinRadio) mappedinRadio.checked = value.originType !== 'coordinate';
    if (coordinateRadio) coordinateRadio.checked = value.originType === 'coordinate';
    const activeInput = element('kiosk-is-active');
    if (activeInput) activeInput.checked = value.isActive !== false;

    if (updateSnapshot) editingSnapshot = { ...value };
    clearFormErrors();
    updateOriginFields();
    setStatus(isExisting ? `Đang sửa ${value.kioskId}` : 'Kiosk mới');
  };

  const beginCreateKiosk = () => {
    fillForm(emptyDraft(), false);
    element('kiosk-admin-form-pane')?.scrollTo?.({ top: 0, behavior: 'smooth' });
    element('kiosk-id')?.focus?.();
  };

  const renderKioskAdminList = () => {
    const list = element('kiosk-admin-list');
    if (!list) return;
    list.replaceChildren();
    const query = (element('kiosk-admin-search')?.value ?? '').trim().toLocaleLowerCase('vi');
    const activeOnly = element('kiosk-admin-active-filter')?.value === 'active';
    const visibleRecords = records.filter((kiosk) => {
      const matchesQuery = !query || [kiosk.kioskId, kiosk.displayName]
        .some((value) => String(value ?? '').toLocaleLowerCase('vi').includes(query));
      return matchesQuery && (!activeOnly || kiosk.isActive === true);
    });

    visibleRecords.forEach((kiosk) => {
      const row = documentRef.createElement('tr');
      row.dataset.kioskId = String(kiosk.kioskId ?? '');
      const identityCell = documentRef.createElement('td');
      const name = documentRef.createElement('span');
      name.className = 'kiosk-list-primary';
      name.textContent = String(kiosk.displayName ?? 'Chưa đặt tên');
      const id = documentRef.createElement('span');
      id.className = 'kiosk-list-secondary';
      id.textContent = String(kiosk.kioskId ?? '');
      identityCell.append(name, id);

      const typeCell = documentRef.createElement('td');
      typeCell.textContent = kiosk.originType === 'coordinate' ? 'Tọa độ' : 'Đối tượng';
      const statusCell = documentRef.createElement('td');
      const badge = documentRef.createElement('span');
      badge.className = `kiosk-status-badge${kiosk.isActive ? ' is-active' : ''}`;
      badge.textContent = kiosk.isActive ? 'Bật' : 'Tắt';
      statusCell.appendChild(badge);

      const actionCell = documentRef.createElement('td');
      const actions = documentRef.createElement('div');
      actions.className = 'kiosk-row-actions';
      const editButton = documentRef.createElement('button');
      editButton.type = 'button';
      editButton.className = 'kiosk-button kiosk-button-secondary';
      editButton.textContent = 'Sửa';
      const activeButton = documentRef.createElement('button');
      activeButton.type = 'button';
      activeButton.className = 'kiosk-button kiosk-button-secondary';
      activeButton.textContent = kiosk.isActive ? 'Tắt' : 'Bật';
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        void selectKioskAdmin(String(kiosk.kioskId));
      });
      activeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        void toggleKioskActive(String(kiosk.kioskId), !kiosk.isActive, activeButton);
      });
      actions.append(editButton, activeButton);
      actionCell.appendChild(actions);
      row.append(identityCell, typeCell, statusCell, actionCell);
      row.addEventListener('click', () => void selectKioskAdmin(String(kiosk.kioskId)));
      list.appendChild(row);
    });
    show(element('kiosk-admin-empty'), visibleRecords.length === 0);
  };

  const loadKioskAdminList = async () => {
    if (!requireAdmin()) return;
    show(element('kiosk-admin-loading'), true);
    show(element('kiosk-admin-error'), false);
    try {
      const response = await api.list();
      records = Array.isArray(response) ? response : [];
      renderKioskAdminList();
    } catch (error) {
      const errorElement = element('kiosk-admin-error');
      if (errorElement) errorElement.textContent = handleError(error);
      show(errorElement, true);
    } finally {
      show(element('kiosk-admin-loading'), false);
    }
  };

  const openKioskAdmin = async () => {
    if (!requireAdmin()) return;
    modal?.classList.remove('hidden');
    fillForm(emptyDraft(), false);
    await loadKioskAdminList();
  };

  const selectKioskAdmin = async (kioskId) => {
    if (!requireAdmin()) return;
    clearFormErrors();
    try {
      const record = await api.get(kioskId);
      fillForm(record, true);
      documentRef.querySelectorAll('#kiosk-admin-list tr').forEach((row) => {
        row.classList.toggle('is-selected', row.dataset.kioskId === kioskId);
      });
    } catch (error) {
      const alert = element('kiosk-admin-form-error');
      if (alert) alert.textContent = handleError(error);
      show(alert, true);
    }
  };

  const saveKioskAdmin = async () => {
    if (!requireAdmin()) return;
    clearFormErrors();
    const saveButton = element('kiosk-admin-save');
    const originalSaveLabel = saveButton?.textContent ?? '';
    const originalAriaBusy = saveButton?.getAttribute('aria-busy');
    const wasSaveDisabled = saveButton?.getAttribute('disabled') !== null;
    saveButton?.setAttribute('disabled', 'true');
    saveButton?.setAttribute('aria-busy', 'true');
    if (saveButton) saveButton.textContent = 'Đang lưu...';
    try {
      const payload = buildKioskPayload(readDraft());
      const saved = await api.upsert(payload.kioskId, payload);
      fillForm(saved, true);
      setStatus('Đã lưu cấu hình');
      await loadKioskAdminList();
    } catch (error) {
      if (error instanceof KioskAdminValidationError) {
        showFormErrors(error.fieldErrors);
      } else {
        const alert = element('kiosk-admin-form-error');
        if (alert) alert.textContent = handleError(error);
        show(alert, true);
      }
    } finally {
      if (saveButton) {
        saveButton.textContent = originalSaveLabel;
        if (originalAriaBusy === null) saveButton.removeAttribute('aria-busy');
        else saveButton.setAttribute('aria-busy', originalAriaBusy);
        if (wasSaveDisabled) saveButton.setAttribute('disabled', 'true');
        else saveButton.removeAttribute('disabled');
      }
    }
  };

  const toggleKioskActive = async (kioskId, isActive, button) => {
    if (!requireAdmin()) return;
    button?.setAttribute('disabled', 'true');
    try {
      await api.setActive(kioskId, isActive);
      setStatus(isActive ? 'Đã bật kiosk' : 'Đã tắt kiosk');
      await loadKioskAdminList();
    } catch (error) {
      const errorElement = element('kiosk-admin-error');
      if (errorElement) errorElement.textContent = handleError(error);
      show(errorElement, true);
    } finally {
      button?.removeAttribute('disabled');
    }
  };

  function closeKioskAdmin() {
    if (previewActive) endPreview(false);
    pickMode = null;
    onPickModeChange(null);
    modal?.classList.add('hidden');
    pickBar?.classList.add('hidden');
  }

  const endPreview = (reopenAdmin = true) => {
    if (!previewActive) return;
    previewActive = false;
    show(previewBar, false);
    try {
      onPreviewEnd();
    } finally {
      if (reopenAdmin && isAuthenticated()) modal?.classList.remove('hidden');
      else if (reopenAdmin) onAuthRequired();
    }
  };

  const beginPick = (mode) => {
    if (!requireAdmin()) return;
    pickMode = mode;
    onPickModeChange(mode);
    modal?.classList.add('hidden');
    pickBar?.classList.remove('hidden');
    if (pickInstruction) {
      pickInstruction.textContent = mode === 'object'
        ? 'Chọn một đối tượng trên bản đồ. Nhấn Esc để hủy.'
        : 'Chọn một tọa độ trên bản đồ. Nhấn Esc để hủy.';
    }
  };

  const cancelPick = () => {
    if (!pickMode) return;
    pickMode = null;
    onPickModeChange(null);
    pickBar?.classList.add('hidden');
    if (isAuthenticated()) modal?.classList.remove('hidden');
  };

  const finishPick = (draft) => {
    const isExisting = element('kiosk-id')?.readOnly === true;
    pickMode = null;
    onPickModeChange(null);
    pickBar?.classList.add('hidden');
    modal?.classList.remove('hidden');
    fillForm(draft, isExisting, false);
    setStatus('Đã nhận vị trí từ bản đồ');
  };

  const showPickError = (error) => {
    const message = error instanceof KioskAdminValidationError
      ? Object.values(error.fieldErrors)[0]
      : 'Không thể nhận vị trí từ lần chọn này.';
    if (pickInstruction) pickInstruction.textContent = String(message);
  };

  const acceptObjectPick = (object) => {
    try {
      finishPick(applyObjectPick(readDraft(), object));
    } catch (error) {
      showPickError(error);
    }
  };

  const acceptCoordinatePick = (coordinate, floorId) => {
    try {
      finishPick(applyCoordinatePick(readDraft(), coordinate, floorId));
    } catch (error) {
      showPickError(error);
    }
  };

  const previewKioskRoute = () => {
    if (!requireAdmin()) return;
    clearFormErrors();
    try {
      const payload = buildKioskPayload(readDraft());
      onPreview(payload);
      previewActive = true;
      modal?.classList.add('hidden');
      show(previewBar, true);
    } catch (error) {
      if (error instanceof KioskAdminValidationError) {
        showFormErrors(error.fieldErrors);
      } else {
        const alert = element('kiosk-admin-form-error');
        if (alert) alert.textContent = handleError(error);
        show(alert, true);
      }
    }
  };

  const init = () => {
    if (initialized) return;
    initialized = true;
    element('btn-open-kiosk-admin')?.addEventListener('click', () => void openKioskAdmin());
    element('kiosk-admin-close')?.addEventListener('click', closeKioskAdmin);
    element('kiosk-admin-refresh')?.addEventListener('click', () => void loadKioskAdminList());
    element('kiosk-admin-create')?.addEventListener('click', beginCreateKiosk);
    element('kiosk-admin-search')?.addEventListener('input', renderKioskAdminList);
    element('kiosk-admin-active-filter')?.addEventListener('change', renderKioskAdminList);
    element('kiosk-origin-mappedin')?.addEventListener('change', updateOriginFields);
    element('kiosk-origin-coordinate')?.addEventListener('change', updateOriginFields);
    element('kiosk-pick-object')?.addEventListener('click', () => beginPick('object'));
    element('kiosk-pick-coordinate')?.addEventListener('click', () => beginPick('coordinate'));
    element('kiosk-pick-cancel')?.addEventListener('click', cancelPick);
    element('kiosk-admin-preview')?.addEventListener('click', previewKioskRoute);
    element('kiosk-preview-return')?.addEventListener('click', () => endPreview(true));
    element('kiosk-admin-reset')?.addEventListener('click', () => {
      fillForm(editingSnapshot || emptyDraft(), Boolean(editingSnapshot?.kioskId));
    });
    element('kiosk-admin-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      void saveKioskAdmin();
    });
    modal?.addEventListener('click', (event) => {
      if (event.target === modal) closeKioskAdmin();
    });
    documentRef.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (pickMode) cancelPick();
      else if (previewActive) endPreview(true);
      else if (!modal?.classList.contains('hidden')) closeKioskAdmin();
    });
  };

  return {
    init,
    open: openKioskAdmin,
    cancelPick,
    acceptObjectPick,
    acceptCoordinatePick
  };
}
