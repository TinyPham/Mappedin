import assert from 'node:assert/strict';
import {
    KioskDatabaseUnavailableError,
    KioskRepositoryValidationError,
    createKioskRepository
} from './kioskRepository';

type Execution = {
    procedure: string;
    inputs: Array<{ name: string; type: unknown; value: unknown }>;
};

const sqlTypes = {
    NVarChar: (length: number) => ({ type: 'NVarChar', length }),
    Decimal: (precision: number, scale: number) => ({ type: 'Decimal', precision, scale }),
    Bit: { type: 'Bit' }
};

function createFakeDb(results: Array<unknown | Error>) {
    const executions: Execution[] = [];

    return {
        executions,
        db: {
            request() {
                const inputs: Execution['inputs'] = [];
                return {
                    input(name: string, type: unknown, value: unknown) {
                        inputs.push({ name, type, value });
                        return this;
                    },
                    async execute(procedure: string) {
                        executions.push({ procedure, inputs });
                        const result = results.shift();
                        if (result instanceof Error) throw result;
                        return result;
                    }
                };
            }
        }
    };
}

const dbRow = {
    KioskId: 'LT-KIOSK-01',
    DisplayName: 'Main entrance',
    Description: null,
    OriginType: 'coordinate',
    OriginMappedinID: null,
    FloorId: 'f_1',
    Latitude: '0.0000000000',
    Longitude: '106.1234000000',
    Heading: '0.0000',
    DefaultZoom: '1.0000',
    IsActive: 0,
    CreatedAt: new Date('2026-07-01T00:00:00.000Z'),
    UpdatedAt: new Date('2026-07-02T00:00:00.000Z'),
    UpdatedBy: 'admin'
};

async function run() {
    const fake = createFakeDb([
        { recordset: [dbRow] },
        { recordset: [dbRow] },
        { recordset: [dbRow] },
        { recordset: [dbRow] },
        { recordset: [{ UpdatedRows: 0 }] }
    ]);
    const repository = createKioskRepository({
        getDbConnection: async () => fake.db as any,
        sql: sqlTypes as any
    });

    const expectedConfig = {
        kioskId: 'LT-KIOSK-01',
        displayName: 'Main entrance',
        description: null,
        originType: 'coordinate',
        originMappedinId: null,
        floorId: 'f_1',
        latitude: 0,
        longitude: 106.1234,
        heading: 0,
        defaultZoom: 1,
        isActive: false,
        createdAt: dbRow.CreatedAt,
        updatedAt: dbRow.UpdatedAt,
        updatedBy: 'admin'
    };

    assert.deepEqual(await repository.getKioskConfig('LT-KIOSK-01'), expectedConfig);
    assert.deepEqual(await repository.getKioskDeviceById('LT-KIOSK-01'), expectedConfig);
    assert.deepEqual(await repository.listKioskDevices(), [expectedConfig]);
    assert.deepEqual(await repository.upsertKioskDevice({
        kioskId: 'LT-KIOSK-01',
        displayName: 'Main entrance',
        description: null,
        originType: 'coordinate',
        originMappedinId: null,
        floorId: 'f_1',
        latitude: 0,
        longitude: 0,
        heading: 0,
        defaultZoom: 1,
        isActive: false
    }, 'admin'), expectedConfig);
    assert.equal(await repository.setKioskDeviceActive('LT-KIOSK-01', false, 'admin'), false);

    assert.deepEqual(fake.executions.map((entry) => entry.procedure), [
        'dbo.SP_GetKioskConfig',
        'dbo.SP_GetKioskDeviceById',
        'dbo.SP_GetAllKioskDevices',
        'dbo.SP_UpsertKioskDevice',
        'dbo.SP_SetKioskDeviceActive'
    ]);

    const upsertInputs = Object.fromEntries(fake.executions[3].inputs.map((input) => [input.name, input.value]));
    assert.equal(upsertInputs.Latitude, 0);
    assert.equal(upsertInputs.Longitude, 0);
    assert.equal(upsertInputs.Heading, 0);
    assert.equal(upsertInputs.DefaultZoom, 1);
    assert.equal(upsertInputs.IsActive, false);
    assert.equal(upsertInputs.UpdatedBy, 'admin');

    const activeInputs = Object.fromEntries(fake.executions[4].inputs.map((input) => [input.name, input.value]));
    assert.equal(activeInputs.IsActive, false);
    assert.equal(activeInputs.UpdatedBy, 'admin');

    const sqlValidationError = Object.assign(new Error('Latitude must be between -90 and 90.'), { number: 51005 });
    const invalidFake = createFakeDb([sqlValidationError]);
    const invalidRepository = createKioskRepository({
        getDbConnection: async () => invalidFake.db as any,
        sql: sqlTypes as any
    });
    await assert.rejects(
        () => invalidRepository.getKioskConfig('LT-KIOSK-01'),
        KioskRepositoryValidationError
    );

    const unavailableRepository = createKioskRepository({
        getDbConnection: async () => null,
        sql: sqlTypes as any
    });
    await assert.rejects(
        () => unavailableRepository.listKioskDevices(),
        KioskDatabaseUnavailableError
    );

    const disconnectedError = Object.assign(new Error('Connection is closed'), { code: 'ECONNCLOSED' });
    const disconnectedFake = createFakeDb([disconnectedError]);
    const disconnectedRepository = createKioskRepository({
        getDbConnection: async () => disconnectedFake.db as any,
        sql: sqlTypes as any
    });
    await assert.rejects(
        () => disconnectedRepository.listKioskDevices(),
        KioskDatabaseUnavailableError
    );
}

run()
    .then(() => console.log('kioskRepository tests passed'))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
