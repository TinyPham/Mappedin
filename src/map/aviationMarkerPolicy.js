import {transitAccessAreaById} from './transitAccessAreas.mjs';
import {frontageAreaById} from './frontageAreaMarkers.mjs';

// Category IDs are stable database identities; display language never determines priority.
const REQUIRED = new Set([60,61,62,63,86,87,88,92,95,96,98,101,104,124,125,126,127,128,129,130,131,132,133,135,136,137,138,139,167,176,177,178,208]);
const VERTICAL = new Set([60,62]);
export function escapeMarkerHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function getAviationMarkerPolicy(object={},location=null,{zoom=15,gate=null,requiredCategoryIds=[],requiredObjectIds=[]}={}) {
 const category=Number(location?.subCategoryId??location?.SubCategoryID);
 const vertical=VERTICAL.has(category)||['elevator','escalator','stairway','stairs'].includes(String(object.type||'').toLowerCase());
 const accessArea=transitAccessAreaById.has(object.id);
 const frontageArea=frontageAreaById.has(object.id);
 const required=!vertical&&(accessArea||frontageArea||Boolean(gate)||REQUIRED.has(category)||requiredCategoryIds.includes(category)||requiredObjectIds.includes(object.id));
 return {required,accessArea,frontageArea,rank:required?'always-visible':'low',occlude:!required,dynamicResize:vertical,iconSize:24,
  showLabel:!vertical,iconOnly:vertical,label:gate?.gateNo!=null?`Gate ${Number(gate.gateNo)}`:null};
}
export function markerCoordinatesForFloor(object,currentFloorId,overviewFloorId){
 if(!currentFloorId||currentFloorId===overviewFloorId)return [];
 const points=object.coordinates?.length?object.coordinates:[object.coordinate||object.anchor||object.center||object.centroid];
 const seen=new Set();
 return points.filter(Boolean).map(c=>({...c,floorId:c.floorId||c.floor?.id||object.floorId||object.floor?.id})).filter(c=>Number.isFinite(c.latitude)&&Number.isFinite(c.longitude)&&c.floorId)
  .filter(c=>c.floorId===currentFloorId)
  .filter(c=>{const key=markerOwnershipKey(object.id,c);if(seen.has(key))return false;seen.add(key);return true;});
}
export function markerOwnershipKey(id,c){return `${id}:${c.floorId}:${c.sourceFloorId||c.floorId}:${Number(c.latitude).toFixed(7)}:${Number(c.longitude).toFixed(7)}`;}
