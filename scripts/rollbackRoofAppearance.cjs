const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sql = require('mssql');

const mapId = '693687f4f176dd000ba13a3b';
const root = path.resolve(__dirname, '..');
const backupPath = path.join(root, 'diagnostics/roof-appearance-2026-10-11/database-before.json');

async function main() {
  // Rollback uses the fixed map ID and original snapshot, even if the config was removed.
  const before = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  assert.ok(Array.isArray(before) && before.length <= 1, 'Backup must contain zero or one row.');
  const original = before[0];
  if (before.length) {
    assert.ok(original && typeof original === 'object' && !Array.isArray(original), 'Backup row must be an object.');
    assert.equal(original.MapID, mapId, 'Backup belongs to a different map.');
    assert.equal(typeof original.ConfigJson, 'string');
    JSON.parse(original.ConfigJson);
    assert.match(original.UpdatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?$/);
  }
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
      const exists = (await transaction.request().query(`
        SELECT CASE WHEN OBJECT_ID(N'dbo.MapRoofAppearance', N'U') IS NULL THEN 0 ELSE 1 END AS ExistsFlag;
      `)).recordset[0].ExistsFlag;
      if (!exists) {
        assert.ok(!original, 'Cannot restore an original row because the table is missing.');
      } else {
        const request = transaction.request().input('MapID', sql.NVarChar(100), mapId);
        if (original) {
          await request.input('ConfigJson', sql.NVarChar(sql.MAX), original.ConfigJson)
            // Bind the SQL timestamp as text to preserve all seven fractional digits.
            .input('UpdatedAt', sql.NVarChar(27), original.UpdatedAt)
            .query(`
              IF EXISTS (SELECT 1 FROM dbo.MapRoofAppearance WITH (UPDLOCK, HOLDLOCK) WHERE MapID = @MapID)
                UPDATE dbo.MapRoofAppearance SET ConfigJson = @ConfigJson,
                  UpdatedAt = CONVERT(DATETIME2(7), @UpdatedAt, 126) WHERE MapID = @MapID;
              ELSE
                INSERT INTO dbo.MapRoofAppearance (MapID, ConfigJson, UpdatedAt)
                  VALUES (@MapID, @ConfigJson, CONVERT(DATETIME2(7), @UpdatedAt, 126));
            `);
        } else {
          await request.query('DELETE FROM dbo.MapRoofAppearance WHERE MapID = @MapID;');
        }
        const restored = (await transaction.request().input('MapID', sql.NVarChar(100), mapId).query(`
          SELECT MapID, ConfigJson, CONVERT(NVARCHAR(27), UpdatedAt, 126) AS UpdatedAt
          FROM dbo.MapRoofAppearance WHERE MapID = @MapID;
        `)).recordset;
        assert.deepEqual(restored, before, 'Rollback readback differs from the original row.');
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback().catch(() => {});
      throw error;
    }
    console.log('Rolled back and verified the target map roof appearance.');
  } finally {
    await pool.close();
  }
}

module.exports = { main };
if (require.main === module) main().catch(() => {
  console.error('Roof appearance rollback failed. Check the original backup and database connection.');
  process.exitCode = 1;
});
