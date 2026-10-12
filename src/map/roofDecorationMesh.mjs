import clipping from 'polygon-clipping';
import {ShapeUtils, Vector2} from 'three';

const EPSILON = 1e-8;
const box = (x0, y0, x1, y1) => [[[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]];
function roundedBox([x0,y0,x1,y1],radius){
  const r=Math.max(0,Math.min(radius,(x1-x0)/2,(y1-y0)/2)),ring=[];
  for(const [cx,cy,start] of [[x1-r,y0+r,-Math.PI/2],[x1-r,y1-r,0],[x0+r,y1-r,Math.PI/2],[x0+r,y0+r,Math.PI]]){
    for(let i=0;i<=8;i++){const a=start+i*Math.PI/16;ring.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}
  }
  ring.push(ring[0]);return [ring];
}
const signedArea = ring => ring.reduce((sum, a, i) => {
  const b = ring[(i+1)%ring.length];
  return sum + a[0]*b[1] - b[0]*a[1];
}, 0)/2;

function bounds(polygons) {
  const result = {minX:Infinity, minY:Infinity, maxX:-Infinity, maxY:-Infinity};
  for (const polygon of polygons) for (const ring of polygon) for (const [x,y] of ring) {
    result.minX = Math.min(result.minX,x); result.maxX = Math.max(result.maxX,x);
    result.minY = Math.min(result.minY,y); result.maxY = Math.max(result.maxY,y);
  }
  return result;
}

function cleanRing(ring) {
  const points = [];
  for (const p of ring) {
    if (!p.every(Number.isFinite)) throw new TypeError('Roof coordinates must be finite');
    const last = points.at(-1);
    if (!last || Math.hypot(p[0]-last[0],p[1]-last[1]) > 1e-9) points.push(p);
  }
  if (points.length>1 && Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1])<1e-9) points.pop();
  if (points.length<3 || Math.abs(signedArea(points))<EPSILON) return [];
  return [...points,points[0].slice()];
}

function projectGeometry(geometry, project) {
  if (!geometry) return [];
  const polygons = geometry.type==='Polygon' ? [geometry.coordinates] : geometry.type==='MultiPolygon' ? geometry.coordinates : [];
  return polygons.flatMap(polygon => {
    if (!polygon.length) return [];
    const outer = cleanRing(polygon[0].map(project));
    if (!outer.length) return [];
    return [[outer,...polygon.slice(1).map(r=>cleanRing(r.map(project))).filter(r=>r.length)]];
  });
}

// Perimeter-weighted covariance makes the long axis independent of vertex density.
function longAxis(ring) {
  let length=0, mx=0, my=0, xx=0, yy=0, xy=0;
  for (let i=1;i<ring.length;i++) {
    const a=ring[i-1], b=ring[i], w=Math.hypot(b[0]-a[0],b[1]-a[1]);
    length+=w; mx+=w*(a[0]+b[0])/2; my+=w*(a[1]+b[1])/2;
    xx+=w*(a[0]*a[0]+a[0]*b[0]+b[0]*b[0])/3;
    yy+=w*(a[1]*a[1]+a[1]*b[1]+b[1]*b[1])/3;
    xy+=w*(2*a[0]*a[1]+a[0]*b[1]+b[0]*a[1]+2*b[0]*b[1])/6;
  }
  mx/=length; my/=length;
  const angle=Math.atan2(2*(xy/length-mx*my),xx/length-mx*mx-yy/length+my*my)/2;
  const c=Math.cos(angle), s=Math.sin(angle);
  const toAxis=([x,y])=>[(x-mx)*c+(y-my)*s,-(x-mx)*s+(y-my)*c];
  const fromAxis=([x,y])=>[mx+x*c-y*s,my+x*s+y*c];
  return {toAxis,fromAxis,bounds:bounds([[ring.map(toAxis)]])};
}

function insetWings(source, lengthScale, widthScale) {
  return source.flatMap(polygon => {
    const axis=longAxis(polygon[0]);
    const scaled=polygon.map(r=>r.map(p=>{const [x,y]=axis.toAxis(p); return axis.fromAxis([x*lengthScale,y*widthScale]);}));
    // Intersect again for concave sources: scaling must never invent glass outside a wing.
    return clipping.intersection([scaled],[polygon]);
  });
}

