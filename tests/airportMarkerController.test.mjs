import test from 'node:test';
import assert from 'node:assert/strict';
import {createAirportMarkerController} from '../src/map/airportMarkerController.js';

const point=(id,name,x=0,floorId='f')=>({id,name,coordinate:{latitude:10,longitude:107+x/109628,floorId}});

// Only browser/SDK boundaries are simulated; selection, clustering and reconciliation run unchanged.
function harness(t,objects,{zoom=17}={}){
 const listeners={},frames=new Map(),elements=new Map(),dialogs=[],selected=[],removed=[];
 let sequence=0,frameSequence=0,adds=0,nameReads=0,labelClears=0;
 const saved=new Map(['document','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 t.after(()=>{for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
 const element=tag=>({tag,children:[],append(child){this.children.push(child);},showModal(){this.open=true;},close(){this.open=false;},remove(){this.removed=true;}});
 globalThis.document={addEventListener:(type,fn)=>listeners[type]=fn,getElementById:id=>dialogs.find(d=>d.id===id&&!d.removed),querySelectorAll:()=>[...elements.values()],createElement:element,body:{append:d=>dialogs.push(d)}};
 globalThis.getComputedStyle=()=>({display:'flex',visibility:'visible',opacity:'1'});
 globalThis.requestAnimationFrame=fn=>{const id=++frameSequence;frames.set(id,fn);return id;};
 globalThis.cancelAnimationFrame=id=>frames.delete(id);
 const markerIdToObject=new Map();
 const mapView={currentFloor:{id:'f'},Camera:{zoomLevel:zoom},on:(type,fn)=>listeners[type]=fn,setFloor:async id=>{mapView.currentFloor={id};},Labels:{removeAll:()=>labelClears++},createCoordinate:(latitude,longitude)=>({latitude,longitude}),Markers:{
  add(coordinate,html,options){
   const marker={id:`marker-${++sequence}`,coordinate,html,options};adds++;
   const rect={x:0,y:0,width:24,height:24};
   const el={html,dataset:{airportKey:html.match(/data-airport-key="([^"]+)/)[1]},parentElement:null,querySelector:()=>({getBoundingClientRect:()=>rect}),getBoundingClientRect:()=>({...rect,width:200,height:44})};
   el.closest=()=>el;elements.set(marker.id,el);return marker;
  },
  remove(marker){removed.push(marker.id);elements.delete(marker.id);}
 }};
 const controller=createAirportMarkerController({mapView,objects,getLocations:()=>({}),getName:o=>{nameReads++;return o.name;},getImage:()=>'/wc.png',getGate:()=>null,overviewFloorId:'overview',markerIdToObject,onSelect:(obj,marker)=>selected.push({obj,marker})});
 const flush=()=>{const pending=[...frames.values()];frames.clear();for(const fn of pending)fn();};
 const camera=value=>{mapView.Camera.zoomLevel=value;listeners['camera-change']();};
 const click=(index=0)=>listeners.click({target:[...elements.values()][index],clientX:90,clientY:34,preventDefault(){},stopPropagation(){}});
 return {controller,mapView,markerIdToObject,frames,dialogs,selected,removed,camera,flush,click,markups:()=>[...elements.values()].map(e=>e.html),stats:()=>({adds,nameReads,labelClears})};
}

test('clicking a representative selects its real central POI without opening any chooser',t=>{
 const objects=Array.from({length:5},(_,i)=>point(`security-${i}`,'Security',i*2));
 const h=harness(t,objects);h.controller.refresh();h.click();
 assert.equal(h.controller.count(),1);
 assert.equal(h.selected.length,1);
 assert.equal(h.selected[0].obj,objects[2]);
 assert.equal(h.selected[0].marker,null);
 assert.equal(h.dialogs.length,0);
 assert.equal([...h.markerIdToObject.values()][0],objects[2]);
});
test('names appear from zoom 16.5, and icons alone appear below 16.5',t=>{
 const h=harness(t,[point('a','Kiểm soát an ninh 1'),point('b','Kiểm soát an ninh 2',2)],{zoom:16.49});
 h.controller.refresh();
 for(const [zoom,expectLabel] of [[16.49,false],[16.5,true],[17,true],[18,true],[21.5,true],[16.49,false]]){
  if(zoom!==h.mapView.Camera.zoomLevel){h.camera(zoom);h.flush();}
  const markups=h.markups();
  assert.ok(markups.length>=1);
  for(const html of markups){
   assert.equal(html.includes('airport-poi-label'),expectLabel,`unexpected label at ${zoom}: ${html}`);
   assert.ok(html.includes('<img')&&html.includes('aria-label='),`missing accessible icon at ${zoom}`);
   if(!expectLabel) assert.ok(!html.includes('title='),'hidden label must not pop up on hover');
  }
 }
});

