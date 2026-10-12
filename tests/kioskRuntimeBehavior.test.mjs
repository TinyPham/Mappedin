import test from 'node:test';
import assert from 'node:assert/strict';
import { executeFunction } from './helpers/mainSource.mjs';

test('local kiosk diagnostics stay off unless a debug switch is explicitly enabled', () => {
  const window = { location: { search: '', hostname: 'localhost' }, localStorage: { getItem: () => null } };
  const enabled = executeFunction('isMapRuntimeDebugEnabled', { window });
  assert.equal(enabled(), false);
  const category = executeFunction('isCategoryDebugEnabled', { isMapRuntimeDebugEnabled: enabled, checkIsLocal: () => true });
  assert.equal(category(), false);
  window.location.search = '?debug=true'; assert.equal(enabled(), true); assert.equal(category(), true);
  window.location.search = ''; window.__MAP_DEBUG__ = true; assert.equal(enabled(), true);
  window.__MAP_DEBUG__ = false; window.localStorage.getItem = () => '1'; assert.equal(enabled(), true);
  window.localStorage.getItem = () => { throw new Error('storage blocked'); }; assert.equal(enabled(), false);
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
