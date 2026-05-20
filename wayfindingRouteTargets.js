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

function verticalOffsetOf(value, coordinate = coordinateOf(value)) {
  return value?.verticalOffset ??
    coordinate?.verticalOffset ??
    value?.center?.verticalOffset ??
    value?.anchor?.verticalOffset ??
    0;
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

function isMapObjectLike(obj) {
  return String(obj?.__type || '').toLowerCase() === 'object';
}

function getGeoJsonGeometry(obj) {
  return obj?.geoJSON?.geometry || obj?.geometry || null;
}

function projectPointToSegment(point, a, b) {
  const ax = a[0];
  const ay = a[1];
  const bx = b[0];
  const by = b[1];
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return { longitude: ax, latitude: ay };

  const t = Math.max(0, Math.min(1, ((point.longitude - ax) * dx + (point.latitude - ay) * dy) / lengthSq));
  return {
    longitude: ax + t * dx,
    latitude: ay + t * dy
  };
}

function getNearestPointOnRing(ring, reference) {
  if (!Array.isArray(ring) || ring.length < 2 || !reference) return null;

  let best = null;
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    if (!Array.isArray(a) || !Array.isArray(b)) continue;
    if (![a[0], a[1], b[0], b[1]].every(Number.isFinite)) continue;

    const point = projectPointToSegment(reference, a, b);
    const score = (point.longitude - reference.longitude) ** 2 + (point.latitude - reference.latitude) ** 2;
    if (!best || score < best.score) best = { ...point, score };
  }

  return best ? { latitude: best.latitude, longitude: best.longitude } : null;
}

function getPrimaryPolygonRing(obj) {
  const geometry = getGeoJsonGeometry(obj);
  const coordinates = geometry?.coordinates;
  return geometry?.type === 'Polygon' && Array.isArray(coordinates?.[0]) ? coordinates[0] : null;
}

function distanceToObjectBoundaryMeters(obj, coordinate) {
  const ring = getPrimaryPolygonRing(obj);
  const target = coordinateOf(coordinate);
  if (!ring || !target) return Infinity;

  const reference = {
    latitude: target.latitude ?? target.lat,
    longitude: target.longitude ?? target.lng
  };
  if (![reference.latitude, reference.longitude].every(Number.isFinite)) return Infinity;

  const edgePoint = getNearestPointOnRing(ring, reference);
  if (!edgePoint) return Infinity;

  return distanceMeters(
    { latitude: edgePoint.latitude, longitude: edgePoint.longitude, floorId: floorIdOf(obj) },
    target
  );
}

export function getObjectRouteReferenceCoordinate(obj, routeCoordinates, side = 'origin', options = {}) {
  if (!isMapObjectLike(obj) || !Array.isArray(routeCoordinates) || routeCoordinates.length < 2) return null;
  if (!getPrimaryPolygonRing(obj)) return null;

  const minProgressMeters = Number.isFinite(options.minProgressMeters) ? options.minProgressMeters : 10;
  const maxBoundaryDistanceMeters = Number.isFinite(options.maxBoundaryDistanceMeters) ? options.maxBoundaryDistanceMeters : 12;
  const ordered = side === 'destination' ? [...routeCoordinates].reverse() : routeCoordinates;

  let progressMeters = 0;
  let lastNearBoundary = null;
  for (let i = 1; i < ordered.length; i++) {
    progressMeters += distanceMeters(ordered[i - 1], ordered[i]);
    if (progressMeters < minProgressMeters) continue;

    const boundaryDistance = distanceToObjectBoundaryMeters(obj, ordered[i]);
    if (boundaryDistance <= maxBoundaryDistanceMeters) {
      lastNearBoundary = ordered[i];
      continue;
    }

    if (lastNearBoundary) break;
  }

  return lastNearBoundary;
}

function addUniquePoint(points, point) {
  if (!point || ![point.latitude, point.longitude].every(Number.isFinite)) return;
  const key = `${point.latitude.toFixed(10)},${point.longitude.toFixed(10)}`;
  if (points.some((existing) => existing.key === key)) return;
  points.push({ ...point, key });
}

