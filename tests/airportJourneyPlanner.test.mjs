import assert from 'node:assert/strict';
import test from 'node:test';
import {planAirportJourney} from '../src/navigation/airportJourneyPlanner.js';
import {resolveJourneyScenario} from '../src/journeys/airportJourneyScenarios.js';
import {validateAirportRoute} from '../src/navigation/airportRouteValidator.js';
import {createAirportJourneySdkAdapter} from '../src/navigation/airportJourneySdkAdapter.js';
import {readFileSync} from 'node:fs';

const point = (x, floorId = 'test-floor-1') => ({longitude: x, latitude: 0, floorId});
function fixture(intent = {kind: 'departure', traffic: 'domestic'}) {
  const source = resolveJourneyScenario(intent);
  const profile = {id: 'test-operator', status: 'verified', scenarioCheckpoints: {
    [source.id]: source.steps.map((_, i) => `test-checkpoint-${i}`),
  }};
  const endpoints = new Map();
  const add = (id, x, floorId = 'test-floor-1') => {
    const endpoint = {id, floorId, entity: {id}, coordinate: point(x, floorId)};
    endpoints.set(id, endpoint);
    return id;
  };
  const origin = add('test-origin', 0), destination = add('test-gate-7', source.steps.length * 3 + 1);
  const checkpointRegistry = Object.fromEntries(source.steps.map((step, i) => {
    const id = `test-checkpoint-${i}`;
    return [id, {id, role: step.role, verified: true, profileIds: [profile.id],
      floorId: 'test-floor-1', direction: 'forward', portalDirection: 'forward',
      entryEndpointId: add(`${id}-entry`, i * 3 + 1), exitEndpointId: add(`${id}-exit`, i * 3 + 2)}];
  }));
  const config = {version: 'test-v1', profiles: {[profile.id]: profile}, checkpointRegistry};
  const input = {...intent, profileId: profile.id, origin, destination, mobility: 'accessible'};
  const calls = [];
  const deps = {config,
    resolveEndpoint: id => endpoints.get(id),
    getDirections: async (from, to, options) => {
      calls.push({from, to, options});
      const a = endpoints.get(from.id).coordinate, b = endpoints.get(to.id).coordinate;
      const directPortal = Object.values(checkpointRegistry).some(r => r.entryEndpointId === from.id && r.exitEndpointId === to.id);
      const detour = !directPortal && Math.abs(a.longitude - b.longitude) > 3;
      return {coordinates: detour ? [a, {...a, latitude: 10}, {...b, latitude: 10}, b] : [a, b]};
    },
    validateLeg: (route, leg) => {
      const observed = [];
      const scenario = resolveJourneyScenario(input, config);
      for (const record of Object.values(checkpointRegistry)) {
        const entry = endpoints.get(record.entryEndpointId).coordinate;
        const exit = endpoints.get(record.exitEndpointId).coordinate;
        const zone = {floorId: record.floorId, geometry: {type: 'Polygon', coordinates: [[
          [entry.longitude + 0.1, -0.1], [exit.longitude - 0.1, -0.1],
          [exit.longitude - 0.1, 0.1], [entry.longitude + 0.1, 0.1], [entry.longitude + 0.1, -0.1],
        ]]}};
        validateAirportRoute(route, leg.constraints.blockedRoles.includes(record.role) ? [zone] : []);
        for (let i = 1; i < route.coordinates.length; i++) {
          const a = route.coordinates[i - 1], b = route.coordinates[i];
          if (a.floorId !== record.floorId || b.floorId !== record.floorId || a.latitude !== 0 || b.latitude !== 0) continue;
          const forward = a.longitude <= entry.longitude && b.longitude >= exit.longitude;
          const reverse = b.longitude <= entry.longitude && a.longitude >= exit.longitude;
          if (forward || reverse) observed.push({...scenario.steps.find(s => s.checkpointId === record.id), direction: forward ? 'forward' : 'reverse'});
        }
      }
      return {valid: true, checkpointEvents: observed};
    },
  };
  return {input, deps, config, endpoints, calls, profile, source};
}

