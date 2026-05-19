function isCoordinateLike(value) {
  return value && (
    (Number.isFinite(value.latitude) && Number.isFinite(value.longitude)) ||
    (Number.isFinite(value.lat) && Number.isFinite(value.lng))
  );
}

function coordinateOf(value) {
  if (!value) return null;
  if (isCoordinateLike(value)) return value;
  return value.coordinate ||
    value.anchor ||
    value.center ||
    value.centroid ||
    value.position ||
    value.anchorTarget ||
    value.focusTarget ||
    null;
}

function floorIdOf(value, coordinate = coordinateOf(value)) {
  return value?.floorId ||
    value?.floor?.id ||
    coordinate?.floorId ||
    coordinate?.floor?.id ||
    null;
}

function distanceMeters(a, b) {
  const ca = coordinateOf(a);
  const cb = coordinateOf(b);
  if (!ca || !cb) return Infinity;

  const lat1 = ca.latitude ?? ca.lat;
  const lng1 = ca.longitude ?? ca.lng;
  const lat2 = cb.latitude ?? cb.lat;
  const lng2 = cb.longitude ?? cb.lng;
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return Infinity;

  const radius = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function addCandidate(candidates, target, priority) {
  const coordinate = coordinateOf(target);
  if (!target || !coordinate) return;
  candidates.push({
    target,
    coordinate,
    priority,
    floorId: floorIdOf(target, coordinate)
  });
}

function addDoorCandidates(candidates, doors, priority) {
  if (!Array.isArray(doors)) return;
  for (const door of doors) addCandidate(candidates, door, priority);
}

function addEntranceCandidates(candidates, entrances, priority) {
  if (!Array.isArray(entrances)) return;
  for (const entrance of entrances) {
    addCandidate(candidates, entrance?.coordinate || entrance?.anchor || entrance?.center || entrance, priority);
  }
}

function addNodeCandidates(candidates, nodes, priority) {
  if (!Array.isArray(nodes)) return;
  for (const node of nodes) addCandidate(candidates, node, priority);
}

function collectRouteTargetCandidates(obj) {
  const candidates = [];
  if (!obj) return candidates;

  addEntranceCandidates(candidates, obj.entrances, 0);
  addDoorCandidates(candidates, obj.doors, 1);

  if (Array.isArray(obj.spaces)) {
    for (const space of obj.spaces) {
      addEntranceCandidates(candidates, space?.entrances, 2);
      addDoorCandidates(candidates, space?.doors, 3);
    }
  }

  addNodeCandidates(candidates, obj.nodes, 4);
  addNodeCandidates(candidates, obj.navigableNodes, 5);

  return candidates;
}

function chooseCandidate(candidates, original, opposite) {
  if (candidates.length === 0) return null;

  const oppositeCoord = coordinateOf(opposite);
  const oppositeFloorId = floorIdOf(opposite, oppositeCoord);
  const originalCoord = coordinateOf(original);

  return candidates
    .map((candidate, index) => {
      const sameFloorPenalty = oppositeFloorId && candidate.floorId && candidate.floorId !== oppositeFloorId ? 1000000 : 0;
      const oppositeDistance = oppositeCoord ? distanceMeters(candidate.coordinate, oppositeCoord) : 0;
      const originalDistance = originalCoord ? distanceMeters(candidate.coordinate, originalCoord) : 0;
      return {
        ...candidate,
        score: candidate.priority * 10000000 + sameFloorPenalty + oppositeDistance + originalDistance * 0.05 + index * 0.001
      };
    })
    .sort((a, b) => a.score - b.score)[0];
}

function shouldKeepOriginalTarget(obj) {
  const type = String(obj?.__type || obj?.type || '').toLowerCase();
  return type === 'door' ||
    type === 'connection' ||
    type === 'point-of-interest' ||
    isCoordinateLike(obj);
}

export function resolveWayfindingRouteTarget(obj, opposite) {
  if (!obj || shouldKeepOriginalTarget(obj)) return obj;

  const candidates = collectRouteTargetCandidates(obj);
  const chosen = chooseCandidate(candidates, obj, opposite);
  return chosen?.target || obj;
}

export function resolveWayfindingRouteTargets(waypoints) {
  const points = (waypoints || []).filter(Boolean);
  const legs = [];
  for (let i = 0; i < points.length - 1; i++) {
    const origin = points[i];
    const destination = points[i + 1];
    legs.push({
      origin,
      destination,
      routeOrigin: resolveWayfindingRouteTarget(origin, destination),
      routeDestination: resolveWayfindingRouteTarget(destination, origin)
    });
  }
  return legs;
}
