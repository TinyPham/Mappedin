// Inspect by default; --apply updates only frontage UI icons and the parking presentation anchor.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),sql=require('mssql');
async function main(){
 const root=path.resolve(__dirname,'..');require('dotenv').config({path:path.join(root,'.env'),quiet:true});
 const {frontageAreaMarkers:areas}=await import(pathToFileURL(path.join(root,'src/map/frontageAreaMarkers.mjs')));
 assert.ok(['DB_SERVER','DB_NAME','DB_USER','DB_PASSWORD'].every(key=>process.env[key]),'Database configuration incomplete');
 for(const area of areas)assert.ok(fs.existsSync(path.join(root,area.icon.slice(1))),'Icon asset missing');
 const pool=await sql.connect({server:process.env.DB_SERVER,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,
  options:{encrypt:process.env.DB_ENCRYPT!=='false',trustServerCertificate:process.env.DB_TRUST_SERVER_CERTIFICATE==='true'},connectionTimeout:15000,requestTimeout:30000});
 const apply=process.argv.includes('--apply');let transaction;
 try{
  if(apply){transaction=new sql.Transaction(pool);await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);}
  const select=async()=>{
   const request=(transaction||pool).request();areas.forEach((area,i)=>request.input('mid'+i,sql.NVarChar(100),area.mappedinId));
   return(await request.query(`SELECT AL.AreaListID,AL.MappedinID,AL.FloorID,AL.Name,AI.InformationID,AI.UIImageUrl,V.StyleJson
    FROM dbo.AreaList AL LEFT JOIN dbo.AreaInformation AI ON AI.AreaListID=AL.AreaListID
    LEFT JOIN dbo.AreaVisualOverrides V ON V.MappedinID=AL.MappedinID
    WHERE AL.MappedinID IN (${areas.map((_,i)=>'@mid'+i).join(',')}) ORDER BY AL.MappedinID;`)).recordset;
  };
  const before=await select();assert.equal(before.length,areas.length,'Expected one row per frontage POI');
  for(const area of areas){const row=before.find(r=>r.MappedinID===area.mappedinId);assert.equal(row?.FloorID,area.floorId);assert.ok(['road','curbside'].includes(JSON.parse(row.StyleJson).role),'Missing approved visual style');}
  let saved=before;
  if(apply){
   const output=path.join(root,'diagnostics/curbside-markers-2026-10-12');fs.mkdirSync(output,{recursive:true});
   fs.writeFileSync(path.join(output,'database-before-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json'),JSON.stringify(before,null,2),{flag:'wx'});
   for(const area of areas){
    const row=before.find(r=>r.MappedinID===area.mappedinId);
    await transaction.request().input('id',sql.Int,row.AreaListID).input('icon',sql.NVarChar(500),area.icon).query(`
     IF EXISTS(SELECT 1 FROM dbo.AreaInformation WHERE AreaListID=@id) UPDATE dbo.AreaInformation SET UIImageUrl=@icon WHERE AreaListID=@id;
     ELSE INSERT dbo.AreaInformation(AreaListID,UIImageUrl) VALUES(@id,@icon);`);
    if(area.anchor){
     const style={...JSON.parse(row.StyleJson),markerAnchor:area.anchor};
     await transaction.request().input('id',sql.NVarChar(100),area.mappedinId).input('style',sql.NVarChar(sql.MAX),JSON.stringify(style))
      .query('UPDATE dbo.AreaVisualOverrides SET StyleJson=@style,UpdatedAt=SYSUTCDATETIME() WHERE MappedinID=@id;');
    }
   }
   saved=await select();assert.equal(saved.length,before.length);
   for(const area of areas){
    const row=saved.find(r=>r.MappedinID===area.mappedinId),prior=before.find(r=>r.MappedinID===area.mappedinId);
    assert.equal(row.UIImageUrl,area.icon);assert.equal(row.Name,prior.Name);assert.equal(row.FloorID,prior.FloorID);
    assert.deepEqual(JSON.parse(row.StyleJson),area.anchor?{...JSON.parse(prior.StyleJson),markerAnchor:area.anchor}:JSON.parse(prior.StyleJson));
   }
   await transaction.commit();transaction=null;
   fs.writeFileSync(path.join(output,'database-after.json'),JSON.stringify(saved,null,2));
  }
  console.log(JSON.stringify({applied:apply,areas:saved.map(r=>({id:r.MappedinID,name:r.Name,icon:r.UIImageUrl,anchor:JSON.parse(r.StyleJson).markerAnchor||null}))},null,2));
 }catch(error){if(transaction)await transaction.rollback().catch(()=>{});throw error;}finally{await pool.close();}
}
module.exports={main};
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