test('source configuration stays pending without invoking any SDK', async () => {
  const config = JSON.parse(readFileSync(new URL('../src/config/airportOperations.json', import.meta.url)));
  for (const profileId of Object.keys(config.profiles)) {
    await assert.rejects(planAirportJourney({kind: 'departure', traffic: 'domestic', profileId}, {
      config, getDirections: () => assert.fail('SDK called for pending scenario'),
    }), error => error.code === 'SCENARIO_PENDING');
  }
});

test('preview and input-supplied verified profiles cannot enable a route', async () => {
  const f = fixture();
  f.profile.status = 'candidate';
  await assert.rejects(planAirportJourney(f.input, f.deps), /SCENARIO_PREVIEW/);
  f.profile.status = 'pending';
  await assert.rejects(planAirportJourney({...f.input, profile: {...f.profile, status: 'verified'}}, f.deps), /SCENARIO_PENDING/);
  assert.equal(f.calls.length, 0);
});

for (const intent of [
  {kind: 'departure', traffic: 'domestic'}, {kind: 'departure', traffic: 'international'},
  {kind: 'arrival', traffic: 'domestic'}, {kind: 'arrival', traffic: 'international'},
  ...['II', 'DI', 'DD', 'ID'].map(transfer => ({kind: 'transfer', transfer})),
]) test(`plans ${JSON.stringify(intent)} with staged physical legs`, async () => {
  const f = fixture(intent), plan = await planAirportJourney(f.input, f.deps);
  assert.equal(plan.legs.length, f.source.steps.length * 2 + 1);
  assert.equal(plan.checkpointEvents.length, f.source.steps.length);
  assert.equal(plan.legStates.length, plan.legs.length);
  assert.equal(plan.context.journeyKind, intent.kind);
  assert.equal(plan.context.stage, f.source.stages.at(-1));
  assert.equal(plan.configVersion, 'test-v1');
  assert.equal(plan.coordinates.length, plan.legs.length + 1);
  assert.deepEqual(plan.floorTransitions, []);
  assert.ok(f.calls.every(c => c.options.accessible === true && c.options.mobility === 'accessible'));
  assert.equal(plan.legStates[0].fromStage, f.source.stages[0]);
  assert.equal(plan.legStates[1].toStage, f.source.stages[1]);
  assert.equal(plan.legStates[2].fromStage, f.source.stages[1]);
  assert.equal(plan.context.authorization, 'none');
  assert.equal(plan.context.destinationEndpointId, 'test-gate-7');
  if (intent.transfer === 'ID') {
    const immigration = plan.legStates.find(l => l.event?.role === 'immigration');
    assert.deepEqual(immigration.constraints.allowedRoles, ['immigration']);
    const security = plan.legStates.find(l => l.event?.role === 'domestic-security');
    assert.ok(security.constraints.blockedRoles.includes('immigration'));
  }
});

test('missing physical bindings, floors, entities and reverse portal fail before SDK', async () => {
  for (const mutate of [
    f => delete f.config.checkpointRegistry['test-checkpoint-0'].entryEndpointId,
    f => {f.config.checkpointRegistry['test-checkpoint-0'].portalDirection = 'reverse';},
    f => delete f.endpoints.get(f.input.destination).floorId,
    f => delete f.endpoints.get(f.input.destination).entity,
    f => {f.endpoints.get(f.input.destination).floorId = 'wrong-floor';},
  ]) {
    const f = fixture(); mutate(f);
    await assert.rejects(planAirportJourney(f.input, f.deps));
    assert.equal(f.calls.length, 0);
  }
});

test('reversed, reordered, extra and missing observed events never finalize a leg', async () => {
  for (const change of [event => ({...event, direction: 'reverse'}),
    event => ({...event, checkpointId: 'test-checkpoint-1'}), () => null]) {
    const f = fixture();
    f.deps.validateLeg = (_route, leg) => ({valid: true, checkpointEvents: leg.event ? [change(leg.event)].filter(Boolean) : []});
    await assert.rejects(planAirportJourney(f.input, f.deps), /EVENT/);
    assert.equal(f.calls.length, 2);
  }
  const f = fixture();
  f.deps.validateLeg = () => ({valid: true, checkpointEvents: [{...f.source.steps[1]}]});
  await assert.rejects(planAirportJourney(f.input, f.deps), /EVENT/);
  assert.equal(f.calls.length, 1);
});

