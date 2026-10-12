import clipping from 'polygon-clipping';
import {createAccessRoadMesh,encodeRoadGLB} from './accessRoadMesh.mjs';
import {findRoadGarageConnections,createConnectionLandings,repairRoadCenterlines} from './roadConnections.mjs';

const polygons=g=>g?.type==='Polygon'?[g.coordinates]:g?.type==='MultiPolygon'?g.coordinates:[];
const features=group=>Object.entries(group||{}).flatMap(([floor,fc])=>(fc.features||[]).map(feature=>({floor,feature})));
const idOf=f=>f.properties?.id||f.id;
function pointSegmentDistance(p,a,b){
 const sx=111320*Math.cos(p[1]*Math.PI/180),sy=111320;
 const vx=(b[0]-a[0])*sx,vy=(b[1]-a[1])*sy,px=(p[0]-a[0])*sx,py=(p[1]-a[1])*sy;
 const t=Math.max(0,Math.min(1,(px*vx+py*vy)/(vx*vx+vy*vy||1)));
 return Math.hypot(px-t*vx,py-t*vy);
}
function onBoundary(line,geometry){
 return line.every(p=>polygons(geometry).some(poly=>poly.some(ring=>ring.slice(1).some((b,i)=>pointSegmentDistance(p,ring[i],b)<.04))));
}

