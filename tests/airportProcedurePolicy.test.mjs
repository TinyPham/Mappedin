import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveJourneyScenario} from '../src/journeys/airportJourneyScenarios.js';
import config from '../src/config/airportOperations.json' with {type: 'json'};

const policy = await import('../src/navigation/airportProcedurePolicy.js').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});

// Deliberately synthetic, test-only checkpoint records; these are not map data.
function fixture(status = 'verified') {
  assert.equal(typeof policy.validateProcedureEvents, 'function');
  assert.equal(typeof policy.advanceProcedureState, 'function');
  const stages = ['international-arrival-corridor', 'health-cleared', 'entry-border-cleared',
    'baggage-complete', 'arrival-customs-cleared', 'public', 'domestic-checkin-done',
    'boarding-validated', 'domestic-security-cleared', 'domestic-airside', 'departure-gate'];
  const roles = ['health', 'immigration', 'baggage', 'arrival-customs', 'arrival-public',
    'checkin', 'boarding-validation', 'domestic-security', 'domestic-airside', 'departure-gate'];
  const steps = roles.map((role, i) => ({role, fromStage: stages[i], toStage: stages[i + 1],
    checkpointId: `test-only-${i}`, floorId: 'test-floor', direction: 'forward'}));
  const checkpointRegistry = Object.fromEntries(steps.map(step => [step.checkpointId, {
    id: step.checkpointId, role: step.role, floorId: step.floorId, direction: step.direction,
    verified: true, profileIds: ['test-profile'],
  }]));
  const scenario = {id: 'transfer-ID-public', profileId: 'test-profile',
    profile: {id: 'test-profile', status}, availability: status === 'candidate' ? 'preview' : 'available',
    stages, steps};
  return {scenario, checkpointRegistry, events: steps.map(step => ({...step}))};
}

test('validates every ordered ID public-transfer leg without asserting authorization or geometry', () => {
  const {scenario, checkpointRegistry, events} = fixture();
  const result = policy.validateProcedureEvents(events, scenario, {checkpointRegistry});
  assert.equal(result.status, 'complete');
  assert.equal(result.valid, true);
  assert.equal(result.complete, true);
  assert.equal(result.verifiedRealRoute, false);
  assert.equal(result.state.stage, 'departure-gate');
  assert.equal(result.state.authorization, 'none');
  assert.deepEqual(result.legStates.map(leg => [leg.fromStage, leg.toStage]),
    scenario.steps.map(step => [step.fromStage, step.toStage]));
});

test('prefixes are incomplete and cannot claim completed procedure', () => {
  const {scenario, checkpointRegistry, events} = fixture();
  for (let count = 0; count < events.length; count++) {
    const result = policy.validateProcedureEvents(events.slice(0, count), scenario, {checkpointRegistry});
    assert.equal(result.status, 'incomplete');
    assert.equal(result.complete, false);
    assert.equal(result.state.nextStep, count);
  }
});

for (const [name, edit] of [
  ['skipped immigration', events => events.splice(1, 1)],
  ['reordered immigration and health', events => [events[0], events[1]] = [events[1], events[0]]],
  ['reverse portal', events => events[1].direction = 'reverse'],
  ['wrong checkpoint ID', events => events[1].checkpointId = 'unknown'],
  ['wrong floor', events => events[1].floorId = 'another-floor'],
  ['wrong role', events => events[1].role = 'emigration'],
  ['unknown from stage', events => events[1].fromStage = 'url-cleared'],
  ['unknown to stage', events => events[1].toStage = 'url-cleared'],
  ['skipped intermediate stage', events => events[1].toStage = 'public'],
  ['extra terminal event', events => events.push({...events.at(-1)})],
]) {
  test(`rejects ${name}`, () => {
    const {scenario, checkpointRegistry, events} = fixture();
    edit(events);
    const result = policy.validateProcedureEvents(events, scenario, {checkpointRegistry});
    assert.equal(result.status, 'invalid');
    assert.equal(result.valid, false);
    assert.equal(result.verifiedRealRoute, false);
  });
}

