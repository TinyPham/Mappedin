import type sql from 'mssql';

type AvailableModelSyncPayload = {
    modelName: string;
    fileName: string;
    thumbnail: string | null;
    scale: number[];
    rotation: number[];
};

export async function syncAvailableModel(
    db: sql.ConnectionPool,
    sqlTypes: typeof sql,
    payload: AvailableModelSyncPayload
) {
    await db.request()
        .input('ModelName', sqlTypes.NVarChar(200), payload.modelName)
        .input('FileName', sqlTypes.NVarChar(500), payload.fileName)
        .input('Thumbnail', sqlTypes.NVarChar(500), payload.thumbnail)
        .input('DefaultScaleX', sqlTypes.Decimal(10, 4), payload.scale[0])
        .input('DefaultScaleY', sqlTypes.Decimal(10, 4), payload.scale[1])
        .input('DefaultScaleZ', sqlTypes.Decimal(10, 4), payload.scale[2])
        .input('DefaultRotationX', sqlTypes.Decimal(10, 4), payload.rotation[0])
        .input('DefaultRotationY', sqlTypes.Decimal(10, 4), payload.rotation[1])
        .input('DefaultRotationZ', sqlTypes.Decimal(10, 4), payload.rotation[2])
        .execute('SP_SyncAvailableModel');
}
