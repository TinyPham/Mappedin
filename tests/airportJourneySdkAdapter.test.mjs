import assert from 'node:assert/strict';import test from 'node:test';
import {createAirportJourneySdkAdapter} from '../src/navigation/airportJourneySdkAdapter.js';
const c=x=>({longitude:107+x,latitude:10,floorId:'F'});
const from={id:'entry',coordinate:c(0)},to={id:'exit',coordinate:c(.0001)};
const record={id:'portal',role:'immigration',floorId:'F',direction:'entry-to-exit',portalDirection:'entry-to-exit',entryEndpointId:'entry',exitEndpointId:'exit',verified:true,profileIds:['full-t1'],geometry:{type:'Polygon',coordinates:[[[106.99999,9.99999],[107.00011,9.99999],[107.00011,10.00001],[106.99999,10.00001],[106.99999,9.99999]]]}};
const config={zones:[],checkpointRegistry:{portal:record}};
const data={getByType:t=>t==='floor'?[{id:'F'}]:t==='door'?[from,to]:[],getDirections:async()=>({coordinates:[from.coordinate,to.coordinate]})};
const event={checkpointId:'portal',role:'immigration',floorId:'F',direction:'entry-to-exit',fromStage:'health-cleared',toStage:'entry-border-cleared'};
const leg={event,context:{profileId:'full-t1'},constraints:{blockedRoles:[],allowedRoles:['immigration']}};
test('observes a directed portal from route geometry, rather than echoing a requested event',async()=>{
 const sdk=createAirportJourneySdkAdapter({mapData:data,config});
 assert.equal((await sdk.resolveEndpoint('entry')).entity,from);
 const result=await sdk.validateLeg({coordinates:[c(0),c(.0001)]},leg);assert.deepEqual(result.checkpointEvents,[event]);
 assert.equal((await sdk.validateLeg({coordinates:[c(.001),c(.0011)]},leg)).checkpointEvents.length,0);
});
test('rejects reversed portals and unverified or missing geometry',async()=>{
 const sdk=createAirportJourneySdkAdapter({mapData:data,config});
 await assert.rejects(sdk.validateLeg({coordinates:[c(.0001),c(0)]},leg),/REVERSED_PORTAL/);
 const unverified=createAirportJourneySdkAdapter({mapData:data,config:{zones:[],checkpointRegistry:{portal:{...record,verified:false}}}});
 await assert.rejects(unverified.validateLeg({coordinates:[c(0),c(.0001)]},leg),/UNVERIFIED_PORTAL/);
 const missing=createAirportJourneySdkAdapter({mapData:data,config:{zones:[],checkpointRegistry:{portal:{...record,geometry:null}}}});
 await assert.rejects(missing.validateLeg({coordinates:[c(0),c(.0001)]},leg),/MISSING_PORTAL_GEOMETRY/);
});
test('approach legs do not receive an invented checkpoint event',async()=>{
 const sdk=createAirportJourneySdkAdapter({mapData:data,config});
 await assert.rejects(sdk.validateLeg({coordinates:[c(0),c(.0001)]},{...leg,event:null}),/UNEXPECTED_PORTAL/);
 assert.equal((await sdk.validateLeg({coordinates:[c(-.0001),c(0)]},{...leg,event:null})).checkpointEvents.length,0);
});

