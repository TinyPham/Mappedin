// Passenger guidance is informational; Mappedin remains responsible for geometry.
// Unknown points stay unknown. A floor number or a gate's physical location is
// never evidence that a passenger has cleared a controlled checkpoint.
const endpointId = endpoint => typeof endpoint === 'string' ? endpoint : endpoint?.mappedinId || endpoint?.id;
const plainText = value => typeof value === 'string' ? value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d') : '';

export function classifyAirportEndpoint(endpoint,config,locations={}){
 const id=endpointId(endpoint);
 const counter=(config.counters||[]).find(c=>c.mappedinId===id);
 if(counter)return {kind:'checkin',traffic:counter.trafficClass};
 const gate=(config.gates||[]).find(g=>g.mappedinId===id);
 if(gate)return {kind:'airside',traffic:gate.trafficClass};
 const belt=(config.belts||[]).find(b=>b.mappedinId===id);
 if(belt)return {kind:'baggage',traffic:belt.trafficClass};

 const loc=locations[id]||{};
 const texts=[loc.names?.vn,loc.names?.en,loc.subCategoryNames?.vn,loc.subCategoryNames?.en,
  loc.VN,loc.EN,loc.SubCategoryVN,loc.SubCategoryEN,endpoint?.name]
  .map(plainText).filter(Boolean).join(' | ');
 const domestic=/quoc noi|noi dia|domestic/.test(texts);
 const international=/quoc te|international|intl/.test(texts);
 const traffic=international&&!domestic?'international':domestic&&!international?'domestic':null;
 if(/nhan vien|noi bo|han che|cam vao|staff.only|restricted|authorized.personnel/.test(texts))return {kind:'restricted',traffic};
 if(/an ninh soi chieu|kiem tra an ninh|security (screening|check|checkpoint)|kiem soat xuat nhap canh|passport control|immigration|emigration|hai quan|customs/.test(texts))return {kind:'checkpoint',traffic};
 if(/quay check.in|check.in counter|check.in desk|kiosk check.in/.test(texts))return {kind:'checkin',traffic};
 if(/bang chuyen hanh ly|nhan hanh ly|baggage claim|baggage reclaim/.test(texts))return {kind:'baggage',traffic};
 if(/ga den|khu den|arrival (corridor|hall|area)|domestic arrival|international arrival/.test(texts))return {kind:'arrival',traffic};
 if(/phong cho ga di|khu ga di|departure lounge|(?:domestic|international) departure|boarding (lounge|gate|area)|khu cach ly|airside/.test(texts))return {kind:'airside',traffic};
 if(/sanh cong cong|khu cong cong|public (hall|area|zone)|khu vuc cong cong/.test(texts))return {kind:'public',traffic:null};
 return {kind:'unknown',traffic:null};
}

function legNotice(from,to){
 if(to.kind==='restricted')return 'rn_staff_access';
 if(to.kind==='checkpoint')return 'rn_security_checkpoint';
 if(to.kind==='baggage'||to.kind==='arrival'){
  if((from.kind==='arrival'||from.kind==='baggage')&&from.traffic===to.traffic)return null;
  return to.traffic==='international'?'rn_intl_arrival_area':to.traffic==='domestic'?'rn_dom_arrival_area':null;
 }
 if(to.kind==='airside'){
  if((from.kind==='airside'||from.kind==='arrival'||from.kind==='baggage')&&from.traffic&&to.traffic){
   if(from.kind==='airside'&&from.traffic===to.traffic)return null;
   const code=(from.traffic==='domestic'?'d':'i')+(to.traffic==='domestic'?'d':'i');
   return `rn_transfer_${code}`;
  }
  if(from.kind==='checkin'&&from.traffic&&to.traffic&&from.traffic!==to.traffic)
   return to.traffic==='international'?'rn_intl_from_domestic_checkin':'rn_dom_from_international_checkin';
  return to.traffic==='international'?'rn_intl_departure':to.traffic==='domestic'?'rn_dom_departure':
   'rn_departure_check';
 }
 if(to.kind==='checkin'){
  if(from.kind==='airside')return 'rn_leave_airside';
  if(from.kind==='checkin'&&from.traffic&&to.traffic&&from.traffic!==to.traffic)
   return to.traffic==='international'?'rn_checkin_intl_from_dom':'rn_checkin_dom_from_intl';
 }
 if(to.kind==='public'){
  if(from.kind==='arrival'||from.kind==='baggage')
   return from.traffic==='international'?'rn_intl_arrival_exit':from.traffic==='domestic'?'rn_dom_arrival_exit':null;
  if(from.kind==='airside')return 'rn_leave_airside';
 }
 return null;
}

export function getAirportRouteNoticeKeys({origin,destination,stopovers=[]},config,locations={}){
 const endpoints=[origin,...stopovers,destination].filter(Boolean);
 const result=[];
 for(let i=1;i<endpoints.length;i++){
  const key=legNotice(classifyAirportEndpoint(endpoints[i-1],config,locations),
   classifyAirportEndpoint(endpoints[i],config,locations));
  if(key&&!result.includes(key))result.push(key);
 }
 return result;
}
