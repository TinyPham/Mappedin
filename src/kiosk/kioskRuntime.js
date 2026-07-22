import {
  isKioskConfigValid,
  normalizeKioskId,
  parseKioskModeFromUrl,
  resolveKioskOrigin
} from './kioskMode.js';

const DEFAULT_KIOSK_FETCH_TIMEOUT_MS = 8000;
const HTML_ATTRIBUTE_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtmlAttribute(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ATTRIBUTE_ENTITIES[character]);
}

function createRuntimeState(overrides = {}) {
  return {
    isKioskMode: false,
    kioskId: null,
    config: null,
    origin: null,
    error: null,
    ...overrides
  };
}

function reportError(logger, message, detail) {
  const log = logger && typeof logger.error === 'function' ? logger.error.bind(logger) : console.error;
  log(`[Kiosk] ${message}`, detail);
}

export async function loadKioskRuntime(url, deps = {}) {
  let launch;
  try {
    launch = parseKioskModeFromUrl(url);
  } catch (error) {
    reportError(deps.logger, 'Invalid launch URL', error);
    return createRuntimeState({ error: 'invalid_launch_url' });
  }

  if (!launch.isKioskMode) return createRuntimeState();

  const kioskState = {
    isKioskMode: true,
    kioskId: launch.kioskId,
    config: null,
    origin: null,
    error: launch.error
  };
  if (launch.error) return kioskState;

  const fetchFn = deps.fetch;
  if (typeof fetchFn !== 'function') {
    reportError(deps.logger, 'Kiosk config request cannot start', new Error('Missing fetch dependency'));
    return { ...kioskState, error: 'kiosk_config_unavailable' };
  }

  const apiBase = typeof deps.apiBase === 'string' ? deps.apiBase.replace(/\/+$/, '') : '';
  const timeoutMs = Number.isFinite(deps.timeoutMs) && deps.timeoutMs >= 0
    ? deps.timeoutMs
    : DEFAULT_KIOSK_FETCH_TIMEOUT_MS;
  const abortController = new AbortController();
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      abortController.abort();
      const timeoutError = new Error('Kiosk config request timed out');
      timeoutError.name = 'AbortError';
      reject(timeoutError);
    }, timeoutMs);
  });

  try {
    let response;
    try {
      response = await Promise.race([
        fetchFn(`${apiBase}/kiosks/${encodeURIComponent(launch.kioskId)}/config`, {
          method: 'GET',
          signal: abortController.signal
        }),
        timeoutPromise
      ]);
    } catch (error) {
      reportError(deps.logger, 'Kiosk config request failed', error);
      return { ...kioskState, error: 'kiosk_config_unavailable' };
    }

    if (!response?.ok) {
      reportError(deps.logger, 'Kiosk config request failed', { status: response?.status });
      return { ...kioskState, error: 'kiosk_config_unavailable' };
    }

    let config;
    try {
      config = await Promise.race([response.json(), timeoutPromise]);
    } catch (error) {
      if (error?.name === 'AbortError') {
        reportError(deps.logger, 'Kiosk config request failed', error);
        return { ...kioskState, error: 'kiosk_config_unavailable' };
      }
      reportError(deps.logger, 'Kiosk config response was not valid JSON', error);
      return { ...kioskState, error: 'kiosk_config_invalid_response' };
    }

    if (!isKioskConfigValid(config) || normalizeKioskId(config.kioskId) !== launch.kioskId) {
      reportError(deps.logger, 'Kiosk config failed validation', { kioskId: launch.kioskId });
      return { ...kioskState, error: 'invalid_kiosk_config' };
    }

    try {
      const origin = resolveKioskOrigin(config, deps);
      return { ...kioskState, config, origin, error: null };
    } catch (error) {
      reportError(deps.logger, 'Kiosk origin could not be resolved', error);
      return { ...kioskState, config, error: 'kiosk_origin_unavailable' };
    }
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export function getEffectiveWayfindingOrigin(kioskRuntime, selectedOrigin) {
  return kioskRuntime?.isKioskMode ? kioskRuntime.origin : selectedOrigin;
}

export function shouldUseDirectionsPath(kioskRuntime, origin, destination) {
  return kioskRuntime?.isKioskMode ? Boolean(destination) : Boolean(origin || destination);
}
