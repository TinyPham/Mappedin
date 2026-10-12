// Route changes and playback changes are separate: seeking/restarting the same
// route must invalidate frames that are waiting for an asynchronous floor change.
export function createPlaybackLifecycle(getRouteVersion) {
 let epoch=0,queue=Promise.resolve();
 const capture=()=>({epoch,routeVersion:getRouteVersion()});
 const isCurrent=token=>token.epoch===epoch&&token.routeVersion===getRouteVersion();
 return {
  capture,isCurrent,
  invalidate(){epoch++;return capture();},
  changeFloor(token,floorId,mapView){
   queue=queue.catch(()=>{}).then(async()=>{
    if(!isCurrent(token))return false;
    if(floorId&&floorId!==mapView.currentFloor?.id)await mapView.setFloor(floorId);
    return isCurrent(token);
   });
   return queue;
  }
 };
}
