import clipping from 'polygon-clipping';
import {ShapeUtils,Vector2,Color,BufferGeometry,Float32BufferAttribute} from 'three';

export function roadHeightAt(point,style,top){
 const angle=(style.axisAngle??-37.15)*Math.PI/180;
 const x=point[0]*Math.cos(angle)-point[1]*Math.sin(angle);
 const t=Math.max(0,Math.min(1,(Math.abs(x)-(style.plateauHalfWidth??300))/(style.rampLength??425)));
 const eased=t*t*(3-2*t);
 const ground=Number(style.groundHeight??.4);
 const original=ground+(top-ground)*(1-eased);
 if(Number.isFinite(style.junctionLevelHalfWidth)&&Number.isFinite(style.junctionBlendEnd)){
  const start=style.junctionLevelHalfWidth,end=style.junctionBlendEnd,absX=Math.abs(x);
  if(absX<=start)return top;
  if(absX<end){
   const u=(absX-start)/(end-start),blend=u*u*u*(u*(6*u-15)+10);
   return top+(original-top)*blend;
  }
 }
 return original;
}
const polys=g=>g.type==='Polygon'?[g.coordinates]:g.coordinates;
function projection(origin){
 const sx=111320*Math.cos(origin[1]*Math.PI/180),sy=111320;
 return p=>[(p[0]-origin[0])*sx,(p[1]-origin[1])*sy];
}
function triangulate(poly){
 const rings=poly.map(r=>r.slice(0,-1).map(p=>new Vector2(p[0],p[1])));
 const points=rings.flat();return ShapeUtils.triangulateShape(rings[0],rings.slice(1)).map(tri=>tri.map(i=>points[i].toArray()));
}
function quad(group,a,b,c,d){group.positions.push(...a,...b,...c,...a,...c,...d)}
function densify(ring,step=4){
 const result=[];
 for(let i=1;i<ring.length;i++){
  const a=ring[i-1],b=ring[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));
  for(let j=0;j<n;j++)result.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);
 }
 result.push(result[0]);return result;
}

/** Road mesh is local east/north/up, positioned by the SDK at the curbside origin. */
export function createAccessRoadMesh(geometry,origin,style,top,color,options={}){
 const project=projection(origin),footprints=[...polys(geometry),...polys(options.landings||{type:'MultiPolygon',coordinates:[]})];
 const local=clipping.union(footprints.map(p=>p.map(r=>r.map(project))));
 const caps=(style.connectorCaps||[]).map(cap=>({...cap,edge:cap.edge.map(project)}));
 const asphalt={name:'Asphalt',color,positions:[]},deck={name:'Bridge deck',color:style.deckColor||'#8996A1',positions:[]};
 const lines={name:'Road markings',color:style.lineColor||'#F7F5ED',positions:[]},edgeLines={name:'Edge markings',color:style.edgeLineColor||'#FAFAF5',positions:[]};
 const rails={name:'Guardrails',color:style.railColor||'#CDD5DB',positions:[]};
 const height=p=>options.flat?top:roadHeightAt(p,style,top),thickness=style.deckThickness??.65;
 const angle=(style.axisAngle??-37.15)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const aligned=p=>[p[0]*c-p[1]*s,p[0]*s+p[1]*c];
 const unaligned=p=>[p[0]*c+p[1]*s,-p[0]*s+p[1]*c];
 const bounds=local.flat(2).map(aligned),xs=bounds.map(p=>p[0]),ys=bounds.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const step=style.meshStep??4;
 // Slice before triangulation so interior vertices follow the same continuous ramp profile.
 for(let x=minX;x<maxX;x+=step){
  const box=[[x,minY-1],[Math.min(x+step,maxX),minY-1],[Math.min(x+step,maxX),maxY+1],[x,maxY+1],[x,minY-1]].map(unaligned);
  const pieces=clipping.intersection(local,[box]);
  for(const poly of pieces)for(const tri of triangulate(poly)){
   for(const p of tri)asphalt.positions.push(p[0],p[1],height(p));
   for(const p of [...tri].reverse())deck.positions.push(p[0],p[1],height(p)-thickness);
  }
 }
 const addPaint=(poly,group,offset)=>{for(const tri of triangulate(poly))for(const p of tri)group.positions.push(p[0],p[1],height(p)+offset)};
 const markings=options.markings||{features:[]};
 for(const f of markings.features)addPaint(f.geometry.coordinates.map(r=>r.map(project)),lines,.012);
 for(const poly of local)for(const ring of poly){
  const dense=densify(ring,step);
  for(let i=1;i<dense.length;i++){
   const a=dense[i-1],b=dense[i],dx=b[0]-a[0],dy=b[1]-a[1],distance=Math.hypot(dx,dy);if(distance<1e-6)continue;
   quad(deck,[...a,height(a)],[...b,height(b)],[...b,height(b)-thickness],[...a,height(a)-thickness]);
   if(options.decorations===false)continue;
   const aa=aligned(a),bb=aligned(b);
   const end=(Math.abs(aa[0]-minX)<.3&&Math.abs(bb[0]-minX)<.3)||(Math.abs(aa[0]-maxX)<.3&&Math.abs(bb[0]-maxX)<.3)||(aa[1]<minY+.3&&bb[1]<minY+.3);
   const opening=caps.some(cap=>{
    const [p,q]=cap.edge,n=cap.inward,overlap=style.connectionOverlap??.35;
    const tangent=[(q[0]-p[0])/cap.width,(q[1]-p[1])/cap.width];
    return[a,b].every(point=>{
     const dx=point[0]-p[0],dy=point[1]-p[1],along=dx*tangent[0]+dy*tangent[1],depth=dx*n[0]+dy*n[1];
     return along>=-.06&&along<=cap.width+.06&&depth>=-overlap-.06&&depth<=.06;
    });
   });
   if(end||opening)continue;
   const nx=-dy/distance,ny=dx/distance;
   const strip=(margin,width)=>[[a[0]+nx*margin,a[1]+ny*margin],[b[0]+nx*margin,b[1]+ny*margin],[b[0]+nx*(margin+width),b[1]+ny*(margin+width)],[a[0]+nx*(margin+width),a[1]+ny*(margin+width)],[a[0]+nx*margin,a[1]+ny*margin]];
   for(const edge of clipping.intersection([strip(style.edgeLineInset??.65,style.edgeLineWidth??.18)],local))addPaint(edge,edgeLines,.014);
   const w=style.railWidth??.24,railHeight=style.railHeight??.55;
   const ai=[a[0]+nx*w,a[1]+ny*w],bi=[b[0]+nx*w,b[1]+ny*w];
   quad(rails,[...a,height(a)+railHeight],[...b,height(b)+railHeight],[...bi,height(bi)+railHeight],[...ai,height(ai)+railHeight]);
   quad(rails,[...a,height(a)],[...b,height(b)],[...b,height(b)+railHeight],[...a,height(a)+railHeight]);
   quad(rails,[...ai,height(ai)+railHeight],[...bi,height(bi)+railHeight],[...bi,height(bi)],[...ai,height(ai)]);
  }
 }
 return{origin,groups:[asphalt,deck,lines,edgeLines,rails].filter(g=>g.positions.length)};
}

