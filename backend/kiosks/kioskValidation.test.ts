import assert from 'node:assert/strict';
import {
    KioskValidationError,
    normalizeKioskId,
    parseKioskActiveInput,
    parseKioskUpsertInput
} from './kioskValidation';

(() => {
    assert.equal(normalizeKioskId(' lt-kiosk_01 '), 'LT-KIOSK_01');
    assert.throws(() => normalizeKioskId(''), KioskValidationError);
    assert.throws(() => normalizeKioskId('bad kiosk'), /kioskId/i);
    assert.throws(() => normalizeKioskId(123), /kioskId/i);
})();

(() => {
    assert.equal(parseKioskActiveInput({ isActive: false }), false);
    assert.throws(() => parseKioskActiveInput({}), /isActive/i);
    assert.throws(() => parseKioskActiveInput({ isActive: 0 }), /isActive/i);
})();

(() => {
    const parsed = parseKioskUpsertInput(' lt-kiosk-01 ', {
        displayName: ' Main entrance ',
        description: ' Near door A ',
        originType: 'coordinate',
        floorId: ' f_1 ',
        latitude: 0,
        longitude: 0,
        heading: 0,
        defaultZoom: 1,
        isActive: false
    });

    assert.deepEqual(parsed, {
        kioskId: 'LT-KIOSK-01',
        displayName: 'Main entrance',
        description: 'Near door A',
        originType: 'coordinate',
        originMappedinId: null,
        floorId: 'f_1',
        latitude: 0,
        longitude: 0,
        heading: 0,
        defaultZoom: 1,
        isActive: false
    });
})();

(() => {
    const parsed = parseKioskUpsertInput('mappedin-01', {
        displayName: 'Mappedin origin',
        originType: 'mappedinObject',
        originMappedinId: ' o_123 ',
        floorId: 'ignored',
        latitude: 10,
        longitude: 20
    });

    assert.deepEqual(parsed, {
        kioskId: 'MAPPEDIN-01',
        displayName: 'Mappedin origin',
        description: null,
        originType: 'mappedinObject',
        originMappedinId: 'o_123',
        floorId: null,
        latitude: null,
        longitude: null,
        heading: null,
        defaultZoom: null,
        isActive: true
    });
})();

(() => {
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', {
        displayName: '',
        originType: 'coordinate',
        floorId: 'f_1',
        latitude: 10,
        longitude: 20
    }), /displayName/i);

    assert.throws(() => parseKioskUpsertInput('KIOSK-01', {
        displayName: 'Invalid origin',
        originType: 'point'
    }), /originType/i);

    assert.throws(() => parseKioskUpsertInput('KIOSK-01', {
        displayName: 'Missing coordinate',
        originType: 'coordinate',
        floorId: 'f_1',
        latitude: 10
    }), /longitude/i);

    assert.throws(() => parseKioskUpsertInput('KIOSK-01', {
        displayName: 'Missing object',
        originType: 'mappedinObject'
    }), /originMappedinId/i);
})();

(() => {
    const base = {
        displayName: 'Boundary test',
        originType: 'coordinate',
        floorId: 'f_1',
        latitude: 0,
        longitude: 0
    };

    assert.doesNotThrow(() => parseKioskUpsertInput('KIOSK-01', { ...base, latitude: -90, longitude: 180, heading: 359.9999, defaultZoom: 30 }));
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', { ...base, latitude: -90.0001 }), /latitude/i);
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', { ...base, latitude: 90.0001 }), /latitude/i);
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', { ...base, longitude: -180.0001 }), /longitude/i);
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', { ...base, longitude: 180.0001 }), /longitude/i);
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', { ...base, heading: -0.1 }), /heading/i);
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', { ...base, heading: 360 }), /heading/i);
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', { ...base, defaultZoom: 0.99 }), /defaultZoom/i);
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', { ...base, defaultZoom: 30.01 }), /defaultZoom/i);
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', { ...base, isActive: 0 }), /isActive/i);
})();

(() => {
    const maxKioskId = 'K'.repeat(100);
    const maxDisplayName = 'D'.repeat(200);
    const maxDescription = 'X'.repeat(500);
    const maxFloorId = 'F'.repeat(100);
    const maxOriginMappedinId = 'O'.repeat(100);

    assert.equal(normalizeKioskId(maxKioskId), maxKioskId);
    assert.throws(() => normalizeKioskId('K'.repeat(101)), /kioskId/i);

    const coordinate = parseKioskUpsertInput(maxKioskId, {
        displayName: maxDisplayName,
        description: maxDescription,
        originType: 'coordinate',
        floorId: maxFloorId,
        latitude: 0,
        longitude: 0
    });
    assert.equal(coordinate.displayName.length, 200);
    assert.equal(coordinate.description?.length, 500);
    assert.equal(coordinate.floorId?.length, 100);

    const mappedinObject = parseKioskUpsertInput('KIOSK-01', {
        displayName: 'Mappedin boundary',
        originType: 'mappedinObject',
        originMappedinId: maxOriginMappedinId
    });
    assert.equal(mappedinObject.originMappedinId?.length, 100);

    const coordinateBase = {
        displayName: 'Boundary test',
        originType: 'coordinate',
        floorId: 'f_1',
        latitude: 0,
        longitude: 0
    };
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', {
        ...coordinateBase,
        displayName: 'D'.repeat(201)
    }), /displayName/i);
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', {
        ...coordinateBase,
        description: 'X'.repeat(501)
    }), /description/i);
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', {
        ...coordinateBase,
        floorId: 'F'.repeat(101)
    }), /floorId/i);
    assert.throws(() => parseKioskUpsertInput('KIOSK-01', {
        displayName: 'Mappedin boundary',
        originType: 'mappedinObject',
        originMappedinId: 'O'.repeat(101)
    }), /originMappedinId/i);
})();

console.log('kioskValidation tests passed');
