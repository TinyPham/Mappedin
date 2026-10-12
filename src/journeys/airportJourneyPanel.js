import {renderJourneyFloorplan} from './journeyFloorplan2D.js';
import {resolveJourneyScenario} from './airportJourneyScenarios.js';
export function mountAirportJourneyPanel({mapData,config,onPreferencesChange,onPlay}){
 const instructions=document.getElementById('instructions-list');if(!instructions)return null;
 const panel=document.createElement('details');panel.className='airport-journey-panel';panel.innerHTML=`<summary>Luồng hành khách · bản đồ 2D / 3D</summary>
 <div class="airport-journey-fields"><label>Khai thác<select data-field="profileId"><option value="full-t1">Nhà ga đầy đủ</option><option value="initial-operations">Giai đoạn ban đầu</option></select></label>
 <label>Hành trình<select data-field="journeyKind"><option value="">Chỉ đường tới điểm</option><option value="departure">Luồng đi đầy đủ</option><option value="arrival">Luồng đến đầy đủ</option><option value="transfer">Nối chuyến</option></select></label>
 <label>Loại nối chuyến<select data-field="transferKind"><option value="II">Quốc tế → quốc tế</option><option value="DI">Nội địa → quốc tế</option><option value="DD">Nội địa → nội địa</option><option value="ID">Quốc tế → nội địa</option></select></label>
 <label>Loại chuyến<select data-field="trafficClass"><option value="">Tự nhận diện</option><option value="domestic">Nội địa</option><option value="international">Quốc tế</option></select></label>
 <label><input type="checkbox" data-field="mobility"> Đường đi hỗ trợ xe lăn</label>
 <label><input type="checkbox" data-field="followCamera" checked> Camera quay theo đường đi</label></div>
 <label>Tầng trên bản đồ 2D <select class="airport-2d-floor" aria-label="Tầng bản đồ 2D"></select></label>
 <svg class="airport-floorplan" role="img" aria-label="Mặt bằng theo tầng và tuyến đi đã kiểm tra"></svg>
 <p class="airport-journey-message" aria-live="polite">Chọn điểm đi và điểm đến để xem tuyến cùng luồng.</p>
 <ol class="airport-procedure-list" hidden></ol><button class="airport-procedure-preview" type="button" hidden>Minh họa quy trình</button>
 <button type="button" class="airport-journey-play" disabled>Trình diễn tuyến trên 3D</button>`;
 instructions.before(panel);let route=null,position=null,lastContext=null,procedureTimer=null;
 const svg=panel.querySelector('svg'),floorSelect=panel.querySelector('.airport-2d-floor'),message=panel.querySelector('.airport-journey-message'),play=panel.querySelector('.airport-journey-play');
 const render=()=>{if(route)renderJourneyFloorplan(svg,{mapData,coordinates:route.coordinates,floorId:floorSelect.value,position});else svg.replaceChildren();};
 const labels={'checkin':'Làm thủ tục check-in','boarding-validation':'Đối chiếu thẻ lên tàu bay','domestic-security':'Soi chiếu nội địa','emigration':'Xuất cảnh','international-security-customs':'Soi chiếu an ninh / hải quan','domestic-airside':'Khu cách ly nội địa','international-airside':'Khu cách ly quốc tế','departure-gate':'Gate khởi hành','health':'Kiểm dịch','immigration':'Nhập cảnh','baggage':'Khu nhận hành lý','arrival-customs':'Hải quan đến','arrival-public':'Sảnh công cộng','exit':'Cửa ra / nhà xe','transfer-desk':'Quầy nối chuyến','transfer-security-customs':'Soi chiếu trung chuyển'};
 const list=panel.querySelector('.airport-procedure-list'),preview=panel.querySelector('.airport-procedure-preview');
 const preferences=()=>{const value={};for(const f of panel.querySelectorAll('[data-field]')){const key=f.dataset.field;value[key]=f.type==='checkbox'?(key==='mobility'?(f.checked?'accessible':'standard'):f.checked):f.value||undefined;}
  value.requireProcedure=Boolean(value.journeyKind);if(value.journeyKind==='transfer'){value.transferFrom=value.transferKind[0]==='I'?'international':'domestic';value.transferTo=value.transferKind[1]==='I'?'international':'domestic';}return value;};
 const renderProcedure=()=>{
  clearInterval(procedureTimer);const value=preferences();list.replaceChildren();list.hidden=!value.requireProcedure;preview.hidden=!value.requireProcedure;
  if(!value.requireProcedure)return;
  const scenario=resolveJourneyScenario({...value,trafficClass:value.trafficClass||lastContext?.trafficClass||'domestic',profileId:value.profileId||config.defaultProfile},{profiles:config.profiles,checkpointRegistry:config.checkpointRegistry||{}});
  for(const step of scenario.steps){const li=document.createElement('li');li.textContent=labels[step.role]||step.role;list.append(li);}
  message.textContent=scenario.availability==='available'?'Quy trình có cấu hình lối đi được xác nhận.':'Quy trình minh họa; luồng dẫn đường đang chờ xác nhận các cửa và lối kiểm soát.';
 };
 preview.addEventListener('click',()=>{clearInterval(procedureTimer);const rows=[...list.children];rows.forEach(r=>r.classList.remove('airport-stage-active'));let i=0;const tick=()=>{rows.forEach((r,j)=>r.classList.toggle('airport-stage-active',j===i));i++;if(i>=rows.length)clearInterval(procedureTimer);};tick();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)procedureTimer=setInterval(tick,1000);});
 for(const el of panel.querySelectorAll('[data-field]'))el.addEventListener('change',()=>{
  renderProcedure();onPreferencesChange(preferences());
 });
 floorSelect.addEventListener('change',render);play.addEventListener('click',onPlay);
 new ResizeObserver(render).observe(svg);
 return {setRoute(value){route=value;if(route)lastContext=route.context;position=null;play.disabled=!route;floorSelect.replaceChildren();
  if(!route){message.textContent='Chọn điểm đi và điểm đến để xem tuyến cùng luồng.';render();renderProcedure();return;}
  for(const id of new Set(route.coordinates.map(c=>c.floorId||c.floor?.id))){const opt=document.createElement('option');opt.value=id;opt.textContent=mapData.getByType('floor').find(f=>f.id===id)?.name||id;floorSelect.append(opt);}
  message.textContent=`${route.context.trafficClass==='domestic'?'Nội địa':route.context.trafficClass==='international'?'Quốc tế':'Khu công cộng'} · tuyến dùng chung cho 2D và 3D`;render();
 },setPosition(value){position={...value,floorId:value.floorId||value.floor?.id};if([...floorSelect.options].some(o=>o.value===position.floorId))floorSelect.value=position.floorId;render();}};
}