function getCandidatePointsOnRing(ring, reference) {
  const points = [];
  if (!Array.isArray(ring) || ring.length < 2) return points;

  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    if (!Array.isArray(a) || !Array.isArray(b)) continue;
    if (![a[0], a[1], b[0], b[1]].every(Number.isFinite)) continue;

    addUniquePoint(points, { latitude: a[1], longitude: a[0] });
    addUniquePoint(points, { latitude: b[1], longitude: b[0] });
    addUniquePoint(points, { latitude: (a[1] + b[1]) / 2, longitude: (a[0] + b[0]) / 2 });

    if (reference) {
      const projected = projectPointToSegment(reference, a, b);
      addUniquePoint(points, { latitude: projected.latitude, longitude: projected.longitude });
    }
  }

  return points.map(({ key, ...point }) => point);
}

function createCoordinateTarget(latitude, longitude, floorId, verticalOffset, options) {
  if (options && typeof options.createCoordinate === 'function') {
    const created = options.createCoordinate(latitude, longitude, floorId, verticalOffset);
    if (created) return created;
  }

  return {
    latitude,
    longitude,
    floorId,
    verticalOffset
  };
}

function getRouteDistance(target, opposite, options) {
  if (!options || typeof options.getDistance !== 'function') return null;
  try {
    const distance = options.getDistance(target, opposite);
    return Number.isFinite(distance) ? distance : null;
  } catch {
    return null;
  }
}

function addObjectEdgeCandidate(candidates, obj, opposite, priority, options) {
  if (!isMapObjectLike(obj)) return;

  const ring = getPrimaryPolygonRing(obj);
  if (!Array.isArray(ring)) return;

  const routeReferenceCoord = coordinateOf(options?.routeReferenceCoordinate);
  const oppositeCoord = routeReferenceCoord || coordinateOf(opposite);
  const originalCoord = coordinateOf(obj);
  const referenceCoord = oppositeCoord || originalCoord;
  if (!referenceCoord) return;

  const reference = {
    latitude: referenceCoord.latitude ?? referenceCoord.lat,
    longitude: referenceCoord.longitude ?? referenceCoord.lng
  };
  if (![reference.latitude, reference.longitude].every(Number.isFinite)) return;

  const floorId = floorIdOf(obj, originalCoord);
  const verticalOffset = verticalOffsetOf(obj, originalCoord);
  const edgePoints = getCandidatePointsOnRing(ring, reference);
  if (edgePoints.length === 0) {
    const edgePoint = getNearestPointOnRing(ring, reference);
    if (edgePoint) edgePoints.push(edgePoint);
  }

  for (const edgePoint of edgePoints) {
    const target = createCoordinateTarget(edgePoint.latitude, edgePoint.longitude, floorId, verticalOffset, options);
    const before = candidates.length;
    addCandidate(candidates, target, priority);
    if (candidates.length > before) {
      if (routeReferenceCoord) {
        candidates[candidates.length - 1].referenceDistance = distanceMeters(target, routeReferenceCoord);
      } else {
        candidates[candidates.length - 1].routeDistance = getRouteDistance(target, opposite, options);
      }
    }
  }
}

