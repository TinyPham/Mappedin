import test from 'node:test';import assert from 'node:assert/strict';
import {clusterAviationMarkers} from '../src/map/aviationMarkerClustering.js';
const entry=(id,name,x,{floorId='3',checkin=null,vertical=false,category=101}={})=>({obj:{id},name,coordinate:{latitude:10,longitude:107+x/109628,floorId},location:{subCategoryId:category},checkin,policy:{required:!vertical,iconOnly:vertical},icon:'/wc.png'});
const island=entry('island-A','Đảo làm thủ tục A',14,{checkin:{island:'A',counterNo:null},category:88});
const counters=Array.from({length:14},(_,i)=>entry(`A${i+1}`,`Quầy thủ tục ${i+1} - Đảo A`,i*2,{checkin:{island:'A',counterNo:i+1},category:88}));
test('low zoom shows exactly one named real counter per island, with access to every counter',()=>{
 const result=clusterAviationMarkers([island,...counters],{zoom:17,floorId:'3'});
 assert.equal(result.length,1);assert.ok(counters.some(e=>e.obj.id===result[0].obj.id));
 assert.equal(result[0].name,counters.find(e=>e.obj.id===result[0].obj.id).name);
 assert.equal(result[0].members.filter(e=>Number.isInteger(e.checkin?.counterNo)).length,14);
});
test('zoom reveals progressively more check-in groups and finally every individual counter',()=>{
 const counts=[17,18,18.5,19,19.5,20,20.5,21,21.5].map(zoom=>clusterAviationMarkers([island,...counters],{zoom,floorId:'3'}).length);
 assert.deepEqual(counts,[1,2,3,4,5,8,12,14,14]);
 for(const zoom of [17,18,18.5,19,19.5,20,20.5,21,21.5]) {
  const visible=clusterAviationMarkers([island,...counters],{zoom,floorId:'3'});
  assert.equal(visible.reduce((total,e)=>total+e.members.filter(m=>Number.isInteger(m.checkin?.counterNo)).length,0),14);
  assert.ok(visible.every(e=>e.name===counters.find(c=>c.obj.id===e.obj.id)?.name));
 }
 const close=clusterAviationMarkers([island,...counters],{zoom:22,floorId:'3'});assert.equal(close[0].members.length,1);assert.ok(close.some(e=>e.name===counters[0].name));
});
test('a full 28-counter island reveals 1, 2, 3 to 5, then all named counters without duplication',()=>{
 const points=Array.from({length:28},(_,i)=>entry(`B${i+1}`,`Quầy ${i+1} - Đảo B`,i*2,{checkin:{island:'B',counterNo:i+1},category:88}));
 const counts=[17,18,18.5,19,19.5,20,20.5,21,21.5].map(zoom=>clusterAviationMarkers(points,{zoom,floorId:'3'}).length);
 assert.deepEqual(counts,[1,2,3,4,5,8,12,18,28]);
 assert.deepEqual(new Set(clusterAviationMarkers(points,{zoom:21.5,floorId:'3'}).map(p=>p.obj.id)),new Set(points.map(p=>p.obj.id)));
});
test('nearby security desks with different names but the same category icon reveal progressively',()=>{
 const security=Array.from({length:12},(_,i)=>entry(`s${i}`,`Kiểm soát an ninh ${i+1}`,i*1.5,{category:125}));
 const unrelated=entry('immigration','Kiểm tra xuất cảnh',8,{category:126});
 const distant=entry('far','Kiểm soát an ninh khác',350,{category:125});
 const points=[...security,unrelated,distant];
 const counts=[17,18,18.5,19.5,21.5].map(zoom=>clusterAviationMarkers(points,{zoom,floorId:'3'}).length);
 assert.deepEqual(counts,[3,4,5,7,14]);
 for(const zoom of [17,19.5,21.5]) {
  const result=clusterAviationMarkers(points,{zoom,floorId:'3'});
  assert.equal(result.flatMap(e=>e.members).length,points.length);
  assert.ok(result.every(e=>e.name===points.find(p=>p.obj.id===e.obj.id)?.name));
  assert.ok(result.some(e=>e.obj.id==='immigration'));
 }
});
test('a security checkpoint spread across a concourse starts with one label then reveals its real entrances',()=>{
 const points=[entry('security-west','Kiểm soát an ninh',0,{category:125}),
  entry('security-middle','Kiểm soát an ninh',90,{category:125}),
  entry('security-east','Kiểm soát an ninh',180,{category:125}),
  entry('other-concourse','Kiểm soát an ninh',650,{category:125})];
 const counts=[17,18,18.5,21.5].map(zoom=>clusterAviationMarkers(points,{zoom,floorId:'3'}).length);
 assert.deepEqual(counts,[2,3,4,4],`should not show overlapping checkpoint labels from the same concourse: ${counts}`);
 for(const zoom of [17,18,18.5,21.5]){
  const visible=clusterAviationMarkers(points,{zoom,floorId:'3'});
  assert.deepEqual(new Set(visible.flatMap(e=>e.members.map(m=>m.obj.id))),new Set(points.map(p=>p.obj.id)));
 }
});
test('same-name nearby facilities group but distinct names, distant places and floors do not',()=>{
 const result=clusterAviationMarkers([entry('w1','WC',0),entry('w2','WC',4),entry('w3','WC',500),entry('s','Shop',4,{category:102}),entry('other-floor','WC',0,{floorId:'1'})],{zoom:17,floorId:'3'});
 assert.equal(result.length,3);assert.equal(result.find(e=>e.members.length===2).name,'WC');assert.ok(result.every(e=>e.coordinate.floorId==='3'));
 assert.equal(clusterAviationMarkers([entry('w1','WC',0),entry('w2','WC',4)],{zoom:22,floorId:'3'}).length,2);
});
test('same-name points with different catalogue icons also share a nearby representative',()=>{
 const a=entry('a','Kiểm tra an ninh',0,{category:125}),b=entry('b','Kiểm tra an ninh',3,{category:126}),
  far=entry('far','Kiểm tra an ninh',350,{category:127}),other=entry('other','Hải quan',3,{category:128});
 b.icon='/security-special.png';far.icon='/other.png';
 const low=clusterAviationMarkers([a,b,far,other],{zoom:17,floorId:'3'});
 assert.equal(low.length,3);assert.deepEqual(new Set(low.find(e=>e.members.length===2).members.map(e=>e.obj.id)),new Set(['a','b']));
 assert.equal(clusterAviationMarkers([a,b,far,other],{zoom:21.5,floorId:'3'}).length,4);
});
test('nearby islands never merge, and vertical connections stay ordinary individual icons',()=>{
 const result=clusterAviationMarkers([island,entry('B','Đảo B',16,{checkin:{island:'B',counterNo:null}}),entry('lift1','Thang máy',0,{vertical:true}),entry('lift2','Thang máy',2,{vertical:true})],{zoom:17,floorId:'3'});
 assert.equal(result.length,4);assert.equal(result.filter(e=>e.policy.iconOnly).length,2);
});
test('Overview has no grouped or individual POIs',()=>assert.equal(clusterAviationMarkers([island,...counters],{zoom:17,floorId:'overview',overviewFloorId:'overview'}).length,0));
test('grouping is deterministic and does not alter canonical endpoint identities or coordinates',()=>{
 const original=structuredClone(counters),a=clusterAviationMarkers(counters,{zoom:19,floorId:'3'}),b=clusterAviationMarkers([...counters].reverse(),{zoom:19,floorId:'3'});
 assert.deepEqual(a.map(e=>e.key),b.map(e=>e.key));assert.deepEqual(counters,original);
});

