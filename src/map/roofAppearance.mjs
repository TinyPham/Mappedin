import clipping from 'polygon-clipping';
import {createRoofDecorationMesh} from './roofDecorationMesh.mjs';
import {encodeRoofGLB} from './roofAppearanceMesh.mjs';

const polygons=g=>g?.type==='Polygon'?[g.coordinates]:g?.type==='MultiPolygon'?g.coordinates:[];
const geometry=coordinates=>({type:'MultiPolygon',coordinates});
const idOf=f=>f.properties?.id||f.id;
const allSpaces=mvf=>Object.entries(mvf.space||{}).flatMap(([floorId,fc])=>(fc.features||[]).map(f=>({floorId,id:idOf(f),geometry:f.geometry})));
const hex=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
export function isRoofAppearanceConfig(config){
 return !!(config?.enabled&&config.version===1&&config.mapId&&config.terminal?.floorIds?.length===5&&config.garage?.sourceSpaceId&&config.palette&&Object.values(config.palette).every(hex)&&Number.isFinite(config.axisAngle)&&config.render?.maxTriangles>0);
}

/** Bind colors to actual roof source floors; never edit MVF or navigation. */
export function prepareRoofAppearance(mvf,config,roads={}){
 const plan={surfaces:[],sources:{},origin:roads.origin,overviewFloorId:roads.overviewFloorId,config};
 if(!isRoofAppearanceConfig(config)||!roads.overviewFloorId||!roads.origin)return plan;
 const spaces=allSpaces(mvf),floorFeatures=mvf['floor.geojson']?.features||[],paint=mvf['styles.json']||{};
 for(const source of spaces)if(config.terminal.floorIds.includes(source.floorId))plan.sources[source.id]=structuredClone(source.geometry);
 config.terminal.floorIds.forEach((sourceFloorId,index)=>{
  const elevation=floorFeatures.find(f=>f.properties.id===sourceFloorId)?.properties.elevation;
  const sources=spaces.filter(s=>s.floorId===sourceFloorId);
  if(elevation==null||!sources.length)return;
  const sourceGeometry=clipping.union(...sources.map(s=>polygons(s.geometry)));
  if(!sourceGeometry.length)return;
  for(const [key,style] of Object.entries(paint)){
   if(!key.startsWith('BuildingOutlines')||!key.endsWith('_'+elevation))continue;
   for(const id of style.polygons||[]){
    const outline=spaces.find(s=>s.id===id&&s.floorId===roads.overviewFloorId);
    if(!outline||!clipping.intersection(polygons(outline.geometry),sourceGeometry).length)continue;
    plan.surfaces.push({id,kind:'terminal',tier:index+1,floorId:outline.floorId,sourceFloorId,geometry:structuredClone(outline.geometry),fallbackTop:(style.altitude||0)+(style.height||0)});
   }
  }
 });
 for(const id of roads.parkingDeckIds||[]){
  const outline=spaces.find(s=>s.id===id&&s.floorId===roads.overviewFloorId);
  if(outline)plan.surfaces.push({id,kind:'garage',floorId:outline.floorId,sourceFloorId:config.garage.sourceFloorId,geometry:structuredClone(outline.geometry),fallbackTop:roads.overviewTop});
 }
 for(const surface of plan.surfaces){
  const higher=plan.surfaces.filter(s=>s.kind==='terminal'&&surface.kind==='terminal'&&s.tier>surface.tier);
  surface.visibleGeometry=geometry(higher.length?clipping.difference(polygons(surface.geometry),...higher.map(s=>polygons(s.geometry))):polygons(surface.geometry));
 }
 return plan;
}

export function roofPaintStyle(surface,config){
 if(!isRoofAppearanceConfig(config))return undefined;
 const terminal=surface.kind==='terminal',p=config.palette;
 return{color:terminal?p.terminalSide:p.garageSide,topColor:terminal?p.terminalMetal:p.garageGrass,hoverColor:terminal?p.terminalSide:p.garageSide,interactive:false};
}

