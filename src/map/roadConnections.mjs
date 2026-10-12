import clipping from 'polygon-clipping';

const polygons=g=>g?.type==='Polygon'?[g.coordinates]:g?.coordinates||[];
const distance=(p,a,b)=>{
 const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
 return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
};
const insideRing=(p,ring)=>{
 let inside=false;
 for(let i=1;i<ring.length;i++){
  const a=ring[i-1],b=ring[i];
  if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
};
const inside=(p,polys)=>polys.some(poly=>insideRing(p,poly[0])&&!poly.slice(1).some(r=>insideRing(p,r)));
function projection(origin){
 const sx=111320*Math.cos(origin[1]*Math.PI/180),sy=111320;
 return {project:p=>[(p[0]-origin[0])*sx,(p[1]-origin[1])*sy],unproject:p=>[origin[0]+p[0]/sx,origin[1]+p[1]/sy]};
}

/** Find only mouths already shared by the real road and garage footprints. */
export function findRoadGarageConnections(road,garage){
 const origin=polygons(road)[0]?.[0]?.[0];if(!origin||!garage)return[];
 const {project,unproject}=projection(origin),roads=polygons(road).map(poly=>poly.map(r=>r.map(project)));
 const garages=polygons(garage).map(poly=>poly.map(r=>r.map(project)));
 const boundary=p=>garages.some(poly=>poly.some(r=>r.slice(1).some((b,i)=>distance(p,r[i],b)<.04)));
 const edges=[];
 for(const poly of roads)for(const ring of poly)for(let i=1;i<ring.length;i++){
  const a=ring[i-1],b=ring[i],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  if(![a,b,mid].every(boundary)||Math.hypot(b[0]-a[0],b[1]-a[1])<.1)continue;
  const prev=edges.at(-1);
  if(prev&&distance(a,prev[1],prev[1])<.04&&distance(prev[1],prev[0],b)<.04)prev[1]=b;
  else edges.push([a,b]);
 }
 return edges.map((edge,id)=>{
  const [a,b]=edge,width=Math.hypot(b[0]-a[0],b[1]-a[1]),mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  let inward=[-(b[1]-a[1])/width,(b[0]-a[0])/width];
  if(!inside([mid[0]+inward[0]*.2,mid[1]+inward[1]*.2],roads))inward=inward.map(n=>-n);
  return{id,edge:edge.map(unproject),width,inward};
 });
}

/** A small overlap closes rendering seams, strictly within the garage footprint. */
export function createConnectionLandings(caps,garage,overlap=.35){
 const patches=[];
 for(const cap of caps){
  const {project,unproject}=projection(cap.edge[0]),[a,b]=cap.edge.map(project),n=cap.inward;
  const ring=[a,b,[b[0]-n[0]*overlap,b[1]-n[1]*overlap],[a[0]-n[0]*overlap,a[1]-n[1]*overlap],a].map(unproject);
  patches.push(...clipping.intersection([ring],polygons(garage)));
 }
 return{type:'MultiPolygon',coordinates:patches.length?clipping.union(patches):[]};
}

function hitsOnLine(origin,u,poly){
 const hits=[];
 for(const ring of poly)for(let i=1;i<ring.length;i++){
  const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dy=b[1]-a[1],den=u[0]*dy-u[1]*dx;
  if(Math.abs(den)<1e-9)continue;
  const ax=a[0]-origin[0],ay=a[1]-origin[1],t=(ax*dy-ay*dx)/den,v=(ax*u[1]-ay*u[0])/den;
  if(v>=0&&v<1)hits.push(t);
 }
 return hits.sort((a,b)=>a-b);
}

/** Keep the through-road median continuous; each driveway gets its own transverse median. */
export function repairRoadCenterlines(paths,localPolys,caps,blendHalfWidth=30){
 const polys=typeof localPolys[0]?.[0]?.[0]==='number'?[localPolys]:localPolys;
 let scanPaths=paths;
 if(caps.length&&polys.length===1&&polys[0].length===1){
  const byX=new Map(),direction=caps.reduce((n,cap)=>n+cap.inward[1],0)>=0?1:-1;
  for(const p of paths.flat())if(!byX.has(p[0])||p[1]*direction>byX.get(p[0])[1]*direction)byX.set(p[0],p);
  scanPaths=[[...byX.values()].sort((a,b)=>a[0]-b[0])];
 }
 const repaired=[];
 for(const path of [...scanPaths].sort((a,b)=>a[0][0]-b[0][0])){
  const previous=repaired.at(-1),gap=previous?path[0][0]-previous.points.at(-1)[0]:Infinity;
  // A deep spur can exceed the scan's continuity threshold in Y. Stitch
  // consecutive X samples; overlapping corridors (holes) remain separate.
  if(previous&&gap>0&&gap<=2.01)previous.points.push(...path.map(p=>[...p]));
  else repaired.push({kind:'main',points:path.map(p=>[...p])});
 }
 const main=repaired.reduce((best,p)=>!best||p.points.length>best.points.length?p:best,null);if(!main)return repaired;
 for(const cap of caps){
  const cx=(cap.edge[0][0]+cap.edge[1][0])/2,points=main.points;
  const left=points.findLast(p=>p[0]<cx-blendHalfWidth),right=points.find(p=>p[0]>cx+blendHalfWidth);
  if(!left||!right)continue;
  for(const p of points)if(p[0]>left[0]&&p[0]<right[0])p[1]=left[1]+(right[1]-left[1])*(p[0]-left[0])/(right[0]-left[0]);
 }
 for(const cap of caps){
  const [a,b]=cap.edge,mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],v=cap.inward,u=[-v[1],v[0]];
  // Ray from the mouth towards the continuous through-road median.
  let end=Infinity;
  for(let i=1;i<main.points.length;i++){
   const p=main.points[i-1],q=main.points[i],dx=q[0]-p[0],dy=q[1]-p[1],den=v[0]*dy-v[1]*dx;
   if(Math.abs(den)<1e-9)continue;
   const ax=p[0]-mid[0],ay=p[1]-mid[1],t=(ax*dy-ay*dx)/den,k=(ax*v[1]-ay*v[0])/den;
   if(t>0&&k>=0&&k<=1)end=Math.min(end,t);
  }
  if(!Number.isFinite(end))continue;
  const points=[mid];let offset=0;
  for(let t=2;t<end;t+=2){
   const center=[mid[0]+v[0]*t,mid[1]+v[1]*t];
   const intervals=polys.flatMap(poly=>{const hits=hitsOnLine(center,u,poly),pairs=[];for(let i=0;i+1<hits.length;i+=2)pairs.push([hits[i],hits[i+1]]);return pairs;});
   const pair=intervals.find(([lo,hi])=>lo<=offset&&hi>=offset);
   if(pair&&pair[1]-pair[0]<cap.width*2.5)offset=(pair[0]+pair[1])/2;
   points.push([center[0]+u[0]*offset,center[1]+u[1]*offset]);
  }
  // Intersect the final branch direction with the main line after centring the throat.
  const last=points.at(-1);
  let closest=null;
  for(let i=1;i<main.points.length;i++){
   const p=main.points[i-1],q=main.points[i],dx=q[0]-p[0],dy=q[1]-p[1],den=v[0]*dy-v[1]*dx;
   if(Math.abs(den)<1e-9)continue;
   const ax=p[0]-last[0],ay=p[1]-last[1],t=(ax*dy-ay*dx)/den,k=(ax*v[1]-ay*v[0])/den;
   if(t>=0&&k>=0&&k<=1&&(!closest||t<closest.t))closest={t,p:[last[0]+v[0]*t,last[1]+v[1]*t]};
  }
  if(closest)points.push(closest.p);
  repaired.push({kind:'connector',points});
 }
 return repaired;
}
