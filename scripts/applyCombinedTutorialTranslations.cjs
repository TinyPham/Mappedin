// Apply only the revised combined tutorial copy; backups remain local and ignored.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const sql = require('mssql');

async function main() {
  const root = path.resolve(__dirname, '..');
  const { combinedTutorialTranslations: copy } = await import(pathToFileURL(path.join(root, 'src/tutorial/combinedTutorialTranslations.mjs')));
  const keys = Object.keys(copy), languages = ['VN', 'EN', 'ZH', 'JA', 'KO'];
  assert.equal(keys.length, 14);
  assert.ok(keys.every(key => /^guide_(title|desc)_/.test(key)));
  assert.ok(keys.every(key => languages.every(lang => typeof copy[key][lang] === 'string' && copy[key][lang].trim())));
  require('dotenv').config({ path: path.join(root, '.env'), quiet: true });
  assert.ok(['DB_SERVER', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].every(key => process.env[key]), 'Database configuration is incomplete.');
  const output = path.join(root, 'diagnostics/existing-test-fixes-2026-10-12');
  fs.mkdirSync(output, { recursive: true });
  const pool = await sql.connect({
    server: process.env.DB_SERVER, database: process.env.DB_NAME,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    options: { encrypt: process.env.DB_ENCRYPT !== 'false', trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' },
    connectionTimeout: 10000, requestTimeout: 30000
  });
  try {
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    const select = async () => {
      const request = transaction.request();
      keys.forEach((key, i) => request.input(`key${i}`, sql.NVarChar(100), key));
      return (await request.query(`SELECT KeyCode,KeyType,VN,EN,ZH,JA,KO FROM dbo.Translation_UI WITH (UPDLOCK,HOLDLOCK)
        WHERE KeyCode IN (${keys.map((_, i) => `@key${i}`).join(',')}) ORDER BY KeyCode;`)).recordset;
    };
    try {
      const before = await select();
      const backup = path.join(output, 'tutorial-translations-before.json');
      try { fs.writeFileSync(backup, JSON.stringify(before, null, 2), { flag: 'wx' }); }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
      await transaction.request().query(fs.readFileSync(path.join(root, 'database/patches/update_combined_tutorial_translations.sql'), 'utf8'));
      const saved = await select();
      assert.equal(saved.length, keys.length);
      for (const row of saved) for (const lang of languages) assert.equal(row[lang.toUpperCase()], copy[row.KeyCode][lang]);
      for (const row of before) assert.equal(saved.find(item => item.KeyCode === row.KeyCode).KeyType, row.KeyType);
      fs.writeFileSync(path.join(output, 'tutorial-translations-after.json'), JSON.stringify(saved, null, 2));
      await transaction.commit();
      console.log('Saved and verified 14 tutorial keys in five languages.');
    } catch (error) {
      await transaction.rollback().catch(() => {});
      throw error;
    }
  } finally { await pool.close(); }
}

module.exports = { main };
if (require.main === module) main().catch(() => {
  console.error('Tutorial translation update failed. Check the copy, backup and database connection.');
  process.exitCode = 1;
});
