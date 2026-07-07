import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getCategoryAreaListHeight,
  getCategoryAreaListStyle,
  getCategoryAreaListStyleForRows,
  shouldScrollCategoryAreaList
} from '../src/ui/categoryDropdownLayout.js';

test('category area list height grows by 50px per area up to four areas', () => {
  assert.equal(getCategoryAreaListHeight(1), 50);
  assert.equal(getCategoryAreaListHeight(2), 100);
  assert.equal(getCategoryAreaListHeight(3), 150);
  assert.equal(getCategoryAreaListHeight(4), 200);
});

test('category area list height stays at 200px from five areas onward', () => {
  assert.equal(getCategoryAreaListHeight(5), 200);
  assert.equal(getCategoryAreaListHeight(10), 200);
});

test('category area list scrolls only when there are more than four areas', () => {
  assert.equal(shouldScrollCategoryAreaList(4), false);
  assert.equal(shouldScrollCategoryAreaList(5), true);
});

test('category area list style fixes height to visible area rows and only scrolls overflow', () => {
  assert.deepEqual(getCategoryAreaListStyle(1), {
    height: '50px',
    minHeight: '0px',
    maxHeight: '200px',
    flexShrink: '0',
    overflowY: 'hidden'
  });
  assert.deepEqual(getCategoryAreaListStyle(3), {
    height: '150px',
    minHeight: '0px',
    maxHeight: '200px',
    flexShrink: '0',
    overflowY: 'hidden'
  });
  assert.deepEqual(getCategoryAreaListStyle(7), {
    height: '200px',
    minHeight: '0px',
    maxHeight: '200px',
    flexShrink: '0',
    overflowY: 'auto'
  });
});

test('category area list style uses source row count when rendered entries undercount available areas', () => {
  assert.deepEqual(getCategoryAreaListStyleForRows(1, 16), {
    height: '200px',
    minHeight: '0px',
    maxHeight: '200px',
    flexShrink: '0',
    overflowY: 'auto'
  });
});
