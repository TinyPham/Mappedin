import {splitRouteByFloor} from './journeyTimeline.js';
export function renderJourneyFloorplan(svg,{mapData,coordinates,floorId,position}){
 const ns='http://www.w3.org/2000/svg',shapes=['space','area','object'].flatMap(type=>mapData.getByType(type)).filter(o=>o.floor?.id===floorId&&['Polygon','MultiPolygon'].includes(o.geoJSON?.geometry?.type));
 const polygons=shapes.flatMap(o=>o.geoJSON.geometry.type==='Polygon'?[o.geoJSON.geometry.coordinates]:o.geoJSON.geometry.coordinates);
 const routeParts=splitRouteByFloor(coordinates).filter(p=>p.floorId===floorId);
 const points=[...polygons.flat(2),...routeParts.flatMap(p=>p.coordinates.map(c=>[c.longitude,c.latitude]))];
 if(!points.length){svg.replaceChildren();return;}
 const cos=Math.cos(points[0][1]*Math.PI/180),project=p=>[p[0]*cos,-p[1]];
 const projected=points.map(project),xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
 const bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
 const width=Math.max(320,svg.clientWidth||320),height=260,padding=14,scale=Math.min((width-2*padding)/(bounds[2]-bounds[0]||1),(height-2*padding)/(bounds[3]-bounds[1]||1));
 const xOffset=(width-(bounds[2]-bounds[0])*scale)/2,yOffset=(height-(bounds[3]-bounds[1])*scale)/2;
 const xy=p=>{const v=project(p);return [xOffset+(v[0]-bounds[0])*scale,yOffset+(v[1]-bounds[1])*scale];};
 const path=ring=>ring.map((p,i)=>(i?'L':'M')+xy(p).join(',')).join(' ')+'Z';
 const add=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);svg.append(e);return e;};
 svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
 for(const rings of polygons)add('path',{d:rings.map(path).join(' '),fill:'#edf2f8',stroke:'#b4c2d4','stroke-width':.6,'fill-rule':'evenodd'});
 for(const part of routeParts){if(part.coordinates.length<2)continue;add('path',{d:part.coordinates.map((c,i)=>(i?'L':'M')+xy([c.longitude,c.latitude]).join(',')).join(' '),fill:'none',stroke:'#214ca6','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'});}
 if(position&&position.floorId===floorId){const [cx,cy]=xy([position.longitude,position.latitude]);add('circle',{cx,cy,r:5,fill:'#e68d1a',stroke:'#fff','stroke-width':2});}
}