function insetLeaf(source) {
  if (!source.length) return [];
  const b=bounds(source), cx=(b.minX+b.maxX)/2, cy=(b.minY+b.maxY)/2;
  const scaled=source.map(p=>p.map(r=>r.map(([x,y])=>[cx+(x-cx)*.78,cy+(y-cy)*.80])));
  return clipping.intersection(source,scaled);
}

// Closed ribbons approximate smooth curves; they are clipped as polygons, never by centroids.
function waveRibbons(region, spacing, width, curve, padding, budget) {
  if (!region.length || !(spacing>0) || !(width>0)) return [];
  const b=bounds(region), span=b.maxX-b.minX;
  const samples=Math.max(1,Math.min(512,Math.ceil(span/8)));
  const first=Math.floor((b.minY-padding)/spacing), last=Math.ceil((b.maxY+padding)/spacing);
  // Keep work bounded when a caller requests an unusually small spacing/budget.
  const stride=Math.max(1,Math.ceil((last-first+1)*samples*2/Math.max(16,budget)));
  const ribbons=[];
  for (let row=first;row<=last;row+=stride) {
    const lower=[], upper=[];
    for (let i=0;i<=samples;i++) {
      const x=b.minX+span*i/samples, y=row*spacing+curve(x);
      lower.push([x,y-width/2]); upper.push([x,y+width/2]);
    }
    const ring=[...lower,...upper.reverse(),lower[0]];
    ribbons.push(...clipping.intersection(region,[[ring]]));
  }
  return ribbons;
}

function grid(region, spacing, width, budget) {
  if (!region.length || !(spacing>0) || !(width>0)) return [];
  const b=bounds(region), strips=[];
  const count=(b.maxX-b.minX+b.maxY-b.minY)/spacing+4;
  const stride=Math.max(1,Math.ceil(count*2/Math.max(16,budget)));
  for (let x=Math.ceil(b.minX/spacing)*spacing;x<=b.maxX;x+=spacing*stride) strips.push(box(x-width/2,b.minY,x+width/2,b.maxY));
  for (let y=Math.ceil(b.minY/spacing)*spacing;y<=b.maxY;y+=spacing*stride) strips.push(box(b.minX,y-width/2,b.maxX,y+width/2));
  if (!strips.length) return [];
  return clipping.intersection(region,clipping.union(...strips));
}

function rim(region, width) {
  if (!(width>0)) return [];
  const strips=[];
  for (const polygon of region) for (const ring of polygon) for (let i=1;i<ring.length;i++) {
    const a=ring[i-1], b=ring[i], length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if (length<EPSILON) continue;
    const nx=-(b[1]-a[1])*width/length, ny=(b[0]-a[0])*width/length;
    strips.push([[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny],[a[0]+nx,a[1]+ny]]]);
  }
  // Union prevents overlapping coplanar paint at joins and between nearby boundaries.
  let band=[];
  for (let i=0;i<strips.length;i+=128) band=clipping.union(band,...strips.slice(i,i+128));
  return band.length ? clipping.intersection(region,band) : [];
}

function slotRing(ring) {
  const axis=longAxis(ring), b=axis.bounds, length=b.maxX-b.minX, width=b.maxY-b.minY;
  // Regular rectangles and rounded slots pass; stairwells, wide and irregular holes stay open.
  if (!(length>15 && width>0 && length/width>3 && Math.abs(signedArea(ring))/(length*width)>.72)) return null;
  const inset=Math.min(.3,width*.12);
  const cx=(b.minX+b.maxX)/2, cy=(b.minY+b.maxY)/2;
  const scaled=ring.map(p=>{
    const [x,y]=axis.toAxis(p);
    return axis.fromAxis([cx+(x-cx)*(1-2*inset/length),cy+(y-cy)*(1-2*inset/width)]);
  });
  return clipping.intersection([[ring]],[[scaled]]);
}

