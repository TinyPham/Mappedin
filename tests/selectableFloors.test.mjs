import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PASSENGER_FLOOR_IDS,
  isSelectableFloor,
  selectFloorsForDropdown
} from '../src/config/selectableFloors.js';

const passengerFloors = [
  { id: 'm_dae8f26a40f6017f', name: 'Tang tret [Ga di/den]', elevation: 0 },
  { id: 'm_41a38d6d0411d397', name: 'Tang 1 [Ga den]', elevation: 1 },
  { id: 'm_d4b5674c0b15e099', name: 'Tang 2 [Ga di]', elevation: 2 },
  { id: 'm_1523f7dcde647c40', name: 'Tang 3 [Check-in]', elevation: 3 }
];

test('passenger floor whitelist contains exactly the four approved IDs', () => {
  assert.deepEqual([...PASSENGER_FLOOR_IDS], passengerFloors.map((floor) => floor.id));
});

test('selector accepts the identified overview and four approved passenger floors', () => {
  const overview = { id: 'm_overview', name: 'Overview', elevation: -1 };

  assert.equal(isSelectableFloor(overview, overview.id), true);
  passengerFloors.forEach((floor) => assert.equal(isSelectableFloor(floor, overview.id), true, floor.id));
});

test('selector rejects GF-Asset and every unapproved future floor', () => {
  const overviewId = 'm_overview';
  assert.equal(isSelectableFloor({ id: 'm_5d142f3fe2ef164a', name: 'GF-Asset' }, overviewId), false);
  assert.equal(isSelectableFloor({ id: 'm_future', name: 'New passenger floor' }, overviewId), false);
  assert.equal(isSelectableFloor({ id: 'm_fake_overview', name: 'Overview Asset' }, overviewId), false);
  assert.equal(isSelectableFloor(null, overviewId), false);
});

test('dropdown filtering preserves source order without mutating map data', () => {
  const overview = { id: 'm_overview', name: 'Tong quan', elevation: -1 };
  const gfAsset = { id: 'm_5d142f3fe2ef164a', name: 'GF-Asset', elevation: 0 };
  const source = [overview, passengerFloors[0], gfAsset, passengerFloors[1]];

  assert.deepEqual(
    selectFloorsForDropdown(source, overview.id),
    [overview, passengerFloors[0], passengerFloors[1]]
  );
  assert.equal(source.length, 4);
});
