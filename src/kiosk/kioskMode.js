const KIOSK_ID_PATTERN = /^[A-Z0-9_-]+$/;
const KIOSK_ID_MAX_LENGTH = 100;
const STICKY_URL_KEYS = ['mode', 'kioskId', 'admin', 'debug', 'lang', 'delay', 'sync'];
const NULLABLE_KIOSK_CONFIG_FIELDS = [
  'description',
  'originMappedinId',
  'floorId',
  'latitude',
  'longitude',
  'heading',
  'defaultZoom'
];

function getSearchParams(value) {
  if (value instanceof URLSearchParams) return value;
  if (value instanceof URL) return value.searchParams;
  if (typeof value !== 'string') {
    throw new TypeError('Expected a URL, URL string, or URL search string');
  }

  const hasUrlScheme = /^[A-Za-z][A-Za-z\d+.-]*:/.test(value);
  const isBareSearch = value.includes('=') && !hasUrlScheme && !value.startsWith('/') && !value.startsWith('?');
  const input = isBareSearch ? `?${value}` : value;
  return new URL(input, 'https://kiosk.local').searchParams;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalNumberInRange(value, minimum, maximum, maximumInclusive = true) {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  return value >= minimum && (maximumInclusive ? value <= maximum : value < maximum);
}

function isNullableString(value) {
  return value === null || typeof value === 'string';
}

function isNullableFiniteNumber(value) {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

export function normalizeKioskId(value) {
  if (typeof value !== 'string') return null;

  const kioskId = value.trim().toUpperCase();
  if (!kioskId || kioskId.length > KIOSK_ID_MAX_LENGTH || !KIOSK_ID_PATTERN.test(kioskId)) {
    return null;
  }

  return kioskId;
}

export function parseKioskModeFromUrl(url) {
  const params = getSearchParams(url);
  if (params.get('mode') !== 'kiosk') {
    return { status: 'website', isKioskMode: false, kioskId: null, error: null };
  }

  const kioskIdValue = params.get('kioskId');
  if (kioskIdValue === null || kioskIdValue.trim() === '') {
    return { status: 'missing', isKioskMode: true, kioskId: null, error: 'missing_kiosk_id' };
  }

  const kioskId = normalizeKioskId(kioskIdValue);
  if (!kioskId) {
    return { status: 'invalid', isKioskMode: true, kioskId: null, error: 'invalid_kiosk_id' };
  }

  return { status: 'valid', isKioskMode: true, kioskId, error: null };
}

export function isKioskConfigValid(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return false;
  if (NULLABLE_KIOSK_CONFIG_FIELDS.some((field) => !Object.hasOwn(config, field))) return false;
  if (!normalizeKioskId(config.kioskId)) return false;
  if (!isNonEmptyString(config.displayName)) return false;
  if (config.isActive !== true) return false;
  if (config.originType !== 'mappedinObject' && config.originType !== 'coordinate') return false;
  if (!isNullableString(config.description)) return false;
  if (!isNullableString(config.originMappedinId)) return false;
  if (!isNullableString(config.floorId)) return false;
  if (!isNullableFiniteNumber(config.latitude)) return false;
  if (!isNullableFiniteNumber(config.longitude)) return false;
  if (!isNullableFiniteNumber(config.heading)) return false;
  if (!isNullableFiniteNumber(config.defaultZoom)) return false;
  if (!isOptionalNumberInRange(config.heading, 0, 360, false)) return false;
  if (!isOptionalNumberInRange(config.defaultZoom, 1, 30)) return false;

  if (config.originType === 'mappedinObject') {
    return isNonEmptyString(config.originMappedinId) &&
      config.floorId === null &&
      config.latitude === null &&
      config.longitude === null;
  }

  return config.originMappedinId === null &&
    isNonEmptyString(config.floorId) &&
    typeof config.latitude === 'number' &&
    config.latitude >= -90 &&
    config.latitude <= 90 &&
    typeof config.longitude === 'number' &&
    config.longitude >= -180 &&
    config.longitude <= 180;
}

export function resolveKioskOrigin(config, deps) {
  if (!isKioskConfigValid(config)) {
    throw new Error('Cannot resolve an invalid kiosk config');
  }

  if (config.originType === 'mappedinObject') {
    if (typeof deps?.findMappedinObject !== 'function') {
      throw new Error('resolveKioskOrigin requires deps.findMappedinObject');
    }

    const origin = deps.findMappedinObject(config.originMappedinId);
    if (!origin) {
      throw new Error(`Mappedin object ${config.originMappedinId} not found for kiosk origin`);
    }
    return origin;
  }

  if (typeof deps?.createCoordinate !== 'function') {
    throw new Error('resolveKioskOrigin requires deps.createCoordinate');
  }

  return deps.createCoordinate({
    latitude: config.latitude,
    longitude: config.longitude,
    floorId: config.floorId,
    verticalOffset: 0
  });
}

export function copyStickyUrlParams(currentUrlOrSearch, targetParams) {
  if (!(targetParams instanceof URLSearchParams)) {
    throw new TypeError('targetParams must be URLSearchParams');
  }

  const currentParams = getSearchParams(currentUrlOrSearch);
  for (const key of STICKY_URL_KEYS) {
    if (targetParams.has(key)) continue;

    const value = currentParams.get(key);
    if (value !== null) targetParams.set(key, value);
  }

  return targetParams;
}

export function buildMapUrl(currentUrlOrSearch, state) {
  const params = copyStickyUrlParams(currentUrlOrSearch, new URLSearchParams());
  params.set('lang', state.lang);

  if (state.floorId) params.set('floor', state.floorId);
  if (state.locationId) params.set('location', state.locationId);
  if (state.departureId) params.set('departure', state.departureId);

  let path = `/${state.lang}/${state.mapId}`;
  if (state.hasDirections) path += '/directions';

  const queryString = params.toString();
  return path + (queryString ? `?${queryString}` : '');
}
