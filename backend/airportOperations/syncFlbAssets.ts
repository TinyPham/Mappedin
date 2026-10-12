// Explicit, idempotent catalogue installation. Does not place any model on the map.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {getDbConnection,sql} from '../db';
import {syncAvailableModel} from '../availableModelSyncRepository';

async function main(){
 const root=path.resolve(__dirname,__filename.endsWith('.js')?'../../..':'../..');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'Model3D/flb/manifest.json'),'utf8'));
 const numbers=new Set(manifest.entries.map((e:any)=>e.flbNo));
 if(numbers.size!==32||manifest.entries.length!==32||manifest.entries.some((e:any)=>!Number.isInteger(e.flbNo)||e.flbNo<1||e.flbNo>32))throw new Error('Expected exactly FLB 01–32');
 for(const entry of manifest.entries){
  const expected=`/Model3D/flb/FLB-${String(entry.flbNo).padStart(2,'0')}.glb`;
  if(entry.assetUrl!==expected)throw new Error('Unexpected asset path');
  const hash=createHash('sha256').update(fs.readFileSync(path.join(root,expected))).digest('hex');
  if(hash!==entry.sha256)throw new Error('Asset hash mismatch');
 }
 const pool=await getDbConnection();if(!pool)throw new Error('Database unavailable');
 const before=await pool.request().query("SELECT * FROM dbo.AvailableModels WHERE FileName LIKE 'flb/FLB-%.glb'");
 const backupDir=path.join(root,'diagnostics/airport-operations');fs.mkdirSync(backupDir,{recursive:true});
 const backup=path.join(backupDir,`flb-catalog-before-${Date.now()}.json`);fs.writeFileSync(backup,JSON.stringify(before.recordset,null,2));
 const tx=new sql.Transaction(pool);await tx.begin();
 try{
  const transactionalPool={request:()=>new sql.Request(tx)} as any;
  for(const entry of manifest.entries)await syncAvailableModel(transactionalPool,sql,{modelName:entry.label,fileName:entry.assetUrl.slice('/Model3D/'.length),thumbnail:null,scale:[1,1,1],rotation:[90,0,0]});
  await tx.commit();
 }catch(error){await tx.rollback();throw error;}
 const after=await pool.request().query("SELECT FileName,ModelName FROM dbo.AvailableModels WHERE FileName LIKE 'flb/FLB-%.glb' AND IsActive=1");
 if(after.recordset.length!==32)throw new Error('Catalogue verification failed');
 console.log(JSON.stringify({installedAssets:32,placedInstances:0,backup:path.relative(root,backup)}));
 await pool.close();
}
main().catch(error=>{console.error('FLB catalogue installation failed:',error.message);process.exit(1);});
