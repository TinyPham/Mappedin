import type sql from 'mssql';

export async function fetchRoofAppearances(db: sql.ConnectionPool) {
    const result = await db.request().query(`
        IF OBJECT_ID(N'dbo.MapRoofAppearance', N'U') IS NULL
            SELECT CAST(NULL AS NVARCHAR(100)) AS MapID, CAST(NULL AS NVARCHAR(MAX)) AS ConfigJson WHERE 1 = 0;
        ELSE
            EXEC sys.sp_executesql N'SELECT MapID, ConfigJson FROM dbo.MapRoofAppearance;';
    `);
    const appearances: Record<string, Record<string, any>> = {};
    for (const row of result.recordset || []) {
        try {
            const config = JSON.parse(row.ConfigJson);
            if (typeof row.MapID !== 'string' || !row.MapID.trim()
                || !config || typeof config !== 'object' || Array.isArray(config)) continue;
            // Treat even special object property names as ordinary map IDs.
            Object.defineProperty(appearances, row.MapID, {
                value: config, enumerable: true, configurable: true, writable: true
            });
        } catch { /* A malformed optional config must not prevent map initialization. */ }
    }
    return appearances;
}
