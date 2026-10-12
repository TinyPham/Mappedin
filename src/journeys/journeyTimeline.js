export const coordinateFloor=c=>c.floorId||c.floor?.id;
export function splitRouteByFloor(coordinates){
 const parts=[];for(const c of coordinates){const floorId=coordinateFloor(c);let part=parts.at(-1);if(!part||part.floorId!==floorId){part={floorId,coordinates:[]};parts.push(part);}part.coordinates.push(c);}return parts;
}
export function interpolateBearing(current,target,amount=.35){const delta=((target-current+540)%360)-180;return current+delta*Math.max(0,Math.min(1,amount));}
const distance=(a,b)=>Math.hypot((a.longitude-b.longitude)*Math.cos(a.latitude*Math.PI/180),a.latitude-b.latitude);
export function sampleJourneyRoute(coordinates,fraction){
 if(!coordinates.length)return null;
 if(fraction<=0)return {latitude:coordinates[0].latitude,longitude:coordinates[0].longitude,floorId:coordinateFloor(coordinates[0]),routeIndex:0};
 if(fraction>=1){const last=coordinates.at(-1);return {latitude:last.latitude,longitude:last.longitude,floorId:coordinateFloor(last),routeIndex:coordinates.length-1};}
 const distances=[0];for(let i=1;i<coordinates.length;i++)distances.push(distances[i-1]+(coordinateFloor(coordinates[i])===coordinateFloor(coordinates[i-1])?distance(coordinates[i],coordinates[i-1]):0));
 const target=distances.at(-1)*Math.max(0,Math.min(1,fraction));let i=1;while(i<distances.length-1&&(distances[i]<target||(distances[i]===target&&distances[i+1]===target)))i++;
 const a=coordinates[Math.max(0,i-1)],b=coordinates[i]||a;
 if(coordinateFloor(a)!==coordinateFloor(b))return {...b,routeIndex:i};
 const length=distances[i]-distances[i-1],t=length?(target-distances[i-1])/length:0;
 return {latitude:a.latitude+(b.latitude-a.latitude)*t,longitude:a.longitude+(b.longitude-a.longitude)*t,floorId:coordinateFloor(a),routeIndex:i-1+t};
}
export function routeLookAheadBearing(coordinates,current){
 const floorId=coordinateFloor(current);let index=-1;
 if(Number.isFinite(current.routeIndex))index=Math.max(0,Math.min(coordinates.length-1,Math.round(current.routeIndex)));
 if(index<0||coordinateFloor(coordinates[index])!==floorId){index=-1;for(let i=0;i<coordinates.length;i++)if(coordinateFloor(coordinates[i])===floorId&&(index<0||distance(coordinates[i],current)<distance(coordinates[index],current)))index=i;}
 if(index<0)return null;
 let start=index,end=index;while(start>0&&coordinateFloor(coordinates[start-1])===floorId)start--;while(end<coordinates.length-1&&coordinateFloor(coordinates[end+1])===floorId)end++;
 if(start===end)return null;
 const a=coordinates[Math.max(start,index-1)],b=coordinates[Math.min(end,index+3)];
 return Math.atan2((b.longitude-a.longitude)*Math.cos(a.latitude*Math.PI/180),b.latitude-a.latitude)*180/Math.PI;
}
