import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import sourceConfig from '../src/config/airportOperations.json' with { type: 'json' };

// Keep the initial red run an assertion failure when the new module is absent.
const moduleUrl = new URL('../src/journeys/airportJourneyScenarios.js', import.meta.url);
const { resolveJourneyScenario } = existsSync(moduleUrl) ? await import(moduleUrl) : {};
test('exports the scenario resolver', () => assert.equal(typeof resolveJourneyScenario, 'function'));

const chains = {
  domesticDeparture: ['public', 'domestic-checkin-done', 'boarding-validated', 'domestic-security-cleared', 'domestic-airside', 'departure-gate'],
  internationalDeparture: ['public', 'international-checkin-done', 'boarding-validated', 'exit-border-cleared', 'intl-security-customs-cleared', 'international-airside', 'departure-gate'],
  domesticArrival: ['domestic-arrival-corridor', 'baggage-complete', 'public', 'exit'],
  internationalArrival: ['international-arrival-corridor', 'health-cleared', 'entry-border-cleared', 'baggage-complete', 'arrival-customs-cleared', 'public', 'exit'],
  transferII: ['international-arrival-corridor', 'health-cleared', 'transfer-processed', 'transfer-security-customs-cleared', 'international-airside', 'departure-gate'],
};
const roles = {
  domesticDeparture: ['checkin', 'boarding-validation', 'domestic-security', 'domestic-airside', 'departure-gate'],
  internationalDeparture: ['checkin', 'boarding-validation', 'emigration', 'international-security-customs', 'international-airside', 'departure-gate'],
  domesticArrival: ['baggage', 'arrival-public', 'exit'],
  internationalArrival: ['health', 'immigration', 'baggage', 'arrival-customs', 'arrival-public', 'exit'],
  transferII: ['health', 'transfer-desk', 'transfer-security-customs', 'international-airside', 'departure-gate'],
};
for (const [code, arrival, departure] of [['DI', 'domestic', 'international'], ['DD', 'domestic', 'domestic'], ['ID', 'international', 'domestic']]) {
  chains[`transfer${code}`] = [...chains[`${arrival}Arrival`].slice(0, -1), ...chains[`${departure}Departure`].slice(1)];
  roles[`transfer${code}`] = [...roles[`${arrival}Arrival`].slice(0, -1), ...roles[`${departure}Departure`]];
}
const requests = {
  domesticDeparture: { kind: 'departure', traffic: 'domestic' },
  internationalDeparture: { kind: 'departure', traffic: 'international' },
  domesticArrival: { kind: 'arrival', traffic: 'domestic' },
  internationalArrival: { kind: 'arrival', traffic: 'international' },
  ...Object.fromEntries(['II', 'DI', 'DD', 'ID'].map(transfer => [`transfer${transfer}`, { kind: 'transfer', transfer }])),
};
function fixture(id, status = 'verified', profileId = 'full-t1') {
  const ids = roles[id].map((_, index) => `fixture-${id}-${index}`);
  const profile = { id: profileId, status, transferArea: 'west', scenarioCheckpoints: { [id]: ids } };
  const checkpointRegistry = Object.fromEntries(ids.map((checkpointId, index) => [checkpointId, {
    id: checkpointId, role: roles[id][index], floorId: 'fixture-floor', direction: 'forward', verified: true, profileIds: [profileId],
  }]));
  return { profile, checkpointRegistry };
}
function resolve(id, setup = fixture(id), extra = {}) {
  return resolveJourneyScenario({ ...requests[id], profile: setup.profile, ...extra }, { checkpointRegistry: setup.checkpointRegistry });
}
for (const id of Object.keys(requests)) {
  test(`${id} has the approved ordered stages and checkpoint roles`, () => {
    const result = resolve(id);
    assert.equal(result.id, id);
    assert.equal(result.availability, 'available');
    assert.deepEqual(result.stages, chains[id]);
    assert.deepEqual(result.steps.map(step => step.role), roles[id]);
    result.steps.forEach((step, index) => {
      assert.equal(step.fromStage, result.stages[index]);
      assert.equal(step.toStage, result.stages[index + 1]);
      assert.equal(step.checkpointId, `fixture-${id}-${index}`);
      assert.equal(step.floorId, 'fixture-floor');
      assert.equal(step.direction, 'forward');
    });
    assert.deepEqual(result.profile, { id: 'full-t1', status: 'verified' });
    assert.equal(result.previewOnly, false);
    assert.equal(result.verifiedRealRoute, false);
  });
}
test('normalizes context aliases and named profiles without fallback', () => {
  const setup = fixture('transferID');
  const result = resolveJourneyScenario({ journeyKind: 'transfer', transferFrom: 'international', transferTo: 'domestic', profileId: 'full-t1' }, {
    profiles: { 'full-t1': setup.profile }, checkpointRegistry: setup.checkpointRegistry,
  });
  assert.equal(result.id, 'transferID');
  assert.equal(result.traffic, 'international');
  assert.equal(result.transfer, 'ID');
  assert.equal(result.availability, 'available');
  assert.equal(resolveJourneyScenario({ journeyKind: 'departure', trafficClass: 'domestic', profile: 'full-t1' }, {
    profiles: { 'full-t1': fixture('domesticDeparture').profile }, checkpointRegistry: fixture('domesticDeparture').checkpointRegistry,
  }).availability, 'available');
  assert.ok(resolveJourneyScenario({ ...requests.domesticDeparture, profileId: 'unknown' }).reasons.includes('UNKNOWN_PROFILE'));
});
test('built-in placeholders preserve required steps without inventing checkpoint IDs', () => {
  for (const profileId of ['initial-t1', 'full-t1']) {
    const result = resolveJourneyScenario({ ...requests.domesticDeparture, profileId });
    assert.equal(result.availability, 'pending');
    assert.equal(result.steps.length, 5);
    assert.ok(result.steps.every(step => step.checkpointId === null && step.floorId === null));
  }
});
test('read-only source profiles without status never imply approval', () => {
  for (const profileId of ['initial-operations', 'full-t1']) {
    const result = resolveJourneyScenario({ ...requests.domesticDeparture, profileId }, { profiles: sourceConfig.profiles });
    assert.equal(result.availability, 'pending');
    assert.equal(result.profile.status, 'pending');
    assert.ok(result.reasons.includes('PROFILE_UNCONFIRMED'));
  }
});
test('complete candidate profiles are preview only', () => {
  const result = resolve('internationalDeparture', fixture('internationalDeparture', 'candidate'));
  assert.equal(result.availability, 'preview');
  assert.equal(result.previewOnly, true);
  assert.equal(result.verifiedRealRoute, false);
  assert.equal(result.profile.status, 'candidate');
});
for (const [label, mutate] of [
  ['missing binding', setup => setup.profile.scenarioCheckpoints.domesticDeparture.pop()],
  ['extra binding', setup => setup.profile.scenarioCheckpoints.domesticDeparture.push('extra')],
  ['missing checkpoint', setup => delete setup.checkpointRegistry['fixture-domesticDeparture-0']],
  ['wrong ID', setup => setup.checkpointRegistry['fixture-domesticDeparture-0'].id = 'other'],
  ['wrong role', setup => setup.checkpointRegistry['fixture-domesticDeparture-0'].role = 'immigration'],
  ['missing floor', setup => delete setup.checkpointRegistry['fixture-domesticDeparture-0'].floorId],
  ['reverse direction', setup => setup.checkpointRegistry['fixture-domesticDeparture-0'].direction = 'reverse'],
  ['unverified checkpoint', setup => setup.checkpointRegistry['fixture-domesticDeparture-0'].verified = false],
  ['wrong profile', setup => setup.checkpointRegistry['fixture-domesticDeparture-0'].profileIds = ['other']],
  ['unapproved status', setup => setup.profile.status = 'unconfirmed'],
]) {
  test(`fails closed for ${label}`, () => {
    const setup = fixture('domesticDeparture'); mutate(setup);
    assert.equal(resolve('domesticDeparture', setup).availability, 'pending');
  });
}
test('initial II requires the west transfer area', () => {
  const setup = fixture('transferII', 'verified', 'initial-t1');
  assert.equal(resolve('transferII', setup).availability, 'available');
  setup.profile.transferArea = 'east';
  assert.equal(resolve('transferII', setup).availability, 'pending');
});
test('actual initial-operations profile enforces west II and requires explicit dedicated ID configuration', () => {
  const setup = fixture('transferII', 'verified', 'initial-operations');
  assert.equal(resolve('transferII', setup).availability, 'available');
  setup.profile.transferArea = 'east';
  assert.equal(resolve('transferII', setup).availability, 'pending');
  assert.equal(resolve('transferID', fixture('transferID', 'verified', 'initial-operations'), { variant: 'dedicated' }).availability, 'pending');
});
test('ID constraints allow arrival immigration then block it after public recheck-in', () => {
  const result = resolve('transferID');
  const blocked = result.constraints.blockedRolesByStage;
  assert.ok(!blocked['health-cleared'].includes('immigration'));
  assert.ok(!blocked['baggage-complete'].includes('arrival-customs'));
  assert.ok(blocked.public.includes('immigration'));
  assert.ok(blocked['domestic-airside'].includes('emigration'));
});
function dedicatedFixture(profileId = 'full-t1') {
  const setup = fixture('transferID', 'verified', profileId);
  const stages = ['international-arrival-corridor', 'health-cleared', 'dedicated-entry-border-cleared', 'domestic-airside', 'domestic-departure-gate'];
  const dedicatedRoles = ['health', 'immigration', 'domestic-airside', 'departure-gate'];
  setup.profile.dedicatedID = { enabled: true, floorId: 'fixture-floor2', steps: dedicatedRoles.map((role, index) => ({
    role, fromStage: stages[index], toStage: stages[index + 1], checkpointId: `fixture-dedicated-${index}`, floorId: 'fixture-floor2', direction: 'forward',
  })) };
  for (const step of setup.profile.dedicatedID.steps) setup.checkpointRegistry[step.checkpointId] = {
    id: step.checkpointId, role: step.role, floorId: step.floorId, direction: step.direction, verified: true, profileIds: [profileId],
  };
  return setup;
}
test('dedicated ID uses only the explicit configured sequence and defaults to pending initially', () => {
  assert.equal(resolve('transferID', fixture('transferID'), { variant: 'dedicated' }).availability, 'pending');
  assert.equal(resolve('transferID', fixture('transferID', 'verified', 'initial-t1'), { variant: 'dedicated' }).availability, 'pending');
  const setup = dedicatedFixture();
  const result = resolve('transferID', setup, { variant: 'dedicated' });
  assert.equal(result.id, 'transferIDDedicated');
  assert.equal(result.availability, 'available');
  assert.deepEqual(result.steps, setup.profile.dedicatedID.steps);
  assert.ok(!result.stages.includes('public'));
  setup.profile.dedicatedID.steps[1].floorId = 'wrong-floor';
  assert.equal(resolve('transferID', setup, { variant: 'dedicated' }).availability, 'pending');
});
for (const profileId of ['initial-t1', 'initial-operations']) {
  test(`${profileId} can enable dedicated ID with complete explicit verified configuration`, () => {
    const setup = dedicatedFixture(profileId);
    const result = resolve('transferID', setup, { variant: 'dedicated' });
    assert.equal(result.availability, 'available');
    assert.deepEqual(result.steps, setup.profile.dedicatedID.steps);
    assert.equal(result.verifiedRealRoute, false);
    setup.profile.dedicatedID.enabled = false;
    assert.equal(resolve('transferID', setup, { variant: 'dedicated' }).availability, 'pending');
  });
  test(`${profileId} explicit candidate dedicated ID is preview only`, () => {
    const setup = dedicatedFixture(profileId);
    setup.profile.status = 'candidate';
    const result = resolve('transferID', setup, { variant: 'dedicated' });
    assert.equal(result.availability, 'preview');
    assert.equal(result.previewOnly, true);
    assert.equal(result.verifiedRealRoute, false);
  });
  test(`${profileId} explicit dedicated ID still requires verified profile and bindings`, () => {
    const setup = dedicatedFixture(profileId);
    setup.profile.status = undefined;
    assert.equal(resolve('transferID', setup, { variant: 'dedicated' }).availability, 'pending');
    setup.profile.status = 'verified';
    setup.checkpointRegistry['fixture-dedicated-1'].verified = false;
    assert.equal(resolve('transferID', setup, { variant: 'dedicated' }).availability, 'pending');
  });
}
test('dedicated ID binds immigration to floor2 while preserving other configured floors', () => {
  const setup = dedicatedFixture();
  for (const index of [0, 2, 3]) {
    const step = setup.profile.dedicatedID.steps[index];
    step.floorId = 'fixture-floor1';
    setup.checkpointRegistry[step.checkpointId].floorId = step.floorId;
  }
  assert.equal(resolve('transferID', setup, { variant: 'dedicated' }).availability, 'available');
  const immigration = setup.profile.dedicatedID.steps[1];
  immigration.floorId = 'fixture-floor1';
  setup.checkpointRegistry[immigration.checkpointId].floorId = immigration.floorId;
  assert.equal(resolve('transferID', setup, { variant: 'dedicated' }).availability, 'pending');
});
for (const defect of ['discontinuous', 'no-immigration', 'missing-direction']) {
  test(`dedicated ID rejects ${defect} configuration`, () => {
    const setup = dedicatedFixture();
    if (defect === 'discontinuous') setup.profile.dedicatedID.steps[1].fromStage = 'public';
    if (defect === 'no-immigration') setup.profile.dedicatedID.steps.splice(1, 1);
    if (defect === 'missing-direction') delete setup.profile.dedicatedID.steps[0].direction;
    assert.equal(resolve('transferID', setup, { variant: 'dedicated' }).availability, 'pending');
  });
}
function recheckFixture() {
  const setup = fixture('domesticDeparture');
  setup.profile.recheck = { trigger: 'secondary-request', escortRequired: true, allowedReturnStages: ['domestic-airside'], steps: [
    { role: 'secondary-check', fromStage: 'domestic-airside', toStage: 'escorted-secondary-room', checkpointId: 'fixture-secondary', floorId: 'fixture-floor', direction: 'forward' },
    { role: 'secondary-return', fromStage: 'escorted-secondary-room', toStage: 'domestic-airside', checkpointId: 'fixture-return', floorId: 'fixture-floor', direction: 'forward' },
  ] };
  for (const step of setup.profile.recheck.steps) setup.checkpointRegistry[step.checkpointId] = {
    id: step.checkpointId, role: step.role, floorId: step.floorId, direction: step.direction, verified: true, profileIds: [setup.profile.id],
  };
  return setup;
}
const recheck = { trigger: 'secondary-request', escort: true, returnStage: 'domestic-airside' };
test('recheck inserts an explicit guarded loop and preserves repeated stage order', () => {
  const setup = recheckFixture();
  assert.equal(resolve('domesticDeparture', setup).steps.length, 5);
  const result = resolve('domesticDeparture', setup, { recheck });
  assert.equal(result.availability, 'available');
  assert.deepEqual(result.stages.slice(-4), ['domestic-airside', 'escorted-secondary-room', 'domestic-airside', 'departure-gate']);
  assert.deepEqual(result.steps.slice(4, 6), setup.profile.recheck.steps);
  assert.deepEqual(result.recheck, recheck);
  assert.deepEqual(result.recheckGuard, { trigger: 'secondary-request', escortRequired: true, allowedReturnStages: ['domestic-airside'] });
});
test('recheck cannot skip mandatory forward stages even when the return is configured', () => {
  const setup = recheckFixture();
  setup.profile.recheck.steps[0].fromStage = 'public';
  assert.equal(resolve('domesticDeparture', setup, { recheck }).availability, 'pending');
});
test('configured recheck may replay earlier stages without removing required checkpoints', () => {
  const setup = recheckFixture();
  setup.profile.recheck.allowedReturnStages = ['public'];
  setup.profile.recheck.steps[1].toStage = 'public';
  const result = resolve('domesticDeparture', setup, { recheck: { ...recheck, returnStage: 'public' } });
  assert.equal(result.availability, 'available');
  assert.equal(result.stages.filter(stage => stage === 'public').length, 2);
  assert.deepEqual(result.steps.slice(-5).map(step => step.role), roles.domesticDeparture);
});
test('airside recheck cannot waive escort using profile configuration', () => {
  const setup = recheckFixture();
  setup.profile.recheck.escortRequired = false;
  assert.equal(resolve('domesticDeparture', setup, { recheck: { ...recheck, escort: false } }).availability, 'pending');
});
for (const [label, spec] of [['missing trigger', { ...recheck, trigger: null }], ['wrong trigger', { ...recheck, trigger: 'other' }], ['no escort', { ...recheck, escort: false }], ['wrong return', { ...recheck, returnStage: 'public' }]]) {
  test(`recheck fails closed for ${label}`, () => assert.equal(resolve('domesticDeparture', recheckFixture(), { recheck: spec }).availability, 'pending'));
}
test('recheck rejects broken sequence and unverified bindings', () => {
  const setup = recheckFixture();
  setup.checkpointRegistry['fixture-return'].verified = false;
  assert.equal(resolve('domesticDeparture', setup, { recheck }).availability, 'pending');
  setup.checkpointRegistry['fixture-return'].verified = true;
  setup.profile.recheck.steps[1].toStage = 'public';
  assert.equal(resolve('domesticDeparture', setup, { recheck }).availability, 'pending');
});
test('results are deeply frozen snapshots without freezing caller configuration', () => {
  const setup = recheckFixture(); const result = resolve('domesticDeparture', setup, { recheck });
  for (const value of [result, result.profile, result.steps, result.steps[0], result.stages, result.reasons, result.constraints, result.constraints.blockedRolesByStage, result.constraints.blockedRolesByStage.public, result.recheck, result.recheckGuard, result.recheckGuard.allowedReturnStages]) assert.ok(Object.isFrozen(value));
  setup.profile.status = 'candidate'; setup.profile.recheck.steps[0].role = 'changed';
  setup.profile.recheck.allowedReturnStages.push('public');
  assert.equal(result.profile.status, 'verified');
  assert.equal(result.steps[4].role, 'secondary-check');
  assert.deepEqual(result.recheckGuard.allowedReturnStages, ['domestic-airside']);
  assert.throws(() => { result.steps[0].role = 'changed'; }, TypeError);
});
test('invalid and conflicting inputs produce pending scenarios', () => {
  for (const input of [null, {}, { kind: 'physical', traffic: 'domestic' }, { kind: 'departure', traffic: 'unknown' }, { kind: 'transfer', transfer: 'XX' }, { kind: 'transfer', transfer: 'II', transferFrom: 'domestic', transferTo: 'domestic' }, { kind: 'departure', traffic: 'domestic', variant: 'dedicated' }]) {
    assert.equal(resolveJourneyScenario(input).availability, 'pending');
  }
});

