const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sql = require('mssql');

const mapId = '693687f4f176dd000ba13a3b';
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'diagnostics/roof-appearance-2026-10-11');
const backupPath = path.join(output, 'database-before.json');

function validateBackup(rows) {
  assert.ok(Array.isArray(rows) && rows.length <= 1, 'Backup must contain zero or one row.');
  if (rows.length) {
    assert.ok(rows[0] && typeof rows[0] === 'object' && !Array.isArray(rows[0]), 'Backup row must be an object.');
    assert.equal(rows[0].MapID, mapId, 'Backup belongs to a different map.');
    assert.equal(typeof rows[0].ConfigJson, 'string');
    JSON.parse(rows[0].ConfigJson);
    assert.match(rows[0].UpdatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?$/);
  }
}

async function main() {
  const configJson = fs.readFileSync(path.join(root, 'database/roof-appearance.json'), 'utf8');
  const config = JSON.parse(configJson);
  assert.ok(config && typeof config === 'object' && !Array.isArray(config), 'Config must be an object.');
  assert.equal(config.mapId, mapId, 'Config must belong to the target map.');
  assert.equal(config.version, 1, 'Unsupported config version.');
  assert.equal(typeof config.enabled, 'boolean', 'Config enabled must be boolean.');
  if (fs.existsSync(backupPath)) validateBackup(JSON.parse(fs.readFileSync(backupPath, 'utf8')));
  const schema = fs.readFileSync(path.join(root, 'database/patches/add_roof_appearance.sql'), 'utf8');
  require('dotenv').config({ path: path.join(root, '.env'), quiet: true });
  assert.ok(['DB_SERVER', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].every(key => process.env[key]),
    'Database configuration is incomplete.');

  const pool = await sql.connect({
    server: process.env.DB_SERVER, database: process.env.DB_NAME,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    options: { encrypt: process.env.DB_ENCRYPT !== 'false', trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' },
    connectionTimeout: 10000, requestTimeout: 30000
  });
  try {
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const before = (await transaction.request().input('MapID', sql.NVarChar(100), mapId).query(`
        IF OBJECT_ID(N'dbo.MapRoofAppearance', N'U') IS NULL
          SELECT CAST(NULL AS NVARCHAR(100)) AS MapID, CAST(NULL AS NVARCHAR(MAX)) AS ConfigJson,
                 CAST(NULL AS NVARCHAR(27)) AS UpdatedAt WHERE 1 = 0;
        ELSE
          EXEC sys.sp_executesql
            N'SELECT MapID, ConfigJson, CONVERT(NVARCHAR(27), UpdatedAt, 126) AS UpdatedAt
              FROM dbo.MapRoofAppearance WITH (UPDLOCK, HOLDLOCK) WHERE MapID = @MapID;',
            N'@MapID NVARCHAR(100)', @MapID = @MapID;
      `)).recordset;
      validateBackup(before);
      fs.mkdirSync(output, { recursive: true });
      try {
        // Exclusive creation preserves the original snapshot on every later save.
        fs.writeFileSync(backupPath, JSON.stringify(before, null, 2), { flag: 'wx' });
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
      validateBackup(JSON.parse(fs.readFileSync(backupPath, 'utf8')));
      await transaction.request().query(schema);
      await transaction.request()
        .input('MapID', sql.NVarChar(100), mapId)
        .input('ConfigJson', sql.NVarChar(sql.MAX), configJson)
        .query(`
          IF EXISTS (SELECT 1 FROM dbo.MapRoofAppearance WITH (UPDLOCK, HOLDLOCK) WHERE MapID = @MapID)
            UPDATE dbo.MapRoofAppearance SET ConfigJson = @ConfigJson, UpdatedAt = SYSUTCDATETIME() WHERE MapID = @MapID;
          ELSE
            INSERT INTO dbo.MapRoofAppearance (MapID, ConfigJson) VALUES (@MapID, @ConfigJson);
        `);
      const saved = (await transaction.request().input('MapID', sql.NVarChar(100), mapId).query(`
        SELECT MapID, ConfigJson, CONVERT(NVARCHAR(27), UpdatedAt, 126) AS UpdatedAt
        FROM dbo.MapRoofAppearance WHERE MapID = @MapID;
      `)).recordset;
      assert.equal(saved.length, 1, 'Saved row was not found.');
      assert.equal(saved[0].MapID, mapId);
      assert.equal(saved[0].ConfigJson, configJson, 'Stored JSON differs from the exact input.');
      assert.deepEqual(JSON.parse(saved[0].ConfigJson), config);
      // A readback-file write failure must roll back the database change too.
      fs.writeFileSync(path.join(output, 'database-after.json'), JSON.stringify(saved, null, 2));
      await transaction.commit();
    } catch (error) {
      await transaction.rollback().catch(() => {});
      throw error;
    }
    console.log('Saved and verified the target map roof appearance.');
  } finally {
    await pool.close();
  }
}

module.exports = { main };
if (require.main === module) main().catch(() => {
  // Driver messages can include connection details; keep credentials out of CLI output.
  console.error('Roof appearance save failed. Check the config, backup, and database connection.');
  process.exitCode = 1;
});
