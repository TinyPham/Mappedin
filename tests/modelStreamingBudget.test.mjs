import test from 'node:test';
import assert from 'node:assert/strict';
import { executeFunction } from './helpers/mainSource.mjs';

function streaming({ loadedCount = 0, pendingCount = 0, candidates = [], loadedFloor = 'floor3', loadedName = 'Tree', onLoad } = {}) {
  const instances = new Map(), metadata = new Map(), pending = new Map(), added = [], removed = [];
  const floor = { id: 'floor3', name: 'Check-in', elevation: 3 };
  for (let i = 0; i < loadedCount; i++) {
    const uuid = `loaded-${i}`, instance = { id: uuid };
    instances.set(uuid, instance);
    metadata.set(uuid, { uuid, floorId: loadedFloor, name: loadedName, originalCoordinate: { latitude: i + 1, longitude: 0 } });
  }
  for (let i = 0; i < pendingCount; i++) pending.set(`pending-${i}`, Promise.resolve());
  const distance = (a, b) => Math.abs(a.latitude - b.latitude);
  const mapView = { currentFloor: floor, Camera: { center: { latitude: 0, longitude: 0 } },
    Models: { remove: instance => { removed.push(instance.id); } } };
  const update = executeFunction('updateModelStreaming', {
    debounce: callback => callback,
    window: {}, isGlobalSwitchingFloor: false,
    mapView,
    mapData: { getByType: () => [{ id: 'floor1', elevation: 1 }, floor] },
    modelStreamingGeneration: 0,
    getCameraZoom: () => 20, isMobile: false,
    getModelStreamingZoomThresholds: () => ({ load: 18, unload: 17, loadRadius: 500, unloadRadius: 600 }),
    mapDebugLog: () => {},
    TranslationManager: { data: { locations: {} } },
    MODEL_INSTANCE_REGISTRY: instances, MODEL_ID_REGISTRY: metadata, _pendingModelLoads: pending,
    _allModelMetadata: candidates.map(model => ({ floorId: floor.id, latitude: 0, longitude: 0, ...model })),
    calculateDistance: distance,
    isPersistentLowerFloorModel: model => Boolean(model.persistent),
    _addSingleModelToMap: model => {
      added.push(model.uuid);
      const startingFloor = mapView.currentFloor.id;
      const promise = Promise.resolve().then(async () => {
        await onLoad?.();
        if (mapView.currentFloor.id !== startingFloor) return;
        assert.ok(instances.size < 80, 'loaded and reserved capacity must remain bounded');
        instances.set(model.uuid, { id: model.uuid });
        metadata.set(model.uuid, { ...model, originalCoordinate: { latitude: model.latitude, longitude: model.longitude } });
      }).finally(() => pending.delete(model.uuid));
      pending.set(model.uuid, promise);
      return promise;
    },
    setTimeout: callback => { callback(); return 1; }
  });
  return { update, instances, added, removed, switchFloor: () => mapView.currentFloor = { id: 'floor2', elevation: 2 } };
}

test('streaming limits loads to 80 and prioritizes signage and connections over decoration', async () => {
  const candidates = Array.from({ length: 120 }, (_, i) => ({ uuid: `tree-${i}`, name: 'Tree', latitude: i }));
  candidates.push({ uuid: 'far-flb', name: 'FLB 01', flbVerified: true, latitude: 100 });
  candidates.push({ uuid: 'far-lift', name: 'Elevator', latitude: 1000 });
  const h = streaming({ candidates }); await h.update();
  assert.equal(h.instances.size, 80);
  assert.deepEqual(h.added.slice(0, 2), ['far-flb', 'far-lift']);
});

test('current-floor FLB can displace lower-floor protected models at the hard limit', async () => {
  const h = streaming({ loadedCount: 80, loadedFloor: 'floor1', loadedName: 'Elevator',
    candidates: [{ uuid: 'current-flb', name: 'FLB 01', flbVerified: true }] });
  await h.update(); assert.ok(h.instances.has('current-flb'));
  assert.equal(h.instances.size, 80); assert.equal(h.removed.length, 1);
});

test('a floor change cancels the remaining queued batches', async () => {
  let finish;
  const blocked = new Promise(resolve => finish = resolve);
  const h = streaming({ candidates: Array.from({ length: 30 }, (_, i) => ({ uuid: `tree-${i}`, name: 'Tree' })), onLoad: () => blocked });
  const running = h.update(); await Promise.resolve(); await Promise.resolve();
  assert.equal(h.added.length, 3); h.switchFloor(); finish(); await running;
  assert.equal(h.added.length, 3, 'old-floor batches must not keep reserving capacity');
});

test('an SDK model resolving after a floor change is removed instead of registered', async () => {
  const instances = new Map(), metadata = new Map(), removed = [];
  let finish;
  const mapView = { currentFloor: { id: 'floor3' }, createCoordinate: () => ({}), Models: {
    add: () => new Promise(resolve => finish = resolve), remove: model => removed.push(model.id)
  } };
  const load = executeFunction('_addSingleModelToMapRaw', {
    mapView, mapData: { getByType: () => [{ id: 'floor3' }] },
    MODEL_INSTANCE_REGISTRY: instances, MODEL_ID_REGISTRY: metadata,
    getFlbManifestEntry: () => null, flbManifest: {}, flbPersistence: { generation: () => 0 },
    car: '', tree_palm: '', resolveUrl: value => value, getFlbAssetUrl: () => null,
    mapDebugLog: () => {}
  });
  const running = load({ uuid: 'pending-tree', name: 'Tree', latitude: 10, longitude: 107, floorId: 'floor3', url: 'data:fixture' });
  mapView.currentFloor = { id: 'floor1' }; finish({ id: 'late-sdk-model' }); await running;
  assert.deepEqual(removed, ['late-sdk-model']);
  assert.equal(instances.size, 0); assert.equal(metadata.size, 0);
});

test('discarded pending loads schedule reconciliation on the new floor without waiting for camera movement', async () => {
  const instances = new Map(), pending = new Map();
  let finish, refreshes = 0;
  const mapView = { currentFloor: { id: 'floor1' } };
  const load = executeFunction('_addSingleModelToMap', {
    MODEL_INSTANCE_REGISTRY: instances, _pendingModelLoads: pending, mapView,
    _addSingleModelToMapRaw: () => new Promise(resolve => finish = resolve),
    window: { updateModelStreaming: () => { refreshes++; assert.equal(pending.size, 0); } }
  });
  const old = load({ uuid: 'lift' }); await Promise.resolve();
  mapView.currentFloor = { id: 'floor3' }; finish(undefined); await old;
  assert.equal(refreshes, 1, 'new-floor eligible models need an automatic retry after stale reservations clear');
});

test('pending loads consume capacity so camera refreshes cannot overbook the budget', async () => {
  const h = streaming({ loadedCount: 76, pendingCount: 4, candidates: [{ uuid: 'tree', name: 'Tree' }] });
  await h.update(); assert.deepEqual(h.added, []); assert.equal(h.instances.size, 76);
});

test('an essential connection arriving at a full budget displaces decoration', async () => {
  const h = streaming({ loadedCount: 80, candidates: [{ uuid: 'new-lift', name: 'Elevator', latitude: 1000 }] });
  await h.update();
  assert.ok(h.instances.has('new-lift'), 'essential connections must not be starved by existing decorations');
  assert.equal(h.instances.size, 80); assert.equal(h.removed.length, 1);
});
