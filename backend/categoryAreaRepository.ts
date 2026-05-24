import type sql from 'mssql';

export async function getSubCategoryLocations(db: sql.ConnectionPool, sqlTypes: typeof sql, subCategoryId: string | number) {
    const result = await db.request()
        .input('SID', sqlTypes.Int, subCategoryId)
        .query(`
            SELECT
                AL.*,
                AC.SubCategoryID,
                SC.CategoryID,
                SC.IconPath AS SubCategoryIconPath,
                SC.SubCategoryName AS SubCategoryVN,
                SC.EN AS SubCategoryEN,
                SC.ZH AS SubCategoryZH,
                SC.JA AS SubCategoryJA,
                SC.KO AS SubCategoryKO
            FROM AreaList AL
            JOIN AreaCategory AC ON AL.AreaListID = AC.AreaListID
            LEFT JOIN SubCategories SC ON AC.SubCategoryID = SC.SubCategoryID
            WHERE AC.SubCategoryID = @SID
        `);

    return result.recordset;
}

export async function getAssignedAreas(db: sql.ConnectionPool) {
    const result = await db.request().query(`
        SELECT
            AL.MappedinID,
            AL.FloorID,
            AC.SubCategoryID,
            SC.CategoryID
        FROM AreaList AL
        JOIN AreaCategory AC ON AL.AreaListID = AC.AreaListID
        LEFT JOIN SubCategories SC ON AC.SubCategoryID = SC.SubCategoryID
    `);

    return result.recordset;
}

export async function getActiveCategories(db: sql.ConnectionPool) {
    const result = await db.request().query(`
        SELECT DISTINCT C.* FROM Categories C
        JOIN SubCategories SC ON C.CategoryID = SC.CategoryID
        JOIN AreaCategory AC ON SC.SubCategoryID = AC.SubCategoryID
        ORDER BY C.CategoryName
    `);

    return result.recordset;
}
