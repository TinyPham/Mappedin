import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync('main/main-function/index.ts', 'utf8');

test('SDK view is created while initial data is pending, but data-dependent setup waits', async () => {
  const events = [];
  let resolveData;
  let resolveMap;
  const initialData = new Promise(resolve => { resolveData = resolve; });
  const mapData = new Promise(resolve => { resolveMap = resolve; });
  const start = source.indexOf('async function init()');
  const end = source.indexOf('// Cấu hình độ nhạy Camera', start);
  const script = ts.transpile(source.slice(start, end) + '\n}\ninit();', {
    target: ts.ScriptTarget.ES2020,
  });
  const startup = vm.runInNewContext(script, {
    window: { addEventListener() {} },
    document: { getElementById: () => null, addEventListener() {} },
    console: { log() {}, warn() {} },
    isViewOnly: false,
    TranslationManager: { init: () => { events.push('initial-data'); return initialData; } },
    checkIsLocal: () => false,
    getApiBaseUrl: () => 'https://example.test/api',
    getMapData: () => { events.push('map-data'); return mapData; },
    show3dMap: () => { events.push('map-view'); return {}; },
    setTimeout: callback => { queueMicrotask(callback); },
  });
  let complete = false;
  const completed = startup.then(() => { complete = true; });
  // Older code waits for initial-data and cannot even request Map data yet.
  assert.deepEqual(events, ['initial-data', 'map-data']);
  resolveMap({ getByType: () => [] });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(events, ['initial-data', 'map-data', 'map-view']);
  assert.equal(complete, false);
  resolveData();
  await completed;
  assert.equal(complete, true);
});

test('initial data starts before Map core and joins only after the SDK view is created', () => {
  const start = source.indexOf('const initialDataPromise = TranslationManager.init();');
  const data = source.indexOf('const mapData = await getMapData(', start);
  const view = source.indexOf('const mapView = await show3dMap(', data);
  const join = source.indexOf('await initialDataPromise;', view);
  const setup = source.indexOf('// Cấu hình độ nhạy Camera', view);
  assert.ok(start > 0 && data > start && view > data && join > view && setup > join);
  assert.doesNotMatch(source.slice(start, view), /await initialDataPromise/);
});

test('startup gate is released after interaction setup, never by model metadata or a timer', () => {
  assert.match(source, /const startupGatePromise = new Promise<void>/);
  const setup = source.indexOf('initFlightInfoUI();');
  const ready = source.indexOf('markMapReady();', setup);
  assert.ok(ready > setup);
  assert.doesNotMatch(source, /markStartupAssetsReady|startupAssetsReadyPromise/);
  assert.doesNotMatch(source.slice(source.indexOf('async function init()'), source.indexOf('// Init Translations')), /withStartupTimeout/);
  assert.match(source, /startupGatePromise\.then\(dismissStartupLoadingOverlay\)/);
});

test('late model metadata schedules streaming without modifying the loading overlay', () => {
  const start = source.indexOf('const loadModelsFromAPI = async');
  const end = source.indexOf('// HỆ THỐNG MODEL STREAMING', start);
  const loader = source.slice(start, end);
  assert.match(loader, /_allModelMetadata = models/);
  assert.match(loader, /updateModelStreaming\(\)/);
  assert.doesNotMatch(loader, /loadingText|loadingBar|markMapReady/);
});
