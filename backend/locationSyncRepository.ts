import type sql from 'mssql';

type MappedinLocationSyncRow = {
    id?: string;
    name?: string;
    description?: string;
    imageUrl?: string;
};

export async function syncMappedinLocations(
    db: sql.ConnectionPool,
    sqlTypes: typeof sql,
    locations: MappedinLocationSyncRow[]
) {
    let updated = 0;
    let inserted = 0;

    for (const loc of locations) {
        const mappedinId = loc.id;
        const name = loc.name || '';
        const incomingImg = loc.imageUrl || '';
        const description = loc.description || '';

        if (!mappedinId) continue;

        try {
            await db.request()
                .input('MappedinId', sqlTypes.NVarChar(100), mappedinId)
                .input('Name', sqlTypes.NVarChar(200), name)
                .input('Description', sqlTypes.NVarChar(sqlTypes.MAX), description)
                .input('ImageUrl', sqlTypes.NVarChar(500), incomingImg)
                .execute('SP_SyncMappedinLocation');

            updated++;
        } catch (error) {
            console.error(`Error syncing location ${mappedinId}:`, error);
        }
    }

    return { inserted, updated };
}