test('absent or negative validator and malformed or disconnected geometry fail closed', async () => {
  for (const mutate of [
    f => delete f.deps.validateLeg,
    f => {f.deps.validateLeg = () => undefined;},
    f => {f.deps.validateLeg = () => ({valid: false, checkpointEvents: []});},
    f => {f.deps.getDirections = async () => ({coordinates: []});},
    f => {f.deps.getDirections = async () => ({coordinates: [point(99), point(100)]});},
  ]) {const f = fixture(); mutate(f); await assert.rejects(planAirportJourney(f.input, f.deps));}
});

test('abort and request replacement across routing await prevent further legs', async () => {
  for (const mode of ['abort', 'version']) {
    const f = fixture(), controller = new AbortController();
    let version = 1;
    f.input.abortSignal = controller.signal;
    f.input.requestVersion = version;
    f.deps.getRequestVersion = () => version;
    const route = f.deps.getDirections;
    f.deps.getDirections = async (...args) => {
      const result = await route(...args);
      if (mode === 'abort') controller.abort(); else version++;
      return result;
    };
    await assert.rejects(planAirportJourney(f.input, f.deps), error => error.code === (mode === 'abort' ? 'ABORTED' : 'STALE_REQUEST'));
    assert.equal(f.calls.length, 1);
  }
});

test('checks cancellation after endpoint resolution and asynchronous validation', async () => {
  for (const seam of ['resolveEndpoint', 'validateLeg']) {
    const f = fixture(), controller = new AbortController();
    f.input.abortSignal = controller.signal;
    const original = f.deps[seam];
    f.deps[seam] = async (...args) => {const result = original(...args); controller.abort(); return result;};
    await assert.rejects(planAirportJourney(f.input, f.deps), /ABORTED/);
    assert.equal(f.calls.length, seam === 'resolveEndpoint' ? 0 : 1);
  }
});

test('configuration revocation during await rejects even a valid last route', async () => {
  const f = fixture(), original = f.deps.getDirections;
  f.deps.getDirections = async (...args) => {
    const route = await original(...args);
    f.config.checkpointRegistry['test-checkpoint-0'].verified = false;
    return route;
  };
  await assert.rejects(planAirportJourney(f.input, f.deps), /UNVERIFIED_CHECKPOINT/);
  assert.equal(f.calls.length, 1);
});

test('geometry validator blocks a forbidden zone between valid endpoints', async () => {
  const f = fixture({kind: 'transfer', transfer: 'ID'});
  f.deps.validateLeg = (route, leg) => {
    const zone = {role: 'emigration', floorId: 'test-floor-1', geometry: {type: 'Polygon',
      coordinates: [[[0.25,-1],[0.75,-1],[0.75,1],[0.25,1],[0.25,-1]]]}};
    validateAirportRoute(route, leg.constraints.blockedRoles.includes(zone.role) ? [zone] : []);
    return {valid: true, checkpointEvents: []};
  };
  await assert.rejects(planAirportJourney(f.input, f.deps), /FORBIDDEN_CROSSING/);
  assert.equal(f.calls.length, 1);
});

test('records explicit floor transitions without changing departure gate semantics', async () => {
  const f = fixture();
  const gate = f.endpoints.get(f.input.destination);
  gate.floorId = 'test-explicit-floor-1';
  gate.coordinate = point(gate.coordinate.longitude, gate.floorId);
  const plan = await planAirportJourney(f.input, f.deps);
  assert.equal(plan.context.journeyKind, 'departure');
  assert.equal(plan.coordinates.at(-1).floorId, gate.floorId);
  assert.deepEqual(plan.floorTransitions.map(t => [t.fromFloorId, t.toFloorId]), [['test-floor-1', gate.floorId]]);
  assert.equal(plan.floorTransitions[0].legIndex, plan.legs.length - 1);
});

function addBranch(f, steps) {
  for (const [i, step] of steps.entries()) {
    const entryEndpointId = `${step.checkpointId}-entry`, exitEndpointId = `${step.checkpointId}-exit`;
    for (const [id, x] of [[entryEndpointId, 100 + i * 3], [exitEndpointId, 101 + i * 3]]) {
      f.endpoints.set(id, {id, floorId: step.floorId, entity: {id}, coordinate: point(x, step.floorId)});
    }
    f.config.checkpointRegistry[step.checkpointId] = {id: step.checkpointId, role: step.role,
      floorId: step.floorId, direction: step.direction, verified: true, profileIds: [f.profile.id],
      portalDirection: 'forward', entryEndpointId, exitEndpointId};
  }
}