// When visibility cuts through a native slot, its hole becomes a notch in the exterior.
// Join only the runs inherited from that slot boundary to recover the occlusion edge.
// Added holes and unrelated concave edges are preserved.
function slotVisibility(visible, holes) {
  const inherited=(a,b)=>holes.some(ring=>{
    for (let i=1;i<ring.length;i++) {
      const p=ring[i-1],q=ring[i], dx=q[0]-p[0],dy=q[1]-p[1], length=Math.hypot(dx,dy);
      if (length<EPSILON) continue;
      const onSegment=v=>{
        const x=v[0]-p[0],y=v[1]-p[1],along=(x*dx+y*dy)/length;
        return Math.abs(x*dy-y*dx)/length<1e-5 && along>=-1e-5 && along<=length+1e-5;
      };
      if (onSegment(a)&&onSegment(b)) return true;
    }
    return false;
  });
  return visible.flatMap(polygon=>{
    const outer=polygon[0].slice(0,-1), n=outer.length;
    const edges=outer.map((p,i)=>inherited(p,outer[(i+1)%n]));
    const repaired=cleanRing(outer.filter((p,i)=>!(edges[(i+n-1)%n]&&edges[i])));
    if (!repaired.length) return [];
    const openings=polygon.slice(1).filter(r=>!r.slice(1).every((p,i)=>inherited(r[i],p)));
    return [[repaired,...openings]];
  });
}

/** Independent planar decoration mesh, east/north/up metres, with absolute rendered Z.
 * Native footprints and source geometries are read only. The parent owns the roof base and GLB.
 */
