import type sql from 'mssql';

type ModelPayload = {
    uuid?: string;
    url?: string;
    name?: string;
    desc?: string;
    latitude?: number;
    longitude?: number;
    floorId?: string | null;
    rotation?: number[];
    scale?: number[];
    displayWebsite?: boolean | number;
    elevation?: number;
};

function mapModelRow(row: any) {
    const url = row.ModelURL || '';
    const baseName = url.split('/').pop()?.split('.')[0] || '';
    const thumb = baseName ? `${baseName}.jpg` : null;

    return {
        uuid: row.UUID,
        url,
        name: row.ModelName || '',
        desc: row.Description || '',
        latitude: parseFloat(row.Latitude),
        longitude: parseFloat(row.Longitude),
        floorId: row.FloorId,
        rotation: [row.RotationX, row.RotationY, row.RotationZ],
        scale: [row.ScaleX, row.ScaleY, row.ScaleZ],
        displayWebsite: row.DisplayWebsite ? 1 : 0,
        thumb,
        elevation: row.Elevation != null ? parseFloat(row.Elevation) : 0
    };
}

export async function getAllModels(db: sql.ConnectionPool) {
    const result = await db.request().execute('SP_GetAllModels');
    return (result.recordset || []).map(mapModelRow);
}

export async function syncOverviewModelFloorId(db: sql.ConnectionPool, sqlTypes: typeof sql, overviewFloorId: string) {
    const result = await db.request()
        .input('RuntimeOverviewFloorId', sqlTypes.NVarChar(100), overviewFloorId)
        .execute('SP_UpdateOverviewModelFloorId');

    return Number(result.recordset?.[0]?.UpdatedRows ?? 0);
}

export async function getModelByUuid(db: sql.ConnectionPool, sqlTypes: typeof sql, uuid: string) {
    const result = await db.request()
        .input('UUID', sqlTypes.NVarChar(50), uuid)
        .execute('SP_GetModelByUUID');

    const row = result.recordset?.[0];
    return row ? mapModelRow(row) : null;
}

export async function upsertModel(db: sql.ConnectionPool, sqlTypes: typeof sql, model: ModelPayload) {
    await db.request()
        .input('UUID', sqlTypes.NVarChar(50), model.uuid)
        .input('ModelName', sqlTypes.NVarChar(200), model.name || '')
        .input('Description', sqlTypes.NVarChar(500), model.desc || '')
        .input('ModelURL', sqlTypes.NVarChar(500), model.url)
        .input('Latitude', sqlTypes.Decimal(18, 10), model.latitude)
        .input('Longitude', sqlTypes.Decimal(18, 10), model.longitude)
        .input('FloorId', sqlTypes.NVarChar(100), model.floorId || null)
        .input('FloorName', sqlTypes.NVarChar(100), null)
        .input('RotationX', sqlTypes.Decimal(18, 4), model.rotation?.[0] ?? 0)
        .input('RotationY', sqlTypes.Decimal(18, 4), model.rotation?.[1] ?? 0)
        .input('RotationZ', sqlTypes.Decimal(18, 4), model.rotation?.[2] ?? 0)
        .input('ScaleX', sqlTypes.Decimal(18, 6), model.scale?.[0] ?? 1)
        .input('ScaleY', sqlTypes.Decimal(18, 6), model.scale?.[1] ?? 1)
        .input('ScaleZ', sqlTypes.Decimal(18, 6), model.scale?.[2] ?? 1)
        .input('DisplayWebsite', sqlTypes.Bit, model.displayWebsite ? 1 : 0)
        .input('CreatedBy', sqlTypes.NVarChar(100), null)
        .input('Elevation', sqlTypes.Decimal(18, 4), model.elevation ?? 0)
        .execute('SP_UpsertModel');
}

export async function deleteModel(db: sql.ConnectionPool, sqlTypes: typeof sql, uuid: string) {
    await db.request()
        .input('UUID', sqlTypes.NVarChar(50), uuid)
        .execute('SP_DeleteModel');
}

export async function upsertModels(db: sql.ConnectionPool, sqlTypes: typeof sql, models: ModelPayload[]) {
    for (const model of models) {
        await db.request()
            .input('UUID', sqlTypes.NVarChar(50), model.uuid)
            .input('ModelName', sqlTypes.NVarChar(200), model.name || '')
            .input('Description', sqlTypes.NVarChar(500), model.desc || '')
            .input('ModelURL', sqlTypes.NVarChar(500), model.url)
            .input('Latitude', sqlTypes.Decimal(10, 8), model.latitude)
            .input('Longitude', sqlTypes.Decimal(11, 8), model.longitude)
            .input('FloorId', sqlTypes.NVarChar(100), model.floorId || null)
            .input('FloorName', sqlTypes.NVarChar(100), null)
            .input('RotationX', sqlTypes.Decimal(10, 4), model.rotation?.[0] ?? 0)
            .input('RotationY', sqlTypes.Decimal(10, 4), model.rotation?.[1] ?? 0)
            .input('RotationZ', sqlTypes.Decimal(10, 4), model.rotation?.[2] ?? 0)
            .input('ScaleX', sqlTypes.Decimal(10, 6), model.scale?.[0] ?? 1)
            .input('ScaleY', sqlTypes.Decimal(10, 6), model.scale?.[1] ?? 1)
            .input('ScaleZ', sqlTypes.Decimal(10, 6), model.scale?.[2] ?? 1)
            .input('DisplayWebsite', sqlTypes.Bit, model.displayWebsite ? 1 : 0)
            .input('CreatedBy', sqlTypes.NVarChar(100), 'batch-import')
            .execute('SP_UpsertModel');
    }
}

export async function getAvailableModels(db: sql.ConnectionPool) {
    const result = await db.request().execute('SP_GetAvailableModels');

    return (result.recordset || []).map(row => ({
        id: row.AvailableModelId || row.AvailableModelID || row.Id || 0,
        name: row.ModelName || '',
        file: row.Filename || row.FileName || '',
        thumb: row.Thumbnail || row.ThumbNail || row.thumbnail || '',
        scale: [
            row.DefaultScaleX ?? row.DefaultIScaleX ?? 2,
            row.DefaultScaleY ?? row.DefaultIScaleY ?? 2,
            row.DefaultScaleZ ?? row.DefaultIScaleZ ?? 2
        ],
        rotation: [
            row.DefaultRotationX ?? row.DefaultIRotationX ?? 90,
            row.DefaultRotationY ?? row.DefaultIRotationY ?? 90,
            row.DefaultRotationZ ?? row.DefaultIRotationZ ?? 1
        ]
    }));
}
