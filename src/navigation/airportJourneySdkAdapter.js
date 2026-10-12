import {AirportPolicyError, assertAirportEndpointOpen} from './airportJourneyContext.js';
import {validateAirportRoute, routeIntersectsZone, validateAirportZone, routeZonePassageCount} from './airportRouteValidator.js';

const floorOf = c => c?.floorId || c?.floor?.id;
const role = r => r === 'international-security' ? 'international-security-customs' : r;
const fail = code => {throw new AirportPolicyError(code);};
const near = (a, b) => a && b && floorOf(a) === floorOf(b)
  && Math.hypot((a.longitude-b.longitude)*Math.cos(b.latitude*Math.PI/180), a.latitude-b.latitude)*111320 <= .1;

// An endpoint lying inside a segment is evidence of contact, not evidence that
// the SDK visited the directed portal. Require an explicit sample or reject.
function segmentNear(a, b, endpoint) {
  if (floorOf(a) !== floorOf(endpoint) || floorOf(b) !== floorOf(endpoint)) return false;
  const scale = Math.cos(endpoint.latitude*Math.PI/180);
  const x = (b.longitude-a.longitude)*scale, y = b.latitude-a.latitude;
  const lengthSquared = x*x+y*y;
  if (!lengthSquared) return near(a, endpoint);
  const t = Math.max(0, Math.min(1, ((endpoint.longitude-a.longitude)*scale*x+(endpoint.latitude-a.latitude)*y)/lengthSquared));
  return near({longitude:a.longitude+(b.longitude-a.longitude)*t,
    latitude:a.latitude+(b.latitude-a.latitude)*t, floorId:floorOf(a)}, endpoint);
}

function portalTraversal(coordinates, entry, exit, zone) {
  const visits = [], touched = [];
  for (const [index, c] of coordinates.entries()) {
    const atEntry = near(c, entry), atExit = near(c, exit);
    if (atEntry && atExit) fail('AMBIGUOUS_PORTAL');
    const side = atEntry ? 'entry' : atExit ? 'exit' : null;
    if (side) {
      const previous = visits.at(-1);
      if (previous?.side === side && previous.end === index-1) previous.end = index;
      else visits.push({side, start:index, end:index});
    }
    const next = coordinates[index+1];
    if (!next) continue;
    for (const endpoint of [entry, exit]) {
      if (segmentNear(c, next, endpoint) && !near(c, endpoint) && !near(next, endpoint)) fail('UNSAMPLED_PORTAL');
    }
    if (routeIntersectsZone([c, next], zone)) touched.push(index);
  }
  if (!visits.length && !touched.length) return null;
  const passages = routeZonePassageCount(coordinates, zone);
  if (passages < 0 || passages > 1) fail('AMBIGUOUS_PORTAL');
  // Bound endpoints establish a direction, not a new checkpoint location.
  // Contacts from the opposite side or backward segments remain unsupported.
  if (floorOf(entry) !== floorOf(exit)) fail('AMBIGUOUS_PORTAL');
  const scale = Math.cos(entry.latitude*Math.PI/180);
  const dx = (exit.longitude-entry.longitude)*scale, dy = exit.latitude-entry.latitude;
  const lengthSquared = dx*dx+dy*dy;
  if (!Number.isFinite(lengthSquared) || !lengthSquared) fail('AMBIGUOUS_PORTAL');
  const progress = c => ((c.longitude-entry.longitude)*scale*dx+(c.latitude-entry.latitude)*dy)/lengthSquared;
  for (let i=1; i<visits.length; i++) {
    if (visits[i-1].side === 'exit' && visits[i].side === 'entry') fail('REVERSED_PORTAL');
  }
  if (visits.length === 1) {
    const visit = visits[0];
    // Only the adjacent boundary segment can be an approach/departure. Any
    // additional polygon contact is ambiguous and cannot grant a crossing.
    const approach = visit.side === 'entry' && visit.end === coordinates.length-1
      && touched.every(i => i >= visit.start-1);
    const departure = visit.side === 'exit' && visit.start === 0
      && touched.every(i => i <= visit.end);
    if (approach) {
      if (visit.start > 0 && progress(coordinates[visit.start-1]) > 1e-9) fail('REVERSED_PORTAL');
      return null;
    }
    if (departure) {
      if (visit.end < coordinates.length-1 && progress(coordinates[visit.end+1]) < 1-1e-9) fail('REVERSED_PORTAL');
      return null;
    }
    fail('AMBIGUOUS_PORTAL');
  }
  // Bound endpoints may sit outside a narrow polygon. Safe boundary legs above
  // need no polygon contact; an observed crossing still requires that contact.
  if (!touched.length) fail('PORTAL_GEOMETRY_MISMATCH');
  if (visits.length !== 2 || visits[0].side !== 'entry' || visits[1].side !== 'exit') fail('MULTIPLE_PORTAL_CROSSINGS');
  if (passages !== 1) fail('PORTAL_GEOMETRY_MISMATCH');
  const start = visits[0].end, end = visits[1].start;
  if (touched.some(i => i < visits[0].start || i >= visits[1].end)) fail('AMBIGUOUS_PORTAL');
  for (let i=start; i<end; i++) {
    if (progress(coordinates[i+1]) < progress(coordinates[i])-1e-9) fail('REVERSED_PORTAL');
  }
  return {start, end};
}

