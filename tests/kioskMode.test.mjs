import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildMapUrl,
  copyStickyUrlParams,
  isKioskConfigValid,
  normalizeKioskId,
  parseKioskModeFromUrl,
  resolveKioskOrigin
} from '../src/kiosk/kioskMode.js';

const mappedinConfig = {
  kioskId: 'LT-KIOSK_01',
  displayName: 'Main entrance',
  description: null,
  originType: 'mappedinObject',
  originMappedinId: 'o_main_entrance',
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

test('kiosk helper has a local ESM package boundary for Node 18', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../src/kiosk/package.json', import.meta.url), 'utf8')
  );

  assert.deepEqual(packageJson, { type: 'module' });
});

test('normalizeKioskId trims and uppercases a valid identifier', () => {
  assert.equal(normalizeKioskId('  lt-kiosk_01  '), 'LT-KIOSK_01');
  assert.equal(normalizeKioskId('K'.repeat(100)), 'K'.repeat(100));
});

test('normalizeKioskId consistently returns null for invalid identifiers', () => {
  for (const value of [undefined, null, 123, '', '   ', 'bad kiosk', 'A/B', 'K'.repeat(101)]) {
    assert.equal(normalizeKioskId(value), null, String(value));
  }
});

test('parseKioskModeFromUrl keeps ordinary website URLs in website mode', () => {
  assert.deepEqual(parseKioskModeFromUrl('https://example.com/vn/map?kioskId=LT-01'), {
    status: 'website',
    isKioskMode: false,
    kioskId: null,
    error: null
  });

  assert.equal(parseKioskModeFromUrl('?mode=KIOSK&kioskId=LT-01').status, 'website');
});

test('parseKioskModeFromUrl returns a normalized valid kiosk state', () => {
  const url = new URL('https://example.com/map?mode=kiosk&kioskId=%20lt-kiosk_01%20');

  assert.deepEqual(parseKioskModeFromUrl(url), {
    status: 'valid',
    isKioskMode: true,
    kioskId: 'LT-KIOSK_01',
    error: null
  });
});

test('parseKioskModeFromUrl accepts an absolute URL string', () => {
  assert.equal(
    parseKioskModeFromUrl('https://example.com/map?mode=kiosk&kioskId=lt-absolute-01').kioskId,
    'LT-ABSOLUTE-01'
  );
});

test('parseKioskModeFromUrl distinguishes missing and invalid kiosk IDs', () => {
  assert.deepEqual(parseKioskModeFromUrl('?mode=kiosk'), {
    status: 'missing',
    isKioskMode: true,
    kioskId: null,
    error: 'missing_kiosk_id'
  });

  assert.deepEqual(parseKioskModeFromUrl('?mode=kiosk&kioskId=bad%20id'), {
    status: 'invalid',
    isKioskMode: true,
    kioskId: null,
    error: 'invalid_kiosk_id'
  });
});

test('copyStickyUrlParams preserves only sticky URL values', () => {
  const target = new URLSearchParams();

  const result = copyStickyUrlParams(
    '?mode=kiosk&kioskId=LT-01&admin=1&debug=true&lang=vi&delay=250&sync=off&floor=f1&location=o1&departure=o2',
    target
  );

  assert.equal(result, target);
  assert.deepEqual([...target.entries()], [
    ['mode', 'kiosk'],
    ['kioskId', 'LT-01'],
    ['admin', '1'],
    ['debug', 'true'],
    ['lang', 'vi'],
    ['delay', '250'],
    ['sync', 'off']
  ]);
  assert.equal(target.has('floor'), false);
  assert.equal(target.has('location'), false);
  assert.equal(target.has('departure'), false);
});

test('copyStickyUrlParams does not overwrite values already set on target', () => {
  const target = new URLSearchParams('mode=website&lang=en&floor=f_target');

  copyStickyUrlParams('https://example.com/?mode=kiosk&lang=vi&debug=true', target);

  assert.equal(target.get('mode'), 'website');
  assert.equal(target.get('lang'), 'en');
  assert.equal(target.get('debug'), 'true');
  assert.equal(target.get('floor'), 'f_target');
});

test('buildMapUrl uses current app language for both path and query', () => {
  const fullURL = buildMapUrl(
    '?mode=kiosk&kioskId=LT-01&lang=en&admin=true&floor=old-floor&location=old-location',
    {
      lang: 'vn',
      mapId: 'airport-map',
      hasDirections: true,
      floorId: 'f_departures',
      locationId: 'o_destination',
      departureId: 'o_origin'
    }
  );
  const url = new URL(fullURL, 'https://example.com');

  assert.equal(url.pathname, '/vn/airport-map/directions');
  assert.equal(url.searchParams.get('lang'), 'vn');
  assert.equal(url.searchParams.get('mode'), 'kiosk');
  assert.equal(url.searchParams.get('kioskId'), 'LT-01');
  assert.equal(url.searchParams.get('admin'), 'true');
  assert.equal(url.searchParams.get('floor'), 'f_departures');
  assert.equal(url.searchParams.get('location'), 'o_destination');
  assert.equal(url.searchParams.get('departure'), 'o_origin');
});

