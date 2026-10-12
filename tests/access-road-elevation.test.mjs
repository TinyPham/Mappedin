import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccessRoadMesh, roadHeightAt, encodeRoadGLB} from '../src/map/accessRoadMesh.mjs';
import {resolveRenderedRoadLevel} from '../src/map/accessRoadVisuals.mjs';
const profile={axisAngle:0,plateauHalfWidth:30,rampLength:70,groundHeight:.4,deckThickness:.3,railHeight:.45};
test('road anchors to the SDK rendered level after auto floor-gap expansion',()=>{
 const level=resolveRenderedRoadLevel({getState:()=>({altitude:30,height:10})},{getById:()=>({id:'native-level3'})},{overviewTop:10,levelAnchorIds:['native-level3']});
 assert.equal(level,30.08);
 assert.ok(roadHeightAt([0,0],profile,level)-profile.deckThickness>20);
});
test('approach rises continuously from ground to curbside level and clears the floor-one bridge',()=>{
 assert.equal(roadHeightAt([0,0],profile,10),10);
 assert.equal(roadHeightAt([30,0],profile,10),10);
 assert.equal(roadHeightAt([100,0],profile,10),.4);
 assert.ok(roadHeightAt([60,0],profile,10)>roadHeightAt([80,0],profile,10));
 assert.ok(roadHeightAt([15,0],profile,10)-profile.deckThickness>6);
 for(let x=1;x<=100;x++)assert.ok(Math.abs(roadHeightAt([x,0],profile,10)-roadHeightAt([x-.01,0],profile,10))<.01);
});
test('mesh uses the exact road footprint, leaves holes open, and encodes a valid GLB container',()=>{
 const origin=[107,10],sx=111320*Math.cos(10*Math.PI/180),sy=111320;
 const ring=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]].map(p=>[107+p[0]/sx,10+p[1]/sy]);
 const geometry={type:'Polygon',coordinates:[ring(-100,-6,200,12),ring(-4,-2,8,4)]};
 const mesh=createAccessRoadMesh(geometry,origin,profile,10,'#56616C');
 assert.ok(mesh.groups.some(g=>g.name==='Asphalt'&&g.positions.length>100));
 const asphalt=mesh.groups.find(g=>g.name==='Asphalt');
 for(let i=0;i<asphalt.positions.length;i+=9){
  const x=(asphalt.positions[i]+asphalt.positions[i+3]+asphalt.positions[i+6])/3;
  const y=(asphalt.positions[i+1]+asphalt.positions[i+4]+asphalt.positions[i+7])/3;
  assert.ok(!(Math.abs(x)<4-1e-5&&Math.abs(y)<2-1e-5),'triangle enters hole');
 }
 assert.ok(asphalt.positions.every(Number.isFinite));
 const glb=encodeRoadGLB(mesh);const view=new DataView(glb.buffer);
 assert.equal(view.getUint32(0,true),0x46546c67);
 assert.equal(view.getUint32(4,true),2);
 assert.equal(view.getUint32(8,true),glb.length);
});
