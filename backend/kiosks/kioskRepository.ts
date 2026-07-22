import { getDbConnection, sql } from '../db';
import type { KioskConfig, KioskOriginType, KioskUpsertInput } from './kioskTypes';

type SqlTypes = {
    NVarChar: (length: number) => unknown;
    Decimal: (precision: number, scale: number) => unknown;
    Bit: unknown;
};

type RepositoryDependencies = {
    getDbConnection: () => Promise<any>;
    sql: SqlTypes;
};

const SQL_VALIDATION_MESSAGES: Record<number, string> = {
    51001: 'kioskId is required',
    51002: 'Invalid kioskId',
    51003: 'displayName is required',
    51004: 'originType must be mappedinObject or coordinate',
    51005: 'latitude must be between -90 and 90',
    51006: 'longitude must be between -180 and 180',
    51007: 'heading must be greater than or equal to 0 and less than 360',
    51008: 'defaultZoom must be between 1 and 30',
    51009: 'originMappedinId is required for mappedinObject origin',
    51010: 'floorId, latitude, and longitude are required for coordinate origin'
};

const DATABASE_UNAVAILABLE_CODES = new Set([
    'ECONNCLOSED',
    'ENOTOPEN',
    'ESOCKET',
    'ETIMEOUT',
    'ELOGIN'
]);

export class KioskDatabaseUnavailableError extends Error {
    constructor() {
        super('Database connection currently unavailable');
        this.name = 'KioskDatabaseUnavailableError';
    }
}

export class KioskRepositoryValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'KioskRepositoryValidationError';
    }
}

function sqlErrorNumber(error: any): number | null {
    const value = error?.number
        ?? error?.originalError?.info?.number
        ?? error?.precedingErrors?.[0]?.number;
    const number = Number(value);
    return Number.isInteger(number) ? number : null;
}

function isDatabaseUnavailableError(error: any): boolean {
    const code = error?.code ?? error?.originalError?.code;
    return error?.name === 'ConnectionError' || DATABASE_UNAVAILABLE_CODES.has(code);
}

async function executeSafely<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        const number = sqlErrorNumber(error);
        if (number !== null && SQL_VALIDATION_MESSAGES[number]) {
            throw new KioskRepositoryValidationError(SQL_VALIDATION_MESSAGES[number]);
        }
        if (isDatabaseUnavailableError(error)) {
            throw new KioskDatabaseUnavailableError();
        }
        throw error;
    }
}

function nullableNumber(value: unknown): number | null {
    return value === null || value === undefined ? null : Number(value);
}

function mapKioskRow(row: any): KioskConfig {
    return {
        kioskId: String(row.KioskId),
        displayName: String(row.DisplayName),
        description: row.Description ?? null,
        originType: row.OriginType as KioskOriginType,
        originMappedinId: row.OriginMappedinID ?? null,
        floorId: row.FloorId ?? null,
        latitude: nullableNumber(row.Latitude),
        longitude: nullableNumber(row.Longitude),
        heading: nullableNumber(row.Heading),
        defaultZoom: nullableNumber(row.DefaultZoom),
        isActive: Boolean(row.IsActive),
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
        updatedBy: row.UpdatedBy ?? null
    };
}

export function createKioskRepository(dependencies: RepositoryDependencies) {
    async function request() {
        const db = await dependencies.getDbConnection();
        if (!db) throw new KioskDatabaseUnavailableError();
        return db.request();
    }

    return {
        async getKioskConfig(kioskId: string): Promise<KioskConfig | null> {
            return executeSafely(async () => {
                const result = await (await request())
                    .input('KioskId', dependencies.sql.NVarChar(100), kioskId)
                    .execute('dbo.SP_GetKioskConfig');
                const row = result.recordset?.[0];
                return row ? mapKioskRow(row) : null;
            });
        },

        async getKioskDeviceById(kioskId: string): Promise<KioskConfig | null> {
            return executeSafely(async () => {
                const result = await (await request())
                    .input('KioskId', dependencies.sql.NVarChar(100), kioskId)
                    .execute('dbo.SP_GetKioskDeviceById');
                const row = result.recordset?.[0];
                return row ? mapKioskRow(row) : null;
            });
        },

        async listKioskDevices(): Promise<KioskConfig[]> {
            return executeSafely(async () => {
                const result = await (await request()).execute('dbo.SP_GetAllKioskDevices');
                return (result.recordset ?? []).map(mapKioskRow);
            });
        },

        async upsertKioskDevice(input: KioskUpsertInput, updatedBy: string): Promise<KioskConfig | null> {
            return executeSafely(async () => {
                const result = await (await request())
                    .input('KioskId', dependencies.sql.NVarChar(100), input.kioskId)
                    .input('DisplayName', dependencies.sql.NVarChar(200), input.displayName)
                    .input('Description', dependencies.sql.NVarChar(500), input.description ?? null)
                    .input('OriginType', dependencies.sql.NVarChar(30), input.originType)
                    .input('OriginMappedinID', dependencies.sql.NVarChar(100), input.originMappedinId ?? null)
                    .input('FloorId', dependencies.sql.NVarChar(100), input.floorId ?? null)
                    .input('Latitude', dependencies.sql.Decimal(18, 10), input.latitude ?? null)
                    .input('Longitude', dependencies.sql.Decimal(18, 10), input.longitude ?? null)
                    .input('Heading', dependencies.sql.Decimal(10, 4), input.heading ?? null)
                    .input('DefaultZoom', dependencies.sql.Decimal(10, 4), input.defaultZoom ?? null)
                    .input('IsActive', dependencies.sql.Bit, input.isActive ?? true)
                    .input('UpdatedBy', dependencies.sql.NVarChar(100), updatedBy)
                    .execute('dbo.SP_UpsertKioskDevice');
                const row = result.recordset?.[0];
                return row ? mapKioskRow(row) : null;
            });
        },

        async setKioskDeviceActive(kioskId: string, isActive: boolean, updatedBy: string): Promise<boolean> {
            return executeSafely(async () => {
                const result = await (await request())
                    .input('KioskId', dependencies.sql.NVarChar(100), kioskId)
                    .input('IsActive', dependencies.sql.Bit, isActive)
                    .input('UpdatedBy', dependencies.sql.NVarChar(100), updatedBy)
                    .execute('dbo.SP_SetKioskDeviceActive');
                return Number(result.recordset?.[0]?.UpdatedRows ?? 0) > 0;
            });
        }
    };
}

export type KioskRepository = ReturnType<typeof createKioskRepository>;

const repository = createKioskRepository({ getDbConnection, sql });

export const getKioskConfig = repository.getKioskConfig;
export const getKioskDeviceById = repository.getKioskDeviceById;
export const listKioskDevices = repository.listKioskDevices;
export const upsertKioskDevice = repository.upsertKioskDevice;
export const setKioskDeviceActive = repository.setKioskDeviceActive;
