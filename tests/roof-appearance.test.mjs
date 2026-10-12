import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareRoofAppearance,installRoofAppearance} from '../src/map/roofAppearance.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/roof-appearance.json',import.meta.url)));
const config=JSON.parse(fs.readFileSync(new URL('../database/roof-appearance.json',import.meta.url)));
test('selects five terminal tiers and only the approved garage top without mutating any source geometry',()=>{
 const mvf=structuredClone(fixture.mvf),before=structuredClone(mvf),plan=prepareRoofAppearance(mvf,config,fixture.roads);
 assert.deepEqual(mvf,before);
 assert.equal(plan.surfaces.filter(s=>s.kind==='terminal').length,5);
 assert.equal(plan.surfaces.filter(s=>s.kind==='garage').length,1);
 assert.ok(plan.surfaces.every(s=>s.floorId===fixture.roads.overviewFloorId));
 for(const id of [...fixture.roads.centerRoadDecks.map(d=>d.id),...Object.keys(fixture.roads.paintSources)])assert.ok(!plan.surfaces.some(s=>s.id===id));
 assert.equal(plan.surfaces.find(s=>s.kind==='garage').geometry.coordinates.length,25,'garage openings must remain intact');
});
test('resolves republished overview IDs using stable source floors, not saved generated IDs',()=>{
 const mvf=structuredClone(fixture.mvf),old=fixture.roads.overviewFloorId,newFloor='f_new_publish';
 const idMap=new Map(mvf.space[old].features.map((f,i)=>[f.properties.id,'s_new_'+i]));
 mvf.space[newFloor]=mvf.space[old];delete mvf.space[old];
 for(const f of mvf.space[newFloor].features)f.properties.id=idMap.get(f.properties.id);
 for(const p of Object.values(mvf['styles.json']))if(p.polygons)p.polygons=p.polygons.map(id=>idMap.get(id)||id);
 const roads={...fixture.roads,overviewFloorId:newFloor,parkingDeckIds:fixture.roads.parkingDeckIds.map(id=>idMap.get(id))};
 const plan=prepareRoofAppearance(mvf,config,roads);
 assert.equal(plan.surfaces.length,6);assert.ok(plan.surfaces.every(s=>s.floorId===newFloor&&s.id.startsWith('s_new_')));
});
test('missing or disabled DB appearance leaves the approved map untouched',()=>{
 const before=structuredClone(fixture.mvf);
 for(const cfg of [null,{...config,enabled:false}])assert.equal(prepareRoofAppearance(fixture.mvf,cfg,fixture.roads).surfaces.length,0);
 assert.deepEqual(fixture.mvf,before);
});
test('a deleted source roof floor skips that optional tier instead of aborting the kiosk map',()=>{
 const mvf=structuredClone(fixture.mvf);delete mvf.space[config.terminal.floorIds[0]];
 const plan=prepareRoofAppearance(mvf,config,fixture.roads);
 assert.equal(plan.surfaces.length,5);assert.ok(!plan.surfaces.some(s=>s.tier===1));
});
test('floor changes reuse cached meshes and disabling the DB config restores roof colors and releases models',()=>{
 const plan=prepareRoofAppearance(fixture.mvf,config,fixture.roads),spaces=new Map(plan.surfaces.map(s=>[s.id,{id:s.id}]));
 const states=new Map(plan.surfaces.map((s,i)=>[s.id,{color:'#EEEEEE',hoverColor:'#EEEEEE',altitude:20+i*10,height:2}]));
 const listeners=new Map(),active=new Set();let added=0,removed=0,builds=0,current=config;
 const view={currentFloor:{id:plan.overviewFloorId},on:(e,f)=>listeners.set(e,f),off:e=>listeners.delete(e),getState:s=>states.get(s.id),updateState:(s,p)=>states.set(s.id,{...states.get(s.id),...p}),createCoordinate:(lat,lng,floor)=>({lat,lng,floor}),Models:{add:(coordinate,url,options)=>{assert.equal(options.interactive,false);const model={id:++added};active.add(model);return model;},remove:m=>{assert.ok(active.delete(m),'model leaked or removed twice');removed++;}}};
 const data={getById:(_t,id)=>spaces.get(id)};
 const meshFactory=(_surface,origin,top)=>{builds++;return{origin,groups:[{name:'test',color:'#123456',positions:[0,0,top,1,0,top,0,1,top]}]};};
 const controller=installRoofAppearance(view,data,plan,()=>current,{meshFactory});
 assert.equal(active.size,6);assert.equal(builds,6);
 controller.refresh();assert.equal(builds,6);assert.equal(added,6);
 view.currentFloor={id:'m_1523f7dcde647c40'};listeners.get('floor-change')();assert.equal(active.size,0);
 view.currentFloor={id:plan.overviewFloorId};listeners.get('floor-change')();assert.equal(active.size,6);assert.equal(builds,6,'mesh rebuilt when cache could be reused');
 for(let i=0;i<20;i++){
  current={...config,palette:{...config.palette,terminalMetal:'#'+(0xdddddd+i).toString(16)}};
  controller.refresh();assert.equal(active.size,6);assert.equal(controller.metrics.cacheEntries,6,'obsolete palette blobs retained');
 }
 current=null;controller.refresh();assert.equal(active.size,0);assert.equal(controller.metrics.cacheEntries,0);
 for(const state of states.values()){assert.equal(state.color,'#EEEEEE');assert.equal(state.topColor,'#EEEEEE');}
 controller.dispose();controller.dispose();assert.equal(removed,added);assert.equal(listeners.size,0);
});
