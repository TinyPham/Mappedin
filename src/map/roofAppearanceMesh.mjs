import {encodeRoadGLB} from './accessRoadMesh.mjs';

/** Keep the proven geographic model frame; flat roof colors avoid PBR overexposure. */
export function encodeRoofGLB(mesh){
 const original=encodeRoadGLB(mesh),view=new DataView(original.buffer,original.byteOffset,original.byteLength);
 const jsonLength=view.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(original.subarray(20,20+jsonLength)));
 json.asset.generator='Airport roof appearance';
 json.meshes[0].name='Roof surface decoration';
 json.extensionsUsed=['KHR_materials_unlit'];
 for(const material of json.materials)material.extensions={KHR_materials_unlit:{}};
 const text=new TextEncoder().encode(JSON.stringify(json)),paddedLength=Math.ceil(text.length/4)*4;
 const binary=original.subarray(20+jsonLength+8),out=new Uint8Array(12+8+paddedLength+8+binary.length),header=new DataView(out.buffer);
 header.setUint32(0,0x46546c67,true);header.setUint32(4,2,true);header.setUint32(8,out.length,true);
 header.setUint32(12,paddedLength,true);header.setUint32(16,0x4e4f534a,true);out.fill(32,20,20+paddedLength);out.set(text,20);
 const offset=20+paddedLength;header.setUint32(offset,binary.length,true);header.setUint32(offset+4,0x004e4942,true);out.set(binary,offset+8);
 return out;
}
