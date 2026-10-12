import test from 'node:test';
import assert from 'node:assert/strict';
let createModelLoadRegistry;
try { ({ createModelLoadRegistry } = await import('../src/map/modelLoadRegistry.js')); } catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }
test('model load registry exists', () => assert.equal(typeof createModelLoadRegistry, 'function'));
test('concurrent and completed requests share exactly one instance per UUID', async () => {
  const registry = createModelLoadRegistry();
  let finish, calls = 0;
  const load = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const first = registry.load('uuid', load);
  const second = registry.load('uuid', load);
  assert.equal(first, second);
  assert.equal(registry.has('uuid'), true);
  await Promise.resolve();
  assert.equal(calls, 1);
  const instance = { id: 'sdk-instance' };
  finish(instance);
  assert.equal(await first, instance);
  assert.equal(await registry.load('uuid', load), instance);
  assert.equal(calls, 1);
  assert.equal(registry.get('uuid'), instance);
});
test('failed and empty loads clear pending state so retries can succeed', async () => {
  const registry = createModelLoadRegistry();
  await assert.rejects(registry.load('uuid', () => { throw new Error('network'); }), /network/);
  assert.equal(registry.has('uuid'), false);
  await assert.rejects(registry.load('uuid', () => undefined), /instance/);
  assert.equal(registry.has('uuid'), false);
  assert.deepEqual(await registry.load('uuid', () => ({ id: 'ok' })), { id: 'ok' });
});
test('pending entries cannot be forgotten and duplicate SDK loads cannot race with unload', async () => {
  const registry = createModelLoadRegistry();
  let finish;
  const promise = registry.load('uuid', () => new Promise(resolve => { finish = resolve; }));
  assert.equal(registry.delete('uuid'), false);
  await Promise.resolve();
  finish({ id: 'ok' });
  await promise;
  assert.equal(registry.delete('uuid'), true);
  assert.equal(registry.has('uuid'), false);
  assert.deepEqual(await registry.load('uuid', () => ({ id: 'new' })), { id: 'new' });
});
test('distinct explicit proxy IDs remain distinct and invalid IDs never invoke loader', async () => {
  const registry = createModelLoadRegistry();
  assert.notEqual(await registry.load('original', () => ({})), await registry.load('proxy', () => ({})));
  for (const uuid of ['', null, undefined, ' ']) assert.throws(() => registry.load(uuid, () => assert.fail('must not load')), /UUID/);
});
