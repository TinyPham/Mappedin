import type sql from 'mssql';
import { fetchAreaColorMap } from './areaColorRepository';

export async function getInitialData(db: sql.ConnectionPool) {
    const result = await db.request().execute('SP_GetInitialData');
    const areaColors = await fetchAreaColorMap(db);

    const languages = result.recordsets[0];

    const uiTranslations: any = {};
    result.recordsets[1].forEach((row: any) => {
        const key = (row.KeyCode || '').toLowerCase();
        uiTranslations[key] = {
            vn: row.VN,
            vi: row.VN,
            en: row.EN,
            zh: row.ZH,
            ja: row.JA,
            ko: row.KO
        };
    });

    const categories = result.recordsets[2].map((row: any) => ({
        id: row.CategoryID,
        icon: row.IconPath,
        names: {
            vn: row.VN,
            vi: row.VN,
            en: row.EN,
            zh: row.ZH,
            ja: row.JA,
            ko: row.KO
        }
    }));

    const subcategories = result.recordsets[3].map((row: any) => ({
        id: row.SubCategoryID,
        categoryId: row.CategoryID,
        icon: row.IconPath,
        names: {
            vn: row.VN,
            vi: row.VN,
            en: row.EN,
            zh: row.ZH,
            ja: row.JA,
            ko: row.KO
        }
    }));

    const floors = result.recordsets[4].map((row: any) => ({
        id: row.FloorId,
        mappedinId: row.MappedinId,
        code: row.FloorCode,
        sortOrder: row.SortOrder,
        names: {
            vn: row.VN,
            vi: row.VN,
            en: row.EN,
            zh: row.ZH,
            ja: row.JA,
            ko: row.KO
        }
    }));

    const locations: any = {};
    result.recordsets[5].forEach((row: any) => {
        const mid = typeof row.MappedinID === 'string' ? row.MappedinID.trim() : row.MappedinID;
        if (!mid) return;

        locations[mid] = {
            id: Number(row.AreaListID),
            AreaListID: Number(row.AreaListID),
            mappedinId: mid,
            MappedinID: mid,
            categoryId: row.CategoryID == null ? null : Number(row.CategoryID),
            CategoryID: row.CategoryID == null ? null : Number(row.CategoryID),
            subCategoryId: row.SubCategoryID == null ? null : Number(row.SubCategoryID),
            SubCategoryID: row.SubCategoryID == null ? null : Number(row.SubCategoryID),
            subCategoryIcon: row.SubCategoryIconPath,
            subCategoryIconPath: row.SubCategoryIconPath,
            subCategoryNames: {
                vn: row.SubCategoryVN,
                vi: row.SubCategoryVN,
                en: row.SubCategoryEN,
                zh: row.SubCategoryZH,
                ja: row.SubCategoryJA,
                ko: row.SubCategoryKO
            },
            names: {
                vn: row.VN,
                vi: row.VN,
                en: row.EN,
                zh: row.ZH,
                ja: row.JA,
                ko: row.KO
            },
            image: row.UIImageUrl || row.MappedinImageUrl || row.RunUrl,
            uiImage: row.UIImageUrl,
            editorImage: row.MappedinImageUrl,
            descriptions: {
                vn: row.InformationVI,
                vi: row.InformationVI,
                en: row.InformationEN,
                zh: row.InformationZH,
                ja: row.InformationJA,
                ko: row.InformationKO
            },
            phone: row.Phone,
            openingHours: row.OpeningHours,
            locationDetail: {
                vn: row.LocationDetail_VN,
                en: row.LocationDetail_EN,
                zh: row.LocationDetail_ZH,
                ja: row.LocationDetail_JA,
                ko: row.LocationDetail_KO
            }
        };
    });

    return {
        languages,
        ui: uiTranslations,
        categories,
        subcategories,
        floors,
        locations,
        areaColors
    };
}
