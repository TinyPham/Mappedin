import assert from 'node:assert/strict';
import express from 'express';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { getAirportOperations } from './operationsRepository';
import { registerAirportOperationsRoutes } from './operationsRoutes';

async function run() {
    const root = path.resolve(__dirname, __filename.endsWith('.js') ? '../../..' : '../..');
    const configContent = readFileSync(path.join(root, 'src/config/airportOperations.json'), 'utf8');
    const config = JSON.parse(configContent);
    const current = getAirportOperations();
    for (const key of Object.keys(config)) assert.deepEqual(current[key], config[key], `preserve config field ${key}`);
    assert.equal(current.version, 'airport-operations-v1');
    assert.equal(current.profileId, 'full-t1');
    assert.equal(current.profile.id, current.profileId);
    assert.equal(current.overviewFloorId, 'f_36653dc40b36e121');
    assert.equal(current.gates.length, 49);
    assert.equal(current.counters.length, 234);
    assert.equal(current.zones.length, 9);
    assert.match(current.metadata.checksum, /^sha256:[a-f0-9]{64}$/);
    assert.equal(current.metadata.checksum, `sha256:${createHash('sha256').update(configContent).digest('hex')}`);
    for (const value of [null, 1, true, [], {}, '', ' full-t1 ']) {
        for (const field of ['profile', 'version']) {
            assert.throws(() => getAirportOperations({ [field]: value }), error =>
                (error as any).status === 400 && (error as any).code === 'INVALID_OPERATIONS_REQUEST');
        }
    }
    for (const gateNo of [9, 10, 17, 28, 34, 43, 44]) {
        const gate = current.gates.find(g => g.gateNo === gateNo);
        assert.ok(gate);
        assert.equal(gate.floorId, 'm_41a38d6d0411d397');
        assert.equal(gate.accessRole, 'departure');
    }
    const initial = getAirportOperations({ profile: 'initial-operations', version: current.version });
    assert.equal(initial.profileId, 'initial-operations');
    assert.deepEqual(initial.profile.openIslands, ['A', 'B', 'C', 'D']);
    assert.equal(initial.profile.counterLimits.D, 14);
    assert.equal(initial.gates.length, 49, 'profile selection preserves infrastructure metadata');
    assert.deepEqual(initial.gates, current.gates);
    initial.profile.openGateNos.length = 0;
    assert.ok(getAirportOperations({ profile: 'initial-operations' }).profile.openGateNos.length > 0);

    const app = express();
    registerAirportOperationsRoutes(app);
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    try {
        const address = server.address() as { port: number };
        const endpoint = `http://127.0.0.1:${address.port}/api/airport-operations`;
        const response = await fetch(endpoint);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), current);
        const selected = await fetch(`${endpoint}?profile=initial-operations&version=${current.version}`);
        assert.equal(selected.status, 200);
        assert.equal((await selected.json()).profileId, 'initial-operations');
        for (const query of [
            'profile=', 'version=', 'profile=%20', 'profile=bad%20id',
            'profile=full-t1&profile=initial-operations', 'version=x&version=y',
            'profile[id]=full-t1', 'version[id]=airport-operations-v1'
        ]) {
            const invalid = await fetch(`${endpoint}?${query}`);
            assert.equal(invalid.status, 400, query);
            assert.equal((await invalid.json()).code, 'INVALID_OPERATIONS_REQUEST');
        }
        for (const query of ['profile=missing', 'profile=__proto__', 'profile=constructor', 'version=airport-operations-v0']) {
            const unknown = await fetch(`${endpoint}?${query}`);
            assert.equal(unknown.status, 404, query);
            assert.equal((await unknown.json()).code, 'OPERATIONS_CONFIG_NOT_FOUND');
        }
        for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
            assert.equal((await fetch(endpoint, { method })).status, 404, method);
        }
    } finally {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
    const source = readFileSync(path.join(root, 'backend/server.ts'), 'utf8');
    assert.match(source, /import\s*\{\s*registerAirportOperationsRoutes\s*\}\s*from\s*['"]\.\/airportOperations\/operationsRoutes['"]/);
    assert.match(source, /registerAirportOperationsRoutes\(app\)/);
    console.log('operationsRepository and operationsRoutes tests passed');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