test('camera changes coalesce into one frame and reuse floor entries',t=>{
 const h=harness(t,[point('a','Shop')]);h.controller.refresh();const reads=h.stats().nameReads;
 h.camera(18);h.camera(19);h.camera(20);
 assert.equal(h.frames.size,1);assert.equal(h.stats().adds,1);
 h.flush();assert.equal(h.stats().nameReads,reads);assert.equal(h.stats().adds,1);assert.equal(h.removed.length,0);
});

test('saturated zoom does not schedule work or replace marker identities',t=>{
 const h=harness(t,[point('a','Shop')],{zoom:21.5});h.controller.refresh();
 const before=h.stats();h.camera(22);h.camera(24);h.camera(30);
 assert.equal(h.frames.size,0);assert.deepEqual(h.stats(),before);assert.equal(h.removed.length,0);
});

test('click and same-bucket zoom updates never open a member chooser',t=>{
 const h=harness(t,[point('a','WC'),point('b','WC',2)]);h.controller.refresh();h.click();
 assert.equal(h.selected.length,1);assert.equal(h.dialogs.length,0);
 h.camera(17.5);h.flush();assert.equal(h.dialogs.length,0);assert.equal(h.stats().adds,1);
});

test('explicit refresh replaces only changed presentation signatures and preserves other marker IDs',t=>{
 const objects=[point('a','Shop'),point('b','WC',1000)];const h=harness(t,objects);h.controller.refresh();
 const ids=[...h.markerIdToObject.keys()];objects[0].name='Translated shop';h.controller.refresh();
 assert.equal(h.stats().adds,3);assert.deepEqual(h.removed,[ids[0]]);assert.equal(h.markerIdToObject.get(ids[1]),objects[1]);
 h.controller.refresh();assert.equal(h.stats().adds,3);assert.equal(h.removed.length,1);
});

test('split groups reconcile without replacing unrelated facilities or opening a chooser',t=>{
 const h=harness(t,[point('a','WC'),point('b','WC',10),point('shop','Shop',1000)]);h.controller.refresh();
 const shopId=[...h.markerIdToObject].find(([,obj])=>obj.id==='shop')[0];h.click();
 h.camera(21.5);h.flush();assert.equal(h.controller.count(),3);assert.ok(h.markerIdToObject.has(shopId));assert.equal(h.dialogs.length,0);
});

test('clear cancels pending work and removes ownership without a chooser',t=>{
 const h=harness(t,[point('a','WC'),point('b','WC',2)]);h.controller.refresh();h.click();h.camera(18);
 h.controller.clear();h.flush();assert.equal(h.frames.size,0);assert.equal(h.controller.count(),0);assert.equal(h.markerIdToObject.size,0);assert.equal(h.dialogs.length,0);
});

test('colocated individual POIs are independently selectable without any picker',t=>{
 const objects=[point('a','Security A'),point('b','Security B')];
 const h=harness(t,objects,{zoom:21.5});h.controller.refresh();
 assert.equal(h.controller.count(),2);
 h.click(0);h.click(1);
 assert.deepEqual(h.selected.map(s=>s.obj.id),['a','b']);
 assert.equal(h.dialogs.length,0);
});

test('pending camera work uses the current native floor and Overview stays empty',t=>{
 const h=harness(t,[point('a','Shop'),point('b','Shop',0,'g')]);h.controller.refresh();h.camera(18);
 h.mapView.currentFloor={id:'g'};h.flush();assert.equal(h.controller.count(),1);assert.deepEqual([...h.markerIdToObject.values()].map(o=>o.id),['b']);
 h.mapView.currentFloor={id:'overview'};h.camera(19);h.flush();assert.equal(h.controller.count(),0);assert.equal(h.markerIdToObject.size,0);
});