/** One mesh with several material primitives; no nested model meshes. */
export function encodeRoadGLB(mesh){
 const bufferViews=[],accessors=[],materials=[],primitives=[],parts=[];let byteLength=0;
 const addBuffer=(array)=>{
  const bytes=new Uint8Array(array.buffer,array.byteOffset,array.byteLength);parts.push(bytes);
  bufferViews.push({buffer:0,byteOffset:byteLength,byteLength:bytes.length,target:34962});byteLength+=bytes.length;return bufferViews.length-1;
 };
 for(const group of mesh.groups){
  const positions=new Float32Array(group.positions),geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
  const normals=geometry.getAttribute('normal').array;
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<positions.length;i++) {min[i%3]=Math.min(min[i%3],positions[i]);max[i%3]=Math.max(max[i%3],positions[i])}
  const positionAccessor=accessors.push({bufferView:addBuffer(positions),componentType:5126,count:positions.length/3,type:'VEC3',min,max})-1;
  const normalAccessor=accessors.push({bufferView:addBuffer(normals),componentType:5126,count:normals.length/3,type:'VEC3'})-1;
  const color=new Color(group.color).toArray();materials.push({name:group.name,doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[...color,1],metallicFactor:0,roughnessFactor:.95}});
  primitives.push({attributes:{POSITION:positionAccessor,NORMAL:normalAccessor},material:materials.length-1});geometry.dispose();
 }
 const json={asset:{version:'2.0',generator:'Airport access road visual mesh'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{name:'Elevated access road',primitives}],materials,buffers:[{byteLength}],bufferViews,accessors};
 const jsonBytes=new TextEncoder().encode(JSON.stringify(json)),paddedLength=Math.ceil(jsonBytes.length/4)*4;
 const output=new Uint8Array(12+8+paddedLength+8+byteLength),view=new DataView(output.buffer);
 view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,output.length,true);
 view.setUint32(12,paddedLength,true);view.setUint32(16,0x4e4f534a,true);output.fill(32,20,20+paddedLength);output.set(jsonBytes,20);
 const offset=20+paddedLength;view.setUint32(offset,byteLength,true);view.setUint32(offset+4,0x004e4942,true);
 let cursor=offset+8;for(const part of parts){output.set(part,cursor);cursor+=part.length}return output;
}
