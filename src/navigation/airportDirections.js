import {AirportPolicyError,createJourneyContext,resolveAirportPolicy} from './airportJourneyContext.js';
import {validateAirportRoute} from './airportRouteValidator.js';
export function createAirportDirections({mapData,config,getContext}){
 const floors=new Map(mapData.getByType('floor').map(f=>[f.id,f]));
 return async function airportDirections(from,to,options={}){
  const input=getContext();
  // Point-to-point navigation follows the Mappedin graph. Airport control-zone
  // constraints belong only to the separately validated procedure planner.
  if(input?.mode!=='procedure'){
   const route=await mapData.getDirections(from,to,options);
   if(!route)throw new AirportPolicyError('NO_ROUTE');
   return route;
  }
  const context=createJourneyContext(input,config),policy=resolveAirportPolicy(context,config);
  const zones=policy.zones.map(z=>{
   const floor=floors.get(z.floorId);if(!floor)throw new AirportPolicyError('MISSING_FLOOR');
   return {floor,geometry:z.geometry,cost:Infinity};
  });
  const route=await mapData.getDirections(from,to,{...options,accessible:context.mobility==='accessible',zones:[...(options.zones||[]),...zones]});
  if(!route)throw new AirportPolicyError('NO_PERMITTED_ROUTE');
  validateAirportRoute(route,policy.zones);
  return route;
 };
}
