import {AirportPolicyError} from './airportJourneyContext.js';
const floorOf=p=>p?.floorId||p?.floor?.id;
const point=p=>[p.longitude,p.latitude];
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const EPS=1e-12;
function onSegment(p,a,b){return Math.abs(cross(a,b,p))<=EPS&&p[0]>=Math.min(a[0],b[0])-EPS&&p[0]<=Math.max(a[0],b[0])+EPS&&p[1]>=Math.min(a[1],b[1])-EPS&&p[1]<=Math.max(a[1],b[1])+EPS;}
function intersect(a,b,c,d){
 const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);
 return ((x>EPS&&y<-EPS||x<-EPS&&y>EPS)&&(z>EPS&&w<-EPS||z<-EPS&&w>EPS))||onSegment(c,a,b)||onSegment(d,a,b)||onSegment(a,c,d)||onSegment(b,c,d);
}
function inside(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
 const a=ring[j],b=ring[i];if(onSegment(p,a,b))return true;
 if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;
}return yes;}
function ringsTouch(a,b){
 for(let i=0;i<a.length-1;i++)for(let j=0;j<b.length-1;j++){
  if(intersect(a[i],a[i+1],b[j],b[j+1]))return true;
 }
 return false;
}
function polygons(zone){
 const invalid=()=>{throw new AirportPolicyError('INVALID_ZONE');};
 const g=zone?.geometry?.geometry||zone?.geometry;
 if(typeof zone?.floorId!=='string'||!zone.floorId.trim()||!g||!['Polygon','MultiPolygon'].includes(g.type))invalid();
 const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;
 if(!Array.isArray(polys)||!polys.length)invalid();
 for(const polygon of polys){
  if(!Array.isArray(polygon)||!polygon.length)invalid();
  for(const ring of polygon){
   if(!Array.isArray(ring)||ring.length<4)invalid();
   for(const vertex of ring)if(!Array.isArray(vertex)||vertex.length<2||!Number.isFinite(vertex[0])||!Number.isFinite(vertex[1]))invalid();
   const first=ring[0],last=ring.at(-1);
   if(first[0]!==last[0]||first[1]!==last[1])invalid();
   // Translate to the first vertex to avoid cancellation in longitude/latitude.
   const area=ring.slice(1).reduce((sum,b,i)=>sum+cross(first,ring[i],b),0);
   if(!Number.isFinite(area)||area===0)invalid();
   for(let i=0;i<ring.length-1;i++)for(let j=i+2;j<ring.length-1;j++){
    if(i===0&&j===ring.length-2)continue;
    if(intersect(ring[i],ring[i+1],ring[j],ring[j+1]))invalid();
   }
  }
  for(let i=1;i<polygon.length;i++){
   const hole=polygon[i];
   if(!inside(hole[0],polygon[0])||ringsTouch(hole,polygon[0]))invalid();
   for(let j=1;j<i;j++){
    if(ringsTouch(hole,polygon[j])||inside(hole[0],polygon[j])||inside(polygon[j][0],hole))invalid();
   }
  }
 }
 return polys;
}
export function validateAirportZone(zone){polygons(zone);return zone;}
// Count contiguous geometric passages by partitioning each actual segment at
// polygon edges. This detects unsampled holes/re-entry without inventing events.
// Boundary travel or floor transitions cannot establish an unambiguous passage.
export function routeZonePassageCount(coordinates,zone){
 const polys=polygons(zone);
 let passages=0,wasInside=false;
 for(let i=0;i<coordinates.length-1;i++){
  const from=coordinates[i],to=coordinates[i+1];
  if(floorOf(from)!==zone.floorId||floorOf(to)!==zone.floorId){
   if(floorOf(from)===zone.floorId||floorOf(to)===zone.floorId)return -1;
   wasInside=false;continue;
  }
  const a=point(from),b=point(to),dx=b[0]-a[0],dy=b[1]-a[1];
  if(dx===0&&dy===0)continue;
  const cuts=[0,1];
  for(const polygon of polys)for(const ring of polygon)for(let j=0;j<ring.length-1;j++){
   const c=ring[j],d=ring[j+1],ex=d[0]-c[0],ey=d[1]-c[1];
   if(ex===0&&ey===0)continue;
   const denominator=dx*ey-dy*ex;
   if(denominator===0){
    if(intersect(a,b,c,d))return -1;
    continue;
   }
   const t=((c[0]-a[0])*ey-(c[1]-a[1])*ex)/denominator;
   const u=((c[0]-a[0])*dy-(c[1]-a[1])*dx)/denominator;
   if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);
  }
  cuts.sort((x,y)=>x-y);
  for(let j=1;j<cuts.length;j++){
   if(cuts[j]-cuts[j-1]<=Number.EPSILON)continue;
   const t=(cuts[j]+cuts[j-1])/2,p=[a[0]+dx*t,a[1]+dy*t];
   const inZone=polys.some(r=>inside(p,r[0])&&!r.slice(1).some(h=>inside(p,h)));
   if(inZone&&!wasInside)passages++;
   wasInside=inZone;
  }
 }
 return passages;
}
export function routeIntersectsZone(coordinates,zone){
 const polys=polygons(zone);
 return coordinates.some((c,i)=>{
  if(floorOf(c)!==zone.floorId)return false;const p=point(c);
  if(polys.some(r=>inside(p,r[0])&&!r.slice(1).some(h=>inside(p,h))))return true;
  const next=coordinates[i+1];if(!next||floorOf(next)!==zone.floorId)return false;
  return polys.some(r=>r.some(ring=>ring.some((a,j)=>intersect(p,point(next),a,ring[(j+1)%ring.length]))));
 });
}
export function validateAirportRoute(route,zones){
 const coordinates=route?.coordinates;
 if(!Array.isArray(coordinates)||coordinates.length<2||Array.from(coordinates).some(c=>!Number.isFinite(c?.latitude)||!Number.isFinite(c?.longitude)||typeof floorOf(c)!=='string'||!floorOf(c).trim()))throw new AirportPolicyError('INVALID_ROUTE');
 if(!Array.isArray(zones))throw new AirportPolicyError('INVALID_ZONE');
 for(const zone of zones)if(routeIntersectsZone(coordinates,zone))throw new AirportPolicyError('FORBIDDEN_CROSSING');
 return route;
}
