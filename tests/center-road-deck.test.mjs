import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import clipping from 'polygon-clipping';
import {prepareAccessRoadVisuals,liftCenterRoadDeck} from '../src/map/accessRoadVisuals.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/parking-road-junctions.json',import.meta.url)));
const rows=JSON.parse(fs.readFileSync(new URL('../database/curbside-areas.json',import.meta.url)));

function prepareScene(allowEnds=false){
 const feature=(id,geometry)=>({type:'Feature',properties:{id,destinationNodes:[]},geometry});
 const curb=feature(rows[0].id,fixture.curb);curb.properties.center=fixture.origin;
 const roads=rows.filter(r=>r.visual.role==='road');
 const real={features:[curb,feature(roads[0].id,fixture.terminal),feature(roads[1].id,fixture.road),feature(roads[1].visual.garageSpaceId,fixture.garage)]};
 const outline={type:'MultiPolygon',coordinates:clipping.union(fixture.terminal.coordinates,fixture.road.coordinates,fixture.centerRoadDeck.coordinates,...fixture.endRoadDecks.map(g=>g.coordinates),fixture.garageOverview.coordinates,...fixture.roadInfills.map(g=>g.coordinates))};
 const mvf={space:{real:structuredClone(real),overview:{features:[feature('outline',outline)]}},obstruction:{},'floor.geojson':{features:[{properties:{id:'real',elevation:4}}]},'styles.json':{BuildingOutlines_test_4:{height:2,altitude:8,polygons:['outline']}}};
 const styles=Object.fromEntries(rows.map(r=>[r.id,{...r.visual}]));styles[rows[0].id].liftCenterRoadDeck=true;styles[rows[0].id].liftEndRoadDecks=allowEnds;
 const before=structuredClone(styles),visuals=prepareAccessRoadVisuals(mvf,styles,{});
 assert.deepEqual(mvf.space.real,real);assert.deepEqual(styles,before);
 return visuals;
}

test('selects only the central piece touching both roads, without changing real spaces or road profiles',()=>{
 const visuals=prepareScene();
 assert.equal(visuals.centerRoadDecks.length,1);
 assert.deepEqual(visuals.centerRoadDecks[0].geometry,fixture.centerRoadDeck);
});

test('adds exactly the two end pieces and leaves the middle and exterior ramp pieces intact',()=>{
 const visuals=prepareScene(true);
 assert.equal(visuals.centerRoadDecks.length,3);
 for(const geometry of [fixture.centerRoadDeck,...fixture.endRoadDecks])assert.ok(visuals.centerRoadDecks.some(deck=>JSON.stringify(deck.geometry)===JSON.stringify(geometry)));
 assert.equal(visuals.roadsideDetails.length,2);
 assert.ok(visuals.roadsideDetails.every(detail=>!visuals.centerRoadDecks.some(deck=>deck.id===detail.id)));
});

test('lifts just that piece and preserves its thickness, color and geometry',()=>{
 const calls=[];const space={id:'middle'};
 const view={updateState:(object,patch)=>calls.push({object,patch})};
 liftCenterRoadDeck(view,{getById:(_type,id)=>id==='middle'?space:null},{centerRoadDecks:[{id:'middle',height:2}]},30.08);
 assert.equal(calls.length,1);assert.equal(calls[0].object,space);
 assert.deepEqual(calls[0].patch,{altitude:28.08,height:2});
 assert.equal(calls[0].patch.altitude+calls[0].patch.height,30.08);
});
