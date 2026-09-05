import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../../main/main-function/index.ts', import.meta.url),
  'utf8',
);

test('map name marker stays disabled and is removed if already present', () => {
  assert.match(
    source,
    /let mapNameMarker: any = null;\s*const SHOW_MAP_NAME_MARKER = false;/,
    'the map name marker visibility flag should default to false beside its state',
  );

  const createFunctionStart = source.indexOf('const createMapNameMarker = () => {');
  const markerHtmlStart = source.indexOf('const markerHtml = `', createFunctionStart);

  assert.notEqual(createFunctionStart, -1, 'createMapNameMarker should exist');
  assert.notEqual(markerHtmlStart, -1, 'createMapNameMarker should construct marker HTML');

  const createFunctionBeforeHtml = source.slice(createFunctionStart, markerHtmlStart);
  assert.match(
    createFunctionBeforeHtml,
    /const createMapNameMarker = \(\) => \{\s*if \(!SHOW_MAP_NAME_MARKER\) \{\s*if \(mapNameMarker\) \{\s*try \{\s*mapView\.Markers\.remove\(mapNameMarker\);\s*\} catch \(e\) \{ \}\s*mapNameMarker = null;\s*\}\s*return;\s*\}/,
    'the create function should remove any existing marker and return while disabled',
  );

  assert.match(
    source,
    /if \(SHOW_MAP_NAME_MARKER && !mapNameMarker\) \{\s*createMapNameMarker\(\);/,
    'overview mode should only create the marker when its visibility flag is enabled',
  );
});
