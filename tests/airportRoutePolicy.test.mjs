import test from 'node:test';import assert from 'node:assert/strict';
import {createAirportDirections} from '../src/navigation/airportDirections.js';
import config from '../src/config/airportOperations.json' with {type:'json'};
const origin={id:config.counters.find(c=>c.island==='A').mappedinId},destination={id:config.gates.find(g=>g.gateNo===3).mappedinId};
test('ordinary navigation passes the original Mappedin options with no policy zones',async()=>{
 let options;const floors=config.zones.map(z=>({id:z.floorId}));
 const get=createAirportDirections({config,getContext:()=>({origin,destination,mobility:'accessible'}),mapData:{getByType:()=>floors,getDirections:async(a,b,o)=>{options=o;return {coordinates:[{latitude:0,longitude:0,floorId:floors[0].id},{latitude:0.01,longitude:0,floorId:floors[0].id}]};}}});
 await get(origin,destination,{smoothing:false,accessible:false});
 assert.equal(options.accessible,false);assert.equal(options.zones,undefined);assert.equal(options.smoothing,false);
});
test('strict procedure navigation keeps policy zones and accessibility',async()=>{
 let options;const floors=config.zones.map(z=>({id:z.floorId}));
 const get=createAirportDirections({config,getContext:()=>({mode:'procedure',origin,destination,mobility:'accessible'}),mapData:{getByType:()=>floors,getDirections:async(a,b,o)=>{options=o;return {coordinates:[{latitude:0,longitude:0,floorId:floors[0].id},{latitude:0.01,longitude:0,floorId:floors[0].id}]};}}});
 await get(origin,destination);
 assert.equal(options.accessible,true);assert.ok(options.zones.length>=2);assert.ok(options.zones.every(z=>z.cost===Infinity&&z.floor.id));
});
test('ordinary route still reports actual no-route to callers',async()=>{
 const get=createAirportDirections({config,getContext:()=>({origin,destination}),mapData:{getByType:()=>config.zones.map(z=>({id:z.floorId})),getDirections:async()=>null}});
 await assert.rejects(get(origin,destination),/NO_ROUTE/);
});
