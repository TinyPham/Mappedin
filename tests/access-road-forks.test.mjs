import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {roadHeightAt,createAccessRoadMesh} from '../src/map/accessRoadMesh.mjs';
import {prepareAccessRoadVisuals,captureRenderedRoadLevel,resolveRenderedRoadLevel} from '../src/map/accessRoadVisuals.mjs';
import clipping from 'polygon-clipping';
const rows=JSON.parse(fs.readFileSync(new URL('../database/curbside-areas.json',import.meta.url))).filter(r=>r.visual.role==='road');
const originals=JSON.parse(fs.readFileSync(new URL('./fixtures/approved-road-profiles.json',import.meta.url)));
const top=30.08;
const point=(x,y,style)=>{const a=style.axisAngle*Math.PI/180;return[x*Math.cos(a)+y*Math.sin(a),-x*Math.sin(a)+y*Math.cos(a)];};

test('long approach ramps retain the approved profile outside the level-three junction',()=>{
 for(const row of rows){
  const old=originals[row.id];
  for(const side of [-1,1])for(let x=380;x<=730;x+=5)for(const y of [-280,-200,-120,0])assert.equal(roadHeightAt(point(side*x,y,row.visual),row.visual,top),roadHeightAt(point(side*x,y,old),old,top));
 }
});

test('level-three garage turnouts sit on a common flat level above the floor-one bridge',()=>{
 for(const row of rows)for(const side of [-1,1])for(const x of [155,300,310,320,330]){
  const height=roadHeightAt(point(side*x,-95,row.visual),row.visual,top);
  assert.equal(height,top);assert.ok(height-row.visual.deckThickness>10.08);
 }
});

test('local transition descends smoothly with no bump or step into the original ramp',()=>{
 for(const row of rows)for(const side of [-1,1]){
  let previous=top;
  for(let x=330;x<=400;x+=.1){const z=roadHeightAt(point(side*x,-95,row.visual),row.visual,top);assert.ok(z<=previous+1e-9);assert.ok(Math.abs(z-previous)<.03);previous=z;}
  const z=x=>roadHeightAt(point(side*x,-95,row.visual),row.visual,top),eps=.001;
  assert.ok(Math.abs((z(380)-z(380-eps))/eps-(z(380+eps)-z(380))/eps)<.001);
 }
});

test('roadside details retain their complete footprint and native floor-height references',()=>{
 const f=JSON.parse(fs.readFileSync(new URL('./fixtures/parking-road-junctions.json',import.meta.url)));
 const configured=JSON.parse(fs.readFileSync(new URL('../database/curbside-areas.json',import.meta.url)));
 const feature=(id,geometry)=>({type:'Feature',properties:{id,destinationNodes:[]},geometry});
 const curb=feature(configured[0].id,f.curb);curb.properties.center=f.origin;
 const real={features:[curb,feature(rows[0].id,f.terminal),feature(rows[1].id,f.road),feature(rows[1].visual.garageSpaceId,f.garage)]};
 const outline={type:'MultiPolygon',coordinates:clipping.union(f.terminal.coordinates,f.road.coordinates,f.garageOverview.coordinates,...f.roadInfills.map(g=>g.coordinates))};
 const mvf={space:{real:structuredClone(real),overview:{features:[feature('combined',outline)]}},obstruction:{},'floor.geojson':{features:[{properties:{id:'real',elevation:4}}]},'styles.json':{BuildingOutlines_test_4:{height:2,altitude:8,polygons:['combined']}}};
 const v=prepareAccessRoadVisuals(mvf,Object.fromEntries(configured.map(r=>[r.id,r.visual])),{});
 assert.equal(v.roadsideDetails.length,2);assert.deepEqual(mvf.space.real,real);
 const native=mvf['styles.json'].BuildingOutlines_test_4;
 assert.equal(native.height,2);assert.equal(native.altitude,8);
 const project=p=>[(p[0]-f.origin[0])*111320*Math.cos(f.origin[1]*Math.PI/180),(p[1]-f.origin[1])*111320];
 for(const detail of v.roadsideDetails){
  assert.ok(native.polygons.includes(detail.id),'native source disappeared');
  assert.ok(v.levelAnchorIds.includes(detail.id),'original SDK source must remain available before overrides');
  const mesh=createAccessRoadMesh(detail.geometry,f.origin,detail.style,top,'#E2E8F0',{decorations:false});
  const p=mesh.groups.find(g=>g.name==='Asphalt').positions;let meshArea=0;
  for(let i=0;i<p.length;i+=9)meshArea+=Math.abs((p[i+3]-p[i])*(p[i+7]-p[i+1])-(p[i+6]-p[i])*(p[i+4]-p[i+1]))/2;
  let footprint=0;
  for(const [i,ring] of detail.geometry.coordinates.entries()){
   const r=ring.map(project);let a=0;for(let j=1;j<r.length;j++)a+=r[j-1][0]*r[j][1]-r[j][0]*r[j-1][1];footprint+=(i?-1:1)*Math.abs(a/2);
  }
  assert.ok(Math.abs(meshArea-footprint)<.001,'part of the original detail was dropped');
 }
});

test('SDK altitude reset after a visual override cannot lower the level-three road',()=>{
 let state={altitude:30,height:10};const view={getState:()=>state},data={getById:()=>({id:'original-native-outline'})};
 const visuals={levelAnchorIds:['original-native-outline'],targets:[{style:{role:'curbside',surfaceHeight:.08}}]};
 assert.equal(captureRenderedRoadLevel(view,data,visuals),30.08);
 state={altitude:8,height:2};
 for(let i=0;i<3;i++)assert.equal(resolveRenderedRoadLevel(view,data,visuals),30.08);
 assert.ok(resolveRenderedRoadLevel(view,data,visuals)-.65>10.08);
});