test('dedicated ID transfer follows explicit floor and stage contracts', async () => {
  const f = fixture({kind: 'transfer', transfer: 'ID', variant: 'dedicated'});
  const stages = ['international-arrival-corridor', 'health-cleared', 'dedicated-entry-border-cleared',
    'domestic-security-cleared', 'domestic-airside', 'departure-gate'];
  const roles = ['health', 'immigration', 'domestic-security', 'domestic-airside', 'departure-gate'];
  const steps = roles.map((role, i) => ({role, fromStage: stages[i], toStage: stages[i + 1],
    checkpointId: `test-dedicated-${i}`, floorId: i === 1 ? 'test-operator-floor-2' : 'test-floor-1', direction: 'forward'}));
  f.profile.dedicatedID = {enabled: true, floorId: 'test-operator-floor-2', steps};
  addBranch(f, steps);
  const plan = await planAirportJourney(f.input, f.deps);
  assert.deepEqual(plan.checkpointEvents.map(e => e.role), roles);
  assert.equal(plan.checkpointEvents[1].floorId, 'test-operator-floor-2');
  assert.ok(plan.floorTransitions.length > 0);
});

test('guarded recheck preserves mandatory steps and per-leg stage on return', async () => {
  const f = fixture();
  const steps = [
    {role: 'secondary-check', fromStage: 'domestic-airside', toStage: 'escorted-secondary-room',
      checkpointId: 'test-secondary', floorId: 'test-floor-1', direction: 'forward'},
    {role: 'secondary-return', fromStage: 'escorted-secondary-room', toStage: 'domestic-airside',
      checkpointId: 'test-return', floorId: 'test-floor-1', direction: 'forward'},
  ];
  f.profile.recheck = {trigger: 'secondary-request', escortRequired: true,
    allowedReturnStages: ['domestic-airside'], steps};
  f.input.recheck = {trigger: 'secondary-request', escort: true, returnStage: 'domestic-airside'};
  addBranch(f, steps);
  const plan = await planAirportJourney(f.input, f.deps);
  assert.deepEqual(plan.checkpointEvents.map(e => e.role), [
    'checkin', 'boarding-validation', 'domestic-security', 'domestic-airside',
    'secondary-check', 'secondary-return', 'departure-gate',
  ]);
  const returned = plan.legStates.find(l => l.event?.role === 'secondary-return');
  assert.equal(returned.fromStage, 'escorted-secondary-room');
  assert.equal(returned.toStage, 'domestic-airside');
});

test('standard mobility and pre-aborted requests are enforced', async () => {
  const f = fixture(); f.input.mobility = 'standard';
  await planAirportJourney(f.input, f.deps);
  assert.ok(f.calls.every(c => c.options.accessible === false));
  const cancelled = fixture(), controller = new AbortController();
  controller.abort(); cancelled.input.abortSignal = controller.signal;
  await assert.rejects(planAirportJourney(cancelled.input, cancelled.deps), /ABORTED/);
  assert.equal(cancelled.calls.length, 0);
});

test('rejects SDK geometry altered by asynchronous validator', async () => {
  const f = fixture(), original = f.deps.validateLeg;
  f.deps.validateLeg = async (route, leg) => {
    const result = original(route, leg);
    route.coordinates = [point(99), point(100)];
    return result;
  };
  await assert.rejects(planAirportJourney(f.input, f.deps), /GEOMETRY_CHANGED/);
});

test('rejects an endpoint resolver returning a different SDK entity', async () => {
  const f = fixture();
  f.endpoints.get(f.input.destination).entity = {id: 'test-wrong-entity'};
  await assert.rejects(planAirportJourney(f.input, f.deps), /INVALID_ENDPOINT/);
  assert.equal(f.calls.length, 0);
});

