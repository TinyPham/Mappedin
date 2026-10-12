const DEFINITIONS = {
  domesticDeparture: {
    stages: ['public', 'domestic-checkin-done', 'boarding-validated', 'domestic-security-cleared', 'domestic-airside', 'departure-gate'],
    roles: ['checkin', 'boarding-validation', 'domestic-security', 'domestic-airside', 'departure-gate'],
  },
  internationalDeparture: {
    stages: ['public', 'international-checkin-done', 'boarding-validated', 'exit-border-cleared', 'intl-security-customs-cleared', 'international-airside', 'departure-gate'],
    roles: ['checkin', 'boarding-validation', 'emigration', 'international-security-customs', 'international-airside', 'departure-gate'],
  },
  domesticArrival: {
    stages: ['domestic-arrival-corridor', 'baggage-complete', 'public', 'exit'],
    roles: ['baggage', 'arrival-public', 'exit'],
  },
  internationalArrival: {
    stages: ['international-arrival-corridor', 'health-cleared', 'entry-border-cleared', 'baggage-complete', 'arrival-customs-cleared', 'public', 'exit'],
    roles: ['health', 'immigration', 'baggage', 'arrival-customs', 'arrival-public', 'exit'],
  },
  transferII: {
    stages: ['international-arrival-corridor', 'health-cleared', 'transfer-processed', 'transfer-security-customs-cleared', 'international-airside', 'departure-gate'],
    roles: ['health', 'transfer-desk', 'transfer-security-customs', 'international-airside', 'departure-gate'],
  },
};
for (const [code, arrival, departure] of [['DI', 'domestic', 'international'], ['DD', 'domestic', 'domestic'], ['ID', 'international', 'domestic']]) {
  DEFINITIONS[`transfer${code}`] = {
    stages: [...DEFINITIONS[`${arrival}Arrival`].stages.slice(0, -1), ...DEFINITIONS[`${departure}Departure`].stages.slice(1)],
    roles: [...DEFINITIONS[`${arrival}Arrival`].roles.slice(0, -1), ...DEFINITIONS[`${departure}Departure`].roles],
  };
}
const INITIAL_PROFILES = ['initial-t1', 'initial-operations'];
const BUILTIN_PROFILES = [...INITIAL_PROFILES, 'full-t1'];
const CONTROL_ROLES = ['domestic-security', 'international-security', 'international-security-customs', 'emigration', 'immigration', 'arrival-customs', 'departure-customs', 'passenger-customs', 'transfer-desk', 'transfer-security-customs'];
const DEDICATED_ROLES = ['health', 'transfer-desk', 'transfer-security-customs', 'immigration', 'domestic-security', 'domestic-airside', 'departure-gate'];
const RECHECK_ROLES = ['secondary-check', 'secondary-return'];
const isText = value => typeof value === 'string' && value.trim().length > 0;
const trafficLetter = value => ({ domestic: 'D', international: 'I' })[value];
const lookup = (collection, id) => collection instanceof Map ? collection.get(id)
  : collection && Object.hasOwn(collection, id) ? collection[id] : undefined;

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

// Copy only the binding fields: configuration metadata cannot grant clearance.
function explicitSteps(steps) {
  return Array.isArray(steps) ? Array.from(steps, step => ({
    role: step?.role ?? null, fromStage: step?.fromStage ?? null, toStage: step?.toStage ?? null,
    checkpointId: step?.checkpointId ?? null, floorId: step?.floorId ?? null, direction: step?.direction ?? null,
  })) : [];
}

function isSequence(steps) {
  return steps.length > 0 && Array.from(steps).every((step, index) =>
    step != null && ['role', 'fromStage', 'toStage', 'checkpointId', 'floorId', 'direction'].every(key => isText(step[key]))
    && (!index || steps[index - 1]?.toStage === step.fromStage));
}

