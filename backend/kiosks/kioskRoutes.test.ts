import assert from 'node:assert/strict';
import { createKioskRepository } from './kioskRepository';
import { registerKioskRoutes } from './kioskRoutes';

type RegisteredRoute = {
    method: 'get' | 'put' | 'patch';
    path: string;
    handlers: Function[];
};

class FakeApp {
    routes: RegisteredRoute[] = [];

    get(path: string, ...handlers: Function[]) {
        this.routes.push({ method: 'get', path, handlers });
    }

    put(path: string, ...handlers: Function[]) {
        this.routes.push({ method: 'put', path, handlers });
    }

    patch(path: string, ...handlers: Function[]) {
        this.routes.push({ method: 'patch', path, handlers });
    }
}

function createResponse() {
    return {
        statusCode: 200,
        body: undefined as unknown,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(body: unknown) {
            this.body = body;
            return this;
        }
    };
}

const config = {
    kioskId: 'LT-KIOSK-01',
    displayName: 'Main entrance',
    description: null,
    originType: 'coordinate' as const,
    originMappedinId: null,
    floorId: 'f_1',
    latitude: 10,
    longitude: 106,
    heading: 0,
    defaultZoom: 19,
    isActive: true,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedBy: 'admin'
};

function createRepository(overrides: Record<string, Function> = {}) {
    return {
        getKioskConfig: async () => config,
        getKioskDeviceById: async () => config,
        listKioskDevices: async () => [config],
        upsertKioskDevice: async () => config,
        setKioskDeviceActive: async () => true,
        ...overrides
    };
}

function setup(repository = createRepository()) {
    const app = new FakeApp();
    const requireAdmin = function testRequireAdmin() {};
    registerKioskRoutes(app as any, {
        repository: repository as any,
        requireAdmin: requireAdmin as any
    });

    function route(method: RegisteredRoute['method'], path: string) {
        const registered = app.routes.find((entry) => entry.method === method && entry.path === path);
        assert.ok(registered, `Expected ${method.toUpperCase()} ${path} to be registered`);
        return registered;
    }

    return { app, requireAdmin, route };
}

async function invoke(route: RegisteredRoute, req: Record<string, unknown>) {
    const res = createResponse();
    const handler = route.handlers[route.handlers.length - 1];
    await handler(req, res, () => undefined);
    return res;
}

async function run() {
    {
        let repositoryCalled = false;
        const harness = setup(createRepository({
            getKioskConfig: async () => {
                repositoryCalled = true;
                return config;
            }
        }));
        const res = await invoke(harness.route('get', '/api/kiosks/:kioskId/config'), {
            params: { kioskId: 'bad id' }
        });
        assert.equal(res.statusCode, 400);
        assert.equal(repositoryCalled, false);
    }

    {
        const harness = setup(createRepository({ getKioskConfig: async () => null }));
        const res = await invoke(harness.route('get', '/api/kiosks/:kioskId/config'), {
            params: { kioskId: 'LT-KIOSK-404' }
        });
        assert.equal(res.statusCode, 404);
    }

    {
        const harness = setup();
        const res = await invoke(harness.route('get', '/api/kiosks/:kioskId/config'), {
            params: { kioskId: 'LT-KIOSK-01' }
        });
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, {
            kioskId: 'LT-KIOSK-01',
            displayName: 'Main entrance',
            description: null,
            originType: 'coordinate',
            originMappedinId: null,
            floorId: 'f_1',
            latitude: 10,
            longitude: 106,
            heading: 0,
            defaultZoom: 19,
            isActive: true
        });
    }

    {
        const unavailableRepository = createKioskRepository({
            getDbConnection: async () => null,
            sql: {} as any
        });
        const harness = setup(unavailableRepository as any);
        const res = await invoke(harness.route('get', '/api/kiosks/:kioskId/config'), {
            params: { kioskId: 'LT-KIOSK-01' }
        });
        assert.equal(res.statusCode, 503);
    }

    {
        const harness = setup();
        const adminRoutes = harness.app.routes.filter((route) => route.path.startsWith('/api/admin/kiosks'));
        assert.equal(adminRoutes.length, 4);
        for (const route of adminRoutes) {
            assert.equal(route.handlers[0], harness.requireAdmin, `${route.method} ${route.path} must use requireAdmin`);
        }
    }

    {
        let capturedInput: any;
        let capturedUpdatedBy: unknown;
        const harness = setup(createRepository({
            upsertKioskDevice: async (input: unknown, updatedBy: unknown) => {
                capturedInput = input;
                capturedUpdatedBy = updatedBy;
                return config;
            }
        }));
        const res = await invoke(harness.route('put', '/api/admin/kiosks/:kioskId'), {
            params: { kioskId: 'lt-kiosk-01' },
            admin: { sub: 'token-admin' },
            body: {
                kioskId: 'BODY-KIOSK',
                displayName: 'Main entrance',
                originType: 'coordinate',
                floorId: 'f_1',
                latitude: 0,
                longitude: 0,
                isActive: false,
                updatedBy: 'body-admin'
            }
        });
        assert.equal(res.statusCode, 200);
        assert.equal(capturedInput.kioskId, 'LT-KIOSK-01');
        assert.equal(capturedInput.isActive, false);
        assert.equal('updatedBy' in capturedInput, false);
        assert.equal(capturedUpdatedBy, 'token-admin');
    }

    {
        let repositoryCalled = false;
        const harness = setup(createRepository({
            setKioskDeviceActive: async () => {
                repositoryCalled = true;
                return true;
            }
        }));
        const res = await invoke(harness.route('patch', '/api/admin/kiosks/:kioskId/active'), {
            params: { kioskId: 'LT-KIOSK-01' },
            admin: { sub: 'token-admin' },
            body: { isActive: 0 }
        });
        assert.equal(res.statusCode, 400);
        assert.equal(repositoryCalled, false);
    }

    {
        const harness = setup(createRepository({ setKioskDeviceActive: async () => false }));
        const res = await invoke(harness.route('patch', '/api/admin/kiosks/:kioskId/active'), {
            params: { kioskId: 'LT-KIOSK-404' },
            admin: { sub: 'token-admin' },
            body: { isActive: false }
        });
        assert.equal(res.statusCode, 404);
    }

    {
        const secretSqlDetail = 'SELECT * FROM KioskDevices; Server=secret-db';
        const harness = setup(createRepository({
            getKioskConfig: async () => {
                throw new Error(secretSqlDetail);
            }
        }));
        const originalConsoleError = console.error;
        console.error = () => undefined;
        try {
            const res = await invoke(harness.route('get', '/api/kiosks/:kioskId/config'), {
                params: { kioskId: 'LT-KIOSK-01' }
            });
            assert.equal(res.statusCode, 500);
            assert.deepEqual(res.body, { error: 'Unexpected server error' });
            assert.equal(JSON.stringify(res.body).includes(secretSqlDetail), false);
        } finally {
            console.error = originalConsoleError;
        }
    }
}

run()
    .then(() => console.log('kioskRoutes tests passed'))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