for (const [name, edit] of [
  ['missing checkpoint', f => delete f.checkpointRegistry['test-only-9']],
  ['unverified checkpoint', f => f.checkpointRegistry['test-only-9'].verified = false],
  ['profile excluded', f => f.checkpointRegistry['test-only-9'].profileIds = ['other']],
  ['unknown profile status', f => f.scenario.profile.status = 'url-approved'],
  ['missing profile', f => delete f.scenario.profile],
  ['pending scenario', f => f.scenario.availability = 'pending'],
  ['malformed stage chain', f => f.scenario.steps[1].fromStage = 'public'],
  ['II scenario containing border controls', f => f.scenario.transfer = 'II'],
  ['conditional branch without configured guards', f => f.scenario.recheck = {trigger: 'request', escort: true, returnStage: 'public'}],
  ['conditional branch without escort', f => {
    f.scenario.recheck = {trigger: 'request', escort: false, returnStage: 'public'};
    f.scenario.recheckGuard = {trigger: 'request', escortRequired: true, allowedReturnStages: ['public']};
  }],
  ['conditional branch with wrong trigger', f => {
    f.scenario.recheck = {trigger: 'other', escort: true, returnStage: 'public'};
    f.scenario.recheckGuard = {trigger: 'request', escortRequired: true, allowedReturnStages: ['public']};
  }],
  ['conditional branch with disallowed return', f => {
    f.scenario.recheck = {trigger: 'request', escort: true, returnStage: 'domestic-airside'};
    f.scenario.recheckGuard = {trigger: 'request', escortRequired: true, allowedReturnStages: ['public']};
  }],
]) {
  test(`${name} is unsupported even for an empty or partial event list`, () => {
    const f = fixture();
    edit(f);
    for (const events of [[], f.events]) {
      const result = policy.validateProcedureEvents(events, f.scenario, {checkpointRegistry: f.checkpointRegistry});
      assert.equal(result.status, 'unsupported');
      assert.equal(result.valid, false);
    }
  });
}

test('candidate configuration supports procedure preview only', () => {
  const {scenario, checkpointRegistry, events} = fixture('candidate');
  const result = policy.validateProcedureEvents(events, scenario, {checkpointRegistry});
  assert.equal(result.status, 'preview');
  assert.equal(result.complete, true);
  assert.equal(result.previewOnly, true);
  assert.equal(result.verifiedRealRoute, false);
});

test('advance creates immutable planner state and rejects URL/copied clearance states', () => {
  const {scenario, checkpointRegistry, events} = fixture();
  const options = {checkpointRegistry};
  const state = policy.advanceProcedureState(null, events[0], scenario, options);
  assert.equal(state.stage, 'health-cleared');
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.events[0]), true);
  assert.throws(() => policy.advanceProcedureState({...state}, events[1], scenario, options), /UNKNOWN_STATE/);
  assert.throws(() => policy.advanceProcedureState({stage: 'domestic-airside', checkpointHistory: events}, events[9], scenario, options), /UNKNOWN_STATE/);
  const otherScenario = {...scenario, id: 'different-scenario'};
  assert.throws(() => policy.advanceProcedureState(state, events[1], otherScenario, options), /UNKNOWN_STATE/);
});

test('revalidates prior checkpoints when registry or scenario changes between legs', () => {
  const {scenario, checkpointRegistry, events} = fixture();
  const state = policy.advanceProcedureState(null, events[0], scenario, {checkpointRegistry});
  checkpointRegistry['test-only-0'].verified = false;
  assert.throws(() => policy.advanceProcedureState(state, events[1], scenario, {checkpointRegistry}), /UNVERIFIED_CHECKPOINT/);
});

test('next-leg constraints fail closed after checkpoint revocation', () => {
  const {scenario, checkpointRegistry, events} = fixture();
  const state = policy.advanceProcedureState(null, events[0], scenario, {checkpointRegistry});
  checkpointRegistry['test-only-1'].verified = false;
  assert.throws(() => policy.resolveProcedureConstraints(state, scenario), /UNVERIFIED_CHECKPOINT/);
});

test('constraint resolution checks explicit replacement and missing registries', () => {
  const {scenario, checkpointRegistry, events} = fixture();
  const state = policy.advanceProcedureState(null, events[0], scenario, {checkpointRegistry});
  const replacement = {...checkpointRegistry, 'test-only-1': {...checkpointRegistry['test-only-1'], verified: false}};
  assert.throws(() => policy.resolveProcedureConstraints(state, scenario, {checkpointRegistry: replacement}), /UNVERIFIED_CHECKPOINT/);
  assert.throws(() => policy.resolveProcedureConstraints(state, scenario, {checkpointRegistry: undefined}), /MISSING_CHECKPOINT/);
});

test('ID arrival constraints allow immigration/customs, then block international departure controls', () => {
  const {scenario, checkpointRegistry, events} = fixture();
  assert.equal(typeof policy.resolveProcedureConstraints, 'function');
  let state = policy.advanceProcedureState(null, events[0], scenario, {checkpointRegistry});
  let constraints = policy.resolveProcedureConstraints(state, scenario);
  assert.deepEqual(constraints.allowedRoles, ['immigration']);
  assert.ok(!constraints.blockedRoles.includes('immigration'));
  for (let i = 1; i <= 2; i++) state = policy.advanceProcedureState(state, events[i], scenario, {checkpointRegistry});
  constraints = policy.resolveProcedureConstraints(state, scenario);
  assert.deepEqual(constraints.allowedRoles, ['arrival-customs']);
  for (let i = 3; i <= 4; i++) state = policy.advanceProcedureState(state, events[i], scenario, {checkpointRegistry});
  constraints = policy.resolveProcedureConstraints(state, scenario);
  assert.equal(state.stage, 'public');
  for (const role of ['emigration', 'international-security-customs', 'immigration', 'arrival-customs']) {
    assert.ok(constraints.blockedRoles.includes(role));
  }
});

