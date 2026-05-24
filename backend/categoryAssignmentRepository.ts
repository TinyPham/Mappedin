import type sql from 'mssql';

export async function assignSubCategoryAreas(
    db: sql.ConnectionPool,
    sqlTypes: typeof sql,
    subCategoryId: string | number,
    areaIds: string[]
) {
    const transaction = new sqlTypes.Transaction(db);

    try {
        await transaction.begin();

        await transaction.request()
            .input('SID', sqlTypes.Int, subCategoryId)
            .query('DELETE FROM AreaCategory WHERE SubCategoryID = @SID');

        for (const mappedinId of areaIds) {
            await transaction.request()
                .input('MID', sqlTypes.NVarChar(100), mappedinId)
                .input('SID', sqlTypes.Int, subCategoryId)
                .query(`
                    DECLARE @ALID INT;
                    SELECT @ALID = AreaListID FROM AreaList WHERE MappedinID = @MID;

                    -- Auto-create if missing to ensure assignment works
                    IF @ALID IS NULL
                    BEGIN
                        INSERT INTO AreaList (MappedinID, Name, VN, EN) VALUES (@MID, @MID, @MID, @MID);
                        SET @ALID = SCOPE_IDENTITY();
                    END

                    IF @ALID IS NOT NULL
                    BEGIN
                        -- Remove from any other subcategory before assigning to the current one.
                        DELETE FROM AreaCategory WHERE AreaListID = @ALID;

                        INSERT INTO AreaCategory (AreaListID, SubCategoryID)
                        VALUES (@ALID, @SID);
                    END
                `);
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
