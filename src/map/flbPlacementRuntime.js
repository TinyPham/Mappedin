import {getFlbManifestEntry} from './flbModelPolicy.js';
const vector=v=>{try{return typeof v==='string'?JSON.parse(v):v;}catch{return null;}};
export function verifiedFlbRuntimeModels(models,manifest){
 const numbers=new Set(),result=[];
 for(const model of models){
  const entry=getFlbManifestEntry(model,manifest);if(!entry)continue;
  let desc;try{desc=JSON.parse((model.desc||model.description||'').replace(/\s*\[PUBLIC\]\s*$/,''));}catch{continue;}
  const rotation=vector(model.rotation),scale=vector(model.scale);
  const lat=model.latitude??model.originalCoordinate?.latitude,lon=model.longitude??model.originalCoordinate?.longitude;
  if(desc.role!=='flb-signage'||desc.placementStatus!=='verified'||desc.source!=='admin-map-placement'||desc.flbNo!==entry.flbNo||!model.uuid||!model.floorId||lat==null||lon==null||!Number.isFinite(Number(lat))||Math.abs(Number(lat))>90||!Number.isFinite(Number(lon))||Math.abs(Number(lon))>180||!Number.isFinite(Number(model.elevation??0))||!Array.isArray(rotation)||rotation.length!==3||rotation.some(n=>!Number.isFinite(n))||!Array.isArray(scale)||scale.length!==3||scale.some(n=>!Number.isFinite(n)||n<=0))continue;
  if(numbers.has(entry.flbNo))throw new Error('DUPLICATE_FLB');numbers.add(entry.flbNo);
  result.push({...model,rotation,scale,flbVerified:true,latitude:Number(model.latitude??model.originalCoordinate?.latitude),longitude:Number(model.longitude??model.originalCoordinate?.longitude)});
 }
 return result;
}
export function flbPickerCatalogue(manifest,models){
 const used=new Set(models.filter(m=>!m.flbProxySourceUuid).map(m=>getFlbManifestEntry(m,manifest)?.flbNo).filter(Boolean));
 return manifest.entries.filter(e=>!used.has(e.flbNo)).map(e=>({name:e.label,file:e.assetUrl,url:e.assetUrl,thumbnailUrl:e.thumbnailUrl,thumb:e.thumbnailUrl,scale:[1,1,1],rotation:[90,0,0],elevation:0,flbNo:e.flbNo}));
}
export function flbOverviewProxies(models,overviewFloorId,elevation){
 return models.filter(m=>m.floorId!==overviewFloorId).map(m=>({...m,uuid:`${m.uuid}--flb-overview`,floorId:overviewFloorId,elevation,flbProxySourceUuid:m.uuid,flbVerified:true}));
}
