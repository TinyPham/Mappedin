import assert from 'node:assert/strict';
import test from 'node:test';

import * as kioskRuntimeModule from '../src/kiosk/kioskRuntime.js';

const {
  getEffectiveWayfindingOrigin,
  loadKioskRuntime,
  shouldUseDirectionsPath
} = kioskRuntimeModule;

const mappedinConfig = {
  kioskId: 'LT-KIOSK-01',
  displayName: 'Main entrance kiosk',
  description: null,
  originType: 'mappedinObject',
  originMappedinId: 'O_MAIN_ENTRANCE',
  floorId: null,
  latitude: null,
  longitude: null,
  heading: null,
  defaultZoom: null,
  isActive: true
};

const coordinateConfig = {
  kioskId: 'LT-KIOSK-02',
  displayName: 'Check-in hall kiosk',
  description: null,
  originType: 'coordinate',
  originMappedinId: null,
  floorId: 'f_departures',
  latitude: 10.8188,
  longitude: 106.6519,
  heading: 180,
  defaultZoom: 24,
  isActive: true
};

test('website mode is disabled and never fetches kiosk config', async () => {
  let fetchCalls = 0;

  const state = await loadKioskRuntime('https://example.com/vn/map?kioskId=LT-KIOSK-01', {
    apiBase: 'https://example.com/api',
    fetch: async () => {
      fetchCalls += 1;
      throw new Error('must not fetch');
    }
  });

  assert.deepEqual(state, {
    isKioskMode: false,
    kioskId: null,
    config: null,
    origin: null,
    error: null
  });
  assert.equal(fetchCalls, 0);
});

test('escapeHtmlAttribute encodes every character that can break an input value', () => {
  assert.equal(typeof kioskRuntimeModule.escapeHtmlAttribute, 'function');
  const { escapeHtmlAttribute } = kioskRuntimeModule;
  const payload = '\"><img src=x onerror=alert(1)>&\'';
  const escaped = escapeHtmlAttribute(payload);

  assert.equal(
    escaped,
    '&quot;&gt;&lt;img src=x onerror=alert(1)&gt;&amp;&#39;'
  );
  assert.equal(escaped.includes('<img'), false);
  assert.equal(escaped.includes('"'), false);
  assert.equal(escapeHtmlAttribute(null), '');
});

test('valid mappedin kiosk config fetches the encoded ID and resolves its object origin', async () => {
  const origin = { id: 'o_main_entrance', name: 'Entrance' };
  const fetchCalls = [];
  const requestedObjectIds = [];

  const state = await loadKioskRuntime(
    'https://example.com/vn/map?mode=kiosk&kioskId=%20lt-kiosk-01%20',
    {
      apiBase: 'https://example.com/api/',
      fetch: async (...args) => {
        fetchCalls.push(args);
        return { ok: true, json: async () => mappedinConfig };
      },
      findMappedinObject(id) {
        requestedObjectIds.push(id);
        return origin;
      }
    }
  );

  assert.deepEqual(state, {
    isKioskMode: true,
    kioskId: 'LT-KIOSK-01',
    config: mappedinConfig,
    origin,
    error: null
  });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0][0], 'https://example.com/api/kiosks/LT-KIOSK-01/config');
  assert.equal(fetchCalls[0][1].method, 'GET');
  assert.ok(fetchCalls[0][1].signal instanceof AbortSignal);
  assert.deepEqual(requestedObjectIds, ['O_MAIN_ENTRANCE']);
});

test('valid coordinate kiosk config resolves through the coordinate factory', async () => {
  const origin = { type: 'coordinate' };
  const coordinateCalls = [];

  const state = await loadKioskRuntime('?mode=kiosk&kioskId=LT-KIOSK-02', {
    apiBase: '/api',
    fetch: async () => ({ ok: true, json: async () => coordinateConfig }),
    createCoordinate(options) {
      coordinateCalls.push(options);
      return origin;
    }
  });

  assert.equal(state.origin, origin);
  assert.equal(state.error, null);
  assert.deepEqual(coordinateCalls, [{
    latitude: 10.8188,
    longitude: 106.6519,
    floorId: 'f_departures',
    verticalOffset: 0
  }]);
});