function collectRouteTargetCandidates(obj, opposite, options, seen = new Set()) {
  const candidates = [];
  if (!obj) return candidates;
  if (obj.id && seen.has(obj.id)) return candidates;
  if (obj.id) seen.add(obj.id);

  addEntranceCandidates(candidates, obj.entrances, 0);
  addDoorCandidates(candidates, obj.doors, 1);

  if (Array.isArray(obj.spaces)) {
    for (const space of obj.spaces) {
      addEntranceCandidates(candidates, space?.entrances, 2);
      addDoorCandidates(candidates, space?.doors, 3);
    }
  }

  const relatedCollections = [
    obj.enterpriseLocations,
    obj.locations,
    obj.locationProfiles,
    obj.locationProfile ? [obj.locationProfile] : null,
    obj.location ? [obj.location] : null,
    obj.space ? [obj.space] : null,
    obj.parent ? [obj.parent] : null,
    obj.parentSpace ? [obj.parentSpace] : null,
    obj.parentLocation ? [obj.parentLocation] : null
  ];
  for (const related of relatedCollections) {
    if (!Array.isArray(related)) continue;
    for (const item of related) {
      candidates.push(...collectRouteTargetCandidates(item, opposite, options, seen));
    }
  }

  addNodeCandidates(candidates, obj.nodes, 4);
  addNodeCandidates(candidates, obj.navigableNodes, 5);
  addObjectEdgeCandidate(candidates, obj, opposite, 6, options);

  return candidates;
}

function chooseCandidate(candidates, original, opposite) {
  if (candidates.length === 0) return null;

  const oppositeCoord = coordinateOf(opposite);
  const oppositeFloorId = floorIdOf(opposite, oppositeCoord);
  const originalCoord = coordinateOf(original);
  const originalFloorId = floorIdOf(original, originalCoord);
  const floorMismatchPenalty = 1000000000;

  return candidates
    .map((candidate, index) => {
      const originalFloorPenalty = originalFloorId && candidate.floorId && candidate.floorId !== originalFloorId
        ? floorMismatchPenalty
        : 0;
      const oppositeFloorPenalty = !originalFloorId && oppositeFloorId && candidate.floorId && candidate.floorId !== oppositeFloorId
        ? floorMismatchPenalty
        : 0;
      const routeDistance = Number.isFinite(candidate.routeDistance) ? candidate.routeDistance : null;
      const referenceDistance = Number.isFinite(candidate.referenceDistance) ? candidate.referenceDistance : null;
      const oppositeDistance = referenceDistance ?? routeDistance ?? (oppositeCoord ? distanceMeters(candidate.coordinate, oppositeCoord) : 0);
      const originalDistance = originalCoord ? distanceMeters(candidate.coordinate, originalCoord) : 0;
      return {
        ...candidate,
        score: originalFloorPenalty + oppositeFloorPenalty + candidate.priority * 10000000 + oppositeDistance + originalDistance * 0.05 + index * 0.001
      };
    })
    .sort((a, b) => a.score - b.score)[0];
}

function shouldKeepOriginalTarget(obj) {
  const type = String(obj?.__type || obj?.type || '').toLowerCase();
  return type === 'door' ||
    type === 'connection' ||
    type === 'point-of-interest' ||
    isConnectionLikeTarget(obj) ||
    isCoordinateLike(obj);
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isConnectionLikeTarget(obj) {
  const text = [
    obj?.__type,
    obj?.type,
    obj?.category,
    obj?.name,
    obj?.details?.name
  ].map(normalizeText).join(' ');

  return [
    'connection',
    'elevator',
    'escalator',
    'stair',
    'stairway',
    'portal',
    'security',
    'ramp',
    'thang may',
    'thang cuon',
    'cau thang'
  ].some((keyword) => text.includes(keyword));
}

export function resolveWayfindingRouteTarget(obj, opposite, options) {
  if (!obj || shouldKeepOriginalTarget(obj)) return obj;

  const candidates = collectRouteTargetCandidates(obj, opposite, options);
  const chosen = chooseCandidate(candidates, obj, opposite);
  return chosen?.target || obj;
}

export function resolveWayfindingRouteTargets(waypoints, options) {
  const points = (waypoints || []).filter(Boolean);
  const legs = [];
  for (let i = 0; i < points.length - 1; i++) {
    const origin = points[i];
    const destination = points[i + 1];
    legs.push({
      origin,
      destination,
      routeOrigin: resolveWayfindingRouteTarget(origin, destination, options),
      routeDestination: resolveWayfindingRouteTarget(destination, origin, options)
    });
  }
  return legs;
}
