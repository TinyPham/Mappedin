import test from 'node:test';import assert from 'node:assert/strict';
import config from '../src/config/airportOperations.json' with {type:'json'};
import {createJourneyContext, resolveAirportPolicy} from '../src/navigation/airportJourneyContext.js';
test('A and B counters and islands remain domestic; other islands international',()=>{
 assert.equal(config.counters.length,234);
 for(const c of config.counters){const context=createJourneyContext({origin:{id:c.mappedinId}},config);assert.equal(context.trafficClass,'AB'.includes(c.island)?'domestic':'international');}
});
test('seven floor1 Gates are departure without changing physical ID/floor',()=>{
 for(const n of [9,10,17,28,34,43,44]){const g=config.gates.find(g=>g.gateNo===n);assert.equal(g.accessRole,'departure');assert.equal(g.floorId,'m_41a38d6d0411d397');}
});
test('domestic origin cannot target an international gate or stopover',()=>{
 const origin={id:config.counters.find(c=>c.island==='A').mappedinId};
 const destination={id:config.gates.find(g=>g.gateNo===9).mappedinId};
 assert.throws(()=>createJourneyContext({origin,destination},config),/TRAFFIC_MISMATCH/);
 assert.throws(()=>createJourneyContext({origin,stopovers:[{id:config.counters.find(c=>c.island==='C').mappedinId}]},config),/TRAFFIC_MISMATCH/);
 const physical=createJourneyContext({mode:'physical',origin,destination,stopovers:[{id:config.counters.find(c=>c.island==='C').mappedinId}]},config);
 assert.equal(physical.journeyKind,'physical');
 assert.equal(physical.trafficClass,null);
});
test('initial profile rejects closed islands and D15 while full allows J',()=>{
 const J=config.counters.find(c=>c.island==='J'),D15=config.counters.find(c=>c.island==='D'&&c.counterNo===15);
 for(const c of [J,D15])assert.throws(()=>createJourneyContext({origin:{id:c.mappedinId},profileId:'initial-operations'},config),/ENDPOINT_CLOSED/);
 assert.equal(createJourneyContext({origin:{id:J.mappedinId}},config).trafficClass,'international');
 assert.equal(createJourneyContext({mode:'physical',origin:{id:J.mappedinId},profileId:'initial-operations'},config).journeyKind,'physical');
});
test('generic transfer ignores caller stage and history; unknown profile fails closed',()=>{
 const context=createJourneyContext({journeyKind:'transfer',transferFrom:'international',transferTo:'domestic',stage:'international-arrival-corridor'},config);
 assert.equal(context.stage,'public');
 assert.ok(resolveAirportPolicy(context,config).blockedRoles.includes('immigration'));
 assert.throws(()=>createJourneyContext({profileId:'missing'},config),/UNKNOWN_PROFILE/);
});

test('generic policy cannot be relaxed by forging a stage or clearance history',()=>{
 const input={journeyKind:'transfer',transferFrom:'international',transferTo:'domestic'};
 const baseline=createJourneyContext(input,config);
 for(const stage of ['international-arrival-corridor','domestic-arrival-corridor','entry-border-cleared']){
  const context=createJourneyContext({...input,stage,checkpointHistory:[{role:'immigration',clearance:true}]},config);
  assert.equal(context.stage,'public');
  assert.deepEqual(context.checkpointHistory,[]);
  assert.deepEqual(resolveAirportPolicy({...context,stage},config).blockedRoles,resolveAirportPolicy(baseline,config).blockedRoles);
 }
});

test('arrival uses authoritative belt mapping and never defaults unknown traffic to domestic',()=>{
 for(const belt of config.belts){assert.equal(createJourneyContext({journeyKind:'arrival',destination:{id:belt.mappedinId}},config).trafficClass,belt.beltNo<=3?'domestic':'international');}
 assert.throws(()=>createJourneyContext({journeyKind:'arrival',origin:{id:'public'},destination:{id:'unknown'}},config),/UNKNOWN_TRAFFIC/);
 const policy=resolveAirportPolicy(createJourneyContext({journeyKind:'arrival',trafficClass:'domestic'},config),config);
 assert.ok(policy.blockedRoles.includes('immigration'));assert.ok(policy.blockedRoles.includes('arrival-customs'));
});
