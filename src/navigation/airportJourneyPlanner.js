import {resolveJourneyScenario} from '../journeys/airportJourneyScenarios.js';
import {advanceProcedureState, resolveProcedureConstraints, validateProcedureEvents} from './airportProcedurePolicy.js';
import {assertAirportEndpointOpen} from './airportJourneyContext.js';

export class AirportJourneyPlannerError extends Error {
  constructor(code, details) {
    super(code);
    this.name = 'AirportJourneyPlannerError';
    this.code = code;
    this.details = details;
  }
}
const fail = (code, details) => {throw new AirportJourneyPlannerError(code, details);};
const text = value => typeof value === 'string' && value.trim().length > 0;
const lookup = (collection, id) => collection instanceof Map ? collection.get(id)
  : collection && Object.hasOwn(collection, id) ? collection[id] : undefined;
const idOf = endpoint => typeof endpoint === 'string' ? endpoint : endpoint?.id;
const floorOf = coordinate => coordinate?.floorId ?? coordinate?.floor?.id;
const point = coordinate => ({longitude: coordinate?.longitude, latitude: coordinate?.latitude, floorId: floorOf(coordinate)});
const samePoint = (a, b) => a.floorId === b.floorId && a.latitude === b.latitude && a.longitude === b.longitude;
function validPoint(coordinate) {
  return Number.isFinite(coordinate.longitude) && Number.isFinite(coordinate.latitude) && text(coordinate.floorId);
}

/**
 * planAirportJourney(input, {config, getDirections, resolveEndpoint, validateLeg,
 * getRequestVersion?}). Config is operator-supplied {profiles,checkpointRegistry,version}.
 * Input contains scenario intent, origin/destination IDs, mobility, abortSignal and
 * requestVersion (requires getRequestVersion). Input profiles never grant trust.
 * Registry records extend policy bindings with entryEndpointId, exitEndpointId,
 * portalDirection and optional entryFloorId/exitFloorId (default: bound floorId).
 * resolveEndpoint(id, context) returns {id,floorId,entity,coordinate}; entity is
 * the actual SDK endpoint, coordinate has longitude/latitude and explicit floor.
 * getDirections(entity, entity, options) returns SDK directions with coordinates.
 * validateLeg(directions, leg) must independently check role zones AND directed
 * portal topology, returning {valid:true,checkpointEvents:[observed policy events]}.
 * Approach/final legs require zero events; a crossing requires its exact event.
 * All failures reject; success describes planner movement, never clearance.
 */
