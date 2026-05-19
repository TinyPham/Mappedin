import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  resolveWayfindingRouteTarget,
  resolveWayfindingRouteTargets
} from '../wayfindingRouteTargets.js';

const coord = (latitude, longitude, floorId = 'floor-1') => ({ latitude, longitude, floorId });

test('prefers an explicit entrance coordinate over a deep area anchor', () => {
  const deepAnchor = coord(10, 107);
  const entrance = coord(10.0001, 107.0001);
  const location = {
    id: 'shop-a',
    name: 'Shop A',
    anchor: deepAnchor,
    entrances: [{ coordinate: entrance }]
  };

  assert.equal(resolveWayfindingRouteTarget(location), entrance);
});

test('prefers an associated door over the space center', () => {
  const door = {
    id: 'door-a',
    __type: 'door',
    center: coord(10.0002, 107.0002)
  };
  const space = {
    id: 'space-a',
    __type: 'space',
    center: coord(10, 107),
    doors: [door]
  };

  assert.equal(resolveWayfindingRouteTarget(space), door);
});

test('uses doors from spaces associated with a location profile', () => {
  const door = {
    id: 'door-b',
    __type: 'door',
    center: coord(10.0003, 107.0003)
  };
  const locationProfile = {
    id: 'loc-a',
    __type: 'location-profile',
    spaces: [{ id: 'space-b', center: coord(10, 107), doors: [door] }]
  };

  assert.equal(resolveWayfindingRouteTarget(locationProfile), door);
});

test('chooses the associated door closest to the opposite endpoint', () => {
  const farDoor = { id: 'door-far', center: coord(10, 107) };
  const nearDoor = { id: 'door-near', center: coord(10.01, 107.01) };
  const space = {
    id: 'space-c',
    center: coord(10.005, 107.005),
    doors: [farDoor, nearDoor]
  };
  const opposite = { id: 'dest', anchor: coord(10.011, 107.011) };

  assert.equal(resolveWayfindingRouteTarget(space, opposite), nearDoor);
});

test('falls back to the original object when no door-like target exists', () => {
  const area = { id: 'area-a', center: coord(10, 107) };

  assert.equal(resolveWayfindingRouteTarget(area), area);
});

test('does not reroute elevator or escalator objects to their doors', () => {
  const elevatorDoor = { id: 'door-elevator', center: coord(10.0002, 107.0002) };
  const elevatorSpace = {
    id: 'elevator-space',
    name: 'Thang may',
    type: 'elevator',
    center: coord(10, 107),
    doors: [elevatorDoor]
  };
  const escalatorDoor = { id: 'door-escalator', center: coord(10.0003, 107.0003) };
  const escalatorSpace = {
    id: 'escalator-space',
    name: 'Thang cuon',
    type: 'space',
    category: 'escalator',
    center: coord(10, 107),
    doors: [escalatorDoor]
  };

  assert.equal(resolveWayfindingRouteTarget(elevatorSpace), elevatorSpace);
  assert.equal(resolveWayfindingRouteTarget(escalatorSpace), escalatorSpace);
});

test('resolves route targets for every leg while preserving original UI objects', () => {
  const originDoor = { id: 'origin-door', center: coord(10, 107) };
  const stopDoor = { id: 'stop-door', center: coord(10.1, 107.1) };
  const destinationDoor = { id: 'dest-door', center: coord(10.2, 107.2) };
  const origin = { id: 'origin', doors: [originDoor] };
  const stopover = { id: 'stopover', doors: [stopDoor] };
  const destination = { id: 'destination', doors: [destinationDoor] };

  const legs = resolveWayfindingRouteTargets([origin, stopover, destination]);

  assert.deepEqual(legs.map((leg) => leg.origin), [origin, stopover]);
  assert.deepEqual(legs.map((leg) => leg.destination), [stopover, destination]);
  assert.deepEqual(legs.map((leg) => leg.routeOrigin), [originDoor, stopDoor]);
  assert.deepEqual(legs.map((leg) => leg.routeDestination), [stopDoor, destinationDoor]);
});

test('index routes with resolved door targets while preserving original waypoints', () => {
  const source = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');

  assert.match(source, /import\s+\{\s*resolveWayfindingRouteTargets\s*\}\s+from\s+["']\.\/wayfindingRouteTargets\.js["']/);
  assert.match(source, /const\s+routeLegs\s*=\s*resolveWayfindingRouteTargets\(waypoints\)/);
  assert.match(source, /const\s+\{\s*origin,\s*destination:\s*dest,\s*routeOrigin,\s*routeDestination\s*\}\s*=\s*routeLegs\[i\]/);
  assert.match(source, /mapData\.getDirections\(routeOrigin,\s*routeDestination,/);
});