/** A fixed, non-interactive model per visible roof. No per-frame geometry work. */
export function installRoofAppearance(view,data,plan,getConfig=()=>plan.config,options={}){
 const models=[],cache=new Map(),original=new Map(),tops=new Map();let key='',configKey='',disposed=false;
 const metrics={models:0,triangles:0,cacheEntries:0,lastError:null,surfaces:[]};
 const config=()=>getConfig();
 const removeModels=()=>{for(const model of models)view.Models.remove(model);models.length=0;metrics.models=0;};
 const restore=()=>{
  removeModels();
  for(const [id,state] of original){const space=data.getById('space',id);if(space)view.updateState(space,state);}
  for(const entry of cache.values())URL.revokeObjectURL(entry.url);cache.clear();original.clear();tops.clear();key='';configKey='';metrics.cacheEntries=0;metrics.triangles=0;
 };
 const refresh=()=>{
  if(disposed)return;
  const cfg=config(),floor=view.currentFloor;
  if(!isRoofAppearanceConfig(cfg)){if(original.size||models.length)restore();return;}
  if(!floor)return;
  if(floor.id!==plan.overviewFloorId){removeModels();key='';return;}
  const signature=JSON.stringify(cfg),nextKey=floor.id+signature;
  if(key===nextKey)return;
  removeModels();key=nextKey;metrics.lastError=null;metrics.triangles=0;metrics.surfaces=[];
  if(configKey!==signature){
   for(const entry of cache.values())URL.revokeObjectURL(entry.url);
   cache.clear();configKey=signature;
  }
  for(const surface of plan.surfaces){
   const space=data.getById('space',surface.id);if(!space)continue;
   const state=view.getState(space);
   if(!original.has(surface.id))original.set(surface.id,{color:state.color,topColor:state.topColor??state.color,hoverColor:state.hoverColor??state.color,interactive:state.interactive??false});
   // Capture after the existing road controller has positioned the garage.
   if(!tops.has(surface.id))tops.set(surface.id,Number.isFinite(state.altitude)&&Number.isFinite(state.height)?state.altitude+state.height:surface.fallbackTop);
   const top=tops.get(surface.id);
   view.updateState(space,roofPaintStyle(surface,cfg));
   metrics.surfaces.push({id:surface.id,kind:surface.kind,tier:surface.tier,top,color:roofPaintStyle(surface,cfg).topColor});
   if(!surface.visibleGeometry.coordinates.length)continue;
   const cacheKey=surface.id+top+JSON.stringify(cfg);
   try{
    let entry=cache.get(cacheKey);
    if(!entry){
     const mesh=(options.meshFactory||createRoofDecorationMesh)(surface,plan.origin,top,cfg,plan.sources);
     const triangles=mesh.groups.reduce((n,g)=>n+g.positions.length/9,0);
     if(!mesh.groups.length)continue;
     entry={url:URL.createObjectURL(new Blob([encodeRoofGLB(mesh)],{type:'model/gltf-binary'})),triangles};
     cache.set(cacheKey,entry);
    }
    const triangles=entry.triangles;
    if(metrics.triangles+triangles>cfg.render.maxTriangles)throw Error('Roof decoration triangle budget exceeded');
    metrics.triangles+=triangles;
    models.push(view.Models.add(view.createCoordinate(plan.origin[1],plan.origin[0],floor),entry.url,{rotation:[0,0,0],scale:[1,1,1],verticalOffset:0,interactive:false}));
   }catch(error){metrics.lastError=String(error.message||error);}
  }
  metrics.models=models.length;metrics.cacheEntries=cache.size;
 };
 const styleForObject=obj=>{const surface=plan.surfaces.find(s=>s.id===obj?.id);return surface?roofPaintStyle(surface,config()):undefined;};
 const dispose=()=>{if(disposed)return;disposed=true;view.off?.('floor-change',refresh);restore();};
 view.on('floor-change',refresh);refresh();
 return{refresh,styleForObject,dispose,metrics};
}
