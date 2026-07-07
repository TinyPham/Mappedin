import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSubCategoryLocationEntries,
  getLocalizedAreaName,
  mergeLocationRowsByMappedinId
} from '../src/data/categoryPanelData.js';

test('localized area names prefer AreaList language columns', () => {
  const row = {
    MappedinID: 'coffee_shop',
    Name: 'Old mappedin name',
    VN: 'Vietnamese Counter',
    EN: 'Coffee Counter',
    ZH: 'Chinese Counter',
    JA: 'Japanese Counter',
    KO: 'Korean Counter'
  };

  assert.equal(getLocalizedAreaName(row, 'en'), 'Coffee Counter');
  assert.equal(getLocalizedAreaName(row, 'zh'), 'Chinese Counter');
  assert.equal(getLocalizedAreaName(row, 'ja'), 'Japanese Counter');
  assert.equal(getLocalizedAreaName(row, 'ko'), 'Korean Counter');
  assert.equal(getLocalizedAreaName(row, 'vn'), 'Vietnamese Counter');
});

test('localized area names prefer requested names map before Vietnamese fallback', () => {
  assert.equal(getLocalizedAreaName({
    names: { vn: 'Vietnamese Name', en: 'English Name' },
    EN: 'Column English'
  }, 'en'), 'English Name');
});

test('localized area names treat vi as Vietnamese', () => {
  assert.equal(getLocalizedAreaName({
    names: { vn: 'Vietnamese Name', en: 'English Name' },
    VN: 'Column Vietnamese'
  }, 'vi'), 'Vietnamese Name');
});

test('subcategory entries carry localized database display names instead of map object names', () => {
  const entries = buildSubCategoryLocationEntries(10, [
    {
      MappedinID: 'coffee_shop',
      SubCategoryID: 10,
      VN: 'Vietnamese Counter',
      EN: 'Coffee Counter'
    }
  ], 'floor_2', false, new Map([
    ['coffee_shop', { id: 'coffee_shop', name: 'Old map object name', floor: { id: 'floor_2' } }]
  ]), 'en');

  assert.equal(entries[0].displayName, 'Coffee Counter');
});

test('subcategory entries resolve map objects case-insensitively while keeping database names', () => {
  const entries = buildSubCategoryLocationEntries(10, [
    {
      MappedinID: 'coffee_shop',
      SubCategoryID: 10,
      VN: 'Vietnamese Counter',
      EN: 'Coffee Counter'
    }
  ], 'floor_2', false, new Map([
    ['COFFEE_SHOP', { id: 'COFFEE_SHOP', name: 'Old map object name', floor: { id: 'floor_2' } }]
  ]), 'en');

  assert.equal(entries.length, 1);
  assert.equal(entries[0].displayName, 'Coffee Counter');
  assert.equal(entries[0].mapObject?.id, 'COFFEE_SHOP');
});

test('subcategory entries keep database rows even when the SDK map object is unavailable', () => {
  const entries = buildSubCategoryLocationEntries(10, [
    {
      MappedinID: 'landscape_area',
      SubCategoryID: 10,
      FloorID: 'floor_2',
      EN: 'Landscape Area'
    }
  ], 'floor_2', false, new Map([
    ['other_area', { id: 'other_area', name: 'Other area', floor: { id: 'floor_2' } }]
  ]), 'en');

  assert.equal(entries.length, 1);
  assert.equal(entries[0].displayName, 'Landscape Area');
  assert.equal(entries[0].mapObject, null);
});

test('merged subcategory rows keep fresh AreaList language values over blank cached values', () => {
  const merged = mergeLocationRowsByMappedinId([
    {
      MappedinID: 'retail_shop',
      SubCategoryID: 10,
      names: { vn: 'Cua hang ban le', en: '' },
      EN: ''
    }
  ], [
    {
      MappedinID: 'retail_shop',
      SubCategoryID: 10,
      VN: 'Cua hang ban le',
      EN: 'Retail Shop'
    }
  ]);

  assert.equal(merged.length, 1);
  assert.equal(getLocalizedAreaName(merged[0], 'en'), 'Retail Shop');
});
