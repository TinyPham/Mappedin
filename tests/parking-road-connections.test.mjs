import test from 'node:test';
import assert from 'node:assert/strict';
import clipping from 'polygon-clipping';
import fs from 'node:fs';
import {findRoadGarageConnections,repairRoadCenterlines,createConnectionLandings} from '../src/map/roadConnections.mjs';
import {prepareAccessRoadVisuals,createRoadMarkings} from '../src/map/accessRoadVisuals.mjs';
import {createAccessRoadMesh,roadHeightAt} from '../src/map/accessRoadMesh.mjs';
const origin=[107,10],sx=111320*Math.cos(10*Math.PI/180),sy=111320;
const geo=p=>[origin[0]+p[0]/sx,origin[1]+p[1]/sy];
const roadRing=[[-60,0],[-4,0],[-4,-16],[4,-16],[4,0],[60,0],[60,12],[-60,12],[-60,0]];
const road={type:'Polygon',coordinates:[roadRing.map(geo)]};
const garage={type:'Polygon',coordinates:[[[-40,-16],[-40,-50],[40,-50],[40,-16],[-40,-16]].map(geo)]};
test('finds shared garage mouth and creates a bounded landing inside the garage',()=>{
 const caps=findRoadGarageConnections(road,garage);assert.equal(caps.length,1);
 assert.ok(Math.abs(caps[0].width-8)<1e-5);
 const landings=createConnectionLandings(caps,garage,.4);
 assert.equal(landings.type,'MultiPolygon');assert.ok(landings.coordinates.length);
 assert.equal(clipping.difference(landings.coordinates,garage.coordinates).length,0);
});
test('junction no longer pulls the main centerline into the spur and branch stays central',()=>{
 const original=[];for(let x=-59;x<=59;x+=2)original.push([x,Math.abs(x)<4?-2:6]);
 const caps=[{edge:[[-4,-16],[4,-16]],inward:[0,1],width:8}];
 const repaired=repairRoadCenterlines([original],[roadRing],caps,16);
 const main=repaired.find(p=>p.kind==='main');assert.ok(main);
 for(const p of main.points.filter(p=>Math.abs(p[0])<4))assert.ok(Math.abs(p[1]-6)<1e-5);
 const branch=repaired.find(p=>p.kind==='connector');assert.ok(branch);
 for(const p of branch.points)assert.ok(Math.abs(p[0])<1e-5);
 assert.ok(Math.abs(branch.points.at(-1)[1]-6)<1e-5);
});

test('joins scan fragments interrupted by a deep driveway before repairing its median',()=>{
 const left=[],right=[];
 for(let x=-59;x<=-5;x+=2)left.push([x,6]);
 for(let x=5;x<=59;x+=2)right.push([x,6]);
 const spur=[[-3,-2],[-1,-2],[1,-2],[3,-2]];
 const caps=[{edge:[[-4,-16],[4,-16]],inward:[0,1],width:8}];
 const paths=repairRoadCenterlines([left,spur,right],[roadRing],caps,16);
 assert.equal(paths.filter(p=>p.kind==='main').length,1);
 assert.equal(paths.filter(p=>p.kind==='connector').length,1);
 assert.ok(paths[0].points.every(p=>Math.abs(p[1]-6)<1e-6));
});

test('driveway intervals overlapping the main scan are not mistaken for a second through road',()=>{
 const main=[];for(let x=-59;x<=59;x+=2)main.push([x,6]);
 const branch=[[-3,-10],[-1,-10],[1,-10],[3,-10]];
 const caps=[{edge:[[-4,-16],[4,-16]],inward:[0,1],width:8}];
 const repaired=repairRoadCenterlines([main,branch],[roadRing],caps,16);
 assert.equal(repaired.filter(p=>p.kind==='main').length,1);
 assert.equal(repaired.filter(p=>p.kind==='connector').length,1);
 assert.ok(repaired[0].points.every(p=>Math.abs(p[1]-6)<1e-6));
});

test('published garage junctions have two central branches, level landings and a separate overview deck',()=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/parking-road-junctions.json',import.meta.url)));
 const row=JSON.parse(fs.readFileSync(new URL('../database/curbside-areas.json',import.meta.url))).find(r=>r.visual.garageSpaceId);
 const caps=findRoadGarageConnections(fixture.road,fixture.garage);assert.equal(caps.length,2);
 const angle=row.visual.axisAngle*Math.PI/180;
 const project=p=>[(p[0]-fixture.origin[0])*111320*Math.cos(fixture.origin[1]*Math.PI/180),(p[1]-fixture.origin[1])*111320];
 const aligned=p=>{const [x,y]=project(p);return[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)]};
 for(const cap of caps)for(const p of cap.edge)assert.equal(roadHeightAt(project(p),row.visual,30.08),30.08);
 const style={...row.visual,connectorCaps:caps},markings=createRoadMarkings(fixture.road,style);
 assert.ok(markings.features.some(f=>f.properties.centerlineKind==='connector'));
 const centers=markings.features.map(f=>({kind:f.properties.centerlineKind,p:f.geometry.coordinates[0].slice(0,-1).map(aligned).reduce((n,p,i,arr)=>[n[0]+p[0]/arr.length,n[1]+p[1]/arr.length],[0,0])}));
 for(const cap of caps){
  const x=cap.edge.map(aligned).reduce((n,p)=>n+p[0]/2,0);
  const local=centers.filter(p=>p.kind==='main'&&Math.abs(p.p[0]-x)<15).map(p=>p.p[1]);
  assert.ok(local.length>2);assert.ok(Math.max(...local)-Math.min(...local)<7,'through-road median dips into the spur');
  assert.ok(centers.some(p=>p.kind==='connector'&&Math.abs(p.p[0]-x)<15));
 }
 const landings=createConnectionLandings(caps,fixture.garage,row.visual.connectionOverlap);
 assert.equal(clipping.difference(landings.coordinates,fixture.garage.coordinates).length,0);
 const mesh=createAccessRoadMesh(fixture.road,fixture.origin,style,30.08,row.color,{markings,landings});
 assert.ok(mesh.groups.every(g=>g.positions.every(Number.isFinite)));
 const feature=(id,geometry)=>({type:'Feature',properties:{id,destinationNodes:[]},geometry});
 const combined={type:'MultiPolygon',coordinates:clipping.union(fixture.road.coordinates,fixture.garageOverview.coordinates)};
 const mvf={space:{real:{features:[feature(row.id,fixture.road),feature(row.visual.garageSpaceId,fixture.garage)]},overview:{features:[feature('garage-outline',combined)]}},obstruction:{},'floor.geojson':{features:[{properties:{id:'real',elevation:4}}]},'styles.json':{BuildingOutlines_test_4:{height:2,altitude:8,polygons:['garage-outline']}}};
 const before=structuredClone(mvf.space.real);
 const result=prepareAccessRoadVisuals(mvf,{[row.id]:row.visual},{[row.id]:row.color});
 assert.deepEqual(mvf.space.real,before);
 assert.deepEqual(result.parkingDeckIds,['garage-outline']);
});
