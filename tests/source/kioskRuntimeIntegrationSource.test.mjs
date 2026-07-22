import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../../main/main-function/index.ts', import.meta.url), 'utf8');

function blockBetween(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing start marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

function extractFunction(functionName) {
  const asyncStart = source.indexOf(`async function ${functionName}(`);
  const syncStart = source.indexOf(`function ${functionName}(`);
  const start = asyncStart >= 0 ? asyncStart : syncStart;
  assert.notEqual(start, -1, `missing function: ${functionName}`);

  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}') depth--;
    if (depth === 0) return source.slice(start, index + 1);
  }

  assert.fail(`unterminated function: ${functionName}`);
}

function loadRequestUsableLegDirections() {
  const functionSource = extractFunction('requestUsableLegDirections');
  const executableSource = ts.transpileModule(functionSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 }
  }).outputText;
  return Function(`"use strict"; ${executableSource}; return requestUsableLegDirections;`)();
}

function loadDrawThenCommitNavigation() {
  const functionSource = extractFunction('drawThenCommitNavigation');
  const executableSource = ts.transpileModule(functionSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 }
  }).outputText;
  return Function(`"use strict"; ${executableSource}; return drawThenCommitNavigation;`)();
}

test('init loads kiosk runtime after map objects and before wayfinding state', () => {
  assert.match(source, /from\s+["']\.\.\/\.\.\/src\/kiosk\/kioskRuntime\.js["']/);

  const objectsIndex = source.indexOf('const allMapObjects = getAllMapObjects();');
  const runtimeIndex = source.indexOf('await loadKioskRuntime(window.location.href');
  const stateIndex = source.indexOf('let wayfindingOrigin: any =');

  assert.ok(objectsIndex >= 0 && runtimeIndex > objectsIndex);
  assert.ok(stateIndex > runtimeIndex);
  assert.match(source, /findMappedinObject:[\s\S]*mappedinId[\s\S]*\.toLowerCase\(\)/);
  assert.match(source, /createCoordinate:[\s\S]*mapView\.createCoordinate\(/);
  assert.match(source, /let wayfindingOrigin: any = getEffectiveWayfindingOrigin\(kioskRuntime, null\)/);
});

test('draw, reset, clear and selection paths preserve kiosk origin', () => {
  const drawBlock = blockBetween('const drawNavigation = async () =>', '(window as any).drawNavigation = drawNavigation;');
  assert.match(drawBlock, /wayfindingOrigin\s*=\s*getEffectiveWayfindingOrigin\(kioskRuntime, wayfindingOrigin\)/);

  const resetBlock = blockBetween('const resetWayfinding = (', '(window as any).startSelectingNode =');
  assert.match(resetBlock, /wayfindingOrigin\s*=\s*getEffectiveWayfindingOrigin\(kioskRuntime, null\)/);

  const clearBlock = blockBetween('(window as any).clearNode =', 'let draggedNodeIndex');
  assert.match(clearBlock, /type === ['"]origin['"] && kioskRuntime\.isKioskMode/);

  const selectBlock = blockBetween('(window as any).startSelectingNode =', '(window as any).addStopover');
  assert.match(selectBlock, /type === ['"]origin['"] && kioskRuntime\.isKioskMode/);

  const searchBlock = blockBetween('(window as any).performWayfindingSearch =', 'const swapWayfindingPoints =');
  assert.match(searchBlock, /nodeType === ['"]origin['"] && kioskRuntime\.isKioskMode/);
});

test('reorder, swap, info and map click paths cannot replace kiosk origin', () => {
  const swapFunction = blockBetween('const swapWayfindingPoints = () =>', '// Helper: Focus camera');
  assert.match(swapFunction, /kioskRuntime\.isKioskMode/);

  const infoStart = source.indexOf('btnStart.onclick = () =>');
  assert.notEqual(infoStart, -1);
  assert.match(source.slice(infoStart, infoStart + 300), /kioskRuntime\.isKioskMode/);

  const mapClickBlock = blockBetween('mapView.on("click", async (event: any) =>', '}); //');
  assert.match(mapClickBlock, /isSelectingOrigin && kioskRuntime\.isKioskMode/);

  const swapButtonBlock = blockBetween('const swapBtn = document.getElementById("wayfinding-swap-btn")', '// Nút preview');
  assert.match(swapButtonBlock, /kioskRuntime\.isKioskMode/);
});

test('kiosk location details hide only the start-from-here action', () => {
  const actionsBlock = blockBetween('// Routing Buttons logic', 'const handleRoutingAction =');

  assert.match(
    actionsBlock,
    /btnStart\.style\.display\s*=\s*kioskRuntime\.isKioskMode\s*\?\s*["']none["']\s*:\s*["']flex["']/
  );
  assert.doesNotMatch(actionsBlock, /btnVia\.style\.display\s*=\s*["']none["']/);
  assert.doesNotMatch(actionsBlock, /btnEnd\.style\.display\s*=\s*["']none["']/);
});

test('drag start and drop independently reject kiosk reordering', () => {
  const dragStartBlock = blockBetween(
    '(window as any).onWayfindingDragStart =',
    '(window as any).onWayfindingDragEnd ='
  );
  assert.match(dragStartBlock, /if\s*\(kioskRuntime\.isKioskMode\)\s*return/);

  const dropBlock = blockBetween(
    '(window as any).onWayfindingDrop =',
    '(window as any).swapNodes ='
  );
  assert.match(dropBlock, /if\s*\(kioskRuntime\.isKioskMode\)\s*return/);
});

test('kiosk origin UI is readonly, named by config and has no clear or drag action', () => {
  const uiBlock = blockBetween('const updateWayfindingUI = () =>', '(window as any).performWayfindingSearch =');
  assert.match(uiBlock, /escapeHtmlAttribute\(kioskRuntime\.config\?\.displayName\s*\|\|\s*['"]['"]\)/);
  assert.match(uiBlock, /const originReadonly = kioskRuntime\.isKioskMode/);
  assert.match(uiBlock, /originReadonlyAttribute[\s\S]*readonly aria-readonly="true"/);
  assert.match(uiBlock, /\$\{originReadonlyAttribute\}/);
  assert.match(uiBlock, /!kioskRuntime\.isKioskMode && wayfindingOrigin/);
});

test('kiosk startup keeps the normal overview camera and exposes one overview reset path', () => {
  const overviewBlock = blockBetween(
    'const resetCameraToOverview = async () =>',
    'showKioskRuntimeError();'
  );

  assert.match(overviewBlock, /zoomLevel:\s*16\.5/);
  assert.match(overviewBlock, /bearing:\s*initialBearing/);
  assert.match(overviewBlock, /pitch:\s*initialPitch/);
  assert.match(overviewBlock, /center:\s*initialVenueCenter/);

  const startupBlock = blockBetween('showKioskRuntimeError();', '// 12. POPUP INFO FUNCTIONS');
  assert.doesNotMatch(startupBlock, /focusKioskOrigin\(\)/);
});

test('URL, home and flight routing use kiosk policies', () => {
  const syncBlock = blockBetween('const syncURL = (forceReplace = false) =>', '(window as any).syncURL = syncURL;');
  assert.match(syncBlock, /shouldUseDirectionsPath\(kioskRuntime, wayfindingOrigin, wayfindingDestination\)/);

  const homeBlock = blockBetween('const btnReset = document.getElementById("btn-reset")', '// Nút Zoom In');
  assert.match(homeBlock, /resetWayfinding\(false\)/);
  assert.match(homeBlock, /resetCameraToOverview\(\)/);

  const flightBlock = blockBetween('const routeBetweenObjects = async', 'const fetchNavigationTargets = async');
  assert.match(flightBlock, /buildFlightWayfindingPlan\(\{/);
  assert.match(flightBlock, /action:\s*['"]route['"]/);
  assert.match(flightBlock, /checkin:\s*originObj/);
  assert.match(flightBlock, /gate:\s*destinationObj/);
  assert.match(flightBlock, /wayfindingStopovers\s*=\s*\[\.\.\.plan\.stopovers\]/);
  assert.match(flightBlock, /getEffectiveWayfindingOrigin\(kioskRuntime, wayfindingOrigin\)/);
});

test('closing a kiosk destination clears the route and restores the overview camera', () => {
  const clearBlock = blockBetween('(window as any).clearNode =', 'let draggedNodeIndex');
  assert.match(clearBlock, /type === ['"]destination['"] && kioskRuntime\.isKioskMode/);
  assert.match(clearBlock, /resetCameraToOverview\(\)/);
  assert.match(clearBlock, /return/);
});

test('kiosk runtime errors render an accessible persistent sanitized banner', () => {
  assert.match(source, /id\s*=\s*['"]kiosk-runtime-error['"]/);
  assert.match(source, /setAttribute\(['"]role['"],\s*['"]alert['"]\)/);
  assert.match(source, /setAttribute\(['"]aria-live['"],\s*['"]assertive['"]\)/);
  assert.match(source, /Kiosk configuration is unavailable/);
});

test('route request retries one rejected primary leg with its sequential fallback', async () => {
  const requestUsableLegDirections = loadRequestUsableLegDirections();
  const calls = [];
  const fallbackDirections = { coordinates: [{ id: 1 }, { id: 2 }] };
  const getDirections = async (_origin, _destination, options) => {
    calls.push(options);
    if (calls.length === 1) throw new Error('primary rejected');
    return fallbackDirections;
  };

  const result = await requestUsableLegDirections({
    getDirections,
    routeOrigin: 'origin',
    routeDestination: 'destination',
    primaryOptions: { smoothing: 'rdp' },
    fallbackOptions: { smoothing: 'greedy-los' },
    isUsableDirections: (value) => Array.isArray(value?.coordinates) && value.coordinates.length >= 2
  });

  assert.equal(result.directions, fallbackDirections);
  assert.equal(result.usedFallback, true);
  assert.equal(result.primaryFailure.message, 'primary rejected');
  assert.deepEqual(calls, [{ smoothing: 'rdp' }, { smoothing: 'greedy-los' }]);
});

test('route request retries a primary result with fewer than two coordinates', async () => {
  const requestUsableLegDirections = loadRequestUsableLegDirections();
  const calls = [];
  const invalidPrimary = { coordinates: [{ id: 1 }] };
  const fallbackDirections = { coordinates: [{ id: 1 }, { id: 2 }] };
  const getDirections = async (_origin, _destination, options) => {
    calls.push(options);
    return calls.length === 1 ? invalidPrimary : fallbackDirections;
  };

  const result = await requestUsableLegDirections({
    getDirections,
    routeOrigin: 'origin',
    routeDestination: 'destination',
    primaryOptions: { smoothing: 'rdp' },
    fallbackOptions: { smoothing: 'greedy-los' },
    isUsableDirections: (value) => Array.isArray(value?.coordinates) && value.coordinates.length >= 2
  });

  assert.equal(result.directions, fallbackDirections);
  assert.equal(result.usedFallback, true);
  assert.match(result.primaryFailure.message, /unusable Directions/);
  assert.deepEqual(calls, [{ smoothing: 'rdp' }, { smoothing: 'greedy-los' }]);
});

test('route request never retries a usable primary leg', async () => {
  const requestUsableLegDirections = loadRequestUsableLegDirections();
  const calls = [];
  const primaryDirections = { coordinates: [{ id: 1 }, { id: 2 }] };

  const result = await requestUsableLegDirections({
    getDirections: async (_origin, _destination, options) => {
      calls.push(options);
      return primaryDirections;
    },
    routeOrigin: 'origin',
    routeDestination: 'destination',
    primaryOptions: { smoothing: 'dp-optimal' },
    fallbackOptions: null,
    isUsableDirections: (value) => Array.isArray(value?.coordinates) && value.coordinates.length >= 2
  });

  assert.equal(result.directions, primaryDirections);
  assert.equal(result.usedFallback, false);
  assert.equal(result.primaryFailure, null);
  assert.deepEqual(calls, [{ smoothing: 'dp-optimal' }]);
});

test('route request reuses a matching usable preview without another SDK call', async () => {
  const requestUsableLegDirections = loadRequestUsableLegDirections();
  const previewDirections = { coordinates: [{ id: 1 }, { id: 2 }] };
  let calls = 0;

  const result = await requestUsableLegDirections({
    getDirections: async () => {
      calls++;
      throw new Error('duplicate primary request');
    },
    routeOrigin: 'origin',
    routeDestination: 'destination',
    primaryOptions: { smoothing: 'dp-optimal', accessible: true },
    fallbackOptions: null,
    reusablePrimaryDirections: previewDirections,
    isUsableDirections: (value) => Array.isArray(value?.coordinates) && value.coordinates.length >= 2
  });

  assert.equal(result.directions, previewDirections);
  assert.equal(result.usedFallback, false);
  assert.equal(result.primaryFailure, null);
  assert.equal(calls, 0);
});

test('preview reuse requires identical endpoints, smoothing and accessibility options', () => {
  const functionSource = extractFunction('directionsRequestsMatch');
  const executableSource = ts.transpileModule(functionSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const directionsRequestsMatch = Function(
    `"use strict"; ${executableSource}; return directionsRequestsMatch;`
  )();
  const origin = {};
  const destination = {};
  const smoothing = {};
  const options = { smoothing, accessible: true };
  const candidate = { origin, destination, options };

  assert.equal(directionsRequestsMatch(candidate, origin, destination, options), true);
  assert.equal(directionsRequestsMatch(candidate, {}, destination, options), false);
  assert.equal(
    directionsRequestsMatch(candidate, origin, destination, { smoothing: {}, accessible: true }),
    false
  );
  assert.equal(
    directionsRequestsMatch(candidate, origin, destination, { smoothing, accessible: false }),
    false
  );
});

test('rejected SDK draw never commits externally active route state', async () => {
  const drawThenCommitNavigation = loadDrawThenCommitNavigation();
  const events = [];

  await assert.rejects(
    drawThenCommitNavigation({
      draw: async () => {
        events.push('draw');
        throw new Error('draw rejected');
      },
      commit: () => events.push('commit')
    }),
    /draw rejected/
  );

  assert.deepEqual(events, ['draw']);
});