function bindExplicitSteps(setup, steps) {
  for (const step of steps) setup.checkpointRegistry[step.checkpointId] = {
    id: step.checkpointId, role: step.role, floorId: step.floorId,
    direction: step.direction, verified: true, profileIds: [setup.profile.id],
  };
}

test('II recheck cannot inject immigration and emigration through verified bindings', () => {
  const setup = fixture('transferII');
  const secondary = recheckFixture().profile.recheck;
  secondary.allowedReturnStages = ['international-airside'];
  secondary.steps[0].fromStage = 'international-airside';
  secondary.steps[0].role = 'immigration';
  secondary.steps[1].toStage = 'international-airside';
  secondary.steps[1].role = 'emigration';
  setup.profile.recheck = secondary;
  bindExplicitSteps(setup, secondary.steps);
  const result = resolve('transferII', setup, { recheck: { ...recheck, returnStage: 'international-airside' } });
  assert.equal(result.availability, 'pending');
});

for (const role of ['health', 'immigration', 'emigration', 'domestic-security', 'international-security-customs', 'transfer-security-customs']) {
  test(`domestic recheck cannot inject ${role} as a secondary role`, () => {
    const setup = recheckFixture();
    setup.profile.recheck.steps[0].role = role;
    bindExplicitSteps(setup, setup.profile.recheck.steps);
    assert.equal(resolve('domesticDeparture', setup, { recheck }).availability, 'pending');
  });
}
for (const [first, last] of [['secondary-return', 'secondary-return'], ['secondary-check', 'secondary-check']]) {
  test(`recheck rejects endpoints ${first} then ${last}`, () => {
    const setup = recheckFixture();
    setup.profile.recheck.steps[0].role = first;
    setup.profile.recheck.steps[1].role = last;
    bindExplicitSteps(setup, setup.profile.recheck.steps);
    assert.equal(resolve('domesticDeparture', setup, { recheck }).availability, 'pending');
  });
}
for (const role of ['emigration', 'international-security', 'international-security-customs', 'arrival-customs']) {
  test(`dedicated ID cannot inject ${role} through a verified checkpoint`, () => {
    const setup = dedicatedFixture();
    const before = setup.profile.dedicatedID.steps[1];
    const injected = { ...before, role, fromStage: before.toStage, toStage: 'fixture-injected-stage', checkpointId: 'fixture-injected' };
    setup.profile.dedicatedID.steps[2].fromStage = injected.toStage;
    setup.profile.dedicatedID.steps.splice(2, 0, injected);
    bindExplicitSteps(setup, setup.profile.dedicatedID.steps);
    assert.equal(resolve('transferID', setup, { variant: 'dedicated' }).availability, 'pending');
  });
}
for (const value of ['hole', null]) {
  test(`dedicated ID with ${value ?? 'null'} step is pending without throwing`, () => {
    const setup = dedicatedFixture();
    if (value === 'hole') delete setup.profile.dedicatedID.steps[1];
    else setup.profile.dedicatedID.steps[1] = value;
    assert.equal(resolve('transferID', setup, { variant: 'dedicated' }).availability, 'pending');
  });
  test(`recheck with ${value ?? 'null'} step is pending without throwing`, () => {
    const setup = recheckFixture();
    if (value === 'hole') delete setup.profile.recheck.steps[0];
    else setup.profile.recheck.steps[0] = value;
    assert.equal(resolve('domesticDeparture', setup, { recheck }).availability, 'pending');
  });
}
test('ordinary sparse checkpoint bindings are pending without throwing', () => {
  const setup = fixture('domesticDeparture');
  delete setup.profile.scenarioCheckpoints.domesticDeparture[1];
  const result = resolve('domesticDeparture', setup);
  assert.equal(result.availability, 'pending');
  assert.equal(result.steps[1].checkpointId, null);
});
test('dedicated configured transfer stages permit their actual outgoing control roles', () => {
  const setup = dedicatedFixture();
  const steps = setup.profile.dedicatedID.steps;
  const desk = { ...steps[0], role: 'transfer-desk', fromStage: 'health-cleared', toStage: 'transfer-processed', checkpointId: 'fixture-dedicated-desk' };
  const security = { ...desk, role: 'transfer-security-customs', fromStage: 'transfer-processed', toStage: 'transfer-security-customs-cleared', checkpointId: 'fixture-dedicated-security' };
  steps[1].fromStage = security.toStage;
  steps.splice(1, 0, desk, security);
  bindExplicitSteps(setup, steps);
  const result = resolve('transferID', setup, { variant: 'dedicated' });
  assert.equal(result.availability, 'available');
  for (const stage of ['health-cleared', 'transfer-processed', 'transfer-security-customs-cleared']) {
    const step = result.steps.find(step => step.fromStage === stage);
    assert.ok(!result.constraints.blockedRolesByStage[stage].includes(step.role));
  }
});
test('ID backward recheck permits arrival controls at every replayed stage', () => {
  const setup = fixture('transferID');
  const secondary = recheckFixture().profile.recheck;
  secondary.allowedReturnStages = ['health-cleared'];
  secondary.steps[1].toStage = 'health-cleared';
  setup.profile.recheck = secondary;
  bindExplicitSteps(setup, secondary.steps);
  const result = resolve('transferID', setup, { recheck: { ...recheck, returnStage: 'health-cleared' } });
  assert.equal(result.availability, 'available');
  assert.equal(result.stages.filter(stage => stage === 'health-cleared').length, 2);
  assert.ok(!result.constraints.blockedRolesByStage['health-cleared'].includes('immigration'));
  assert.ok(!result.constraints.blockedRolesByStage['baggage-complete'].includes('arrival-customs'));
  // A repeated stage can have a secondary branch and a gate checkpoint.
  assert.ok(result.constraints.blockedRolesByStage['domestic-airside'].includes('domestic-security'));
});
test('stage constraints permit only outgoing controls and preserve combined security aliases', () => {
  const result = resolve('internationalDeparture');
  const blocked = result.constraints.blockedRolesByStage;
  assert.ok(blocked.public.includes('emigration'));
  assert.ok(!blocked['boarding-validated'].includes('emigration'));
  assert.ok(!blocked['exit-border-cleared'].includes('international-security-customs'));
  assert.ok(!blocked['exit-border-cleared'].includes('international-security'));
  assert.ok(!blocked['exit-border-cleared'].includes('passenger-customs'));
  assert.ok(!blocked['exit-border-cleared'].includes('departure-customs'));
  assert.ok(blocked.public.includes('passenger-customs'));
  assert.ok(blocked.public.includes('departure-customs'));
  assert.ok(blocked['exit-border-cleared'].includes('immigration'));
  assert.ok(blocked['departure-gate'].includes('international-security'));
});
test('repeated stage constraints union distinct outgoing control roles', () => {
  const setup = dedicatedFixture();
  const steps = setup.profile.dedicatedID.steps;
  const desk = { ...steps[0], role: 'transfer-desk', fromStage: 'health-cleared', toStage: 'transfer-processed', checkpointId: 'fixture-union-desk' };
  const security = { ...desk, role: 'transfer-security-customs', fromStage: 'transfer-processed', toStage: 'health-cleared', checkpointId: 'fixture-union-security' };
  steps.splice(1, 0, desk, security);
  bindExplicitSteps(setup, steps);
  const result = resolve('transferID', setup, { variant: 'dedicated' });
  assert.equal(result.availability, 'available');
  const blocked = result.constraints.blockedRolesByStage['health-cleared'];
  assert.ok(!blocked.includes('transfer-desk'));
  assert.ok(!blocked.includes('immigration'));
  assert.ok(blocked.includes('emigration'));
});
