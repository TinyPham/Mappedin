import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAssignedAreaEntries,
  buildSubCategoryLocationEntries,
  buildVisibleCategoryAreas,
  hasAssignmentsOnVisibleFloor,
  normalizeLocationRecord
} from '../src/data/categoryPanelData.js';

test('overview includes locations from every floor', () => {
  const entries = buildVisibleCategoryAreas([
    { MappedinID: 'a1', FloorID: 'm_floor_1' },
    { MappedinID: 'a2', FloorID: 'm_floor_2' }
  ], 'm_floor_1', true);

  assert.deepEqual(entries.map((entry) => entry.mappedinId), ['a1', 'a2']);
});

test('detail floor only includes matching floor locations', () => {
  const entries = buildVisibleCategoryAreas([
    { MappedinID: 'a1', FloorID: 'm_floor_1' },
    { MappedinID: 'a2', FloorID: 'm_floor_2' }
  ], 'm_floor_2', false);

  assert.deepEqual(entries.map((entry) => entry.mappedinId), ['a2']);
});

test('falls back to map object floor when db floor is missing', () => {
  const mapObjectsById = new Map([
    ['a2', { id: 'a2', floor: { id: 'm_floor_2' } }]
  ]);

  const entries = buildVisibleCategoryAreas([
    { MappedinID: 'a1', FloorID: 'm_floor_1' },
    { MappedinID: 'a2', FloorID: null }
  ], 'm_floor_2', false, mapObjectsById);

  assert.deepEqual(entries.map((entry) => entry.mappedinId), ['a2']);
});

test('subcategory activation uses db floor ids before map object cache', () => {
  const assignments = [
    { MappedinID: 'a1', SubCategoryID: 10, FloorID: 'm_floor_1' },
    { MappedinID: 'a2', SubCategoryID: 10, FloorID: 'm_floor_2' }
  ];

  assert.equal(hasAssignmentsOnVisibleFloor(10, assignments, 'm_floor_2', false), true);
  assert.equal(hasAssignmentsOnVisibleFloor(10, assignments, 'm_floor_3', false), false);
  assert.equal(hasAssignmentsOnVisibleFloor(10, assignments, 'm_floor_3', true), true);
});

test('subcategory activation falls back to map object floor when assignments have no db floor', () => {
  const assignments = [
    { MappedinID: 'a1', SubCategoryID: 10 },
    { MappedinID: 'a2', SubCategoryID: 11 }
  ];
  const mapObjectsById = new Map([
    ['a1', { id: 'a1', floor: { id: 'm_floor_1' } }],
    ['a2', { id: 'a2', floor: { id: 'm_floor_2' } }]
  ]);

  assert.equal(hasAssignmentsOnVisibleFloor(10, assignments, 'm_floor_1', false, mapObjectsById), true);
  assert.equal(hasAssignmentsOnVisibleFloor(10, assignments, 'm_floor_2', false, mapObjectsById), false);
  assert.equal(hasAssignmentsOnVisibleFloor(10, assignments, 'm_floor_2', true, mapObjectsById), true);
});

test('assigned area entries are built from assigned mids on the current floor', () => {
  const mapObjectsById = new Map([
    ['a1', { id: 'a1', floor: { id: 'm_floor_1' } }],
    ['a2', { id: 'a2', floor: { id: 'm_floor_2' } }]
  ]);

  const entries = buildAssignedAreaEntries(
    ['a1', 'a2'],
    [{ MappedinID: 'a1', VN: 'A1' }, { MappedinID: 'a2', VN: 'A2' }],
    'm_floor_2',
    false,
    mapObjectsById
  );

  assert.deepEqual(entries.map((entry) => entry.mappedinId), ['a2']);
  assert.equal(entries[0].dbRow.VN, 'A2');
});

test('assigned area entries fall back to floor.mappedinId when present', () => {
  const mapObjectsById = new Map([
    ['a1', { id: 'a1', floor: { mappedinId: 'm_floor_1' } }],
    ['a2', { id: 'a2', floor: { mappedinId: 'm_floor_2' } }]
  ]);

  const entries = buildAssignedAreaEntries(
    ['a1', 'a2'],
    [{ MappedinID: 'a1' }, { MappedinID: 'a2' }],
    'm_floor_2',
    false,
    mapObjectsById
  );

  assert.deepEqual(entries.map((entry) => entry.mappedinId), ['a2']);
});

test('assigned area entries fall back to location rows when assigned mids are empty', () => {
  const mapObjectsById = new Map([
    ['a1', { id: 'a1', floor: { id: 'm_floor_1' } }],
    ['a2', { id: 'a2', floor: { id: 'm_floor_2' } }]
  ]);

  const entries = buildAssignedAreaEntries(
    [],
    [{ MappedinID: 'a1' }, { MappedinID: 'a2' }],
    'm_floor_1',
    false,
    mapObjectsById
  );

  assert.deepEqual(entries.map((entry) => entry.mappedinId), ['a1']);
});

test('normalizes location identifiers from init data', () => {
  const normalized = normalizeLocationRecord({
    AreaListID: '42',
    CategoryID: '10',
    SubCategoryID: '142',
    MappedinID: '  m_post_service  '
  });

  assert.equal(normalized.id, 42);
  assert.equal(normalized.categoryId, 10);
  assert.equal(normalized.subCategoryId, 142);
  assert.equal(normalized.mappedinId, 'm_post_service');
  assert.deepEqual({
    AreaListID: normalized.AreaListID,
    CategoryID: normalized.CategoryID,
    SubCategoryID: normalized.SubCategoryID,
    MappedinID: normalized.MappedinID
  }, {
    AreaListID: 42,
    CategoryID: 10,
    SubCategoryID: 142,
    MappedinID: 'm_post_service'
  });
});

test('subcategory entries filter by SubCategoryID and current floor', () => {
  const mapObjectsById = new Map([
    ['post_service', { id: 'post_service', floor: { id: 'floor_3' } }],
    ['food_court', { id: 'food_court', floor: { id: 'floor_3' } }],
    ['post_service_floor_2', { id: 'post_service_floor_2', floor: { id: 'floor_2' } }]
  ]);

  const entries = buildSubCategoryLocationEntries(142, [
    { AreaListID: '1', MappedinID: ' post_service ', SubCategoryID: '142' },
    { AreaListID: '2', MappedinID: 'food_court', SubCategoryID: '81' },
    { AreaListID: '3', MappedinID: 'post_service_floor_2', SubCategoryID: '142' },
    { AreaListID: '4', MappedinID: '', SubCategoryID: '142' }
  ], 'floor_3', false, mapObjectsById);

  assert.deepEqual(entries.map((entry) => entry.mappedinId), ['post_service']);
  assert.equal(entries[0].dbRow.SubCategoryID, 142);
});

test('overview subcategory entries include every physical floor', () => {
  const mapObjectsById = new Map([
    ['post_service_floor_3', { id: 'post_service_floor_3', floor: { id: 'floor_3' } }],
    ['post_service_floor_2', { id: 'post_service_floor_2', floor: { id: 'floor_2' } }]
  ]);

  const entries = buildSubCategoryLocationEntries(142, [
    { MappedinID: 'post_service_floor_3', SubCategoryID: 142 },
    { MappedinID: 'post_service_floor_2', SubCategoryID: 142 }
  ], 'overview_map_id', true, mapObjectsById);

  assert.deepEqual(entries.map((entry) => entry.mappedinId), ['post_service_floor_3', 'post_service_floor_2']);
});