export function createRoofDecorationMesh(surface, origin, top, config, sources = {}) {
  if (!Number.isFinite(top) || !Array.isArray(origin) || origin.length<2 || !origin.slice(0,2).every(Number.isFinite)) {
    throw new TypeError('Roof origin and top must be finite');
  }
  const mesh={origin,groups:[]};
  const maxTriangles=Number(config.render?.maxTriangles ?? 28000);
  let remaining=Number.isFinite(maxTriangles) ? Math.max(0,Math.floor(maxTriangles)) : 0;
  if (config.enabled===false || !remaining) return mesh;
  const angle=(config.axisAngle ?? -37.15)*Math.PI/180, c=Math.cos(angle), s=Math.sin(angle);
  const sx=111320*Math.cos(origin[1]*Math.PI/180);
  const project=([lon,lat])=>{const x=(lon-origin[0])*sx, y=(lat-origin[1])*111320; return [x*c-y*s,x*s+y*c];};
  const unalign=([x,y])=>[x*c+y*s,-x*s+y*c];
  const original=projectGeometry(surface.geometry,project);
  const visible=projectGeometry(surface.visibleGeometry || surface.geometry,project);
  if (!original.length || !visible.length) return mesh;
  const region=clipping.intersection(original,visible);
  if (!region.length) return mesh;
  const offset=Number(config.render?.surfaceOffset ?? .035), z=top+offset;
  if (!Number.isFinite(z) || !Number.isFinite(Math.fround(z))) throw new TypeError('Roof height must be finite in Float32');

  const add=(name,color,polygons,height)=>{
    if (!color || !remaining || !Number.isFinite(Math.fround(height))) return;
    const positions=[];
    for (const polygon of polygons) {
      const rings=polygon.map(r=>r.slice(0,-1).map(([x,y])=>new Vector2(x,y)));
      const points=rings.flat();
      const faces=ShapeUtils.triangulateShape(rings[0],rings.slice(1));
      for (const indices of faces) {
        if (!remaining) break;
        let tri=indices.map(i=>unalign(points[i].toArray()));
        const float=tri.map(p=>p.map(Math.fround));
        const cross=(float[1][0]-float[0][0])*(float[2][1]-float[0][1])-(float[1][1]-float[0][1])*(float[2][0]-float[0][0]);
        if (!float.flat().every(Number.isFinite) || !Number.isFinite(cross) || Math.abs(cross)<=2*EPSILON) continue;
        if (cross<0) tri=[tri[0],tri[2],tri[1]];
        for (const p of tri) positions.push(p[0],p[1],height);
        remaining--;
      }
      if (!remaining) break;
    }
    if (positions.length) mesh.groups.push({name,color,positions});
  };
  const palette=config.palette || {};
  if (surface.kind==='terminal') {
    const terminal=config.terminal || {};
    let masks=[];
    if (surface.tier===1) {
      for (const id of [terminal.leftWingSpaceId,terminal.rightWingSpaceId]) {
        if (id && sources[id]) masks.push(...insetWings(projectGeometry(sources[id],project),terminal.glassInsetLength ?? .82,terminal.glassInsetWidth ?? .32));
      }
    } else if (surface.tier===4) masks=[box(-5,275,15,609)];
    else if (surface.tier===5 && sources[terminal.centralGlassSpaceId]) masks=insetLeaf(projectGeometry(sources[terminal.centralGlassSpaceId],project));
    const glass=masks.length ? clipping.intersection(region,clipping.union(masks)) : [];
    add('Terminal glass',palette.glass,glass,z);
    add('Terminal glass grid',palette.glassGrid,grid(glass,terminal.glassGridSpacing ?? 8,terminal.glassGridWidth ?? .12,remaining),z+.004);
    const metal=glass.length ? clipping.difference(region,glass) : region;
    const curve=x=>3*Math.sin(x/110)+1.5*Math.sin(x/48);
    add('Terminal metal ribs',palette.metalRib,waveRibbons(metal,terminal.ribSpacing ?? 3.2,terminal.ribWidth ?? .16,curve,4.5,remaining),z);
  } else if (surface.kind==='garage') {
    const garage=config.garage || {};
    let canopy=[];
    if(Array.isArray(garage.canopyBounds)&&garage.canopyBounds.length===4&&garage.canopyBounds.every(Number.isFinite)){
      const shape=roundedBox(garage.canopyBounds,garage.canopyRadius??10.5);
      canopy=clipping.intersection(region,[shape]);
      add('Garage canopy',palette.terminalMetal,canopy,z+.008);
      const b=garage.canopyBounds,cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,scale=garage.canopyGlassScale||[.60,.83];
      const inset=shape.map(r=>r.map(([x,y])=>[cx+(x-cx)*scale[0],cy+(y-cy)*scale[1]]));
      const glass=clipping.intersection(canopy,[inset]);
      add('Garage canopy glass',palette.glass,glass,z+.012);
      add('Garage canopy grid',palette.glassGrid,grid(glass,config.terminal?.glassGridSpacing??8,config.terminal?.glassGridWidth??.12,remaining),z+.016);
    }
    let slotMasks=[];
    const slotHoles=[];
    for (const polygon of original) for (const hole of polygon.slice(1)) {
      const inset=slotRing(hole);
      if (inset) { slotMasks.push(...inset); slotHoles.push(hole); }
    }
    if (slotMasks.length) {
      const slots=clipping.union(slotMasks);
      // Restore only eligible holes for the visibility test. Occluded parts and all other
      // openings remain excluded even though these selected surfaces sit inside native holes.
      const permitted=clipping.intersection(clipping.union(original,slots),slotVisibility(visible,slotHoles));
      const inset=clipping.intersection(slots,permitted);
      const recess=top-(garage.slotRecess ?? .35);
      add('Garage slots',palette.garageSlot,inset,recess);
      add('Garage slot grid',palette.garageSlotGrid,grid(inset,garage.slotGridSpacing ?? 8,.10,remaining),recess+.004);
    }
    add('Garage rims',palette.garageStripe,rim(region,garage.rimWidth ?? .65),z);
    const curvature=garage.waveCurvature ?? .00017, b=bounds(region);
    const bend=Math.abs(curvature)*Math.max(b.minX*b.minX,b.maxX*b.maxX);
    const waveRegion=canopy.length?clipping.difference(region,canopy):region;
    const waves=waveRibbons(waveRegion,garage.waveSpacing ?? 18,garage.waveWidth ?? .65,x=>curvature*x*x,bend,remaining);
    add('Garage wave stripes',palette.garageStripe,waves,z);
  }
  return mesh;
}