test('individual-counter zoom exposes distinct identities even at coincident anchors',()=>{
 const points=[entry('a','Counter 1',0,{checkin:{island:'A',counterNo:1}}),entry('b','Counter 2',0,{checkin:{island:'A',counterNo:2}})];
 for(const zoom of [21.5,22,25]){
  const result=clusterAviationMarkers(points,{zoom,floorId:'3'});
  assert.equal(result.length,2);assert.ok(result.every(e=>e.members.length===1));
  assert.deepEqual(result.map(e=>e.name),['Counter 1','Counter 2']);
 }
});

test('250-point complete-link grouping bounds geographic calculations and preserves diameter',t=>{
 const points=Array.from({length:250},(_,i)=>entry(String(i).padStart(3,'0'),'WC',i*2));
 const original=Math.hypot;let calculations=0;
 Math.hypot=(...args)=>{calculations++;return original(...args);};
 t.after(()=>{Math.hypot=original;});
 const result=clusterAviationMarkers(points,{zoom:18.5,floorId:'3'});
 assert.ok(calculations<=250*249,`geographic calculations: ${calculations}`);
 assert.equal(result.reduce((n,e)=>n+e.members.length,0),250);
 const radius=260;
 assert.ok(result.every(e=>(Math.max(...e.members.map(m=>Number(m.obj.id)))-Math.min(...e.members.map(m=>Number(m.obj.id))))*2<=radius+0.1));
 assert.deepEqual(result.map(e=>e.key),clusterAviationMarkers([...points].reverse(),{zoom:18.5,floorId:'3'}).map(e=>e.key));
});