function validateBindings(steps, profileId, registry, addReason) {
  for (const step of steps) {
    const record = lookup(registry, step.checkpointId);
    if (!isText(step.checkpointId) || !record) {
      addReason('MISSING_CHECKPOINT');
      continue;
    }
    if (record.verified !== true) addReason('UNVERIFIED_CHECKPOINT');
    if (record.id !== step.checkpointId || record.role !== step.role
      || !isText(step.floorId) || record.floorId !== step.floorId
      || !isText(step.direction) || record.direction !== step.direction
      || !Array.isArray(record.profileIds) || !record.profileIds.includes(profileId)) addReason('CHECKPOINT_BINDING_MISMATCH');
  }
}

function blockedRoles(steps) {
  const outgoing = new Map();
  for (const step of steps) {
    for (const stage of [step.fromStage, step.toStage]) {
      if (isText(stage) && !outgoing.has(stage)) outgoing.set(stage, new Set());
    }
    const permitted = outgoing.get(step.fromStage);
    if (!permitted) continue;
    permitted.add(step.role);
    if (step.role === 'international-security-customs') {
      for (const alias of ['international-security', 'passenger-customs', 'departure-customs']) permitted.add(alias);
    }
  }
  return Object.fromEntries([...outgoing].map(([stage, permitted]) =>
    [stage, CONTROL_ROLES.filter(role => !permitted.has(role))]));
}

/**
 * Resolve a procedure specification, never geometry or a passenger clearance.
 *
 * @param {Object} input kind/journeyKind: departure|arrival|transfer;
 * traffic/trafficClass: domestic|international; transfer: II|DI|DD|ID (or
 * transferFrom/transferTo); profile/profileId: object or configured name;
 * variant: dedicated (ID only); recheck: {trigger, escort:true, returnStage}.
 * @param {Object} [options] {profiles, checkpointRegistry}, keyed objects or Maps.
 * Profiles provide {id,status:verified|candidate,scenarioCheckpoints:{[id]:[IDs]},
 * transferArea, dedicatedID:{enabled,floorId,steps}, recheck:{trigger,
 * escortRequired:true,allowedReturnStages,steps}}. Explicit steps contain
 * {checkpointId,role,floorId,direction,fromStage,toStage}; registry records contain
 * {id,role,floorId,direction,verified:true,profileIds:[profileId]}.
 * @returns {Object} Deeply frozen snapshot with id, kind, traffic, transfer,
 * profileId, profile:{id,status}, availability, reason, reasons, ordered stages,
 * steps, constraints:{blockedRolesByStage}, recheck, recheckGuard:
 * {trigger,escortRequired:true,allowedReturnStages}, previewOnly,
 * verifiedRealRoute:false. Recheck may return to its start or replay earlier
 * stages, but cannot skip mandatory stages by returning forward.
 * Recheck roles are limited to secondary-check and secondary-return, with
 * secondary-check first and secondary-return last; no control roles are granted.
 * Stage constraints union outgoing checkpoint roles across repeated stages.
 * This coarse map does not grant a crossing: per-leg policy must enforce the
 * exact next step, including its checkpoint binding and procedure order.
 * IDs: domesticDeparture, internationalDeparture, domesticArrival,
 * internationalArrival, transferII, transferDI, transferDD, transferID,
 * transferIDDedicated. Ordinary bindings must match the complete role sequence.
 * Dedicated floorId binds only the dedicated immigration step to the explicitly
 * configured floor-2 checkpoint floor; other steps retain their configured floors.
 * Dedicated roles are limited to health, transfer-desk, transfer-security-customs,
 * immigration, domestic-security, domestic-airside, and departure-gate.
 * Initial profiles default to pending; explicit enabled dedicated configuration
 * with complete verified bindings follows the same profile-status rules.
 * The resolver never derives a floor number, checkpoint ID, or approval.
 *
 * @example
 * const scenario = resolveJourneyScenario({journeyKind:'transfer',
 *   transferFrom:'international', transferTo:'domestic', profileId:'full-t1'},
 *   {profiles, checkpointRegistry});
 * // pending => unsupported; preview => illustration only.
 * // Policy must independently validate every binding against current registry.
 * const event = scenario.steps[0]; // exact six-field policy event binding
 * // advanceProcedureState(null, event, scenario, {checkpointRegistry});
 * // Procedure validation alone never verifies a real route's geometry.
 * @example
 * resolveJourneyScenario({kind:'departure', traffic:'domestic', profile,
 *   recheck:{trigger:'secondary-request',escort:true,returnStage:'domestic-airside'}},
 *   {checkpointRegistry}); // inserts only profile.recheck.steps, then resumes
 */
