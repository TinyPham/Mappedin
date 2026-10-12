export class AirportPolicyError extends Error {
 constructor(code,message=code){super(message);this.name='AirportPolicyError';this.code=code;}
}
const endpointId=o=>typeof o==='string'?o:o?.id||o?.mappedinId;
const profileAt=(config,id)=>config.profiles instanceof Map?config.profiles.get(id)
 : config.profiles&&Object.hasOwn(config.profiles,id)?config.profiles[id]:undefined;

// Endpoint openness is configuration policy, independent of procedure progress.
// Unmapped physical endpoints do not need a fabricated airport classification.
export function assertAirportEndpointOpen(endpoint,profileId,config){
 const id=endpointId(endpoint);
 const counter=(config.counters||[]).find(c=>c.mappedinId===id);
 const gate=(config.gates||[]).find(g=>g.mappedinId===id);
 const belt=(config.belts||[]).find(b=>b.mappedinId===id);
 if(!counter&&!gate&&!belt)return;
 const profile=profileAt(config,profileId);
 if(!profile)throw new AirportPolicyError('UNKNOWN_PROFILE');
 if(counter&&(!profile.openIslands?.includes(counter.island)
   ||counter.counterNo>(profile.counterLimits?.[counter.island]??Infinity)))throw new AirportPolicyError('ENDPOINT_CLOSED');
 if(gate&&!profile.openGateNos?.includes(gate.gateNo))throw new AirportPolicyError('ENDPOINT_CLOSED');
 if(belt&&profileId==='initial-operations'&&belt.beltNo>5)throw new AirportPolicyError('ENDPOINT_CLOSED');
}
export function createJourneyContext(input={},config){
 const profileId=input.profileId||config.defaultProfile,profile=profileAt(config,profileId);
 const physical=input.mode==='physical';
 if(!profile&&!physical)throw new AirportPolicyError('UNKNOWN_PROFILE');
 const byCounter=new Map(config.counters.map(c=>[c.mappedinId,c])),byGate=new Map(config.gates.map(g=>[g.mappedinId,g])),byBelt=new Map((config.belts||[]).map(b=>[b.mappedinId,b]));
 const endpoints=[input.origin,...(input.stopovers||[]),input.destination].filter(Boolean);
 const classes=[];
 for(const endpoint of endpoints){
  const id=endpointId(endpoint),counter=byCounter.get(id),gate=byGate.get(id);
  if(!physical)assertAirportEndpointOpen(endpoint,profileId,config);
  if(counter){
   classes.push(counter.trafficClass);
  }
  if(gate&&gate.trafficClass)classes.push(gate.trafficClass);
  const belt=byBelt.get(id);if(belt)classes.push(belt.trafficClass);
 }
 const journeyKind=physical?'physical':input.journeyKind||((byCounter.has(endpointId(input.origin))||byGate.has(endpointId(input.destination)))?'departure':'physical');
 const trafficClass=physical?null:(input.trafficClass||(journeyKind==='transfer'?input.transferFrom:classes[0])||null);
 if(!physical&&journeyKind!=='transfer'&&classes.some(c=>trafficClass&&c!==trafficClass))throw new AirportPolicyError('TRAFFIC_MISMATCH');
 if(input.trafficClass&&!['domestic','international'].includes(input.trafficClass))throw new AirportPolicyError('UNKNOWN_TRAFFIC');
 if(journeyKind==='arrival'&&!trafficClass)throw new AirportPolicyError('UNKNOWN_TRAFFIC');
 return {requestId:input.requestId,configVersion:config.version,profileId,journeyKind,trafficClass,
  transferFrom:input.transferFrom,transferTo:input.transferTo,stage:'public',mobility:input.mobility||'standard',
  originEndpointId:endpointId(input.origin),destinationEndpointId:endpointId(input.destination),checkpointHistory:[],flightContext:input.flightContext||null};
}
export function resolveAirportPolicy(context,config){
 if(context.journeyKind==='physical')return {blockedRoles:[],zones:[],context};
 let blockedRoles=[];
 // Generic routing never treats a supplied stage/history as procedure clearance.
 // The procedure planner resolves its own per-leg constraints from policy state.
 const arrival=context.journeyKind==='arrival';
 if(arrival){blockedRoles=context.trafficClass==='international'?['emigration','domestic-security']:['emigration','international-security','immigration','arrival-customs'];}
 else if(context.trafficClass==='domestic')blockedRoles=['international-security','emigration','immigration','arrival-customs'];
 else if(context.trafficClass==='international')blockedRoles=['domestic-security','immigration','arrival-customs'];
 else blockedRoles=['domestic-security','international-security','emigration','immigration','arrival-customs'];
 return {blockedRoles,zones:config.zones.filter(z=>blockedRoles.includes(z.role)),context};
}
