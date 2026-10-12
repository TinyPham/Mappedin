const fs=require('node:fs'),path=require('node:path'),sql=require('mssql');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});
const rows=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../database/curbside-areas.json'),'utf8'));
async function main(){
 const pool=await sql.connect({server:process.env.DB_SERVER,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,options:{encrypt:process.env.DB_ENCRYPT!=='false',trustServerCertificate:process.env.DB_TRUST_SERVER_CERTIFICATE==='true'},connectionTimeout:10000,requestTimeout:30000});
 const allIds=rows.flatMap(r=>[r.id,...r.previousId?[r.previousId]:[]]);
 const request=pool.request();allIds.forEach((id,i)=>request.input('id'+i,sql.NVarChar(100),id));
 const idsClause=allIds.map((_,i)=>'@id'+i).join(',');
 const before=await request.query(`SELECT * FROM AreaList WHERE MappedinID IN (${idsClause}); SELECT i.* FROM AreaInformation i JOIN AreaList a ON a.AreaListID=i.AreaListID WHERE a.MappedinID IN (${idsClause}); SELECT * FROM AreaColorOverrides WHERE MappedinID IN (${idsClause}); IF OBJECT_ID(N'dbo.AreaVisualOverrides',N'U') IS NOT NULL SELECT * FROM AreaVisualOverrides WHERE MappedinID IN (${idsClause});`);
 const out=path.resolve(__dirname,'../diagnostics',process.argv[2]||'curbside-implementation-2026-10-11');fs.mkdirSync(out,{recursive:true});
 const backup=path.join(out,'database-backup-before-apply.json');if(!fs.existsSync(backup))fs.writeFileSync(backup,JSON.stringify(before.recordsets,null,2));
 const transaction=new sql.Transaction(pool);await transaction.begin();
 try{
  await transaction.request().query(fs.readFileSync(path.resolve(__dirname,'../database/patches/add_area_visual_overrides.sql'),'utf8'));
  for(const row of rows){
   if(row.previousId)await transaction.request().input('old',sql.NVarChar(100),row.previousId).input('new',sql.NVarChar(100),row.id).query(`
    IF EXISTS(SELECT 1 FROM AreaList WHERE MappedinID=@old) AND EXISTS(SELECT 1 FROM AreaList WHERE MappedinID=@new) THROW 50001,'Both area IDs already exist; review before migrating.',1;
    UPDATE AreaList SET MappedinID=@new WHERE MappedinID=@old;
    UPDATE AreaColorOverrides SET MappedinID=@new WHERE MappedinID=@old;
    UPDATE AreaVisualOverrides SET MappedinID=@new WHERE MappedinID=@old;
   `);
   const req=transaction.request().input('id',sql.NVarChar(100),row.id).input('floor',sql.NVarChar(100),row.floorId).input('color',sql.NVarChar(7),row.color).input('style',sql.NVarChar(sql.MAX),JSON.stringify(row.visual));
   for(const lang of ['vn','en','zh','ja','ko'])req.input(lang,sql.NVarChar(200),row.names[lang]).input('info'+lang,sql.NVarChar(sql.MAX),row.descriptions[lang]);
   await req.query(`
    IF NOT EXISTS(SELECT 1 FROM AreaList WITH(UPDLOCK,HOLDLOCK) WHERE MappedinID=@id) INSERT INTO AreaList(MappedinID,Name,VN,EN,ZH,JA,KO,FloorID) VALUES(@id,@vn,@vn,@en,@zh,@ja,@ko,@floor);
    ELSE UPDATE AreaList SET Name=@vn,VN=@vn,EN=@en,ZH=@zh,JA=@ja,KO=@ko,FloorID=@floor WHERE MappedinID=@id;
    DECLARE @area INT=(SELECT MIN(AreaListID) FROM AreaList WHERE MappedinID=@id);
    IF NOT EXISTS(SELECT 1 FROM AreaInformation WHERE AreaListID=@area) INSERT INTO AreaInformation(AreaListID,InformationVI,InformationEN,InformationZH,InformationJA,InformationKO) VALUES(@area,@infovn,@infoen,@infozh,@infoja,@infoko);
    ELSE UPDATE AreaInformation SET InformationVI=@infovn,InformationEN=@infoen,InformationZH=@infozh,InformationJA=@infoja,InformationKO=@infoko WHERE AreaListID=@area;
    MERGE AreaColorOverrides WITH(HOLDLOCK) AS t USING(SELECT @id AS MappedinID) AS s ON t.MappedinID=s.MappedinID WHEN MATCHED THEN UPDATE SET ColorHex=@color,UpdatedAt=SYSUTCDATETIME() WHEN NOT MATCHED THEN INSERT(MappedinID,ColorHex,UpdatedAt) VALUES(@id,@color,SYSUTCDATETIME());
    MERGE AreaVisualOverrides WITH(HOLDLOCK) AS t USING(SELECT @id AS MappedinID) AS s ON t.MappedinID=s.MappedinID WHEN MATCHED THEN UPDATE SET StyleJson=@style,UpdatedAt=SYSUTCDATETIME() WHEN NOT MATCHED THEN INSERT(MappedinID,StyleJson) VALUES(@id,@style);
   `);
  }
  await transaction.commit();
 }catch(e){await transaction.rollback();throw e}
 const check=pool.request();rows.forEach((r,i)=>check.input('id'+i,sql.NVarChar(100),r.id));
 const saved=(await check.query(`SELECT a.*,i.InformationVI,i.InformationEN,i.InformationZH,i.InformationJA,i.InformationKO,c.ColorHex,v.StyleJson FROM AreaList a JOIN AreaInformation i ON i.AreaListID=a.AreaListID JOIN AreaColorOverrides c ON c.MappedinID=a.MappedinID JOIN AreaVisualOverrides v ON v.MappedinID=a.MappedinID WHERE a.MappedinID IN (@id0,@id1,@id2)`)).recordset;
 for(const row of rows){const actual=saved.find(r=>r.MappedinID===row.id);if(!actual||actual.ColorHex!==row.color||JSON.stringify(JSON.parse(actual.StyleJson))!==JSON.stringify(row.visual)||['vn','en','zh','ja','ko'].some(lang=>actual[lang.toUpperCase()]!==row.names[lang]||actual['Information'+(lang==='vn'?'VI':lang.toUpperCase())]!==row.descriptions[lang]))throw Error('Saved area verification failed: '+row.id)}
 fs.writeFileSync(path.join(out,'database-after.json'),JSON.stringify(saved,null,2));
 console.log('Saved and verified 3 areas, 15 names, 15 descriptions, 3 colors and visual styles in '+process.env.DB_NAME+'.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>sql.close());