for(const [name,coordinates] of [
 ['unsampled crossing',[c(-.0001),c(.0002)]],
 ['forward reverse forward',[c(0),c(.0001),c(0),c(.0001)]],
 ['unsampled reverse after forward',[c(0),c(.0001),c(-.0001),c(.0001)]],
 ['geometry-only contact',[{...c(.00005),latitude:9.9999},{...c(.00005),latitude:10.0001}]],
]) test(`portal traversal fails closed: ${name}`,async()=>{
 const sdk=createAirportJourneySdkAdapter({mapData:data,config});
 await assert.rejects(sdk.validateLeg({coordinates},leg),/PORTAL/);
});
test('approach cannot cross the allowed next portal without sampled endpoints',async()=>{
 const sdk=createAirportJourneySdkAdapter({mapData:data,config});
 await assert.rejects(sdk.validateLeg({coordinates:[c(-.0001),c(.0002)]},{...leg,event:null}),/PORTAL/);
});
test('partial portal traversal cannot be treated as an approach',async()=>{
 const sdk=createAirportJourneySdkAdapter({mapData:data,config});
 await assert.rejects(sdk.validateLeg({coordinates:[c(0),c(.00005)]},{...leg,event:null}),/PORTAL/);
});
test('retains forward direction with interior route vertices and safe exit departure',async()=>{
 const sdk=createAirportJourneySdkAdapter({mapData:data,config});
 assert.deepEqual((await sdk.validateLeg({coordinates:[c(0),c(.00005),c(.0001)]},leg)).checkpointEvents,[event]);
 assert.deepEqual((await sdk.validateLeg({coordinates:[c(.0001),c(.0002)]},{...leg,event:null})).checkpointEvents,[]);
});
test('SDK endpoint resolution and routing reject configured closed gates',async()=>{
 const configured={...config,gates:[{mappedinId:'exit',gateNo:24}],profiles:{'full-t1':{id:'full-t1',openGateNos:[1]}}};
 let calls=0;
 const sdk=createAirportJourneySdkAdapter({config:configured,mapData:{...data,getDirections:async()=>{calls++;return {coordinates:[c(0),c(.0001)]};}}});
 await assert.rejects(sdk.resolveEndpoint('exit',leg.context),/ENDPOINT_CLOSED/);
 await assert.rejects(sdk.getDirections(from,to,{context:leg.context,constraints:leg.constraints}),/ENDPOINT_CLOSED/);
 assert.equal(calls,0);
});
test('checkpoint traversal cannot leave its bound geometry and re-enter',async()=>{
 const sdk=createAirportJourneySdkAdapter({mapData:data,config});
 await assert.rejects(sdk.validateLeg({coordinates:[c(0),{...c(.00005),latitude:10.001},c(.0001)]},leg),/AMBIGUOUS_PORTAL/);
});
test('unsampled crossing of a hole is ambiguous even with correctly ordered endpoints',async()=>{
 const hole=[[107.00004,9.999995],[107.00006,9.999995],[107.00006,10.000005],[107.00004,10.000005],[107.00004,9.999995]];
 const configured={...config,checkpointRegistry:{portal:{...record,geometry:{...record.geometry,coordinates:[record.geometry.coordinates[0],hole]}}}};
 const sdk=createAirportJourneySdkAdapter({mapData:data,config:configured});
 await assert.rejects(sdk.validateLeg({coordinates:[c(0),c(.0001)]},leg),/AMBIGUOUS_PORTAL/);
});
test('a directed traversal may have endpoints on opposite sides of bound portal geometry',async()=>{
 const small={type:'Polygon',coordinates:[[[107.00004,9.99999],[107.00006,9.99999],[107.00006,10.00001],[107.00004,10.00001],[107.00004,9.99999]]]};
 const sdk=createAirportJourneySdkAdapter({mapData:data,config:{...config,checkpointRegistry:{portal:{...record,geometry:small}}}});
 assert.deepEqual((await sdk.validateLeg({coordinates:[c(0),c(.0001)]},leg)).checkpointEvents,[event]);
});
test('narrow portal supports approach, crossing, and departure with bound endpoints outside its polygon',async()=>{
 const geometry={type:'Polygon',coordinates:[[[107.00004,9.99999],[107.00006,9.99999],[107.00006,10.00001],[107.00004,10.00001],[107.00004,9.99999]]]};
 const sdk=createAirportJourneySdkAdapter({mapData:data,config:{...config,checkpointRegistry:{portal:{...record,geometry}}}});
 const results=[];
 for(const [coordinates,eventForLeg] of [
  [[c(-.0001),c(0)],null],
  [[c(0),c(.0001)],event],
  [[c(.0001),c(.0002)],null],
 ])results.push(await sdk.validateLeg({coordinates},{...leg,event:eventForLeg}));
 assert.deepEqual(results,[
  {valid:true,checkpointEvents:[]},
  {valid:true,checkpointEvents:[event]},
  {valid:true,checkpointEvents:[]},
 ]);
});
test('narrow portal endpoint contact without polygon contact still rejects the reverse side',async()=>{
 const geometry={type:'Polygon',coordinates:[[[107.00004,9.99999],[107.00006,9.99999],[107.00006,10.00001],[107.00004,10.00001],[107.00004,9.99999]]]};
 const sdk=createAirportJourneySdkAdapter({mapData:data,config:{...config,checkpointRegistry:{portal:{...record,geometry}}}});
 await assert.rejects(sdk.validateLeg({coordinates:[c(.00003),c(0)]},{...leg,event:null}),/REVERSED_PORTAL/);
 await assert.rejects(sdk.validateLeg({coordinates:[c(.0001),c(.00007)]},{...leg,event:null}),/REVERSED_PORTAL/);
});
test('approach cannot arrive at entry from the exit side without sampling exit',async()=>{
 const sdk=createAirportJourneySdkAdapter({mapData:data,config});
 await assert.rejects(sdk.validateLeg({coordinates:[{...c(.0002),latitude:10.000005},c(0)]},{...leg,event:null}),/REVERSED_PORTAL/);
});
test('departure cannot leave exit toward entry without sampling entry',async()=>{
 const sdk=createAirportJourneySdkAdapter({mapData:data,config});
 await assert.rejects(sdk.validateLeg({coordinates:[c(.0001),{...c(-.0001),latitude:10.000005}]},{...leg,event:null}),/REVERSED_PORTAL/);
});
test('internal backward traversal is rejected even without revisiting a portal endpoint',async()=>{
 const sdk=createAirportJourneySdkAdapter({mapData:data,config});
 await assert.rejects(sdk.validateLeg({coordinates:[c(0),c(.00007),c(.00003),c(.0001)]},leg),/REVERSED_PORTAL/);
});