test('isKioskConfigValid accepts a valid mappedin object origin', () => {
  assert.equal(isKioskConfigValid(mappedinConfig), true);
  assert.equal(isKioskConfigValid({ ...mappedinConfig, description: 'Terminal entrance' }), true);
});

test('isKioskConfigValid accepts only active public configs', () => {
  assert.equal(isKioskConfigValid({ ...mappedinConfig, isActive: false }), false);
});

test('isKioskConfigValid requires every nullable public DTO field to be present', () => {
  const nullableFields = [
    'description',
    'originMappedinId',
    'floorId',
    'latitude',
    'longitude',
    'heading',
    'defaultZoom'
  ];

  for (const field of nullableFields) {
    const config = { ...mappedinConfig };
    delete config[field];
    assert.equal(isKioskConfigValid(config), false, field);
  }
});

test('isKioskConfigValid enforces nullable field shapes and origin-specific nulls', () => {
  assert.equal(isKioskConfigValid({ ...mappedinConfig, description: 123 }), false);
  assert.equal(isKioskConfigValid({ ...mappedinConfig, floorId: 'f_unexpected' }), false);
  assert.equal(isKioskConfigValid({ ...mappedinConfig, latitude: 10 }), false);
  assert.equal(isKioskConfigValid({ ...coordinateConfig, originMappedinId: 'o_unexpected' }), false);
  assert.equal(isKioskConfigValid({ ...coordinateConfig, heading: null, defaultZoom: null }), true);
});

test('isKioskConfigValid rejects missing public DTO fields and mappedin origin ID', () => {
  assert.equal(isKioskConfigValid(null), false);
  assert.equal(isKioskConfigValid({ ...mappedinConfig, kioskId: 'bad id' }), false);
  assert.equal(isKioskConfigValid({ ...mappedinConfig, displayName: '  ' }), false);
  assert.equal(isKioskConfigValid({ ...mappedinConfig, originType: 'point' }), false);
  assert.equal(isKioskConfigValid({ ...mappedinConfig, originMappedinId: '' }), false);
  assert.equal(isKioskConfigValid({ ...mappedinConfig, isActive: 1 }), false);
});

test('isKioskConfigValid accepts coordinate boundaries and optional camera values', () => {
  assert.equal(isKioskConfigValid(coordinateConfig), true);
  assert.equal(isKioskConfigValid({
    ...coordinateConfig,
    latitude: -90,
    longitude: 180,
    heading: 0,
    defaultZoom: 1
  }), true);
  assert.equal(isKioskConfigValid({
    ...coordinateConfig,
    latitude: 90,
    longitude: -180,
    heading: 359.999,
    defaultZoom: 30
  }), true);
});

test('isKioskConfigValid rejects incomplete or out-of-range coordinate origins', () => {
  for (const override of [
    { floorId: '' },
    { latitude: Number.NaN },
    { latitude: 90.01 },
    { longitude: Number.POSITIVE_INFINITY },
    { longitude: -180.01 },
    { heading: -1 },
    { heading: 360 },
    { defaultZoom: 0 },
    { defaultZoom: 30.01 }
  ]) {
    assert.equal(isKioskConfigValid({ ...coordinateConfig, ...override }), false, JSON.stringify(override));
  }
});

test('resolveKioskOrigin returns the mappedin object found by its configured ID', () => {
  const object = { id: 'o_main_entrance', type: 'space' };
  const requestedIds = [];

  const result = resolveKioskOrigin(mappedinConfig, {
    findMappedinObject(id) {
      requestedIds.push(id);
      return object;
    }
  });

  assert.equal(result, object);
  assert.deepEqual(requestedIds, ['o_main_entrance']);
});

test('resolveKioskOrigin fails clearly when the mappedin object is missing', () => {
  assert.throws(
    () => resolveKioskOrigin(mappedinConfig, { findMappedinObject: () => null }),
    /Mappedin object .*o_main_entrance.* not found/i
  );
});

test('resolveKioskOrigin uses the coordinate factory and returns its real target', () => {
  const navigationTarget = { type: 'coordinate-target' };
  const calls = [];

  const result = resolveKioskOrigin(coordinateConfig, {
    createCoordinate(options) {
      calls.push(options);
      return navigationTarget;
    }
  });

  assert.equal(result, navigationTarget);
  assert.deepEqual(calls, [{
    latitude: 10.8188,
    longitude: 106.6519,
    floorId: 'f_departures',
    verticalOffset: 0
  }]);
});
