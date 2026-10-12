const fs = require('node:fs');
const path = require('node:path');
const sql = require('mssql');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});
async function main() {
  if (!['DB_SERVER','DB_NAME','DB_USER','DB_PASSWORD'].every(key=>process.env[key])) {
    throw new Error('Database configuration is incomplete.');
  }
  const pool = await sql.connect({
    server:process.env.DB_SERVER,database:process.env.DB_NAME,
    user:process.env.DB_USER,password:process.env.DB_PASSWORD,
    options:{encrypt:process.env.DB_ENCRYPT!=='false',trustServerCertificate:process.env.DB_TRUST_SERVER_CERTIFICATE==='true'},
    connectionTimeout:10000,requestTimeout:20000
  });
  const keys=['not_found','error_nav','airport_policy_error'];
  const before=(await pool.request().query("SELECT KeyCode, KeyType, VN, EN, ZH, JA, KO FROM dbo.Translation_UI WHERE KeyCode IN ('not_found','error_nav','airport_policy_error')")).recordset;
  const backup=path.resolve(__dirname,'../diagnostics/route-unavailable-2026-10-11');
  fs.mkdirSync(backup,{recursive:true});
  const backupPath=path.join(backup,'translations-before.json');
  if(!fs.existsSync(backupPath))fs.writeFileSync(backupPath,JSON.stringify(before,null,2));
  const patch=fs.readFileSync(path.resolve(__dirname,'../database/patches/update_route_unavailable_translations.sql'),'utf8');
  const rows=(await pool.request().query(patch)).recordset;
  if(rows.length!==3||rows.some(row=>['VN','EN','ZH','JA','KO'].some(lang=>!row[lang])))throw new Error('Translation verification failed.');
  const initial=await pool.request().execute('SP_GetInitialData');
  const initialRows=initial.recordsets?.[1]||[];
  if(keys.some(key=>!initialRows.some(row=>row.KeyCode?.toLowerCase()===key&&row.VN===rows[0].VN)))throw new Error('Initial data translation verification failed.');
  console.log('Updated and verified 3 route message keys in VN/EN/ZH/JA/KO, including SP_GetInitialData.');
}
main().catch(error=>{console.error('Route message update failed:',error.message);process.exitCode=1;}).finally(()=>sql.close());
