import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import clipping from 'polygon-clipping';
import {BufferGeometry, Float32BufferAttribute} from 'three';
import {createRoofDecorationMesh} from '../src/map/roofDecorationMesh.mjs';

const shared = JSON.parse(readFileSync(new URL('../database/roof-appearance.json', import.meta.url)));
const origin = [107.042, 10.773];
const sx = 111320 * Math.cos(origin[1] * Math.PI / 180);
const config = {...shared, axisAngle: 0};
const rect = (x, y, w, h) => [[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
const geo = rings => ({type:'Polygon', coordinates:rings.map(r => r.map(([x,y]) => [origin[0]+x/sx, origin[1]+y/111320]))});
const local = g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map(p => p.map(r => r.map(([x,y]) => [(x-origin[0])*sx, (y-origin[1])*111320])));
const group = (mesh, color) => mesh.groups.filter(g => g.color === color);
const triangles = groups => groups.flatMap(g => Array.from({length:g.positions.length/9}, (_,i) => [0,3,6].map(j => g.positions.slice(i*9+j,i*9+j+2))));
const ringArea = r => Math.abs(r.reduce((sum,p,i) => { const q=r[(i+1)%r.length]; return sum+p[0]*q[1]-q[0]*p[1]; },0))/2;
const area = polys => polys.reduce((sum,p) => sum+ringArea(p[0])-p.slice(1).reduce((s,r) => s+ringArea(r),0),0);
const meshArea = groups => triangles(groups).reduce((sum,t) => sum+ringArea(t),0);
const roof = (kind, geometry, tier, visibleGeometry) => ({kind,geometry,tier,visibleGeometry});
function within(groups, allowed) {
  // Boolean overlays with independently projected coincident edges need a common
  // micrometre grid. The tolerance is far below both paint widths and Float32 precision.
  const snap=p=>p.map(x=>Math.round(x*1e6)/1e6);
  const snapped=allowed.map(p=>p.map(r=>r.map(snap)));
  for (const t of triangles(groups)) {
    const ring=t.map(snap);
    const outside = area(clipping.difference([[...ring,ring[0]]],snapped));
    const perimeter=t.reduce((sum,p,i)=>sum+Math.hypot(p[0]-t[(i+1)%3][0],p[1]-t[(i+1)%3][1]),0);
    assert.ok(outside < 2e-5+perimeter*2e-6, `triangle leaks ${outside} square metres`);
  }
}
function healthy(mesh, cap=config.render.maxTriangles, expectedOrigin=origin) {
  assert.deepEqual(mesh.origin,expectedOrigin);
  let count=0;
  for (const g of mesh.groups) {
    assert.equal(typeof g.name,'string');
    assert.ok(Object.values(config.palette).includes(g.color));
    assert.ok(Array.isArray(g.positions));
    assert.equal(g.positions.length%9,0);
    assert.ok(g.positions.length>0);
    assert.ok(g.positions.every(p => Number.isFinite(p) && Number.isFinite(Math.fround(p))));
    for (const t of triangles([g])) assert.ok(ringArea(t.map(p => p.map(Math.fround)))>1e-8,'Float32 triangle collapsed');
    count+=g.positions.length/9;
  }
  assert.ok(count<=cap,`${count} exceeds ${cap}`);
}
function freeze(value) { if(value && typeof value==='object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }

test('terminal ribs are narrow organic waves at the absolute rendered top', () => {
  const geometry=geo([rect(-90,-60,180,120)]);
  const mesh=createRoofDecorationMesh(roof('terminal',geometry,2),origin,37,config);
  healthy(mesh);
  const ribs=group(mesh,config.palette.metalRib);
  assert.ok(meshArea(ribs)>100);
  assert.ok(meshArea(ribs)<180*120*.09,'restrained corrugation, no base or checkerboard');
  within(ribs,local(geometry));
  for (const g of ribs) for(let i=2;i<g.positions.length;i+=3) assert.equal(g.positions[i],37+config.render.surfaceOffset);
  // A centreline changes direction across x; straight rows would have only width-sized drift.
  const nearZero=triangles(ribs).flat().filter(p => Math.abs(p[1])<6);
  assert.ok(Math.max(...nearZero.map(p=>p[1]))-Math.min(...nearZero.map(p=>p[1]))>config.terminal.ribWidth*5);
});

test('all terminal patterns clip whole triangles to visible MultiPolygon silhouettes and holes', () => {
  const geometry=geo([rect(-100,-70,200,140)]);
  const a=geo([rect(-85,-55,65,110),rect(-65,-12,15,24)]);
  const b=geo([rect(15,-50,70,100)]);
  const visible={type:'MultiPolygon',coordinates:[a.coordinates,b.coordinates]};
  const sources={[config.terminal.leftWingSpaceId]:geometry};
  const mesh=createRoofDecorationMesh(roof('terminal',geometry,1,visible),origin,12,config,sources);
  assert.ok(group(mesh,config.palette.glass).length);
  assert.ok(group(mesh,config.palette.glassGrid).length);
  healthy(mesh);
  within(mesh.groups,local(visible));
});

test('tier one wing glass uses long-axis insets and excludes metal ribs', () => {
  const angle=.57,c=Math.cos(angle),s=Math.sin(angle);
  const wing=geo([rect(-100,-20,200,40).map(([x,y])=>[x*c-y*s,x*s+y*c])]);
  const sources={[config.terminal.leftWingSpaceId]:wing};
  const mesh=createRoofDecorationMesh(roof('terminal',wing,1),origin,10,config,sources);
  const glass=group(mesh,config.palette.glass);
  assert.ok(Math.abs(meshArea(glass)-8000*.82*.32)<.1);
  within(glass,local(wing));
  const expected=geo([rect(-82,-6.4,164,12.8).map(([x,y])=>[x*c-y*s,x*s+y*c])]);
  within(glass,local(expected));
  for(const t of triangles(group(mesh,config.palette.metalRib))) assert.ok(area(clipping.intersection([[...t,t[0]]],local(expected)))<2e-5);
  assert.ok(meshArea(group(mesh,config.palette.glassGrid))<meshArea(glass)*.05);
});

test('tier one sources are optional and use configured IDs, including the right wing', () => {
  const geometry=geo([rect(-140,-30,280,60)]);
  const custom={...config,terminal:{...config.terminal,leftWingSpaceId:'custom-left',rightWingSpaceId:'custom-right'}};
  const sources={'custom-left':geo([rect(-130,-20,100,40)]),'custom-right':geo([rect(30,-20,100,40)])};
  assert.equal(group(createRoofDecorationMesh(roof('terminal',geometry,1),origin,10,custom),config.palette.glass).length,0);
  const mesh=createRoofDecorationMesh(roof('terminal',geometry,1),origin,10,custom,sources);
  assert.ok(Math.abs(meshArea(group(mesh,config.palette.glass))-2*4000*.82*.32)<.1);
});

test('tier four stem band follows configured map rotation and exact aligned extents', () => {
  const angle=shared.axisAngle*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const unalign=([x,y])=>[x*c+y*s,-x*s+y*c];
  const geometry=geo([rect(-50,250,100,400).map(unalign)]);
  const mesh=createRoofDecorationMesh(roof('terminal',geometry,4),origin,25,shared);
  const glass=group(mesh,shared.palette.glass);
  assert.ok(Math.abs(meshArea(glass)-20*(609-275))<.1);
  const expected=geo([rect(-5,275,20,334).map(unalign)]);
  within(glass,local(expected));
  healthy(mesh);
});

test('tier five leaf preserves its silhouette and bounds-centred width and length inset', () => {
  const leaf=geo([[[-50,0],[-30,-70],[0,-100],[30,-70],[50,0],[30,70],[0,100],[-30,70],[-50,0]]]);
  const sources={[config.terminal.centralGlassSpaceId]:leaf};
  const mesh=createRoofDecorationMesh(roof('terminal',leaf,5),origin,40,config,sources);
  const glass=group(mesh,config.palette.glass);
  const expected=geo([leaf.coordinates[0].map(([x,y])=>[(x-origin[0])*sx*.78,(y-origin[1])*111320*.80])]);
  assert.ok(Math.abs(meshArea(glass)-area(local(leaf))*.78*.80)<.1);
  within(glass,local(expected));
  within(group(mesh,config.palette.glassGrid),local(expected));
});

test('other terminal tiers contain no blue masks', () => {
  const geometry=geo([rect(-40,-30,80,60)]);
  const sources=Object.fromEntries(['leftWingSpaceId','rightWingSpaceId','centralGlassSpaceId'].map(key=>[config.terminal[key],geometry]));
  for(const tier of [undefined,2,3]) assert.equal(group(createRoofDecorationMesh(roof('terminal',geometry,tier),origin,12,config,sources),config.palette.glass).length,0);
});

test('garage stripes follow the quadratic wave, keep configured width and omit a grass base', () => {
  const geometry=geo([rect(-120,-70,240,140)]);
  const mesh=createRoofDecorationMesh(roof('garage',geometry),origin,18,config);
  healthy(mesh);
  assert.equal(group(mesh,config.palette.garageGrass).length,0);
  const waves=mesh.groups.filter(g=>/wave/i.test(g.name));
  assert.ok(waves.length);
  for(const t of triangles(waves)) for(const [x,y] of t) {
    const shifted=y-config.garage.waveCurvature*x*x;
    const residue=Math.abs(shifted-Math.round(shifted/config.garage.waveSpacing)*config.garage.waveSpacing);
    assert.ok(residue<=config.garage.waveWidth/2+.015);
  }
  const rims=mesh.groups.filter(g=>/rim/i.test(g.name));
  assert.ok(meshArea(rims)>240);
  assert.ok(meshArea(rims)<2*(240+140)*config.garage.rimWidth*1.1);
  within(mesh.groups,local(geometry));
});
test('central garage canopy is white with inset blue glazing and remains clipped around open stairwells',()=>{
 const geometry=geo([rect(-100,-190,200,140),rect(-55,-150,25,45),rect(25,-150,25,45)]);
 const cfg={...config,garage:{...config.garage,canopyBounds:[-28,-176,26,-78],canopyRadius:10.5,canopyGlassScale:[.60,.83]}};
 const mesh=createRoofDecorationMesh(roof('garage',geometry),origin,30.08,cfg);
 const canopy=mesh.groups.filter(g=>g.name==='Garage canopy'),glass=mesh.groups.filter(g=>g.name==='Garage canopy glass');
 assert.ok(canopy.length&&glass.length);healthy(mesh);within(canopy,local(geometry));within(glass,local(geometry));
 assert.ok(meshArea(glass)<meshArea(canopy));
});

test('garage recesses only elongated regular slots and leaves stairs and irregular holes open', () => {
  const slot=rect(-45,-12,75,5);
  const stairs=rect(-8,20,12,12);
  const irregular=[[35,10],[85,10],[85,12],[40,12],[40,25],[35,25],[35,10]];
  const geometry=geo([rect(-100,-60,200,120),slot,stairs,irregular]);
  const mesh=createRoofDecorationMesh(roof('garage',geometry),origin,30,config);
  const slots=group(mesh,config.palette.garageSlot);
  assert.ok(meshArea(slots)>250 && meshArea(slots)<375,'slots have a visible inset');
  within(slots,[ [slot] ]);
  for(const g of slots) for(let i=2;i<g.positions.length;i+=3) assert.equal(g.positions[i],30-config.garage.slotRecess);
  const accents=group(mesh,config.palette.garageSlotGrid);
  assert.ok(accents.length);
  within(accents,[[slot]]);
  within(mesh.groups.filter(g=>g.color!==config.palette.garageSlot&&g.color!==config.palette.garageSlotGrid),local(geometry));
  healthy(mesh);
});

test('garage slots respect visible occlusion and rotated long-axis classification', () => {
  const rotate=([x,y])=>[x*.6-y*.8,x*.8+y*.6];
  const slot=rect(-40,-3,80,6).map(rotate);
  const geometry=geo([rect(-90,-90,180,180),slot,rect(-60,30,8,8)]);
  // Clip first so the slot touching the occlusion boundary becomes an exterior notch;
  // a hole protruding beyond an exterior ring would be invalid GeoJSON.
  const cut=clipping.intersection([[rect(-90,-90,180,180),slot,rect(-60,30,8,8),rect(20,40,10,10)]],[[rect(0,-90,90,180)]]);
  const visible={type:'MultiPolygon',coordinates:cut.map(p=>geo(p).coordinates)};
  const mesh=createRoofDecorationMesh(roof('garage',geometry,undefined,visible),origin,20,config);
  const slots=group(mesh,config.palette.garageSlot);
  assert.ok(meshArea(slots)>100);
  within(slots,clipping.intersection([[slot]],[[rect(0,-90,90,180)]]));
  within(mesh.groups.filter(g=>g.color!==config.palette.garageSlot&&g.color!==config.palette.garageSlotGrid),local(visible));
});

test('garage rims include the inner crescent boundary while keeping wide holes open', () => {
  const ring=(radius,reverse=false)=>Array.from({length:65},(_,i)=>{const a=(reverse?-1:1)*i*Math.PI/32;return [radius*Math.cos(a),radius*Math.sin(a)];});
  const geometry=geo([ring(65),ring(35,true)]);
  const mesh=createRoofDecorationMesh(roof('garage',geometry),origin,15,config);
  const rims=mesh.groups.filter(g=>/rim/i.test(g.name));
  assert.ok(triangles(rims).flat().some(p=>Math.hypot(...p)<36));
  assert.ok(triangles(rims).flat().some(p=>Math.hypot(...p)>64));
  assert.equal(group(mesh,config.palette.garageSlot).length,0);
  within(mesh.groups,local(geometry));
});

test('bounded triangle budgets retain finite, Float32 nondegenerate geometry deterministically', () => {
  const geometry=geo([rect(-300,-200,600,400),rect(-50,-2,100,4)]);
  for(const kind of ['terminal','garage']) for(const maxTriangles of [0,1,24,120]) {
    const limited={...config,render:{...config.render,maxTriangles}};
    const surface=roof(kind,geometry,1);
    const sources={[config.terminal.leftWingSpaceId]:geometry};
    const mesh=createRoofDecorationMesh(surface,origin,17,limited,sources);
    healthy(mesh,maxTriangles);
    if(maxTriangles) assert.ok(mesh.groups.length,'small budgets still produce usable decoration');
    assert.deepEqual(mesh,createRoofDecorationMesh(surface,origin,17,limited,sources));
  }
});

test('preserves deeply frozen source/native geometry and handles empty visibility', () => {
  const geometry=geo([rect(-60,-40,120,80),rect(-30,-2,50,4)]);
  const surface=freeze(roof('garage',geometry));
  const sources=freeze({[config.terminal.leftWingSpaceId]:geometry});
  const before=JSON.stringify({surface,sources,config});
  createRoofDecorationMesh(surface,origin,10,freeze(config),sources);
  assert.equal(JSON.stringify({surface,sources,config}),before);
  assert.deepEqual(createRoofDecorationMesh({...surface,visibleGeometry:{type:'MultiPolygon',coordinates:[]}},origin,10,config),{origin,groups:[]});
});

test('custom palette and pattern dimensions drive the mesh', () => {
  const geometry=geo([rect(-100,-60,200,120)]);
  const custom={...config,palette:{...config.palette,metalRib:'#112233'},terminal:{...config.terminal,ribSpacing:10,ribWidth:.3}};
  const mesh=createRoofDecorationMesh(roof('terminal',geometry,3),origin,10,custom);
  assert.ok(mesh.groups.length);
  assert.ok(mesh.groups.every(g=>g.color==='#112233'));
  assert.ok(meshArea(mesh.groups)>500 && meshArea(mesh.groups)<850);
});

test('disabled decoration and empty footprints are empty; invalid placement is rejected', () => {
  const surface=roof('terminal',geo([rect(-10,-10,20,20)]),1);
  assert.deepEqual(createRoofDecorationMesh(surface,origin,10,{...config,enabled:false}),{origin,groups:[]});
  assert.deepEqual(createRoofDecorationMesh(roof('garage',{type:'Polygon',coordinates:[]}),origin,10,config),{origin,groups:[]});
  assert.throws(()=>createRoofDecorationMesh(surface,origin,NaN,config),/finite/i);
});

test('the actual six roof surfaces fit the whole-map cap with usable Float32 normals', async () => {
  // Read the parent selector fixture without changing it; this guards real kiosk cost
  // and precision in addition to the independent synthetic geometry tests above.
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/roof-appearance.json',import.meta.url)));
  const {prepareRoofAppearance}=await import('../src/map/roofAppearance.mjs');
  const before=JSON.stringify(fixture);
  const plan=prepareRoofAppearance(fixture.mvf,shared,fixture.roads);
  assert.equal(plan.surfaces.length,6);
  let total=0;
  for(const surface of plan.surfaces) {
    const mesh=createRoofDecorationMesh(surface,plan.origin,surface.fallbackTop??10,shared,plan.sources);
    healthy(mesh,shared.render.maxTriangles,plan.origin);
    assert.ok(mesh.groups.length,`${surface.kind} tier ${surface.tier} has decoration`);
    for(const g of mesh.groups) {
      total+=g.positions.length/9;
      const geometry=new BufferGeometry();
      geometry.setAttribute('position',new Float32BufferAttribute(g.positions,3));
      geometry.computeVertexNormals();
      const normals=geometry.getAttribute('normal').array;
      assert.ok(normals.every(Number.isFinite));
      for(let i=0;i<normals.length;i+=3) assert.ok(normals[i+2]>.99,'normal points up after Float32 conversion');
      geometry.dispose();
    }
  }
  assert.ok(total>1000);
  assert.ok(total<shared.render.maxTriangles*.8,`${total} leaves at least 20% whole-map headroom`);
  assert.equal(JSON.stringify(fixture),before);
});
