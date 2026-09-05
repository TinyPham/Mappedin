import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../../main/main-function/index.ts', import.meta.url),
  'utf8',
);

test('persistent location markers stay disabled across every automatic renderer', () => {
  assert.match(
    source,
    /const SHOW_LOCATION_MARKERS = false;/,
    'the shared location marker visibility flag should default to false',
  );

  const objectRendererStart = source.indexOf('const renderObjectMarkersForCurrentFloor = () => {');
  const objectCurrentFloorStart = source.indexOf('const currentFloorId =', objectRendererStart);
  assert.notEqual(objectRendererStart, -1, 'the object marker renderer should exist');
  assert.notEqual(objectCurrentFloorStart, -1, 'the object marker renderer should read the current floor');
  assert.match(
    source.slice(objectRendererStart, objectCurrentFloorStart),
    /const renderObjectMarkersForCurrentFloor = \(\) => \{\s*clearObjectMarkers\(\);\s*if \(!SHOW_LOCATION_MARKERS\) return;/,
    'the object marker renderer should clean up and return before reading the floor or adding markers',
  );

  const connectionRendererStart = source.indexOf('const renderConnectionOverlaysForCurrentFloor = () => {');
  const connectionCurrentFloorStart = source.indexOf('const currentFloorId =', connectionRendererStart);
  const connectionMarkerAddStart = source.indexOf('mapView.Markers.add(', connectionRendererStart);
  assert.notEqual(connectionRendererStart, -1, 'the connection overlay renderer should exist');
  assert.notEqual(connectionCurrentFloorStart, -1, 'the connection overlay renderer should read the current floor');
  assert.notEqual(connectionMarkerAddStart, -1, 'the connection overlay renderer should add markers');
  assert.match(
    source.slice(connectionRendererStart, Math.min(connectionCurrentFloorStart, connectionMarkerAddStart)),
    /const renderConnectionOverlaysForCurrentFloor = \(\) => \{\s*clearConnectionOverlays\(\);\s*if \(!SHOW_LOCATION_MARKERS\) return;/,
    'the connection overlay renderer should clean up and return before reading the floor or adding markers',
  );

  const refreshStart = source.indexOf('const refreshLocationMarkers = () => {');
  const refreshMarkerHtmlStart = source.indexOf('let markerHtml =', refreshStart);
  assert.notEqual(refreshStart, -1, 'the location marker refresh function should exist');
  assert.notEqual(refreshMarkerHtmlStart, -1, 'the location marker refresh function should construct marker HTML');
  assert.match(
    source.slice(refreshStart, refreshMarkerHtmlStart),
    /currentLocationMarkers = \[\];\s*if \(!SHOW_LOCATION_MARKERS\) return;/,
    'the location marker refresh should reset tracked markers and return before constructing marker HTML',
  );

  const entranceStart = source.indexOf('const recreateMainEntranceMarker = () => {');
  const entranceObjectCheckStart = source.indexOf('if (!mainEntranceObject) return;', entranceStart);
  const entranceMarkerHtmlStart = source.indexOf("let markerHtml = '';", entranceStart);
  assert.notEqual(entranceStart, -1, 'the main entrance marker recreation function should exist');
  assert.notEqual(entranceObjectCheckStart, -1, 'the main entrance object check should exist');
  assert.notEqual(entranceMarkerHtmlStart, -1, 'the main entrance function should construct marker HTML');
  assert.match(
    source.slice(entranceStart, entranceObjectCheckStart),
    /const recreateMainEntranceMarker = \(\) => \{\s*if \(!SHOW_LOCATION_MARKERS\) \{\s*if \(mainEntranceMarker\) \{\s*try \{\s*mapView\.Markers\.remove\(mainEntranceMarker\);\s*\} catch \(e\) \{ \}\s*mainEntranceMarker = null;\s*\}\s*return;\s*\}/,
    'the main entrance function should immediately remove, null, and return before object checks or marker HTML',
  );

  assert.match(
    source,
    /if \(SHOW_LOCATION_MARKERS && !mainEntranceMarker && mainEntranceObject\) \{\s*recreateMainEntranceMarker\(\);/,
    'the non-overview path should only recreate the main entrance marker when location markers are enabled',
  );
});
