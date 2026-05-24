import type sql from 'mssql';

type MappedinAreaSyncRow = {
    id?: string;
    name?: string;
    floorId?: string;
};

function normalizeMappedinAreaName(name: string | undefined): string | undefined {
    if (name === 'エスカレーター' || name === 'Escalator') return 'Thang cuốn';
    if (name === 'エレベーター' || name === 'Elevator') return 'Thang máy';
    return name;
}

export async function syncMappedinAreas(db: sql.ConnectionPool, sqlTypes: typeof sql, areas: MappedinAreaSyncRow[]) {
    for (const area of areas) {
        const finalName = normalizeMappedinAreaName(area.name);

        await db.request()
            .input('MID', sqlTypes.NVarChar(100), area.id)
            .input('Name', sqlTypes.NVarChar(200), finalName || null)
            .input('FloorID', sqlTypes.NVarChar(100), area.floorId || null)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM AreaList WHERE MappedinID = @MID)
                    INSERT INTO AreaList (MappedinID, Name, VN, EN, FloorID)
                    VALUES (@MID, ISNULL(@Name, @MID), ISNULL(@Name, @MID), ISNULL(@Name, @MID), @FloorID)
                ELSE
                    UPDATE AreaList
                    SET Name = ISNULL(@Name, Name),
                        FloorID = ISNULL(@FloorID, FloorID)
                    WHERE MappedinID = @MID
            `);
    }
}