/** Change paint and synthetic overview meshes only. Real spaces, obstacles and graph stay intact. */
export function prepareAccessRoadVisuals(mvf,styles={},colors={}){
 const result={paintSources:{},overviewFloorId:null,overviewTop:0,targets:[],edgeCount:0,lowerBridges:[],groundStripIds:[],levelAnchorIds:[],bridgeLevelAnchorIds:[],parkingDeckIds:[],roadsideDetails:[],centerRoadDecks:[],medianGapPatches:[]};
 const all=features(mvf.space),paint=mvf['styles.json'];
 if(!paint)return result;
 for(const [id,style] of Object.entries(styles)){
  if(!['road','curbside'].includes(style.role))continue;
  const item=all.find(x=>idOf(x.feature)===id);if(!item)continue;
  const garage=all.find(x=>x.floor===item.floor&&idOf(x.feature)===style.garageSpaceId);
  const connectorCaps=garage?findRoadGarageConnections(item.feature.geometry,garage.feature.geometry):[];
  const targetStyle=connectorCaps.length?{...style,connectorCaps}:style;
  const landings=garage?createConnectionLandings(connectorCaps,garage.feature.geometry,style.connectionOverlap??.35):null;
  result.targets.push({id,floorId:item.floor,geometry:structuredClone(item.feature.geometry),style:targetStyle,garageGeometry:garage?.feature.geometry,landings});
  // Avoid lowering walls of adjacent rooms or a facade containing entrances.
  const neighbors=all.filter(x=>x.floor===item.floor&&!styles[idOf(x.feature)]);
  const edges=(mvf.obstruction?.[item.floor]?.features||[]).filter(w=>
   /wall/i.test(w.properties?.kind||'')&&w.geometry.type==='LineString'&&
   !(w.properties.entrances?.length)&&onBoundary(w.geometry.coordinates,item.feature.geometry)&&
   (!neighbors.some(n=>onBoundary(w.geometry.coordinates,n.feature.geometry))||connectorCaps.some(cap=>w.geometry.coordinates.every(p=>pointSegmentDistance(p,...cap.edge)<.04)))).map(idOf);
  for(const s of Object.values(paint))if(s.lineStrings)s.lineStrings=s.lineStrings.filter(id=>!edges.includes(id));
  paint['AccessRoadEdges_'+id]={color:style.edgeColor||'#E4EAED',topColor:style.edgeColor||'#E4EAED',height:style.edgeHeight??.18,width:style.edgeWidth??.1,altitude:0,lineStrings:edges};
  result.edgeCount+=edges.length;
  for(const s of Object.values(paint))if(s.polygons)s.polygons=s.polygons.filter(ref=>ref!==id);
  paint['AccessRoadSurface_'+id]={color:colors[id]||style.color,opacity:1,height:style.surfaceHeight??.08,altitude:0,polygons:[id]};
 }
 const roads=result.targets.filter(t=>t.style.role==='road');
 if(!roads.length)return result;
 const curb=result.targets.find(t=>t.style.role==='curbside');
 result.medianDeckColor=curb?.style.medianDeckColor;
 const curbFeature=all.find(x=>idOf(x.feature)===curb?.id)?.feature;
 const ring=curb?.geometry.coordinates[0]||roads[0].geometry.coordinates[0];
 result.origin=curbFeature?.properties.center||[ring.reduce((n,p)=>n+p[0],0)/ring.length,ring.reduce((n,p)=>n+p[1],0)/ring.length];
 for(const id of curb?.style.lowerBridgeSpaceIds||[]){
  const item=all.find(x=>idOf(x.feature)===id&&x.floor===curb.style.lowerBridgeFloorId);
  if(item)result.lowerBridges.push({id,floorId:item.floor,geometry:structuredClone(item.feature.geometry)});
 }
 // The real floor-three median is a single Room in the editor. A lower
 // walkway's XY footprint must never cut this independently elevated slab.
 const angle=(roads[0].style.axisAngle??-37.15)*Math.PI/180;
 const aligned=p=>{const x=(p[0]-result.origin[0])*111320*Math.cos(result.origin[1]*Math.PI/180),y=(p[1]-result.origin[1])*111320;return[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)]};
 const nativeMedians=all.filter(x=>{
  if(x.floor!==roads[0].floorId||styles[idOf(x.feature)]||x.feature.properties.destinationNodes?.length)return false;
  const pts=polygons(x.feature.geometry).flat(2).map(aligned),xs=pts.map(p=>p[0]);
  if(!pts.length||Math.min(...xs)>=0||Math.max(...xs)<=0||Math.max(...pts.map(p=>p[1]))>=0)return false;
  const borders=polygons(x.feature.geometry).flatMap(poly=>poly.flatMap(r=>r.slice(1).map((b,i)=>[r[i],b])));
  return roads.every(road=>borders.some(line=>onBoundary(line,road.geometry)));
 });
 result.medianSourceIds=nativeMedians.map(x=>idOf(x.feature));
 // Locate the synthetic outline by reference and intersection, never by a publish-dependent overview ID.
 const elevation=mvf['floor.geojson']?.features?.find(f=>f.properties.id===roads[0].floorId)?.properties.elevation;
 for(const [key,s] of Object.entries({...paint})){
  if(!key.startsWith('BuildingOutlines')||!s.polygons?.length)continue;
  if(elevation!=null&&!key.endsWith('_'+elevation))continue;
  const matching=all.filter(x=>s.polygons.includes(idOf(x.feature))&&!(x.feature.properties.destinationNodes?.length)&&
   roads.some(r=>clipping.intersection(polygons(x.feature.geometry),polygons(r.geometry)).length));
  if(!matching.length)continue;
  result.overviewFloorId=matching[0].floor;result.overviewBase=s.altitude||0;result.overviewTop=(s.altitude||0)+(s.height||0);
  // A floor-one walkway may be included in the combined exterior outline of floor three.
  // Keep its original lower-level outline; remove only the duplicate overview
  // portion outside the actual floor-three curbside and native median Room.
  const protectedSurfaces=[...(curb?[polygons(curb.geometry)]:[]),...nativeMedians.map(x=>polygons(x.feature.geometry))];
  const bridgeCuts=result.lowerBridges.flatMap(b=>protectedSurfaces.length?clipping.difference(polygons(b.geometry),...protectedSurfaces):polygons(b.geometry));
  const cut=clipping.union(...result.targets.map(r=>polygons(r.geometry)),...bridgeCuts.map(poly=>[poly]));
  for(const item of matching){
   const remaining=clipping.difference(polygons(item.feature.geometry),cut);
   if(!remaining.length){
    mvf.space[item.floor].features=mvf.space[item.floor].features.filter(f=>f!==item.feature);
    s.polygons=s.polygons.filter(id=>id!==idOf(item.feature));
    continue;
   }
   item.feature.geometry={type:'Polygon',coordinates:remaining[0]};
   delete item.feature.bbox;
   for(let i=1;i<remaining.length;i++){
    const id=idOf(item.feature)+'-visual-'+i;
    mvf.space[item.floor].features.push({type:'Feature',properties:{...item.feature.properties,id,externalId:id},geometry:{type:'Polygon',coordinates:remaining[i]}});
    s.polygons.push(id);
   }
  }
  if(curb){
   const angle=(roads[0].style.axisAngle??-37.15)*Math.PI/180;
   const project=p=>{const x=(p[0]-result.origin[0])*111320*Math.cos(result.origin[1]*Math.PI/180),y=(p[1]-result.origin[1])*111320;return[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)]};
   const curbXs=polygons(curb.geometry).flat(2).map(p=>project(p)[0]),curbWidth=Math.max(...curbXs)-Math.min(...curbXs);
   // The long detached strip in front of the garage is exterior ground, not a 2m wall at level three.
   for(const item of all.filter(x=>s.polygons.includes(idOf(x.feature))&&x.floor===result.overviewFloorId)){
    const points=polygons(item.feature.geometry).flat(2).map(project),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    const width=Math.max(...xs)-Math.min(...xs),depth=Math.max(...ys)-Math.min(...ys);
    if(width>curbWidth*1.5&&depth<width/25&&Math.max(...ys)<-120){
     const id=idOf(item.feature);s.polygons=s.polygons.filter(ref=>ref!==id);result.groundStripIds.push(id);
     paint['AccessGroundStrip_'+id]={polygons:[id],color:roads[0].style.groundStripColor||'#BBC3C9',height:roads[0].style.groundStripHeight??.18,altitude:roads[0].style.groundStripAltitude??.3};
    }
   }
  }
  const detailRoad=roads.find(r=>r.style.fitRoadsideDetails);
  if(detailRoad){
   const angle=(detailRoad.style.axisAngle??-37.15)*Math.PI/180;
   const aligned=p=>{const x=(p[0]-result.origin[0])*111320*Math.cos(result.origin[1]*Math.PI/180),y=(p[1]-result.origin[1])*111320;return[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)]};
   for(const f of mvf.space[result.overviewFloorId].features.filter(f=>s.polygons.includes(idOf(f)))){
    const pts=polygons(f.geometry).flat(2).map(aligned),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
    const minX=Math.min(...xs),maxX=Math.max(...xs);
    if((minX>480||maxX<-480)&&maxX-minX<300&&Math.max(...ys)<-100){
     result.roadsideDetails.push({id:idOf(f),geometry:structuredClone(f.geometry),style:detailRoad.style});
    }
   }
  }
  // Keep native parsing/auto floor gaps intact. Hide each old detail only at
  // render time, after its complete graded replacement has been installed.
  result.levelAnchorIds=[...s.polygons];
  if(curb?.style.liftCenterRoadDeck||curb?.style.liftEndRoadDecks){
   const angle=(roads[0].style.axisAngle??-37.15)*Math.PI/180;
   const aligned=p=>{const x=(p[0]-result.origin[0])*111320*Math.cos(result.origin[1]*Math.PI/180),y=(p[1]-result.origin[1])*111320;return[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)]};
   for(const f of mvf.space[result.overviewFloorId].features.filter(f=>s.polygons.includes(idOf(f)))){
    const pts=polygons(f.geometry).flat(2).map(aligned),xs=pts.map(p=>p[0]);
    const minX=Math.min(...xs),maxX=Math.max(...xs),isCenter=minX<0&&maxX>0;
    const flatLimit=Math.min(...roads.map(r=>r.style.junctionLevelHalfWidth??r.style.plateauHalfWidth??300));
    const allowed=isCenter?curb.style.liftCenterRoadDeck:curb.style.liftEndRoadDecks&&Math.max(Math.abs(minX),Math.abs(maxX))<flatLimit;
    if(!allowed||Math.max(...pts.map(p=>p[1]))>=0)continue;
    const borders=polygons(f.geometry).flatMap(poly=>poly.flatMap(r=>r.slice(1).map((b,i)=>[r[i],b])));
    if(roads.every(road=>borders.some(line=>onBoundary(line,road.geometry)))){
     result.centerRoadDecks.push({id:idOf(f),height:s.height||.08,geometry:structuredClone(f.geometry)});
    }
   }
  }
  // The top-level garage is an open deck. A ten-metre overview extrusion puts
  // its visible roof above the actual level-three driveway surface.
  const garages=roads.filter(r=>r.garageGeometry);
  const area=poly=>poly.reduce((total,ring,i)=>{
   const o=ring[0];let a=0;for(let j=1;j<ring.length;j++)a+=(ring[j-1][0]-o[0])*(ring[j][1]-o[1])-(ring[j][0]-o[0])*(ring[j-1][1]-o[1]);
   return total+(i?-1:1)*Math.abs(a/2);
  },0);
  for(const f of mvf.space[result.overviewFloorId].features.filter(f=>s.polygons.includes(idOf(f)))){
   const size=polygons(f.geometry).reduce((n,p)=>n+area(p),0);
   // Synthetic outlines also cover the garage's stairs, cores and internal
   // voids, which are excluded from its navigable Space. Require a majority
   // match to the garage after the road cut has separated the buildings.
   if(size>0&&garages.some(g=>clipping.intersection(polygons(f.geometry),polygons(g.garageGeometry)).reduce((n,p)=>n+area(p),0)/size>.8))result.parkingDeckIds.push(idOf(f));
  }
  break;
 }
 if(result.overviewFloorId&&result.lowerBridges.length){
  const lowerElevation=mvf['floor.geojson']?.features?.find(f=>f.properties.id===result.lowerBridges[0].floorId)?.properties.elevation;
  for(const [key,s] of Object.entries(paint)){
   if(!key.startsWith('BuildingOutlines')||!key.endsWith('_'+lowerElevation))continue;
   result.bridgeOverviewBase=s.altitude||0;result.bridgeLevelAnchorIds=[...s.polygons];
   const bridgeCut=clipping.union(...result.lowerBridges.map(b=>polygons(b.geometry)));
   for(const item of all.filter(x=>x.floor===result.overviewFloorId&&s.polygons.includes(idOf(x.feature)))){
    const remainder=clipping.difference(polygons(item.feature.geometry),bridgeCut);
    if(!remainder.length)continue;
    item.feature.geometry={type:'Polygon',coordinates:remainder[0]};delete item.feature.bbox;
    for(let i=1;i<remainder.length;i++){
     const id=idOf(item.feature)+'-visual-bridge-'+i;
     mvf.space[item.floor].features.push({type:'Feature',properties:{...item.feature.properties,id,externalId:id},geometry:{type:'Polygon',coordinates:remainder[i]}});
     s.polygons.push(id);
    }
   }
  }
 }
 if(result.overviewFloorId){
  for(const target of result.targets){
   const refs=[];
   polygons(target.geometry).forEach((coordinates,i)=>{
    const id='s_access_'+target.id+'_'+i;refs.push(id);result.paintSources[id]=target.id;
    mvf.space[result.overviewFloorId].features.push({type:'Feature',properties:{id,externalId:id,destinationNodes:[]},geometry:{type:'Polygon',coordinates}});
   });
   const curb=target.style.role==='curbside',thickness=curb?.06:target.style.deckThickness??.25;
   paint['AccessRoadOverview_'+target.id]={color:colors[target.id]||target.style.color,opacity:curb?1:0,height:thickness,altitude:result.overviewTop-thickness+(curb?.025:0),polygons:refs};
  }
 }
 return result;
}