test('missing or invalid kiosk ID remains in kiosk mode with a clear launch error', async () => {
  for (const [url, error] of [
    ['?mode=kiosk', 'missing_kiosk_id'],
    ['?mode=kiosk&kioskId=bad%20id', 'invalid_kiosk_id']
  ]) {
    const state = await loadKioskRuntime(url, {
      apiBase: '/api',
      fetch: async () => assert.fail('must not fetch invalid kiosk launch')
    });

    assert.equal(state.isKioskMode, true);
    assert.equal(state.kioskId, null);
    assert.equal(state.origin, null);
    assert.equal(state.error, error);
  }
});

test('malformed URL input returns a sanitized launch error without fetching', async () => {
  let fetched = false;
  const state = await loadKioskRuntime({ not: 'a URL' }, {
    apiBase: '/api',
    fetch: async () => {
      fetched = true;
    },
    logger: { error() {} }
  });

  assert.deepEqual(state, {
    isKioskMode: false,
    kioskId: null,
    config: null,
    origin: null,
    error: 'invalid_launch_url'
  });
  assert.equal(fetched, false);
});

test('non-ok response returns a sanitized kiosk error and logs diagnostics', async () => {
  const diagnostics = [];
  const state = await loadKioskRuntime('?mode=kiosk&kioskId=LT-KIOSK-01', {
    apiBase: '/api',
    fetch: async () => ({ ok: false, status: 404, json: async () => ({ error: 'secret server detail' }) }),
    logger: { error: (...args) => diagnostics.push(args) }
  });

  assert.equal(state.isKioskMode, true);
  assert.equal(state.kioskId, 'LT-KIOSK-01');
  assert.equal(state.config, null);
  assert.equal(state.origin, null);
  assert.equal(state.error, 'kiosk_config_unavailable');
  assert.equal(JSON.stringify(state).includes('secret server detail'), false);
  assert.equal(diagnostics.length, 1);
  assert.match(String(diagnostics[0][0]), /kiosk config request failed/i);
});

