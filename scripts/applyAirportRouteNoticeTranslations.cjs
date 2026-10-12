// Apply the idempotent, multilingual airport route notice patch to the configured SQL Server.
// Run from the project root: node scripts/applyAirportRouteNoticeTranslations.cjs
const fs = require('node:fs');
const path = require('node:path');
const sql = require('mssql');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

async function main() {
  if (!process.env.DB_SERVER || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    throw new Error('DB_SERVER, DB_NAME, DB_USER and DB_PASSWORD must be configured in .env');
  }
  const pool = await sql.connect({
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: process.env.DB_ENCRYPT !== 'false',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
    },
    connectionTimeout: 10000,
    requestTimeout: 20000
  });
  const patch = fs.readFileSync(path.resolve(__dirname, '../database/patches/add_airport_route_notice_translations.sql'), 'utf8');
  const rows = (await pool.request().query(patch)).recordset;
  const noticeRows = rows.filter(row => row.KeyCode.startsWith('rn_'));
  if (noticeRows.length !== 19 || noticeRows.some(row => ['VN', 'EN', 'ZH', 'JA', 'KO'].some(lang => !row[lang]))) {
    throw new Error('Translation verification failed: expected 19 complete rows in 5 languages.');
  }
  const initData = await pool.request().execute('SP_GetInitialData');
  const initKeys = new Set((initData.recordsets?.[1] || []).map(row => row.KeyCode?.toLowerCase()));
  if (noticeRows.some(row => !initKeys.has(row.KeyCode.toLowerCase()))) {
    throw new Error('SP_GetInitialData does not expose all airport notice translations to /api/init-data.');
  }
  console.log('Applied and verified 19 airport route notice keys (VN/EN/ZH/JA/KO), including SP_GetInitialData.');
}

main().catch(error => {
  console.error('Route notice migration failed:', error.message);
  process.exitCode = 1;
}).finally(() => sql.close());
