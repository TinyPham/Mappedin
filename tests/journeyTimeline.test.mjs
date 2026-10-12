import test from 'node:test';import assert from 'node:assert/strict';
import {sampleJourneyRoute,interpolateBearing,splitRouteByFloor,routeLookAheadBearing} from '../src/journeys/journeyTimeline.js';
const p=(latitude,longitude,floorId)=>({latitude,longitude,floorId});
test('does not draw floor changes as lines through a floor',()=>{
 const legs=splitRouteByFloor([p(10,107,'1'),p(10.1,107,'1'),p(10.1,107,'2'),p(10.2,107,'2')]);
 assert.equal(legs.length,2);assert.equal(legs[1].floorId,'2');
});
test('camera bearing takes the short turn across 360 degrees',()=>{assert.equal(interpolateBearing(350,10,.5),360);assert.equal(interpolateBearing(10,350,.5),0);});
test('samples route on an actual floor without interpolating across a connection',()=>{
 const coords=[p(10,107,'1'),p(10.001,107,'1'),p(10.001,107,'2'),p(10.002,107,'2')];
 const value=sampleJourneyRoute(coords,.75);assert.equal(value.floorId,'2');assert.ok(value.latitude>=10.001);
});

test('100 percent keeps final floor transition even when it has zero horizontal length',()=>{
 const coordinates=[p(10,107,'1'),p(10.001,107,'1'),p(10.001,107,'2')];assert.equal(sampleJourneyRoute(coordinates,1).floorId,'2');assert.equal(sampleJourneyRoute(coordinates,0).floorId,'1');
});
test('bearing stays within the current visit when a route returns to an earlier floor',()=>{
 const coords=[p(10,107,'1'),p(10,107.001,'1'),p(10,107.001,'2'),p(10.001,107.001,'2'),p(10.001,107.001,'1'),p(10.002,107.001,'1')];
 assert.equal(routeLookAheadBearing(coords,{...coords[0],routeIndex:0}),90);
 assert.equal(routeLookAheadBearing(coords,{...coords[4],routeIndex:4}),0);
});