test('hanging kiosk fetch is aborted after timeout and returns a generic error state', async () => {
  let requestSignal;
  let abortCount = 0;
  const startedAt = Date.now();

  const runtimePromise = loadKioskRuntime('?mode=kiosk&kioskId=LT-KIOSK-01', {
    apiBase: '/api',
    timeoutMs: 10,
    fetch: async (_url, options) => new Promise((_resolve, reject) => {
      requestSignal = options.signal;
      requestSignal.addEventListener('abort', () => {
        abortCount += 1;
        const error = new Error('private timeout detail');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    }),
    logger: { error() {} }
  });
  let watchdog;
  const state = await Promise.race([
    runtimePromise,
    new Promise((_, reject) => {
      watchdog = setTimeout(() => reject(new Error('runtime timeout was not enforced')), 100);
    })
  ]).finally(() => clearTimeout(watchdog));

  assert.ok(Date.now() - startedAt < 1000, 'timeout must not block init');
  assert.ok(requestSignal instanceof AbortSignal);
  assert.equal(requestSignal.aborted, true);
  assert.equal(abortCount, 1);
  assert.equal(state.isKioskMode, true);
  assert.equal(state.error, 'kiosk_config_unavailable');
  assert.equal(JSON.stringify(state).includes('private timeout detail'), false);
});

test('timeout also aborts an ok response whose json body never resolves', async () => {
  let requestSignal;
  let abortCount = 0;

  const runtimePromise = loadKioskRuntime('?mode=kiosk&kioskId=LT-KIOSK-01', {
    apiBase: '/api',
    timeoutMs: 10,
    fetch: async (_url, options) => {
      requestSignal = options.signal;
      return {
        ok: true,
        json: async () => new Promise((_resolve, reject) => {
          requestSignal.addEventListener('abort', () => {
            abortCount += 1;
            const error = new Error('private body timeout detail');
            error.name = 'AbortError';
            reject(error);
          }, { once: true });
        })
      };
    },
    logger: { error() {} }
  });

  let watchdog;
  const state = await Promise.race([
    runtimePromise,
    new Promise((_, reject) => {
      watchdog = setTimeout(() => reject(new Error('json timeout was not enforced')), 100);
    })
  ]).finally(() => clearTimeout(watchdog));

  assert.ok(requestSignal instanceof AbortSignal);
  assert.equal(requestSignal.aborted, true);
  assert.equal(abortCount, 1);
  assert.equal(state.isKioskMode, true);
  assert.equal(state.error, 'kiosk_config_unavailable');
  assert.equal(JSON.stringify(state).includes('private body timeout detail'), false);
});

test('invalid JSON and invalid public config do not throw or expose response details', async () => {
  const invalidJson = await loadKioskRuntime('?mode=kiosk&kioskId=LT-KIOSK-01', {
    apiBase: '/api',
    fetch: async () => ({
      ok: true,
      json: async () => { throw new SyntaxError('private response body'); }
    }),
    logger: { error() {} }
  });
  assert.equal(invalidJson.error, 'kiosk_config_invalid_response');
  assert.equal(JSON.stringify(invalidJson).includes('private response body'), false);

  const invalidConfig = await loadKioskRuntime('?mode=kiosk&kioskId=LT-KIOSK-01', {
    apiBase: '/api',
    fetch: async () => ({ ok: true, json: async () => ({ error: 'database detail' }) }),
    logger: { error() {} }
  });
  assert.equal(invalidConfig.error, 'invalid_kiosk_config');
  assert.equal(JSON.stringify(invalidConfig).includes('database detail'), false);
});

test('origin resolution failure is contained in kiosk mode', async () => {
  const state = await loadKioskRuntime('?mode=kiosk&kioskId=LT-KIOSK-01', {
    apiBase: '/api',
    fetch: async () => ({ ok: true, json: async () => mappedinConfig }),
    findMappedinObject: () => null,
    logger: { error() {} }
  });

  assert.equal(state.isKioskMode, true);
  assert.equal(state.config, mappedinConfig);
  assert.equal(state.origin, null);
  assert.equal(state.error, 'kiosk_origin_unavailable');
});

test('effective origin policy always locks an active kiosk to its runtime origin', () => {
  const kioskOrigin = { id: 'kiosk-origin' };
  const selectedOrigin = { id: 'selected-origin' };

  assert.equal(
    getEffectiveWayfindingOrigin({ isKioskMode: true, origin: kioskOrigin }, selectedOrigin),
    kioskOrigin
  );
  assert.equal(
    getEffectiveWayfindingOrigin({ isKioskMode: true, origin: null }, selectedOrigin),
    null
  );
  assert.equal(
    getEffectiveWayfindingOrigin({ isKioskMode: false, origin: null }, selectedOrigin),
    selectedOrigin
  );
});

test('directions path policy requires a destination in kiosk mode', () => {
  const origin = { id: 'origin' };
  const destination = { id: 'destination' };

  assert.equal(shouldUseDirectionsPath({ isKioskMode: true }, origin, null), false);
  assert.equal(shouldUseDirectionsPath({ isKioskMode: true }, origin, destination), true);
  assert.equal(shouldUseDirectionsPath({ isKioskMode: false }, origin, null), true);
  assert.equal(shouldUseDirectionsPath({ isKioskMode: false }, null, destination), true);
  assert.equal(shouldUseDirectionsPath({ isKioskMode: false }, null, null), false);
});
