import type sql from 'mssql';

type AreaInfoPayload = Record<string, any>;

export async function upsertAreaInformation(db: sql.ConnectionPool, sqlTypes: typeof sql, payload: AreaInfoPayload) {
    await db.request()
        .input('MappedinId', sqlTypes.NVarChar(100), payload.id)
        .input('NameVN', sqlTypes.NVarChar(200), payload.name_vi)
        .input('NameEN', sqlTypes.NVarChar(200), payload.name_en)
        .input('NameZH', sqlTypes.NVarChar(200), payload.name_zh)
        .input('NameJA', sqlTypes.NVarChar(200), payload.name_ja)
        .input('NameKO', sqlTypes.NVarChar(200), payload.name_ko)
        .input('VN', sqlTypes.NVarChar(sqlTypes.MAX), payload.vn)
        .input('EN', sqlTypes.NVarChar(sqlTypes.MAX), payload.en)
        .input('ZH', sqlTypes.NVarChar(sqlTypes.MAX), payload.zh)
        .input('JA', sqlTypes.NVarChar(sqlTypes.MAX), payload.ja)
        .input('KO', sqlTypes.NVarChar(sqlTypes.MAX), payload.ko)
        .input('ImageUrl', sqlTypes.NVarChar(500), payload.imageUrl)
        .input('MappedinImageUrl', sqlTypes.NVarChar(500), payload.mappedinImageUrl || null)
        .input('Phone', sqlTypes.NVarChar(50), payload.phone)
        .input('OpeningHours', sqlTypes.NVarChar(100), payload.openingHours)
        .input('LocationDetail_VN', sqlTypes.NVarChar(sqlTypes.MAX), payload.detail_vn)
        .input('LocationDetail_EN', sqlTypes.NVarChar(sqlTypes.MAX), payload.detail_en)
        .input('LocationDetail_ZH', sqlTypes.NVarChar(sqlTypes.MAX), payload.detail_zh)
        .input('LocationDetail_JA', sqlTypes.NVarChar(sqlTypes.MAX), payload.detail_ja)
        .input('LocationDetail_KO', sqlTypes.NVarChar(sqlTypes.MAX), payload.detail_ko)
        .execute('SP_UpsertAreaInformation');
}
