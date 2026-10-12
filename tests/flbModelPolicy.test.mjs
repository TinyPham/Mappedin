import test from 'node:test';
import assert from 'node:assert/strict';

const moduleUrl = new URL('../src/map/flbModelPolicy.js', import.meta.url);
let policy;
try { policy = await import(moduleUrl); } catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }
const manifest = { entries: [{ flbNo: 1, uuid: 'assigned-instance', assetUrl: '/Model3D/flb/FLB-01.glb', assetVersion: 'abcdef123456', placement: { status: 'unplaced' } }] };
test('FLB policy module exists', () => assert.ok(policy, 'FLB policy implementation is missing'));
test('detects explicit UUID or exact URL, ignoring host and query but never names or directory guesses', () => {
  assert.ok(policy.isFlbModel({ uuid: 'assigned-instance', name: 'renamed' }, manifest));
  assert.ok(policy.isFlbModel({ url: 'https://airport.example/Model3D/flb/FLB-01.glb?v=old' }, manifest));
  assert.ok(policy.isFlbModel({ url: './Model3D/flb/FLB-01.glb' }, manifest));
  for (const model of [{ name: 'FLB 01' }, { url: '/Model3D/flb/unregistered.glb' }, { uuid: 'other' }, null]) assert.equal(policy.isFlbModel(model, manifest), false);
});
test('asset URL is stable, uses manifest version and rejects unknown assets', () => {
  const model = { uuid: 'assigned-instance', url: 'outdated.glb' };
  assert.equal(policy.getFlbAssetUrl(model, manifest), `${manifest.entries[0].assetUrl}?v=abcdef123456`);
  assert.equal(policy.getFlbAssetUrl(model, manifest), policy.getFlbAssetUrl(model, manifest));
  assert.equal(policy.getFlbAssetUrl({ name: 'FLB 01' }, manifest), null);
});
test('unplaced sign is recognized but cannot load; verified sign is persistent only on its own floor', () => {
  const model = { uuid: 'assigned-instance', displayWebsite: false };
  assert.equal(policy.getFlbModelPolicy(model, manifest, { currentFloorId: 'floor' }).shouldLoad, false);
  const verified = structuredClone(manifest);
  verified.entries[0].placement = { status: 'verified', floorId: 'floor', latitude: 10, longitude: 106, elevation: 0, rotation: [0, 0, 0], scale: [1, 1, 1], source: 'survey', evidence: 'checked anchor' };
  const result = policy.getFlbModelPolicy(model, verified, { currentFloorId: 'floor', zoom: 0, distance: 10000 });
  assert.equal(result.shouldLoad, true);
  assert.equal(result.keepLoaded, true);
  assert.equal(result.priority, 'signage');
  assert.equal(result.assetUrl, `${verified.entries[0].assetUrl}?v=abcdef123456`);
  assert.equal(policy.getFlbModelPolicy(model, verified, { currentFloorId: 'other' }).keepLoaded, false);
  assert.equal(policy.getFlbModelPolicy({ uuid: 'unassigned-shadow', url: verified.entries[0].assetUrl }, verified, { currentFloorId: 'floor' }).shouldLoad, false);
  assert.equal(policy.getFlbModelPolicy({ url: verified.entries[0].assetUrl }, verified, { currentFloorId: 'floor' }).shouldLoad, false);
  verified.entries[0].placement.latitude = NaN;
  assert.equal(policy.getFlbModelPolicy(model, verified, { currentFloorId: 'floor' }).shouldLoad, false);
});
test('UUID and URL resolving to different signs fail closed', () => {
  const conflicting = { entries: [...manifest.entries, { ...manifest.entries[0], flbNo: 2, uuid: 'second', assetUrl: '/Model3D/flb/FLB-02.glb' }] };
  assert.equal(policy.isFlbModel({ uuid: 'assigned-instance', url: conflicting.entries[1].assetUrl }, conflicting), false);
});
