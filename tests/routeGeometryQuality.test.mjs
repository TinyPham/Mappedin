import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeAdjacentRouteGeometry,
  selectNonIntersectingStopoverRoute
} from '../src/navigation/routeGeometryQuality.js';

const point = (x, y, floorId = 'floor-1') => ({
  longitude: x,
  latitude: y,
  floorId
});

const directions = (coordinates, distance = coordinates.length * 10) => ({
  coordinates,
  distance,
  instructions: []
});

test('detects an interior crossing between adjacent route legs', () => {
  const firstLeg = [point(0, 0), point(2, 2), point(4, 0)];
  const secondLeg = [point(4, 0), point(2, -1), point(1, 2)];

  const quality = analyzeAdjacentRouteGeometry(firstLeg, secondLeg);

  assert.equal(quality.intersectionCount, 1);
});

test('detects a crossing that lands on an internal route vertex', () => {
  const quality = analyzeAdjacentRouteGeometry(
    [point(0, 0), point(2, 2), point(4, 0)],
    [point(4, 0), point(2, 2), point(2, 4)]
  );

  assert.ok(quality.intersectionCount >= 1);
});

test('does not count the shared stopover endpoint as an intersection', () => {
  const stopover = point(2, 0);
  const quality = analyzeAdjacentRouteGeometry(
    [point(0, 0), stopover],
    [stopover, point(4, 0)]
  );

  assert.equal(quality.intersectionCount, 0);
  assert.equal(quality.overlapMeters, 0);
});

test('detects route backtracking over the same corridor', () => {
  const stopover = point(2, 0);
  const quality = analyzeAdjacentRouteGeometry(
    [point(0, 0), stopover],
    [stopover, point(1, 0), point(3, 0)]
  );

  assert.equal(quality.intersectionCount, 0);
  assert.ok(quality.overlapMeters > 0);
});

test('selects a non-intersecting stopover route before a shorter crossing route', async () => {
  const origin = { id: 'origin' };
  const destination = { id: 'destination' };
  const crossingDoor = { id: 'crossing-door' };
  const cleanDoor = { id: 'clean-door' };
  const routes = new Map([
    ['origin->crossing-door', directions([point(0, 0), point(2, 2), point(4, 0)], 30)],
    ['crossing-door->destination', directions([point(4, 0), point(2, -1), point(1, 2)], 30)],
    ['origin->clean-door', directions([point(0, 0), point(2, 0)], 50)],
    ['clean-door->destination', directions([point(2, 0), point(3, 0), point(4, 0)], 50)]
  ]);

  const selected = await selectNonIntersectingStopoverRoute({
    origin,
    destination,
    candidates: [crossingDoor, cleanDoor],
    getDirections: async (from, to) => routes.get(`${from.id}->${to.id}`),
    directionsOptions: {},
    isUsableDirections: (value) => Array.isArray(value?.coordinates) && value.coordinates.length >= 2
  });

  assert.equal(selected.target, cleanDoor);
  assert.equal(selected.quality.intersectionCount, 0);
  assert.equal(selected.quality.overlapMeters, 0);
  assert.deepEqual(selected.directions, [
    routes.get('origin->clean-door'),
    routes.get('clean-door->destination')
  ]);
});

test('returns the least crossing candidate when the SDK offers no clean route', async () => {
  const origin = { id: 'origin' };
  const destination = { id: 'destination' };
  const oneCrossing = { id: 'one-crossing' };
  const twoCrossings = { id: 'two-crossings' };
  const routes = new Map([
    ['origin->one-crossing', directions([point(0, 0), point(2, 2), point(4, 0)], 20)],
    ['one-crossing->destination', directions([point(4, 0), point(2, -1), point(1, 2)], 20)],
    ['origin->two-crossings', directions([point(0, 0), point(1, 2), point(2, 0), point(3, 2), point(4, 0)], 10)],
    ['two-crossings->destination', directions([point(4, 0), point(0, 1)], 10)]
  ]);

  const selected = await selectNonIntersectingStopoverRoute({
    origin,
    destination,
    candidates: [twoCrossings, oneCrossing],
    getDirections: async (from, to) => routes.get(`${from.id}->${to.id}`),
    directionsOptions: {},
    isUsableDirections: (value) => Array.isArray(value?.coordinates) && value.coordinates.length >= 2
  });

  assert.equal(selected.target, oneCrossing);
  assert.equal(selected.quality.intersectionCount, 1);
});

test('strict selection rejects all candidates when every route intersects', async () => {
  const origin = { id: 'origin' };
  const destination = { id: 'destination' };
  const crossingDoor = { id: 'crossing-door' };
  const routes = new Map([
    ['origin->crossing-door', directions([point(0, 0), point(2, 2), point(4, 0)], 30)],
    ['crossing-door->destination', directions([point(4, 0), point(2, -1), point(1, 2)], 30)]
  ]);

  const selected = await selectNonIntersectingStopoverRoute({
    origin,
    destination,
    candidates: [crossingDoor],
    getDirections: async (from, to) => routes.get(`${from.id}->${to.id}`),
    directionsOptions: {},
    isUsableDirections: (value) => Array.isArray(value?.coordinates) && value.coordinates.length >= 2,
    requireNonIntersecting: true
  });

  assert.equal(selected, null);
});