test('malformed event lists fail closed without throwing from the batch API', () => {
  const {scenario, checkpointRegistry} = fixture();
  for (const events of [null, {}, [null], ['immigration']]) {
    assert.equal(policy.validateProcedureEvents(events, scenario, {checkpointRegistry}).status, 'invalid');
  }
});

const intents = [
  {kind: 'departure', traffic: 'domestic'}, {kind: 'departure', traffic: 'international'},
  {kind: 'arrival', traffic: 'domestic'}, {kind: 'arrival', traffic: 'international'},
  ...['II', 'DI', 'DD', 'ID'].map(transfer => ({kind: 'transfer', transfer})),
];

test('all resolved journey contracts integrate with full validation and per-leg advancement', () => {
  for (const intent of intents) {
    const pending = resolveJourneyScenario(intent);
    const profile = {id: 'integration-fixture', status: 'verified', transferArea: 'west',
      scenarioCheckpoints: {[pending.id]: pending.steps.map((_, index) => `integration-only-${index}`)}};
    const checkpointRegistry = Object.fromEntries(pending.steps.map((step, index) => {
      const id = `integration-only-${index}`;
      return [id, {id, role: step.role, floorId: 'integration-test-floor', direction: 'forward',
        verified: true, profileIds: [profile.id]}];
    }));
    const scenario = resolveJourneyScenario({...intent, profile}, {checkpointRegistry});
    const options = {checkpointRegistry};
    const result = policy.validateProcedureEvents(scenario.steps, scenario, options);
    assert.equal(result.status, 'complete', scenario.id);
    let state = null;
    for (const event of scenario.steps) state = policy.advanceProcedureState(state, event, scenario, options);
    assert.deepEqual(state, result.state);
    assert.equal(result.legStates.length, scenario.steps.length);
    assert.equal(result.verifiedRealRoute, false);
    for (const leg of result.legStates.filter(leg => leg.role === 'international-security-customs')) {
      assert.ok(!leg.constraints.blockedRoles.includes('international-security'));
      assert.ok(!leg.constraints.blockedRoles.includes('passenger-customs'));
      assert.ok(!leg.constraints.blockedRoles.includes('departure-customs'));
      assert.ok(leg.constraints.blockedRoles.includes('immigration'));
    }
    profile.status = 'candidate';
    const preview = resolveJourneyScenario({...intent, profile}, {checkpointRegistry});
    assert.equal(policy.validateProcedureEvents(preview.steps, preview, options).status, 'preview');
  }
});

test('current source profiles cannot enable routes without real checkpoint contracts', () => {
  for (const profileId of Object.keys(config.profiles)) {
    for (const intent of [...intents, {kind: 'transfer', transfer: 'ID', variant: 'dedicated'}]) {
      const scenario = resolveJourneyScenario({...intent, profileId}, {profiles: config.profiles});
      assert.equal(scenario.availability, 'pending');
      assert.equal(policy.validateProcedureEvents([], scenario).status, 'unsupported');
    }
  }
});

test('resolved guarded recheck loop validates without losing mandatory departure events', () => {
  const pending = resolveJourneyScenario({kind: 'departure', traffic: 'domestic'});
  const profile = {id: 'loop-fixture', status: 'verified', scenarioCheckpoints: {
    domesticDeparture: pending.steps.map((_, index) => `loop-only-${index}`),
  }, recheck: {trigger: 'secondary-request', escortRequired: true,
    allowedReturnStages: ['domestic-airside'], steps: [
      {role: 'secondary-check', fromStage: 'domestic-airside', toStage: 'escorted-secondary-room',
        checkpointId: 'loop-only-room', floorId: 'loop-test-floor', direction: 'forward'},
      {role: 'secondary-return', fromStage: 'escorted-secondary-room', toStage: 'domestic-airside',
        checkpointId: 'loop-only-return', floorId: 'loop-test-floor', direction: 'forward'},
    ]}};
  const checkpointRegistry = Object.fromEntries([
    ...pending.steps.map((step, index) => ({...step, checkpointId: `loop-only-${index}`, floorId: 'loop-test-floor'})),
    ...profile.recheck.steps,
  ].map(step => [step.checkpointId, {id: step.checkpointId, role: step.role, floorId: step.floorId,
    direction: step.direction, verified: true, profileIds: [profile.id]}]));
  const scenario = resolveJourneyScenario({kind: 'departure', traffic: 'domestic', profile,
    recheck: {trigger: 'secondary-request', escort: true, returnStage: 'domestic-airside'}}, {checkpointRegistry});
  assert.equal(scenario.availability, 'available');
  const result = policy.validateProcedureEvents(scenario.steps, scenario, {checkpointRegistry});
  assert.equal(result.status, 'complete');
  assert.equal(result.legStates.length, 7);
  const skipped = scenario.steps.filter(step => step.role !== 'secondary-check');
  assert.equal(policy.validateProcedureEvents(skipped, scenario, {checkpointRegistry}).status, 'invalid');
});
