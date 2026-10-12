/**
 * Procedure contracts describe planner movement, never passenger authorization.
 * Checkpoint registries must come from trusted configuration, not query strings.
 * Geometry, portal topology, endpoint/profile openness and operational approval
 * remain separate router checks; even a complete procedure is not a real route.
 *
 * const scenario = resolveJourneyScenario(intent, {profiles, checkpointRegistry});
 * const result = validateProcedureEvents(route.checkpointEvents, scenario, {checkpointRegistry});
 * // Feed result.legStates into per-leg zone/portal validation before publishing.
 */

export class ProcedurePolicyError extends Error {
  constructor(code) {
    super(code);
    this.name = 'ProcedurePolicyError';
    this.code = code;
  }
}

const states = new WeakMap();
const eventFields = ['checkpointId', 'role', 'floorId', 'direction', 'fromStage', 'toStage'];
const controlRoles = ['domestic-security', 'international-security', 'international-security-customs',
  'emigration', 'immigration', 'arrival-customs', 'departure-customs', 'passenger-customs',
  'transfer-security-customs', 'dedicated-immigration'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const checkpointAt = (registry, id) => registry instanceof Map ? registry.get(id)
  : registry && Object.hasOwn(registry, id) ? registry[id] : undefined;
const fail = code => { throw new ProcedurePolicyError(code); };

function assertSupported(scenario, registry) {
  if (!scenario || !nonempty(scenario.id) || !['available', 'preview'].includes(scenario.availability)) {
    fail(scenario?.reason || 'SCENARIO_PENDING');
  }
  const profile = scenario.profile;
  if (!profile || profile.id !== scenario.profileId || !nonempty(profile.id) ||
      !['verified', 'candidate'].includes(profile.status)) fail('UNKNOWN_PROFILE');
  if (!Array.isArray(scenario.steps) || !scenario.steps.length || !Array.isArray(scenario.stages) ||
      scenario.stages.length !== scenario.steps.length + 1) fail('INVALID_SCENARIO');
  if (scenario.recheck != null) {
    const branch = scenario.recheck;
    const guard = scenario.recheckGuard;
    if (!guard || !nonempty(branch.trigger) || branch.trigger !== guard.trigger ||
        branch.escort !== true || guard.escortRequired !== true ||
        !Array.isArray(guard.allowedReturnStages) || !guard.allowedReturnStages.includes(branch.returnStage) ||
        !scenario.stages.includes(branch.returnStage)) fail('RECHECK_GUARD_FAILED');
  }
  for (const [index, step] of scenario.steps.entries()) {
    if (!step || eventFields.some(field => !nonempty(step[field])) ||
        step.fromStage !== scenario.stages[index] || step.toStage !== scenario.stages[index + 1]) {
      fail('INVALID_SCENARIO');
    }
    if (scenario.transfer === 'II' && ['immigration', 'emigration', 'dedicated-immigration'].includes(step.role)) {
      fail('FORBIDDEN_SCENARIO_ROLE');
    }
    const checkpoint = checkpointAt(registry, step.checkpointId);
    if (!checkpoint) fail('MISSING_CHECKPOINT');
    if (checkpoint.verified !== true) fail('UNVERIFIED_CHECKPOINT');
    if (checkpoint.id !== step.checkpointId || checkpoint.role !== step.role ||
        checkpoint.floorId !== step.floorId || checkpoint.direction !== step.direction) fail('CHECKPOINT_BINDING_MISMATCH');
    if (!Array.isArray(checkpoint.profileIds) || !checkpoint.profileIds.includes(profile.id)) fail('CHECKPOINT_PROFILE_MISMATCH');
  }
}

function assertEvent(event, step) {
  if (!step) fail('EXTRA_EVENT');
  if (!event || typeof event !== 'object' || eventFields.some(field => !nonempty(event[field]))) fail('INVALID_EVENT');
  if (eventFields.some(field => event[field] !== step[field])) fail('EVENT_ORDER_OR_BINDING_MISMATCH');
}

function snapshotEvent(event) {
  return Object.freeze(Object.fromEntries(eventFields.map(field => [field, event[field]])));
}

function makeState(scenario, events, checkpointRegistry) {
  const saved = Object.freeze(events.map(snapshotEvent));
  const state = Object.freeze({scenarioId: scenario.id, profileId: scenario.profileId,
    stage: scenario.stages[saved.length], nextStep: saved.length,
    events: saved, mode: 'planner', authorization: 'none'});
  // Identity prevents a stage or clearance object restored from a URL from
  // being mistaken for state created by this planner. Replay events explicitly.
  states.set(state, {scenario, signature: JSON.stringify(scenario), checkpointRegistry});
  return state;
}

function assertState(state, scenario) {
  const saved = state && states.get(state);
  if (!saved || saved.scenario !== scenario || saved.signature !== JSON.stringify(scenario)) fail('UNKNOWN_STATE');
}

/** Advance one mandatory event. Throws ProcedurePolicyError and never skips a leg. */
export function advanceProcedureState(state, event, scenario, {checkpointRegistry} = {}) {
  if (state != null) assertState(state, scenario);
  assertSupported(scenario, checkpointRegistry);
  const events = state?.events || [];
  // Registry trust can change between asynchronous routing legs. Recheck all
  // bindings and already-planned events instead of trusting a cached clearance.
  events.forEach((prior, index) => assertEvent(prior, scenario.steps[index]));
  assertEvent(event, scenario.steps[events.length]);
  return makeState(scenario, [...events, event], checkpointRegistry);
}

/**
 * Only the next ordered checkpoint role is permitted for the next leg.
 * This replaces a single traffic-class ban across an entire transfer journey:
 * ID arrival may enter immigration/customs before its domestic departure legs.
 */
export function resolveProcedureConstraints(state, scenario, options = {}) {
  assertState(state, scenario);
  // By default retain the live registry used for this state. Callers replacing
  // the registry object should pass the new one explicitly before routing.
  const registry = Object.hasOwn(options, 'checkpointRegistry') ? options.checkpointRegistry : states.get(state).checkpointRegistry;
  assertSupported(scenario, registry);
  const role = scenario.steps[state.nextStep]?.role;
  const allowedRoles = Object.freeze(role ? [role] : []);
  // Combined checkpoint roles represent their constituent control zones on
  // this leg; arrival customs never aliases departure/passenger customs.
  const permittedControls = role === 'international-security-customs'
    ? [role, 'international-security', 'passenger-customs', 'departure-customs'] : allowedRoles;
  const blockedRoles = Object.freeze(controlRoles.filter(control => !permittedControls.includes(control)));
  return Object.freeze({stage: state.stage, nextStage: scenario.steps[state.nextStep]?.toStage ?? null,
    allowedRoles, blockedRoles, mode: 'planner', authorization: 'none'});
}

/**
 * Validate complete routes or prefixes. Invalid input returns a structured
 * failure; missing configuration returns unsupported even for an empty prefix.
 * `valid` describes procedure ordering only. `verifiedRealRoute` is always false.
 */
export function validateProcedureEvents(events, scenario, {checkpointRegistry} = {}) {
  const base = {valid: false, complete: false, verifiedRealRoute: false, previewOnly: false,
    state: null, legStates: []};
  try {
    assertSupported(scenario, checkpointRegistry);
  } catch (error) {
    if (!(error instanceof ProcedurePolicyError)) throw error;
    return {...base, status: 'unsupported', code: error.code};
  }
  const previewOnly = scenario.profile.status === 'candidate' || scenario.availability === 'preview' || scenario.previewOnly === true;
  if (!Array.isArray(events)) return {...base, previewOnly, status: 'invalid', code: 'INVALID_EVENTS'};
  let state = makeState(scenario, [], checkpointRegistry);
  const legStates = [];
  for (const event of events) {
    try {
      const constraints = resolveProcedureConstraints(state, scenario);
      const next = advanceProcedureState(state, event, scenario, {checkpointRegistry});
      legStates.push(Object.freeze({index: state.nextStep, checkpointId: event.checkpointId,
        floorId: event.floorId, direction: event.direction, role: event.role,
        fromStage: state.stage, toStage: next.stage, constraints}));
      state = next;
    } catch (error) {
      if (!(error instanceof ProcedurePolicyError)) throw error;
      return {...base, previewOnly, state, legStates: Object.freeze(legStates), status: 'invalid', code: error.code};
    }
  }
  const complete = state.nextStep === scenario.steps.length;
  return {...base, valid: true, complete, previewOnly, state, legStates: Object.freeze(legStates),
    status: complete ? (previewOnly ? 'preview' : 'complete') : 'incomplete', code: null};
}
