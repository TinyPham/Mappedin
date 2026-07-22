import type { RequestHandler, Response } from 'express';
import {
    KioskDatabaseUnavailableError,
    KioskRepositoryValidationError,
    getKioskConfig,
    getKioskDeviceById,
    listKioskDevices,
    setKioskDeviceActive,
    upsertKioskDevice
} from './kioskRepository';
import type { KioskRepository } from './kioskRepository';
import type { KioskConfig, PublicKioskConfig } from './kioskTypes';
import {
    KioskValidationError,
    normalizeKioskId,
    parseKioskActiveInput,
    parseKioskUpsertInput
} from './kioskValidation';

type KioskRouteApp = {
    get: (path: string, ...handlers: RequestHandler[]) => unknown;
    put: (path: string, ...handlers: RequestHandler[]) => unknown;
    patch: (path: string, ...handlers: RequestHandler[]) => unknown;
};

type RegisterKioskRoutesDependencies = {
    requireAdmin: RequestHandler;
    repository?: KioskRepository;
};

const defaultRepository: KioskRepository = {
    getKioskConfig,
    getKioskDeviceById,
    listKioskDevices,
    upsertKioskDevice,
    setKioskDeviceActive
};

export function toPublicKioskConfig(config: KioskConfig): PublicKioskConfig {
    return {
        kioskId: config.kioskId,
        displayName: config.displayName,
        description: config.description,
        originType: config.originType,
        originMappedinId: config.originMappedinId,
        floorId: config.floorId,
        latitude: config.latitude,
        longitude: config.longitude,
        heading: config.heading,
        defaultZoom: config.defaultZoom,
        isActive: config.isActive
    };
}

function sendKioskError(res: Response, error: unknown, operation: string) {
    if (error instanceof KioskValidationError || error instanceof KioskRepositoryValidationError) {
        return res.status(400).json({ error: error.message });
    }
    if (error instanceof KioskDatabaseUnavailableError) {
        return res.status(503).json({ error: 'Database connection currently unavailable' });
    }

    console.error(`[Kiosk] ${operation} failed:`, error);
    return res.status(500).json({ error: 'Unexpected server error' });
}

export function registerKioskRoutes(app: KioskRouteApp, dependencies: RegisterKioskRoutesDependencies) {
    const repository = dependencies.repository ?? defaultRepository;

    app.get('/api/kiosks/:kioskId/config', async (req, res) => {
        try {
            const kioskId = normalizeKioskId(req.params.kioskId);
            const config = await repository.getKioskConfig(kioskId);
            if (!config) return res.status(404).json({ error: 'Kiosk config not found' });
            return res.json(toPublicKioskConfig(config));
        } catch (error) {
            return sendKioskError(res, error, 'get public config');
        }
    });

    app.get('/api/admin/kiosks', dependencies.requireAdmin, async (_req, res) => {
        try {
            return res.json(await repository.listKioskDevices());
        } catch (error) {
            return sendKioskError(res, error, 'list devices');
        }
    });

    app.get('/api/admin/kiosks/:kioskId', dependencies.requireAdmin, async (req, res) => {
        try {
            const kioskId = normalizeKioskId(req.params.kioskId);
            const config = await repository.getKioskDeviceById(kioskId);
            if (!config) return res.status(404).json({ error: 'Kiosk config not found' });
            return res.json(config);
        } catch (error) {
            return sendKioskError(res, error, 'get admin config');
        }
    });

    app.put('/api/admin/kiosks/:kioskId', dependencies.requireAdmin, async (req, res) => {
        try {
            const input = parseKioskUpsertInput(req.params.kioskId, req.body);
            const updatedBy = (req as any).admin.sub;
            const config = await repository.upsertKioskDevice(input, updatedBy);
            if (!config) throw new Error('Kiosk upsert returned no record');
            return res.json(config);
        } catch (error) {
            return sendKioskError(res, error, 'upsert device');
        }
    });

    app.patch('/api/admin/kiosks/:kioskId/active', dependencies.requireAdmin, async (req, res) => {
        try {
            const kioskId = normalizeKioskId(req.params.kioskId);
            const isActive = parseKioskActiveInput(req.body);
            const updatedBy = (req as any).admin.sub;
            const updated = await repository.setKioskDeviceActive(kioskId, isActive, updatedBy);
            if (!updated) return res.status(404).json({ error: 'Kiosk config not found' });
            return res.json({ success: true, kioskId, isActive });
        } catch (error) {
            return sendKioskError(res, error, 'set device active state');
        }
    });
}