test('config version changes and stale requests during validation cannot finalize', async () => {
  for (const mode of ['config', 'request']) {
    const f = fixture(), original = f.deps.validateLeg;
    let version = 1;
    f.input.requestVersion = 1; f.deps.getRequestVersion = () => version;
    f.deps.validateLeg = async (...args) => {
      const result = original(...args);
      if (mode === 'config') f.config.version = 'test-v2'; else version++;
      return result;
    };
    await assert.rejects(planAirportJourney(f.input, f.deps), new RegExp(mode === 'config' ? 'CONFIG_CHANGED' : 'STALE_REQUEST'));
    assert.equal(f.calls.length, 1);
  }
});

function configureEndpoints(f) {
  f.config.counters = [{mappedinId:f.input.origin,island:'A',counterNo:1,trafficClass:'domestic'}];
  f.config.gates = [{mappedinId:f.input.destination,gateNo:7,trafficClass:'domestic'}];
  f.profile.openIslands = ['A'];
  f.profile.openGateNos = [7];
}
for(const [name,close] of [
  ['gate',f=>{f.profile.openGateNos=[];}],
  ['island',f=>{f.profile.openIslands=[];}],
  ['counter limit',f=>{f.profile.counterLimits={A:0};}],
]) test(`closed ${name} rejects before SDK routing`,async()=>{
  const f=fixture();configureEndpoints(f);close(f);
  await assert.rejects(planAirportJourney(f.input,f.deps),/ENDPOINT_CLOSED/);
  assert.equal(f.calls.length,0);
});
test('checkpoint endpoints obey the same closure rules as journey endpoints',async()=>{
  const f=fixture();configureEndpoints(f);
  f.config.gates.push({mappedinId:'test-checkpoint-0-entry',gateNo:99});
  await assert.rejects(planAirportJourney(f.input,f.deps),/ENDPOINT_CLOSED/);
  assert.equal(f.calls.length,0);
});
test('gate closure during the final SDK await cannot publish a route',async()=>{
  const f=fixture();configureEndpoints(f);const get=f.deps.getDirections;
  f.deps.getDirections=async(...args)=>{
    const route=await get(...args);
    if(f.calls.length===f.source.steps.length*2+1)f.profile.openGateNos=[];
    return route;
  };
  await assert.rejects(planAirportJourney(f.input,f.deps),/ENDPOINT_CLOSED|CONFIG_CHANGED/);
});
for(const seam of ['resolveEndpoint','getDirections','validateLeg']) test(`zone revocation during ${seam} is version guarded`,async()=>{
  const f=fixture();f.config.zones=[];const original=f.deps[seam];
  f.deps[seam]=async(...args)=>{
    const result=await original(...args);
    f.config.zones.push({role:'immigration',floorId:'test-floor-1',geometry:{type:'Polygon',coordinates:[[[.25,-1],[.75,-1],[.75,1],[.25,1],[.25,-1]]]}});
    return result;
  };
  await assert.rejects(planAirportJourney(f.input,f.deps),/CONFIG_CHANGED/);
});
test('a new closure across an earlier leg during the final await invalidates the whole plan',async()=>{
  const f=fixture();f.config.zones=[];const get=f.deps.getDirections;
  f.deps.getDirections=async(...args)=>{
    const route=await get(...args);
    if(f.calls.length===f.source.steps.length*2+1)f.config.zones.push({role:'immigration',floorId:'test-floor-1',geometry:{type:'Polygon',coordinates:[[[.25,-1],[.75,-1],[.75,1],[.25,1],[.25,-1]]]}});
    return route;
  };
  await assert.rejects(planAirportJourney(f.input,f.deps),/CONFIG_CHANGED/);
});
test('planner owns stage progression despite supplied stage and clearance history',async()=>{
  const f=fixture();f.input.stage='departure-gate';f.input.checkpointHistory=f.source.steps;
  const plan=await planAirportJourney(f.input,f.deps);
  assert.equal(plan.legStates[0].fromStage,'public');
  assert.equal(plan.checkpointEvents.length,f.source.steps.length);
});

