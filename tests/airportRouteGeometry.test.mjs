import assert from 'node:assert/strict';import test from 'node:test';
import {routeIntersectsZone,validateAirportRoute} from '../src/navigation/airportRouteValidator.js';
const zone={floorId:'3F',geometry:{type:'Feature',geometry:{type:'Polygon',coordinates:[[[0,0],[2,0],[2,2],[0,2],[0,0]]]}}};
const p=(x,y,floorId='3F')=>({longitude:x,latitude:y,floorId});
test('rejects crossing even if both endpoints are outside',()=>assert.equal(routeIntersectsZone([p(-1,1),p(3,1)],zone),true));
test('rejects boundary touch and collinear travel',()=>{assert.ok(routeIntersectsZone([p(-1,0),p(1,0)],zone));assert.ok(routeIntersectsZone([p(-1,-1),p(0,0)],zone));});
test('does not apply a polygon on another floor or connect points across floors',()=>{assert.equal(routeIntersectsZone([p(-1,1,'2F'),p(3,1,'2F')],zone),false);assert.equal(routeIntersectsZone([p(-1,1),p(3,1,'2F')],zone),false);});
test('rejects malformed routes and missing coordinates',()=>{assert.throws(()=>validateAirportRoute({coordinates:[]},[]),/INVALID_ROUTE/);assert.throws(()=>validateAirportRoute({coordinates:[p(1,1),{floorId:'3F'}]},[]),/INVALID_ROUTE/);});
test('keeps holes navigable and validates every segment of smoothed route',()=>{
 const hole={floorId:'3F',geometry:{type:'Polygon',coordinates:[[[0,0],[5,0],[5,5],[0,5],[0,0]],[[1,1],[4,1],[4,4],[1,4],[1,1]]]}};
 assert.equal(routeIntersectsZone([p(2,2),p(3,3)],hole),false);
 assert.throws(()=>validateAirportRoute({coordinates:[p(-1,1),p(3,1)]},[zone]),/FORBIDDEN_CROSSING/);
});

for(const [name,geometry] of [
 ['empty outer ring',{type:'Polygon',coordinates:[[]]}],
 ['empty multipolygon',{type:'MultiPolygon',coordinates:[]}],
 ['unclosed ring',{type:'Polygon',coordinates:[[[0,0],[2,0],[2,2],[0,2]]]}],
 ['nonfinite vertex',{type:'Polygon',coordinates:[[[0,0],[2,0],[NaN,2],[0,0]]]}],
 ['degenerate ring',{type:'Polygon',coordinates:[[[0,0],[1,0],[2,0],[0,0]]]}],
 ['empty hole',{type:'Polygon',coordinates:[zone.geometry.geometry.coordinates[0],[]]}],
 ['self-intersecting ring',{type:'Polygon',coordinates:[[[0,0],[3,3],[0,3],[2,0],[0,0]]]}],
 ['hole crossing outer ring',{type:'Polygon',coordinates:[zone.geometry.geometry.coordinates[0],[[-1,.5],[1,.5],[1,1.5],[-1,1.5],[-1,.5]]]}],
 ['hole outside outer ring',{type:'Polygon',coordinates:[zone.geometry.geometry.coordinates[0],[[10,10],[11,10],[11,11],[10,11],[10,10]]]}],
]) test(`invalid zone fails closed: ${name}`,()=>{
 assert.throws(()=>validateAirportRoute({coordinates:[p(-1,1),p(3,1)]},[{floorId:'3F',geometry}]),error=>error.code==='INVALID_ZONE');
});
test('zone without a floor fails closed even away from its polygon',()=>{
 assert.throws(()=>validateAirportRoute({coordinates:[p(10,10),p(11,11)]},[{geometry:zone.geometry}]),error=>error.code==='INVALID_ZONE');
});
test('sparse route coordinates fail closed',()=>{
 assert.throws(()=>validateAirportRoute({coordinates:[p(-1,1),,p(3,1)]},[]),error=>error.code==='INVALID_ROUTE');
});
