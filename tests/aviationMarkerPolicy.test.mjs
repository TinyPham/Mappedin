import assert from 'node:assert/strict';
import test from 'node:test';
import {getAviationMarkerPolicy, markerCoordinatesForFloor, markerOwnershipKey, escapeMarkerHtml} from '../src/map/aviationMarkerPolicy.js';

test('all journey categories keep their icon at low zoom on a native floor, independent of label language',()=>{
 for(const id of [88,63,61,101,125,127,131,135,139,136,137,138,176,95,167]) {
  const p=getAviationMarkerPolicy({id:'x'}, {subCategoryId:id}, {zoom:15});
  assert.equal(p.rank,'always-visible');assert.equal(p.occlude,false);assert.equal(p.showLabel,true);
 }
});
test('vertical connections are icon only even close up',()=>{
 for(const id of [60,62])assert.equal(getAviationMarkerPolicy({}, {subCategoryId:id},{zoom:22}).showLabel,false);
 assert.equal(getAviationMarkerPolicy({type:'elevator'},null,{zoom:22}).showLabel,false);
});
test('vertical icons use ordinary collision and zoom resizing instead of aviation prominence',()=>{
 for(const id of [60,62]){
  const policy=getAviationMarkerPolicy({}, {subCategoryId:id},{zoom:15,requiredObjectIds:['x']});
  assert.equal(policy.required,false);assert.equal(policy.rank,'low');assert.equal(policy.occlude,true);assert.equal(policy.dynamicResize,true);
 }
});
test('Gate alias uses configured GateNo; names never infer operational role',()=>{
 const p=getAviationMarkerPolicy({id:'e9',name:'Cửa ra tàu bay 9'}, {subCategoryId:63},{zoom:20,gate:{gateNo:9,accessRole:'departure'}});
 assert.equal(p.label,'Gate 9');assert.equal(p.showLabel,true);
});
test('commercial has low collision priority and fixed screen icon size',()=>{
 const p=getAviationMarkerPolicy({}, {subCategoryId:164},{zoom:15});
 assert.equal(p.rank,'low');assert.equal(p.iconSize,24);
 assert.equal(getAviationMarkerPolicy({}, {subCategoryId:88},{zoom:22}).iconSize,24);
});
test('explicit operational IDs prioritize belts and gates even without a database category',()=>{
 assert.equal(getAviationMarkerPolicy({id:'belt'},null,{requiredObjectIds:['belt']}).rank,'always-visible');
 assert.equal(getAviationMarkerPolicy({id:'gate'},null,{gate:{gateNo:9}}).rank,'always-visible');
 assert.equal(getAviationMarkerPolicy({id:'shop'},null,{requiredObjectIds:['belt']}).rank,'low');
});
test('Overview never projects indoor POI icons, and source coordinates are unchanged',()=>{
 const object={id:'space',coordinate:{latitude:10,longitude:107,floorId:'3F'}};
 const coords=markerCoordinatesForFloor(object,'overview','overview');
 assert.equal(coords.length,0);assert.equal(object.coordinate.floorId,'3F');
 assert.equal(markerCoordinatesForFloor(object,'1F','overview').length,0);
});
test('ownership separates physical anchors and escapes database text',()=>{
 assert.equal(markerOwnershipKey('x',{floorId:'f',latitude:10,longitude:107}),markerOwnershipKey('x',{floorId:'f',latitude:10,longitude:107}));
 assert.notEqual(markerOwnershipKey('x',{floorId:'f',latitude:10,longitude:107}),markerOwnershipKey('x',{floorId:'g',latitude:10,longitude:107}));
 assert.equal(escapeMarkerHtml('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
});

test('coincident vertical anchors display exclusively on the selected native floor',()=>{
 const object={id:'lift',coordinates:[{latitude:10,longitude:107,floorId:'1F'},{latitude:10,longitude:107,floorId:'2F'}]};
 assert.equal(markerCoordinatesForFloor(object,'overview','overview').length,0);
 const floor1=markerCoordinatesForFloor(object,'1F','overview'),floor2=markerCoordinatesForFloor(object,'2F','overview');
 assert.equal(floor1.length,1);assert.equal(floor1[0].floorId,'1F');assert.equal(floor2.length,1);assert.equal(floor2[0].floorId,'2F');
});