function sdkFixture() {
  const f=fixture();configureEndpoints(f);f.config.zones=[];
  for(const endpoint of f.endpoints.values()){
    endpoint.coordinate={...endpoint.coordinate,longitude:107+endpoint.coordinate.longitude*.00001,latitude:10};
    endpoint.entity={id:endpoint.id,coordinate:endpoint.coordinate};
  }
  for(const record of Object.values(f.config.checkpointRegistry)){
    const a=f.endpoints.get(record.entryEndpointId).coordinate.longitude-.0000005;
    const b=f.endpoints.get(record.exitEndpointId).coordinate.longitude+.0000005;
    record.geometry={type:'Polygon',coordinates:[[[a,9.999999],[b,9.999999],[b,10.000001],[a,10.000001],[a,9.999999]]]};
  }
  const mapData={getByType:type=>type==='door'?[...f.endpoints.values()].map(e=>e.entity):type==='floor'?[{id:'test-floor-1'}]:[],
    getDirections:async(from,to,options)=>{
      f.calls.push({from,to,options});return {coordinates:[from.coordinate,to.coordinate]};
    }};
  f.mapData=mapData;
  f.deps={config:f.config,...createAirportJourneySdkAdapter({mapData,config:f.config})};
  return f;
}
test('planner integrates observed SDK portals without granting clearance',async()=>{
  const f=sdkFixture(),plan=await planAirportJourney(f.input,f.deps);
  assert.equal(plan.verifiedRealRoute,true);
  assert.equal(plan.context.authorization,'none');
  assert.equal(plan.checkpointEvents.length,f.source.steps.length);
  assert.equal(f.calls.length,f.source.steps.length*2+1);
});
test('real SDK adapter and planner reject a gate closed before routing',async()=>{
  const f=sdkFixture();f.profile.openGateNos=[];
  await assert.rejects(planAirportJourney(f.input,f.deps),/ENDPOINT_CLOSED/);
  assert.equal(f.calls.length,0);
});
test('real SDK adapter and planner reject late closure of an already validated approach',async()=>{
  const f=sdkFixture(),get=f.mapData.getDirections;
  f.mapData.getDirections=async(...args)=>{
    const route=await get(...args);
    if(f.calls.length===f.source.steps.length*2+1){
      f.config.zones.push({role:'immigration',floorId:'test-floor-1',geometry:{type:'Polygon',coordinates:[[[107.000002,9.999999],[107.000008,9.999999],[107.000008,10.000001],[107.000002,10.000001],[107.000002,9.999999]]]}});
    }
    return route;
  };
  await assert.rejects(planAirportJourney(f.input,f.deps),/CONFIG_CHANGED/);
});
test('real SDK adapter rejects an unsampled additional portal on an approach',async()=>{
  const f=sdkFixture();
  for(const [id,longitude] of [['extra-entry',107.000003],['extra-exit',107.000007]]){
    const coordinate={longitude,latitude:10,floorId:'test-floor-1'};
    f.endpoints.set(id,{id,coordinate,entity:{id,coordinate}});
  }
  f.config.checkpointRegistry.extra={id:'extra',role:'checkin',floorId:'test-floor-1',direction:'forward',portalDirection:'forward',verified:true,profileIds:[f.profile.id],entryEndpointId:'extra-entry',exitEndpointId:'extra-exit',geometry:{type:'Polygon',coordinates:[[[107.000002,9.999999],[107.000008,9.999999],[107.000008,10.000001],[107.000002,10.000001],[107.000002,9.999999]]]}};
  f.deps={config:f.config,...createAirportJourneySdkAdapter({mapData:f.mapData,config:f.config})};
  await assert.rejects(planAirportJourney(f.input,f.deps),/UNSAMPLED_PORTAL/);
  assert.equal(f.calls.length,1);
});
test('sparse SDK geometry cannot bypass route validation',async()=>{
  const f=fixture();
  f.deps.getDirections=async(from,to)=>({coordinates:[f.endpoints.get(from.id).coordinate,,f.endpoints.get(to.id).coordinate]});
  f.deps.validateLeg=(_route,leg)=>({valid:true,checkpointEvents:leg.event?[leg.event]:[]});
  await assert.rejects(planAirportJourney(f.input,f.deps),/INVALID_ROUTE/);
});
test('validator cannot delete a coordinate while retaining the geometry length',async()=>{
  const f=fixture(),original=f.deps.validateLeg;
  f.deps.validateLeg=async(route,leg)=>{
    const result=original(route,leg);delete route.coordinates[0];return result;
  };
  await assert.rejects(planAirportJourney(f.input,f.deps),/GEOMETRY_CHANGED/);
});
