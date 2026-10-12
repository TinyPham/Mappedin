import test from 'node:test';
import assert from 'node:assert/strict';
import clipping from 'polygon-clipping';
import {prepareAccessRoadVisuals, createRoadMarkings} from '../src/map/accessRoadVisuals.mjs';
const polygon=(id,coordinates)=>({type:'Feature',properties:{id,destinationNodes:[]},geometry:{type:'Polygon',coordinates}});
const square=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
test('visual changes preserve routing and do not lower shared or entrance walls',()=>{
 const road=polygon('road',[square(0,0,10,2)]),building=polygon('building',[square(0,2,10,8)]);
 const wall=(id,a,b,entrances=[])=>({type:'Feature',properties:{id,kind:'Wall',entrances},geometry:{type:'LineString',coordinates:[a,b]}});
 const mvf={space:{f:{features:[road,building]},overview:{features:[polygon('outline',[square(0,0,10,10)])]}},obstruction:{f:{features:[wall('edge',[0,0],[10,0]),wall('shared',[0,2],[10,2]),wall('door',[0,0],[0,2],['entrance'])]}},'styles.json':{Walls:{height:1,width:.3,lineStrings:['edge','shared','door']},BuildingOutlines_test_4:{height:2,altitude:8,polygons:['outline']}},'node.geojson':{features:[{id:'node'}]},'connection.json':[{id:'connection'}],entrance:{f:{features:[{id:'entrance'}]}},'navigationFlags.json':{blocked:['door']}};
 const before=structuredClone(mvf),result=prepareAccessRoadVisuals(mvf,{road:{role:'road',edgeHeight:.18,edgeWidth:.1,deckThickness:.25}}, {road:'#56616C'});
 for(const key of ['node.geojson','connection.json','entrance','navigationFlags.json','obstruction'])assert.deepEqual(mvf[key],before[key]);
 assert.deepEqual(mvf.space.f,before.space.f);
 assert.deepEqual(mvf['styles.json'].Walls.lineStrings,['shared','door']);
 assert.equal(mvf['styles.json'].AccessRoadEdges_road.height,.18);
 assert.equal(result.overviewFloorId,'overview');
 const originalOutline=mvf.space.overview.features.find(f=>f.properties.id==='outline');
 assert.equal(clipping.intersection(originalOutline.geometry.coordinates,road.geometry.coordinates).length,0);
 assert.ok(result.paintSources['s_access_road_0']);
});
test('markings are clipped to the road including holes, with metre scale spacing',()=>{
 const lng=107,lat=10,dx=1/109600,dy=1/111320;
 const road={type:'Polygon',coordinates:[square(lng,lat,100*dx,12*dy),square(lng+40*dx,lat+4*dy,10*dx,4*dy)]};
 const markings=createRoadMarkings(road,{axisAngle:0,lineWidth:.15,dashLength:4,dashGap:4});
 assert.ok(markings.features.length>5);
 for(const f of markings.features)assert.equal(clipping.difference(f.geometry.coordinates,road.coordinates).length,0);
});
test('overview cuts only the source floor elevation even when lower floors intersect',()=>{
 const mvf={space:{real:{features:[polygon('road',[square(0,0,10,2)])]},overview:{features:[polygon('lower',[square(0,0,10,10)]),polygon('upper',[square(0,0,10,10)])]}},obstruction:{},'floor.geojson':{features:[{properties:{id:'real',elevation:4}}]},'styles.json':{BuildingOutlines_test_1:{altitude:2,height:2,polygons:['lower']},BuildingOutlines_test_4:{altitude:8,height:2,polygons:['upper']}}};
 const lower=structuredClone(mvf.space.overview.features[0]);
 const result=prepareAccessRoadVisuals(mvf,{road:{role:'road'}},{road:'#56616C'});
 assert.equal(result.overviewTop,10);
 assert.deepEqual(mvf.space.overview.features[0],lower);
 assert.equal(clipping.intersection(mvf.space.overview.features[1].geometry.coordinates,[square(0,0,10,2)]).length,0);
});