export function resolveJourneyScenario(input = {}, { profiles = {}, checkpointRegistry = {} } = {}) {
  input = input && typeof input === 'object' ? input : {};
  const reasons = [];
  const addReason = reason => { if (!reasons.includes(reason)) reasons.push(reason); };
  const kind = input.kind ?? input.journeyKind ?? null;
  let traffic = input.traffic ?? input.trafficClass ?? null;
  let transfer = null;
  if (input.kind && input.journeyKind && input.kind !== input.journeyKind) addReason('CONFLICTING_INPUT');
  if (input.traffic && input.trafficClass && input.traffic !== input.trafficClass) addReason('CONFLICTING_INPUT');
  if (kind === 'transfer') {
    const pair = `${trafficLetter(input.transferFrom) ?? ''}${trafficLetter(input.transferTo) ?? ''}`;
    transfer = input.transfer ?? (pair.length === 2 ? pair : null);
    if (!['II', 'DI', 'DD', 'ID'].includes(transfer)) addReason('UNKNOWN_TRANSFER');
    if ((input.transferFrom || input.transferTo) && pair !== transfer) addReason('CONFLICTING_INPUT');
    const sourceTraffic = transfer?.[0] === 'D' ? 'domestic' : transfer?.[0] === 'I' ? 'international' : null;
    if (traffic && traffic !== sourceTraffic) addReason('CONFLICTING_INPUT');
    traffic = sourceTraffic;
  } else {
    if (!['departure', 'arrival'].includes(kind)) addReason('UNKNOWN_KIND');
    if (!['domestic', 'international'].includes(traffic)) addReason('UNKNOWN_TRAFFIC');
    if (input.transfer || input.transferFrom || input.transferTo) addReason('CONFLICTING_INPUT');
  }
  const dedicated = input.variant === 'dedicated';
  if (input.variant != null && !(dedicated && kind === 'transfer' && transfer === 'ID')) addReason('UNKNOWN_VARIANT');
  const profileInput = input.profile ?? input.profileId ?? 'full-t1';
  const profileId = typeof profileInput === 'object' ? profileInput?.id ?? null : profileInput;
  const profile = typeof profileInput === 'object' && profileInput ? profileInput : lookup(profiles, profileId);
  if (input.profileId && input.profileId !== profileId) addReason('PROFILE_MISMATCH');
  if (!isText(profileId) || (!profile && !BUILTIN_PROFILES.includes(profileId))) addReason('UNKNOWN_PROFILE');
  if (profile && profile.id !== profileId) addReason('PROFILE_MISMATCH');
  const profileStatus = profile?.status ?? 'pending';
  if (!['verified', 'candidate'].includes(profileStatus)) addReason('PROFILE_UNCONFIRMED');
  const baseId = kind === 'transfer' ? `transfer${transfer ?? ''}` : `${traffic ?? ''}${kind === 'departure' ? 'Departure' : kind === 'arrival' ? 'Arrival' : ''}`;
  const id = dedicated ? 'transferIDDedicated' : baseId;
  const definition = lookup(DEFINITIONS, baseId);
  let steps = [];
  if (dedicated) {
    const config = profile?.dedicatedID;
    steps = explicitSteps(config?.steps);
    if (INITIAL_PROFILES.includes(profileId) && config?.enabled !== true) addReason('DEDICATED_ID_INITIAL_PENDING');
    const immigrationIndex = steps.findIndex(step => step.role === 'immigration' && step.toStage === 'dedicated-entry-border-cleared');
    const airsideIndex = steps.findIndex(step => step.toStage === 'domestic-airside');
    if (config?.enabled !== true || !isText(config.floorId) || !isSequence(steps)
      || steps.some(step => step.direction !== 'forward' || !DEDICATED_ROLES.includes(step.role))
      || steps[0]?.fromStage !== 'international-arrival-corridor' || steps[0]?.role !== 'health'
      || immigrationIndex < 1 || steps[immigrationIndex]?.floorId !== config.floorId || airsideIndex <= immigrationIndex
      || steps.at(-1)?.role !== 'departure-gate'
      || !['departure-gate', 'domestic-departure-gate'].includes(steps.at(-1)?.toStage)
      || steps.some(step => step.fromStage === 'public' || step.toStage === 'public')) addReason('DEDICATED_ID_UNCONFIGURED');
  } else if (definition) {
    const bindings = lookup(profile?.scenarioCheckpoints, id);
    if (!Array.isArray(bindings) || bindings.length !== definition.roles.length) addReason('CHECKPOINT_SEQUENCE_INCOMPLETE');
    steps = definition.roles.map((role, index) => {
      const checkpointId = Array.isArray(bindings) && isText(bindings[index]) ? bindings[index] : null;
      const record = lookup(checkpointRegistry, checkpointId);
      return { role, fromStage: definition.stages[index], toStage: definition.stages[index + 1], checkpointId, floorId: record?.floorId ?? null, direction: 'forward' };
    });
  }
  if (transfer === 'II' && INITIAL_PROFILES.includes(profileId) && profile?.transferArea !== 'west') addReason('WEST_TRANSFER_REQUIRED');
  let recheck = null;
  let recheckGuard = null;
  if (input.recheck != null) {
    const requested = input.recheck;
    const config = profile?.recheck;
    const extraSteps = explicitSteps(config?.steps);
    const startIndex = steps.findIndex(step => step.fromStage === extraSteps[0]?.fromStage);
    const returnIndex = steps.findIndex(step => step.fromStage === requested?.returnStage);
    const allowed = isText(requested?.trigger) && requested.trigger === config?.trigger
      && requested.escort === true && config?.escortRequired === true
      && Array.isArray(config.allowedReturnStages) && config.allowedReturnStages.includes(requested.returnStage)
      && isSequence(extraSteps) && extraSteps.at(-1).toStage === requested.returnStage
      && extraSteps.every(step => RECHECK_ROLES.includes(step.role))
      && extraSteps[0].role === 'secondary-check' && extraSteps.at(-1).role === 'secondary-return'
      && startIndex >= 0 && returnIndex >= 0 && returnIndex <= startIndex;
    if (!allowed) addReason('RECHECK_GUARD_FAILED');
    else {
      recheck = { trigger: requested.trigger, escort: true, returnStage: requested.returnStage };
      recheckGuard = { trigger: config.trigger, escortRequired: true, allowedReturnStages: [...config.allowedReturnStages] };
      steps = [...steps.slice(0, startIndex), ...extraSteps, ...steps.slice(returnIndex)];
    }
  }
  validateBindings(steps, profileId, checkpointRegistry, addReason);
  const stages = steps.length ? [steps[0].fromStage, ...steps.map(step => step.toStage)] : [];
  const availability = reasons.length ? 'pending' : profileStatus === 'candidate' ? 'preview' : 'available';
  return freeze({ id, kind, traffic, transfer, profileId, profile: { id: profileId, status: profileStatus },
    variant: dedicated ? 'dedicated' : null, availability, reason: reasons[0] ?? null, reasons,
    stages, steps, constraints: { blockedRolesByStage: blockedRoles(steps) },
    recheck, recheckGuard, previewOnly: availability === 'preview', verifiedRealRoute: false });
}