export async function planAirportJourney(input = {}, deps = {}) {
  const {config, getDirections, resolveEndpoint, validateLeg, getRequestVersion} = deps;
  if (!config || typeof config !== 'object') fail('MISSING_CONFIG');
  const intent = {...input, profile: input.profile && typeof input.profile === 'object' ? input.profile.id : input.profile};
  const scenario = resolveJourneyScenario(intent, config);
  if (scenario.availability !== 'available' || scenario.previewOnly) {
    fail(scenario.availability === 'preview' ? 'SCENARIO_PREVIEW' : 'SCENARIO_PENDING', scenario.reasons);
  }
  if (!text(config.version)) fail('MISSING_CONFIG_VERSION');
  for (const dependency of [getDirections, resolveEndpoint, validateLeg]) {
    if (typeof dependency !== 'function') fail('MISSING_DEPENDENCY');
  }
  const mobility = input.mobility ?? 'standard';
  if (!['standard', 'accessible'].includes(mobility)) fail('UNKNOWN_MOBILITY');
  const abortSignal = input.abortSignal;
  const requestVersion = input.requestVersion;
  if (requestVersion != null && typeof getRequestVersion !== 'function') fail('MISSING_REQUEST_VERSION_GUARD');
  const configVersion = config.version;
  const bindingSignature = () => JSON.stringify(scenario.steps.map(step => lookup(config.checkpointRegistry, step.checkpointId)));
  const originalBindings = bindingSignature();
  const originalScenario = JSON.stringify(scenario);
  // Include every routing input, including other portals that a leg might cross.
  // Detect in-place revocation even when an operator forgets to bump the version.
  const routingSignature = () => JSON.stringify({zones: config.zones ?? [],
    counters: config.counters ?? [], gates: config.gates ?? [], belts: config.belts ?? [],
    profile: lookup(config.profiles, scenario.profileId), registry: config.checkpointRegistry},
    (_key, value) => value instanceof Map ? [...value.entries()] : value);
  const originalRoutingPolicy = routingSignature();
  const check = () => {
    if (abortSignal?.aborted) fail('ABORTED');
    if (requestVersion != null && getRequestVersion() !== requestVersion) fail('STALE_REQUEST');
    if (config.version !== configVersion) fail('CONFIG_CHANGED');
    const policy = validateProcedureEvents([], scenario, config);
    if (!policy.valid) fail(policy.code);
    for (const id of [idOf(input.origin), idOf(input.destination), ...scenario.steps.flatMap(step => {
      const record = lookup(config.checkpointRegistry, step.checkpointId);
      return [record.entryEndpointId, record.exitEndpointId];
    })]) assertAirportEndpointOpen(id, scenario.profileId, config);
    if (routingSignature() !== originalRoutingPolicy) fail('CONFIG_CHANGED');
    if (bindingSignature() !== originalBindings || JSON.stringify(resolveJourneyScenario(intent, config)) !== originalScenario) fail('CONFIG_CHANGED');
  };
  // Check both sides of every asynchronous seam, including failure paths.
  const guarded = async operation => {
    check();
    try {const value = await operation(); check(); return value;}
    catch (error) {check(); throw error;}
  };
  check();
  const baseContext = Object.freeze({requestVersion, requestId: input.requestId, configVersion,
    profileId: scenario.profileId, scenarioId: scenario.id, journeyKind: scenario.kind,
    trafficClass: scenario.traffic, transfer: scenario.transfer,
    transferFrom: scenario.transfer ? (scenario.transfer[0] === 'I' ? 'international' : 'domestic') : null,
    transferTo: scenario.transfer ? (scenario.transfer[1] === 'I' ? 'international' : 'domestic') : null,
    mobility, originEndpointId: idOf(input.origin), destinationEndpointId: idOf(input.destination),
    mode: 'planner', authorization: 'none'});
  const endpoint = async (id, expectedFloor) => {
    if (!text(id)) fail('MISSING_ENDPOINT_ID');
    const resolved = await guarded(() => resolveEndpoint(id, baseContext));
    const coordinate = point(resolved?.coordinate);
    if (!resolved || resolved.id !== id || resolved.entity?.id !== id || !text(resolved.floorId)
      || !validPoint(coordinate) || coordinate.floorId !== resolved.floorId
      || (expectedFloor && expectedFloor !== resolved.floorId)) fail('INVALID_ENDPOINT', {id});
    return Object.freeze({id, floorId: resolved.floorId, entity: resolved.entity, coordinate: Object.freeze(coordinate)});
  };
  // Resolve every binding before the first SDK call; no partial route for missing assets.
  const origin = await endpoint(baseContext.originEndpointId);
  const destination = await endpoint(baseContext.destinationEndpointId);
  const portals = [];
  for (const event of scenario.steps) {
    const record = lookup(config.checkpointRegistry, event.checkpointId);
    if (record.portalDirection !== event.direction) fail('PORTAL_DIRECTION_MISMATCH');
    const entry = await endpoint(record.entryEndpointId, record.entryFloorId ?? event.floorId);
    const exit = await endpoint(record.exitEndpointId, record.exitFloorId ?? event.floorId);
    if (entry.id === exit.id || samePoint(entry.coordinate, exit.coordinate)) fail('INVALID_PORTAL');
    portals.push({entry, exit, event});
  }
  let state = validateProcedureEvents([], scenario, config).state;
  const legs = [], coordinates = [], checkpointEvents = [], legStates = [], floorTransitions = [];
  const routeLeg = async (from, to, event, type) => {
    check();
    const constraints = resolveProcedureConstraints(state, scenario, config);
    const context = Object.freeze({...baseContext, stage: state.stage});
    const leg = Object.freeze({index: legs.length, type, from, to, event: event ?? null,
      fromStage: state.stage, toStage: event?.toStage ?? state.stage,
      constraints, context, mobility, abortSignal, requestVersion});
    const directions = await guarded(() => getDirections(from.entity, to.entity, {
      accessible: mobility === 'accessible', mobility, signal: abortSignal, requestVersion,
      constraints, context,
    }));
    const geometry = directions?.coordinates;
    if (!Array.isArray(geometry) || geometry.length < 2) fail('INVALID_ROUTE');
    const points = Array.from(geometry, point);
    if (points.some(p => !validPoint(p))) fail('INVALID_ROUTE');
    if (!samePoint(points[0], from.coordinate) || !samePoint(points.at(-1), to.coordinate)) fail('DISCONNECTED_ROUTE');
    const validation = await guarded(() => validateLeg(directions, leg));
    if (!Array.isArray(directions.coordinates) || directions.coordinates.length !== points.length
      || Array.from(directions.coordinates).some((p, i) => !samePoint(point(p), points[i]))) fail('GEOMETRY_CHANGED');
    if (validation?.valid !== true || !Array.isArray(validation.checkpointEvents)) fail('UNVALIDATED_LEG');
    const events = validation.checkpointEvents;
    if (events.length !== (event ? 1 : 0)) fail('LEG_EVENT_MISMATCH');
    let next = state;
    if (event) next = advanceProcedureState(state, events[0], scenario, config);
    // Publish into the result only after every check for this leg passes.
    const firstIndex = coordinates.length ? 1 : 0;
    for (const coordinate of points.slice(firstIndex)) {
      const previous = coordinates.at(-1);
      if (previous && previous.floorId !== coordinate.floorId) floorTransitions.push(Object.freeze({
        legIndex: leg.index, coordinateIndex: coordinates.length,
        fromFloorId: previous.floorId, toFloorId: coordinate.floorId,
      }));
      coordinates.push(Object.freeze(coordinate));
    }
    legs.push(Object.freeze({...leg, directions}));
    legStates.push(leg);
    state = next;
    if (event) checkpointEvents.push(state.events.at(-1));
  };
  let current = origin;
  for (const {entry, exit, event} of portals) {
    await routeLeg(current, entry, null, 'approach');
    await routeLeg(entry, exit, event, 'checkpoint');
    current = exit;
  }
  await routeLeg(current, destination, null, 'destination');
  check();
  const procedure = validateProcedureEvents(checkpointEvents, scenario, config);
  if (!procedure.valid || !procedure.complete || procedure.previewOnly) fail(procedure.code ?? 'INCOMPLETE_PROCEDURE');
  return Object.freeze({scenario, legs: Object.freeze(legs), coordinates: Object.freeze(coordinates),
    checkpointEvents: Object.freeze(checkpointEvents), legStates: Object.freeze(legStates),
    floorTransitions: Object.freeze(floorTransitions), configVersion,
    context: Object.freeze({...baseContext, stage: state.stage}), verifiedRealRoute: true});
}
