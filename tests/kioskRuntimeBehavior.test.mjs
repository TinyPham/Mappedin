import test from 'node:test';
import assert from 'node:assert/strict';
import { executeFunction } from './helpers/mainSource.mjs';

test('category diagnostics stay off independently of camera logs and general runtime debug', () => {
  const window = { location: { search: '', hostname: 'localhost' }, localStorage: { getItem: () => null } };
  const enabled = executeFunction('isMapRuntimeDebugEnabled', { window });
  assert.equal(enabled(), false);
  const category = executeFunction('isCategoryDebugEnabled', { window, isMapRuntimeDebugEnabled: enabled, checkIsLocal: () => true });
  assert.equal(category(), false);
  window.location.search = '?debug=true'; assert.equal(enabled(), true); assert.equal(category(), false);
  window.__CATEGORY_DEBUG__ = true; assert.equal(category(), true);
  window.__CATEGORY_DEBUG__ = false; assert.equal(category(), false);
  window.__CATEGORY_DEBUG__ = 'true'; assert.equal(category(), false);
  window.location.search = ''; window.__MAP_DEBUG__ = true; assert.equal(enabled(), true);
  window.__MAP_DEBUG__ = false; window.localStorage.getItem = () => '1'; assert.equal(enabled(), true);
  window.localStorage.getItem = () => { throw new Error('storage blocked'); }; assert.equal(enabled(), false);
});

test('full map console tables use existing data and keep floor, ID, name and type details', () => {
  const tables = [], groups = [];
  const objects = [{ id: 's_room', name: 'Room', type: 'space', floorId: 'floor3' },
    { id: 'p_point', name: 'Point', type: 'point', floorId: 'floor3' },
    { id: 's_other', name: 'Other', type: 'space', floorId: 'floor1' }];
  executeFunction('logComprehensiveMapContent', {
    mapData: { getByType: type => { assert.equal(type, 'floor'); return [{ id: 'floor3', name: 'T3', elevation: 3 }]; } },
    allMapObjects: objects, TranslationManager: { getName: obj => `Translated ${obj.name}` },
    console: { group: label => groups.push(label), groupEnd() {}, log() {}, table: rows => tables.push(rows) },
    fetch: () => assert.fail('Logging must not fetch map assets or models')
  })();
  assert.equal(tables.length, 1);
  assert.deepEqual(tables[0].map(row => row.ID), ['p_point', 's_room']);
  assert.equal(tables[0][1]['Original Name'], 'Room');
  assert.equal(tables[0][1]['Translated (Current)'], 'Translated Room');
  assert.equal(tables[0][1].Type, 'space/room');
  assert.ok(groups.some(label => label.includes('T3')));
});

test('color refresh retains anonymous spaces and area objects across all ID prefixes', () => {
  const spaces = [{ id: 's_unnamed', name: '' }, { id: 'o_named', name: 'Counter' }];
  const area = { id: 'a_named', name: 'Hall' };
  const get = executeFunction('getColorRenderObjects', {
    allMapObjects: spaces, mapData: { getByType: () => [area, spaces[0]] }
  });
  assert.deepEqual(get(), [...spaces, area]);
});

test('wayfinding reset restores database roof colors and noninteractive state for spaces', () => {
  const space = { id: 's_space' }, roof = { id: 's_roof' };
  const calls = [];
  const getObjectBaseStyle = obj => obj === roof
    ? { color: '#B8C2CD', hoverColor: '#E8EDF2', topColor: '#E8EDF2', interactive: false }
    : { color: '#56616C', hoverColor: '#56616C' };
  const mapView = { updateState: (obj, style) => calls.push({ obj, style }) };
  const reset = executeFunction('resetObjectHighlight', { allMapObjects: [space, roof], getObjectBaseStyle, mapView });
  reset(space); reset(roof);
  assert.equal(calls[0].style.color, '#56616C');
  assert.equal(calls[1].style.topColor, '#E8EDF2'); assert.equal(calls[1].style.interactive, false);
  calls.length = 0;
  executeFunction('updateHighlights', {
    getColorRenderObjects: () => [space, roof], currentSearchResults: [], wayfindingStopovers: [],
    wayfindingOrigin: null, wayfindingDestination: null, selectedSpace: null, getObjectBaseStyle,
    mapView, highlightObject: () => assert.fail('nothing selected')
  })();
  assert.deepEqual(calls.map(call => call.obj.id), ['s_space', 's_roof']);
  assert.equal(calls[1].style.topColor, '#E8EDF2'); assert.equal(calls[1].style.interactive, false);
});