/** Metre-sized dashes follow each connected scan corridor and are clipped against polygon holes. */
export function createRoadMarkings(geometry,style={}){
 const polys=polygons(geometry);if(!polys.length)return{type:'FeatureCollection',features:[]};
 const origin=polys[0][0][0],sx=111320*Math.cos(origin[1]*Math.PI/180),sy=111320;
 const angle=(style.axisAngle??-37.15)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const project=p=>{const x=(p[0]-origin[0])*sx,y=(p[1]-origin[1])*sy;return[x*c-y*s,x*s+y*c]};
 const unproject=([x,y])=>[origin[0]+(x*c+y*s)/sx,origin[1]+(-x*s+y*c)/sy];
 const local=polys.map(p=>p.map(r=>r.map(project))),xs=local.flat(2).map(p=>p[0]);
 const step=2,length=style.dashLength??4,gap=style.dashGap??4,width=style.lineWidth??.15;
 const paths=[];let previous=[];
 for(let x=Math.min(...xs)+step/2;x<Math.max(...xs);x+=step){
  const centers=[];
  for(const poly of local){
   const hits=[];for(const ring of poly)for(let i=1;i<ring.length;i++){
    const a=ring[i-1],b=ring[i];if((a[0]<=x&&b[0]>x)||(b[0]<=x&&a[0]>x))hits.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));
   }
   hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2)if(hits[i+1]-hits[i]>width*5)centers.push([x,(hits[i]+hits[i+1])/2]);
  }
  const used=new Set(),next=[];
  for(const center of centers){
   const candidates=previous.filter(p=>!used.has(p)).sort((a,b)=>Math.abs(a.at(-1)[1]-center[1])-Math.abs(b.at(-1)[1]-center[1]));
   const path=candidates[0]&&Math.abs(candidates[0].at(-1)[1]-center[1])<15?candidates[0]:[];
   if(!path.length)paths.push(path);used.add(path);path.push(center);next.push(path);
  }
  previous=next;
 }
 const caps=(style.connectorCaps||[]).map(cap=>({...cap,edge:cap.edge.map(project),inward:[cap.inward[0]*c-cap.inward[1]*s,cap.inward[0]*s+cap.inward[1]*c]}));
 const centerlines=caps.length?repairRoadCenterlines(paths,local,caps,style.junctionBlendWidth??30):paths.map(points=>({kind:'main',points}));
 const output=[];
 for(const {kind,points:path} of centerlines){
  let travelled=0;
  for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i],dx=b[0]-a[0],dy=b[1]-a[1],distance=Math.hypot(dx,dy);
   if(travelled%(length+gap)<length){
    const nx=-dy/distance*width/2,ny=dx/distance*width/2;
    const ring=[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny],[a[0]+nx,a[1]+ny]].map(unproject);
    const clipped=clipping.intersection([ring],polys);
    for(const coordinates of clipped)output.push({type:'Feature',properties:{centerlineKind:kind},geometry:{type:'Polygon',coordinates}});
   }
   travelled+=distance;
  }
 }
 return{type:'FeatureCollection',features:output};
}

