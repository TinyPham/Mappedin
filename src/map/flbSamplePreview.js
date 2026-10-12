import {Coordinate} from '@mappedin/mappedin-js';
// Read-only SDK acceptance preview. Never registers or persists a bridge placement.
export function mountFlbSamplePreview({mapView,mapData,manifest,resolveUrl}){
 const panel=document.createElement('section');panel.className='flb-sample-preview';
 panel.innerHTML='<strong>Mẫu biển FLB 3D</strong><label>Số FLB <select aria-label="Số biển mẫu FLB"></select></label><label>Tư thế <select aria-label="Tư thế biển mẫu"><option value="90">Nằm trên mái (90°)</option><option value="0">Trục gốc GLB</option></select></label><button type="button">Xem mẫu trên 3D</button><button type="button">Đóng mẫu</button><p aria-live="polite">Chỉ xem mẫu; không gắn số vào cầu và không lưu database.</p>';
 document.body.append(panel);const [number,rotation]=panel.querySelectorAll('select'),[load,close]=panel.querySelectorAll('button'),status=panel.querySelector('p');
 for(const entry of manifest.entries){const option=document.createElement('option');option.value=entry.flbNo;option.textContent=entry.label;number.append(option);}
 let instance=null,version=0,queue=Promise.resolve(),savedCamera=null,savedFloor=null,savedElevation=null;
 const remove=()=>{if(instance){mapView.Models.remove(instance);instance=null;}};
 close.onclick=()=>{version++;remove();queue.finally(async()=>{if(savedCamera){if(savedFloor&&mapView.currentFloor?.id!==savedFloor)await mapView.setFloor(savedFloor);mapView.Camera.set(savedCamera);mapView.Camera.setElevation(savedElevation);}});panel.remove();};
 load.onclick=()=>{
  const token=++version,entry=manifest.entries.find(e=>e.flbNo===Number(number.value)),rot=Number(rotation.value);
  const center=mapView.Camera.center,floor=mapView.currentFloor;
  if(!center||!entry)return;
  if(!savedCamera){savedCamera={center,zoomLevel:mapView.Camera.zoomLevel,bearing:mapView.Camera.bearing,pitch:mapView.Camera.pitch};savedFloor=floor.id;savedElevation=mapView.Camera.elevation;}
  status.textContent='Đang tải model GLB mẫu…';
  queue=queue.catch(()=>{}).then(async()=>{
   if(token!==version)return;remove();
   const coordinate=mapView.createCoordinate(center.latitude,center.longitude,floor);
   const model=await mapView.Models.add(coordinate,resolveUrl(`${entry.assetUrl}?v=${entry.assetVersion}`),{rotation:[rot,0,0],scale:[1,1,1],interactive:false,verticalOffset:16});
   if(token!==version){mapView.Models.remove(model);return;}
   const raisedCenter=new Coordinate({latitude:center.latitude,longitude:center.longitude,floorId:floor.id,verticalOffset:16});
   mapView.Camera.setElevation((floor.elevation||0)+16);
   instance=model;await mapView.Camera.animateTo({center:raisedCenter,zoomLevel:22,pitch:35,bearing:mapView.Camera.bearing},{duration:600});
   status.textContent=`${entry.label} · model thật trên SDK · mẫu tạm, không lưu vị trí.`;
  }).catch(()=>{if(token===version)status.textContent='Không tải được model mẫu. Vui lòng kiểm tra kết nối backend.';});
 };
}
