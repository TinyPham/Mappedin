import type sql from 'mssql';
import { buildAreaColorMap } from './areaColors';

export async function fetchAreaColorMap(db: sql.ConnectionPool) {
    const result = await db.request().query(`
        IF OBJECT_ID(N'dbo.AreaColorOverrides', N'U') IS NULL
            SELECT CAST(NULL AS NVARCHAR(100)) AS MappedinID, CAST(NULL AS NVARCHAR(7)) AS ColorHex WHERE 1 = 0;
        ELSE
            SELECT MappedinID, ColorHex FROM dbo.AreaColorOverrides;
    `);

    return buildAreaColorMap(result.recordset || []);
}

export async function ensureAreaColorTableExists(db: sql.ConnectionPool) {
    const result = await db.request().query(`
        SELECT CASE WHEN OBJECT_ID(N'dbo.AreaColorOverrides', N'U') IS NULL THEN 0 ELSE 1 END AS ExistsFlag;
    `);

    if (!result.recordset?.[0]?.ExistsFlag) {
        throw new Error('AreaColorOverrides table does not exist. Apply the database patch first.');
    }
}

export async function upsertAreaColors(db: sql.ConnectionPool, sqlTypes: typeof sql, areaIds: string[], color: string) {
    for (const areaId of areaIds) {
        await db.request()
            .input('MappedinID', sqlTypes.NVarChar(100), areaId)
            .input('ColorHex', sqlTypes.NVarChar(7), color)
            .query(`
                MERGE dbo.AreaColorOverrides AS target
                USING (SELECT @MappedinID AS MappedinID, @ColorHex AS ColorHex) AS source
                ON target.MappedinID = source.MappedinID
                WHEN MATCHED THEN
                    UPDATE SET ColorHex = source.ColorHex, UpdatedAt = SYSUTCDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT (MappedinID, ColorHex, UpdatedAt)
                    VALUES (source.MappedinID, source.ColorHex, SYSUTCDATETIME());
            `);
    }
}

export async function deleteAreaColors(db: sql.ConnectionPool, sqlTypes: typeof sql, areaIds: string[]) {
    for (const areaId of areaIds) {
        await db.request()
            .input('MappedinID', sqlTypes.NVarChar(100), areaId)
            .query('DELETE FROM dbo.AreaColorOverrides WHERE MappedinID = @MappedinID;');
    }
}