// Mappedin's auto floor gap rewrites native outline heights after parsing MVF.
// Resolve the actual rendered floor surface instead of using raw MVF's smaller altitude.
export function resolveRenderedRoadLevel(mapView,mapData,visuals,surfaceHeight=visuals.targets?.find(t=>t.style.role==='curbside')?.style.surfaceHeight??.08){
 if(Number.isFinite(visuals.renderedSourceBase))return visuals.renderedSourceBase+surfaceHeight;
 for(const id of visuals.levelAnchorIds||[]){
  const space=mapData.getById('space',id);if(!space)continue;
  try{const state=mapView.getState(space);if(Number.isFinite(state.altitude))return state.altitude+surfaceHeight}catch{}
 }
 return (visuals.overviewBase??visuals.overviewTop)+surfaceHeight;
}

// Updating a generated outline can reset its reported state to raw MVF
// altitude. Capture the SDK's original auto-floor-gap base before any paint,
// deck or opacity overrides, and reuse it when switching floors.
export function captureRenderedRoadLevel(mapView,mapData,visuals){
 const surfaceHeight=visuals.targets?.find(t=>t.style.role==='curbside')?.style.surfaceHeight??.08;
 const top=resolveRenderedRoadLevel(mapView,mapData,visuals,surfaceHeight);
 visuals.renderedSourceBase=top-surfaceHeight;return top;
}

