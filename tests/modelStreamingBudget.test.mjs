import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { functionText, ts } from './helpers/mainSource.mjs';
import { getModelStreamingZoomThresholds } from '../src/performance/modelStreamingThresholds.js';

const approved = JSON.parse(readFileSync(new URL('./fixtures/approved-model-streaming.json', import.meta.url)));

function session({ baseline = false, models = [], zoom = 20, mobile = false, loadedCount = 0, pendingCount = 0, delaySdk = false } = {}) {
  const instances = new Map(), metadata = new Map(), pending = new Map(), added = [], removed = [], completions = [];
  const floor = { id: 'floor3', name: 'Check-in', elevation: 3 };
  const floors = [{ id: 'floor1', name: 'Arrivals', elevation: 1 }, floor];
  const window = {};
  for (let i = 0; i < loadedCount; i++) {
    const uuid = `existing-${i}`;
    instances.set(uuid, { id: uuid });
    metadata.set(uuid, { uuid, floorId: floor.id, name: 'Tree', originalCoordinate: { latitude: 0, longitude: 0 } });
  }
  for (let i = 0; i < pendingCount; i++) pending.set(`pending-${i}`, Promise.resolve());
  const mapView = { currentFloor: floor, Camera: { center: { latitude: 0, longitude: 0 } },
    createCoordinate: (latitude, longitude, target) => ({ latitude, longitude, floorId: target.id }),
    Models: {
      add: async (coordinate, url, options) => {
        const instance = { id: `sdk-${added.length}` };
        added.push({ coordinate, url, options });
        if (delaySdk) await new Promise(resolve => completions.push(resolve));
        return instance;
      },
      remove: instance => removed.push(instance.id)
    }
  };
  const input = models.map(model => ({ floorId: floor.id, latitude: 0, longitude: 0, name: 'Tree', url: 'data:fixture', ...model }));
  const context = {
    debounce: callback => callback, window, isGlobalSwitchingFloor: false, _loadedFloors: new Set(),
    mapView, mapData: { getByType: () => floors }, getCameraZoom: () => zoom, isMobile: mobile,
    getModelStreamingZoomThresholds,
    TranslationManager: { data: { locations: {} } },
    MODEL_INSTANCE_REGISTRY: instances, MODEL_ID_REGISTRY: metadata, _pendingModelLoads: pending, _allModelMetadata: input,
    calculateDistance: (a, b) => Math.hypot(a.latitude - b.latitude, a.longitude - b.longitude),
    isPersistentLowerFloorModel: model => Boolean(model.persistent),
    getFlbManifestEntry: () => null, flbManifest: {}, flbPersistence: { generation: () => 0 },
    car: '', tree_palm: '', resolveUrl: value => value, getFlbAssetUrl: () => null,
    mapDebugLog: () => {}, console: { log() {}, error(error) { throw error; } },
    Date: { now: () => 123456 }, setTimeout: callback => { callback(); return 1; }
  };
  const names = Object.keys(approved.functions);
  const code = names.map(name => baseline ? `const ${name} = ${approved.functions[name]};` : functionText(name)).join('\n');
  const compiled = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const functions = Function(...Object.keys(context), `${compiled}; return { ${names.join(',')} };`)(...Object.values(context));
  window.updateModelStreaming = functions.updateModelStreaming;
  return { ...functions, added, removed, instances, pending, completions, mapView,
    result: () => ({ uuids: [...instances.keys()], added, removed, pending: pending.size }) };
}

test('zooming into a dense area retains the approved 300-model budget', async () => {
  const models = Array.from({ length: 230 }, (_, i) => ({ uuid: `tree-${i}`, latitude: i / 3 }));
  const current = session({ models }); await current.updateModelStreaming();
  assert.equal(current.instances.size, 230, 'Approved visible models must not be cut off by the later 80-model policy');
});

test('desktop and mobile zoom/radius decisions match the approved loader', async () => {
  const models = [
    { uuid: 'near', latitude: 20 }, { uuid: 'medium', latitude: 160 }, { uuid: 'far', latitude: 260 },
    { uuid: 'lift', name: 'Elevator', floorId: 'floor1', latitude: 1000 }
  ];
  for (const mobile of [false, true]) for (const zoom of [16.5, 17, 18.9, 19.3, 20]) {
    const options = { models, mobile, zoom };
    const old = session({ ...options, baseline: true }), current = session(options);
    await old.updateModelStreaming(); await current.updateModelStreaming();
    assert.deepEqual(current.result(), old.result(), `mobile=${mobile}, zoom=${zoom}`);
  }
});

test('original signage/nearest-model priority and reservation accounting are preserved', async () => {
  for (const loadedCount of [0, 290, 296]) {
    const options = { loadedCount, pendingCount: 4, models: [
      { uuid: 'far-lift', name: 'Elevator', latitude: 1000 }, { uuid: 'near-tree', latitude: 1 },
      { uuid: 'flb', name: 'FLB 01', flbVerified: true, latitude: 100 }
    ] };
    const old = session({ ...options, baseline: true }), current = session(options);
    await old.updateModelStreaming(); await current.updateModelStreaming();
    assert.deepEqual(current.result(), old.result());
  }
});

test('pending and completed UUID loads still reuse one SDK instance', async () => {
  const current = session({ delaySdk: true });
  const model = { uuid: 'same-tree', name: 'Tree', floorId: 'floor3', latitude: 0, longitude: 0, url: 'data:fixture' };
  const first = current._addSingleModelToMap(model), second = current._addSingleModelToMap(model);
  assert.equal(first, second); await Promise.resolve(); assert.equal(current.added.length, 1);
  current.completions[0](); const instance = await first;
  assert.equal(await current._addSingleModelToMap(model), instance); assert.equal(current.added.length, 1);
});

test('eligible lower-floor models finishing during a floor switch match the approved behavior', async () => {
  const model = { uuid: 'lift', name: 'Elevator', floorId: 'floor1', latitude: 0, longitude: 0, url: 'data:fixture' };
  const old = session({ baseline: true, delaySdk: true }), current = session({ delaySdk: true });
  for (const h of [old, current]) {
    h.mapView.currentFloor = { id: 'floor1' };
    const loading = h._addSingleModelToMap(model); await Promise.resolve();
    h.mapView.currentFloor = { id: 'floor3' }; h.completions[0](); await loading;
  }
  assert.deepEqual(current.result(), old.result());
  assert.ok(current.instances.has('lift'));
});