export function createAirportJourneySdkAdapter({mapData, config}) {
  const objects = new Map(['space','area','object','door','point-of-interest','connection']
    .flatMap(t => mapData.getByType(t)).map(o => [o.id, o]));
  const floors = new Map(mapData.getByType('floor').map(f => [f.id, f]));
  const registry = () => config.checkpointRegistry instanceof Map
    ? [...config.checkpointRegistry.values()] : Object.values(config.checkpointRegistry || {});
  const coordinate = o => o?.coordinate || o?.anchor || o?.center;
  const blocked = constraints => {
    const zones = config.zones ?? [];
    if (!Array.isArray(zones)) fail('INVALID_ZONE');
    zones.forEach(validateAirportZone);
    return zones.filter(z => constraints.blockedRoles.some(r => role(r) === role(z.role))
      && !constraints.allowedRoles.some(r => role(r) === role(z.role)));
  };
  const assertOpen = (id, context) => assertAirportEndpointOpen(id, context?.profileId ?? config.defaultProfile, config);
  return {
    async resolveEndpoint(id, context) {
      assertOpen(id, context);
      const entity = objects.get(id), point = coordinate(entity);
      if (!entity || !point) return null;
      return {id, entity, coordinate:point, floorId:floorOf(point) || entity.floor?.id};
    },
    async getDirections(from, to, options) {
      assertOpen(from, options.context);
      assertOpen(to, options.context);
      const zones = blocked(options.constraints).map(z => {
        const floor = floors.get(z.floorId);
        if (!floor) fail('MISSING_FLOOR');
        return {geometry:z.geometry, floor, cost:Infinity};
      });
      // The planner guards the entire returned promise, including SDK failures.
      return mapData.getDirections(from, to, {accessible:options.accessible, zones, smoothing:false});
    },
    async validateLeg(directions, leg) {
      assertOpen(leg.from?.id, leg.context);
      assertOpen(leg.to?.id, leg.context);
      validateAirportRoute(directions, blocked(leg.constraints));
      const observed = [];
      for (const record of registry()) {
        const entry = coordinate(objects.get(record.entryEndpointId)), exit = coordinate(objects.get(record.exitEndpointId));
        if (!entry || !exit) fail('MISSING_ENDPOINT_ID');
        if (!record.geometry) fail('MISSING_PORTAL_GEOMETRY');
        const zone = {geometry:record.geometry, floorId:record.floorId};
        validateAirportZone(zone);
        const crossing = portalTraversal(directions.coordinates, entry, exit, zone);
        if (!crossing) continue;
        if (record.verified !== true || !record.profileIds?.includes(leg.context.profileId)) fail('UNVERIFIED_PORTAL');
        if (record.id !== leg.event?.checkpointId) fail('UNEXPECTED_PORTAL');
        observed.push({index:crossing.start, event:{checkpointId:record.id, role:record.role,
          floorId:record.floorId, direction:record.portalDirection,
          fromStage:leg.event.fromStage, toStage:leg.event.toStage}});
      }
      return {valid:true, checkpointEvents:observed.sort((a,b) => a.index-b.index).map(o => o.event)};
    },
  };
}