/** Only the selected isolated median pieces move; footprints and materials stay intact. */
export function liftCenterRoadDeck(mapView,mapData,visuals,top){
 for(const deck of visuals.centerRoadDecks||[]){
  const space=mapData.getById('space',deck.id);
  if(space)mapView.updateState(space,{altitude:top-deck.height,height:deck.height,...(visuals.medianDeckColor?{color:visuals.medianDeckColor,hoverColor:visuals.medianDeckColor}:{})});
 }
}

export function installAccessRoadMarkings(mapView,mapData,visuals,getColors=()=>({})){
 const drawings=[],markings=visuals.targets.filter(t=>t.style.role==='road').map(t=>({target:t,geometry:createRoadMarkings(t.geometry,t.style)}));
 const models=[],cache=new Map();let currentKey=null;
 const refresh=()=>{
  const floor=mapView.currentFloor;if(!floor)return;
  if(floor.id===visuals.overviewFloorId&&!Number.isFinite(visuals.renderedSourceBase))captureRenderedRoadLevel(mapView,mapData,visuals);
  const top=resolveRenderedRoadLevel(mapView,mapData,visuals);
  const bridgeTop=resolveRenderedRoadLevel(mapView,mapData,{levelAnchorIds:visuals.bridgeLevelAnchorIds,overviewBase:visuals.bridgeOverviewBase??0},.08);
  visuals.renderedOverviewTop=top;
  visuals.renderedBridgeTop=bridgeTop;
  const colors=getColors(),key=floor.id+top+bridgeTop+JSON.stringify(markings.map(m=>colors[m.target.id]));
  if(key===currentKey)return;currentKey=key;
  for(const shape of drawings)mapView.Shapes.remove(shape);drawings.length=0;
  for(const model of models)mapView.Models.remove(model);models.length=0;
  for(const {target,geometry} of markings){
   const overview=floor.id===visuals.overviewFloorId;
   if((!overview&&floor.id!==target.floorId)||!geometry.features.length)continue;
   if(overview){
    const color=colors[target.id]||target.style.color||'#56616C',cacheKey=target.id+color+top;
    if(!cache.has(cacheKey)){
     const mesh=createAccessRoadMesh(target.geometry,visuals.origin,target.style,top,color,{markings:geometry,landings:target.landings});
     cache.set(cacheKey,URL.createObjectURL(new Blob([encodeRoadGLB(mesh)],{type:'model/gltf-binary'})));
    }
    models.push(mapView.Models.add(mapView.createCoordinate(visuals.origin[1],visuals.origin[0],floor),cache.get(cacheKey),{rotation:[0,0,0],scale:[1,1,1],verticalOffset:0,interactive:false}));
    continue;
   }
   drawings.push(mapView.Shapes.add(geometry,{color:target.style.lineColor||'#F4F1E4',height:.005,altitude:overview?visuals.overviewTop+.04:(target.style.surfaceHeight??.08)+.015,interactive:false},floor));
  }
  if(floor.id===visuals.overviewFloorId){
   liftCenterRoadDeck(mapView,mapData,visuals,top);
   visuals.renderedMedianGaps=[];
   for(const detail of visuals.roadsideDetails||[]){
    const color=detail.style.roadsideDetailColor||'#E2E8F0',cacheKey=detail.id+color+top;
    if(!cache.has(cacheKey)){
     const mesh=createAccessRoadMesh(detail.geometry,visuals.origin,detail.style,top,color,{decorations:false});
     cache.set(cacheKey,URL.createObjectURL(new Blob([encodeRoadGLB(mesh)],{type:'model/gltf-binary'})));
    }
    models.push(mapView.Models.add(mapView.createCoordinate(visuals.origin[1],visuals.origin[0],floor),cache.get(cacheKey),{rotation:[0,0,0],scale:[1,1,1],verticalOffset:0,interactive:false}));
    const space=mapData.getById('space',detail.id);
    if(space)mapView.updateState(space,{opacity:0});
   }
   for(const id of visuals.parkingDeckIds||[]){
    const space=mapData.getById('space',id);
    const thickness=visuals.targets.find(t=>t.garageGeometry)?.style.garageSurfaceHeight??.08;
    if(space)mapView.updateState(space,{altitude:top-thickness,height:thickness});
   }
   const curbStyle=visuals.targets.find(t=>t.style.role==='curbside')?.style||{};
   for(const bridge of visuals.lowerBridges){
    drawings.push(mapView.Shapes.add({type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:bridge.geometry}]},{color:curbStyle.lowerBridgeColor||'#CCD4DE',altitude:bridgeTop-(curbStyle.lowerBridgeDeckThickness??.35),height:curbStyle.lowerBridgeDeckThickness??.35,interactive:false},floor));
   }
   for(const [visualId,sourceId] of Object.entries(visuals.paintSources)){
    const target=visuals.targets.find(t=>t.id===sourceId);
    if(target?.style.role!=='curbside')continue;
    const space=mapData.getById('space',visualId);
    if(space)mapView.updateState(space,{altitude:top-.06+.025,height:.06});
   }
  }
 };
 mapView.on('floor-change',refresh);refresh();return refresh;
}
