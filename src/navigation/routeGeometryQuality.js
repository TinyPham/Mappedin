function coordinateOf(value) {
  if (!value) return null;
  if ((Number.isFinite(value.latitude) && Number.isFinite(value.longitude)) ||
      (Number.isFinite(value.lat) && Number.isFinite(value.lng))) {
    return value;
  }
  return value.coordinate || value.center || value.anchor || null;
}

function floorIdOf(value) {
  const coordinate = coordinateOf(value);
  return value?.floorId || value?.floor?.id || coordinate?.floorId || coordinate?.floor?.id || null;
}

function toPoint(value) {
  const coordinate = coordinateOf(value);
  if (!coordinate) return null;
  const x = coordinate.longitude ?? coordinate.lng;
  const y = coordinate.latitude ?? coordinate.lat;
  if (![x, y].every(Number.isFinite)) return null;
  return { x, y, floorId: floorIdOf(value) };
}

function distanceMeters(a, b) {
  const radius = 6371000;
  const dLat = (b.y - a.y) * Math.PI / 180;
  const dLng = (b.x - a.x) * Math.PI / 180;
  const lat1 = a.y * Math.PI / 180;
  const lat2 = b.y * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function sameFloor(a, b) {
  return !a.floorId || !b.floorId || a.floorId === b.floorId;
}

function buildSegments(coordinates) {
  const points = (coordinates || []).map(toPoint).filter(Boolean);
  const segments = [];
  for (let index = 0; index < points.length - 1; index++) {
    const start = points[index];
    const end = points[index + 1];
    if (!sameFloor(start, end) || distanceMeters(start, end) < 0.01) continue;
    segments.push({ start, end, index });
  }
  return segments;
}

function cross(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function segmentRelationship(first, second) {
  if (!sameFloor(first.start, second.start)) return { crossing: false, overlapMeters: 0 };

  const r = { x: first.end.x - first.start.x, y: first.end.y - first.start.y };
  const s = { x: second.end.x - second.start.x, y: second.end.y - second.start.y };
  const denominator = r.x * s.y - r.y * s.x;
  const qMinusP = {
    x: second.start.x - first.start.x,
    y: second.start.y - first.start.y
  };
  const epsilon = 1e-12;

  if (Math.abs(denominator) > epsilon) {
    const t = (qMinusP.x * s.y - qMinusP.y * s.x) / denominator;
    const u = (qMinusP.x * r.y - qMinusP.y * r.x) / denominator;
    const intersects = t >= -1e-7 && t <= 1 + 1e-7 && u >= -1e-7 && u <= 1 + 1e-7;
    return { crossing: intersects, overlapMeters: 0 };
  }

  if (Math.abs(cross(first.start, first.end, second.start)) > epsilon ||
      Math.abs(cross(first.start, first.end, second.end)) > epsilon) {
    return { crossing: false, overlapMeters: 0 };
  }

  const useX = Math.abs(r.x) >= Math.abs(r.y);
  const axis = useX ? 'x' : 'y';
  const firstMin = Math.min(first.start[axis], first.end[axis]);
  const firstMax = Math.max(first.start[axis], first.end[axis]);
  const secondMin = Math.min(second.start[axis], second.end[axis]);
  const secondMax = Math.max(second.start[axis], second.end[axis]);
  const overlap = Math.max(0, Math.min(firstMax, secondMax) - Math.max(firstMin, secondMin));
  const axisLength = firstMax - firstMin;
  const overlapMeters = axisLength > epsilon
    ? distanceMeters(first.start, first.end) * overlap / axisLength
    : 0;
  return { crossing: false, overlapMeters };
}

export function analyzeAdjacentRouteGeometry(firstCoordinates, secondCoordinates) {
  const firstSegments = buildSegments(firstCoordinates);
  const secondSegments = buildSegments(secondCoordinates);
  let intersectionCount = 0;
  let overlapMeters = 0;

  for (const first of firstSegments) {
    for (const second of secondSegments) {
      const relationship = segmentRelationship(first, second);
      const isSharedBoundary =
        first.index === firstSegments.at(-1)?.index &&
        second.index === secondSegments[0]?.index &&
        distanceMeters(first.end, second.start) <= 0.5;
      if (relationship.crossing && !isSharedBoundary) intersectionCount++;
      overlapMeters += relationship.overlapMeters;
    }
  }

  const firstEnd = firstSegments.at(-1)?.end || null;
  const secondStart = secondSegments[0]?.start || null;
  const continuityGapMeters = firstEnd && secondStart && sameFloor(firstEnd, secondStart)
    ? distanceMeters(firstEnd, secondStart)
    : Infinity;

  return { intersectionCount, overlapMeters, continuityGapMeters };
}

function compareRouteQuality(a, b) {
  return a.quality.intersectionCount - b.quality.intersectionCount ||
    a.quality.continuityGapMeters - b.quality.continuityGapMeters ||
    a.quality.overlapMeters - b.quality.overlapMeters ||
    a.totalDistance - b.totalDistance ||
    a.index - b.index;
}

export async function selectNonIntersectingStopoverRoute(request) {
  const {
    origin,
    destination,
    candidates,
    getDirections,
    directionsOptions,
    isUsableDirections,
    maxCandidates = 12,
    requireNonIntersecting = false,
    maxContinuityGapMeters = 1.5,
    maxOverlapMeters = 1
  } = request;
  const evaluated = [];

  for (const [index, target] of (candidates || []).slice(0, maxCandidates).entries()) {
    try {
      const first = await getDirections(origin, target, directionsOptions);
      if (!isUsableDirections(first)) continue;
      const second = await getDirections(target, destination, directionsOptions);
      if (!isUsableDirections(second)) continue;
      const quality = analyzeAdjacentRouteGeometry(first.coordinates, second.coordinates);
      evaluated.push({
        target,
        directions: [first, second],
        quality,
        totalDistance: Number(first.distance || 0) + Number(second.distance || 0),
        index
      });
      const current = evaluated.at(-1);
      if (requireNonIntersecting &&
          current.quality.intersectionCount === 0 &&
          current.quality.continuityGapMeters <= maxContinuityGapMeters &&
          current.quality.overlapMeters <= maxOverlapMeters) {
        return current;
      }
    } catch {
      // One invalid candidate must not abort evaluation of the remaining doors.
    }
  }

  evaluated.sort(compareRouteQuality);
  if (!requireNonIntersecting) return evaluated[0] || null;
  return null;
}
