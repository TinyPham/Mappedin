import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import clipping from 'polygon-clipping';
import {prepareAccessRoadVisuals,liftCenterRoadDeck} from '../src/map/accessRoadVisuals.mjs';
const f=JSON.parse(fs.readFileSync(new URL('./fixtures/parking-road-junctions.json',import.meta.url)));
const rows=JSON.parse(fs.readFileSync(new URL('../database/curbside-areas.json',import.meta.url)));
const feature=(id,geometry)=>({type:'Feature',properties:{id,destinationNodes:[]},geometry});
function scene(){
 const curb=feature(rows[0].id,f.curb);curb.properties.center=f.origin;
 const t3={features:[curb,feature(rows[1].id,f.terminal),feature(rows[2].id,f.road),feature(rows[2].visual.garageSpaceId,f.garage),structuredClone(f.continuousMedianSource)]};
 const t1={features:f.lowerBridges.map(b=>feature(b.id,b.geometry))};
 const outline={type:'MultiPolygon',coordinates:clipping.union(f.terminal.coordinates,f.road.coordinates,f.continuousMedianSource.geometry.coordinates,f.garageOverview.coordinates,...f.roadInfills.map(g=>g.coordinates),...f.lowerBridges.map(b=>b.geometry.coordinates))};
 const mvf={space:{m_1523f7dcde647c40:t3,m_41a38d6d0411d397:t1,overview:{features:[feature('upper',outline),feature('lower',{type:'MultiPolygon',coordinates:clipping.union(...f.lowerBridges.map(b=>b.geometry.coordinates))})]}},obstruction:{},'floor.geojson':{features:[{properties:{id:'m_1523f7dcde647c40',elevation:4}},{properties:{id:'m_41a38d6d0411d397',elevation:2}}]},'styles.json':{BuildingOutlines_test_4:{height:2,altitude:8,polygons:['upper']},BuildingOutlines_test_2:{height:2,altitude:4,polygons:['lower']}}};
 return mvf;
}
test('preserves the original continuous floor-three median despite the two lower bridge footprints',()=>{
 const mvf=scene(),before=structuredClone(mvf),v=prepareAccessRoadVisuals(mvf,Object.fromEntries(rows.map(r=>[r.id,r.visual])),{});
 assert.equal(v.centerRoadDecks.length,1,'one original median must remain instead of three cut sections');
 assert.deepEqual(v.medianSourceIds,[f.continuousMedianSource.properties.id]);
 assert.equal(v.medianGapPatches.length,0,'no replacement patches');
 const median=v.centerRoadDecks[0].geometry;
 assert.equal(median.type,'Polygon');assert.equal(median.coordinates.length,1,'no internal openings');
 assert.equal(clipping.difference(f.continuousMedianSource.geometry.coordinates,median.coordinates).length,0,'original floor-three surface missing');
 assert.equal(clipping.difference(median.coordinates,f.continuousMedianSource.geometry.coordinates).length,0,'median expanded outside original drawing');
 assert.deepEqual(mvf.space.m_1523f7dcde647c40,before.space.m_1523f7dcde647c40);
 assert.deepEqual(mvf.space.m_41a38d6d0411d397,before.space.m_41a38d6d0411d397);
 assert.equal(v.lowerBridges.length,2);
 const patches=[];liftCenterRoadDeck({updateState:(_s,p)=>patches.push(p)},{getById:()=>({})},v,30.08);
 assert.deepEqual(patches,[{altitude:28.08,height:2,color:'#E2E8F0',hoverColor:'#E2E8F0'}]);
 assert.equal(v.roadsideDetails.length,2);
});
test('a same-footprint Room on floor one is not mistaken for the floor-three median source',()=>{
 const mvf=scene();
 mvf.space.m_1523f7dcde647c40.features=mvf.space.m_1523f7dcde647c40.features.filter(s=>s.properties.id!==f.continuousMedianSource.properties.id);
 mvf.space.m_41a38d6d0411d397.features.push(structuredClone(f.continuousMedianSource));
 const v=prepareAccessRoadVisuals(mvf,Object.fromEntries(rows.map(r=>[r.id,r.visual])),{});
 assert.deepEqual(v.medianSourceIds,[]);
 assert.equal(v.centerRoadDecks.length,3);
 assert.equal(v.medianGapPatches.length,0);
});
