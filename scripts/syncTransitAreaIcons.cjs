// Inspect by default; --apply persists only the eight Transit area UI images.
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const sql = require('mssql');

async function main() {
  const root = path.resolve(__dirname, '..');
  require('dotenv').config({path:path.join(root,'.env'),quiet:true});
  const {transitAccessAreas:areas} = await import(pathToFileURL(path.join(root,'src/map/transitAccessAreas.mjs')));
  assert.ok(['DB_SERVER','DB_NAME','DB_USER','DB_PASSWORD'].every(key=>process.env[key]), 'Database configuration incomplete');
  for (const area of areas) {
    assert.ok(['/icon-category/airside.png','/icon-category/landside.png'].includes(area.icon));
    assert.ok(fs.existsSync(path.join(root,area.icon.slice(1))), 'Icon asset missing');
  }
  const pool = await sql.connect({server:process.env.DB_SERVER,database:process.env.DB_NAME,
    user:process.env.DB_USER,password:process.env.DB_PASSWORD,
    options:{encrypt:process.env.DB_ENCRYPT!=='false',trustServerCertificate:process.env.DB_TRUST_SERVER_CERTIFICATE==='true'},
    connectionTimeout:15000,requestTimeout:30000});
  const apply = process.argv.includes('--apply');
  let transaction;
  try {
    if (apply) {
      transaction = new sql.Transaction(pool);
      await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    }
    const select = async () => {
      const request = (transaction || pool).request();
      areas.forEach((area,i)=>request.input(`mid${i}`,sql.NVarChar(100),area.mappedinId));
      return (await request.query(`SELECT AL.AreaListID,AL.MappedinID,AL.FloorID,AL.Name,
        AI.InformationID,AI.UIImageUrl,AI.MappedinImageUrl
        FROM dbo.AreaList AL LEFT JOIN dbo.AreaInformation AI ON AI.AreaListID=AL.AreaListID
        WHERE AL.MappedinID IN (${areas.map((_,i)=>`@mid${i}`).join(',')}) ORDER BY AL.MappedinID;`)).recordset;
    };
    const before = await select();
    assert.equal(before.length,areas.length,'Expected exactly one row for each configured Transit area');
    for (const area of areas) assert.equal(before.find(row=>row.MappedinID===area.mappedinId)?.FloorID,area.floorId,'Transit floor mismatch');
    let saved = before;
    if (apply) {
      const output = path.join(root,'diagnostics/transit-area-icons-2026-10-12');
      fs.mkdirSync(output,{recursive:true});
      const stamp = new Date().toISOString().replace(/[:.]/g,'-');
      fs.writeFileSync(path.join(output,`database-before-${stamp}.json`),JSON.stringify(before,null,2),{flag:'wx'});
      for (const area of areas) {
        const row = before.find(row=>row.MappedinID===area.mappedinId);
        await transaction.request().input('areaId',sql.Int,row.AreaListID)
          .input('icon',sql.NVarChar(500),area.icon).query(`
            IF EXISTS (SELECT 1 FROM dbo.AreaInformation WHERE AreaListID=@areaId)
              UPDATE dbo.AreaInformation SET UIImageUrl=@icon WHERE AreaListID=@areaId;
            ELSE INSERT INTO dbo.AreaInformation (AreaListID,UIImageUrl) VALUES (@areaId,@icon);`);
      }
      saved = await select();
      assert.equal(saved.length,before.length);
      for (const area of areas) {
        const row = saved.find(row=>row.MappedinID===area.mappedinId);
        assert.equal(row.UIImageUrl,area.icon);
        assert.equal(row.MappedinImageUrl,before.find(item=>item.MappedinID===area.mappedinId).MappedinImageUrl);
      }
      await transaction.commit();
      transaction = null;
      fs.writeFileSync(path.join(output,'database-after.json'),JSON.stringify(saved,null,2));
    }
    console.log(JSON.stringify({applied:apply,areas:saved.map(row=>({mappedinId:row.MappedinID,floorId:row.FloorID,name:row.Name,icon:row.UIImageUrl}))},null,2));
  } catch (error) {
    if (transaction) await transaction.rollback().catch(()=>{});
    throw error;
  } finally {await pool.close();}
}
module.exports = {main};
if (require.main===module) main().catch(error=>{console.error(error.message);process.exitCode=1;});
