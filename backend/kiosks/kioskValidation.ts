import type { KioskOriginType, KioskUpsertInput } from './kioskTypes';

const KIOSK_ID_PATTERN = /^[A-Z0-9_-]+$/;
const KIOSK_ID_MAX_LENGTH = 100;
const DISPLAY_NAME_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 500;
const ORIGIN_ID_MAX_LENGTH = 100;

export class KioskValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'KioskValidationError';
    }
}

export function normalizeKioskId(value: unknown): string {
    if (typeof value !== 'string') {
        throw new KioskValidationError('kioskId is required');
    }

    const kioskId = value.trim().toUpperCase();
    if (!kioskId) {
        throw new KioskValidationError('kioskId is required');
    }
    if (kioskId.length > KIOSK_ID_MAX_LENGTH) {
        throw new KioskValidationError(`kioskId must be at most ${KIOSK_ID_MAX_LENGTH} characters`);
    }
    if (!KIOSK_ID_PATTERN.test(kioskId)) {
        throw new KioskValidationError('Invalid kioskId: only A-Z, 0-9, underscore, and dash are allowed');
    }

    return kioskId;
}

function asPayload(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new KioskValidationError('Kiosk payload must be an object');
    }
    return value as Record<string, unknown>;
}

function assertMaxLength(value: string, fieldName: string, maxLength: number): string {
    if (value.length > maxLength) {
        throw new KioskValidationError(`${fieldName} must be at most ${maxLength} characters`);
    }
    return value;
}

function requiredString(value: unknown, fieldName: string, maxLength: number): string {
    if (typeof value !== 'string' || !value.trim()) {
        throw new KioskValidationError(`${fieldName} is required`);
    }
    return assertMaxLength(value.trim(), fieldName, maxLength);
}

function optionalString(value: unknown, fieldName: string, maxLength: number): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') {
        throw new KioskValidationError(`${fieldName} must be a string or null`);
    }
    const normalized = value.trim();
    return normalized ? assertMaxLength(normalized, fieldName, maxLength) : null;
}

function optionalNumber(value: unknown, fieldName: string): number | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new KioskValidationError(`${fieldName} must be a finite number or null`);
    }
    return value;
}

function inRange(value: number | null, minimum: number, maximum: number, fieldName: string) {
    if (value !== null && (value < minimum || value > maximum)) {
        throw new KioskValidationError(`${fieldName} must be between ${minimum} and ${maximum}`);
    }
}

export function parseKioskActiveInput(payloadValue: unknown): boolean {
    const payload = asPayload(payloadValue);
    if (typeof payload.isActive !== 'boolean') {
        throw new KioskValidationError('isActive must be a boolean');
    }
    return payload.isActive;
}

export function parseKioskUpsertInput(kioskIdValue: unknown, payloadValue: unknown): KioskUpsertInput {
    const payload = asPayload(payloadValue);
    const kioskId = normalizeKioskId(kioskIdValue);
    const displayName = requiredString(payload.displayName, 'displayName', DISPLAY_NAME_MAX_LENGTH);
    const description = optionalString(payload.description, 'description', DESCRIPTION_MAX_LENGTH);

    if (payload.originType !== 'mappedinObject' && payload.originType !== 'coordinate') {
        throw new KioskValidationError('originType must be mappedinObject or coordinate');
    }
    const originType: KioskOriginType = payload.originType;

    let originMappedinId = optionalString(payload.originMappedinId, 'originMappedinId', ORIGIN_ID_MAX_LENGTH);
    let floorId = optionalString(payload.floorId, 'floorId', ORIGIN_ID_MAX_LENGTH);
    let latitude = optionalNumber(payload.latitude, 'latitude');
    let longitude = optionalNumber(payload.longitude, 'longitude');
    const heading = optionalNumber(payload.heading, 'heading');
    const defaultZoom = optionalNumber(payload.defaultZoom, 'defaultZoom');

    inRange(latitude, -90, 90, 'latitude');
    inRange(longitude, -180, 180, 'longitude');
    inRange(defaultZoom, 1, 30, 'defaultZoom');
    if (heading !== null && (heading < 0 || heading >= 360)) {
        throw new KioskValidationError('heading must be greater than or equal to 0 and less than 360');
    }

    if (originType === 'coordinate') {
        if (!floorId) throw new KioskValidationError('floorId is required for coordinate origin');
        if (latitude === null) throw new KioskValidationError('latitude is required for coordinate origin');
        if (longitude === null) throw new KioskValidationError('longitude is required for coordinate origin');
        originMappedinId = null;
    } else {
        if (!originMappedinId) {
            throw new KioskValidationError('originMappedinId is required for mappedinObject origin');
        }
        floorId = null;
        latitude = null;
        longitude = null;
    }

    const isActive = payload.isActive ?? true;
    if (typeof isActive !== 'boolean') {
        throw new KioskValidationError('isActive must be a boolean');
    }

    return {
        kioskId,
        displayName,
        description,
        originType,
        originMappedinId,
        floorId,
        latitude,
        longitude,
        heading,
        defaultZoom,
        isActive
    };
}
