import type sql from 'mssql';
import { fetchAreaColorMap } from './areaColorRepository';
import { fetchAreaVisualStyles } from './areaVisualRepository';
import { fetchRoofAppearances } from './roofAppearanceRepository';
import { getAirportOperations } from './airportOperations/operationsRepository';

function stableRowKey(row: Record<string, any>): string {
    return JSON.stringify(Object.keys(row).sort().map(key => [key, row[key]]));
}

function numericId(value: any): number {
    const id = Number(value);
    return value != null && Number.isFinite(id) ? id : Number.MAX_SAFE_INTEGER;
}

function canonicalLocationRows(rows: any[]): any[] {
    const groups = new Map<string, any[]>();
    for (const row of rows) {
        const mid = typeof row.MappedinID === 'string' ? row.MappedinID.trim() : '';
        if (!mid) continue;
        if (!groups.has(mid)) groups.set(mid, []);
        groups.get(mid)!.push(row);
    }
    return [...groups.keys()].sort().map(mid => {
        const candidates = groups.get(mid)!.slice().sort((a, b) => {
            const categorizedA = Number(a.CategoryID) > 0;
            const categorizedB = Number(b.CategoryID) > 0;
            if (categorizedA !== categorizedB) return categorizedA ? -1 : 1;
            const idDifference = numericId(a.AreaListID) - numericId(b.AreaListID);
            if (idDifference) return idDifference;
            // SQL joins can produce multiple rows even for the same AreaListID.
            const keyA = stableRowKey(a), keyB = stableRowKey(b);
            return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
        });
        const selected = { ...candidates[0], MappedinID: mid };
        for (const row of candidates.slice(1)) {
            for (const key of Object.keys(row).sort()) {
                if (['AreaListID', 'MappedinID', 'CategoryID', 'SubCategoryID'].includes(key)) continue;
                // Keep classification translations/icons with their canonical classification.
                if (key.startsWith('SubCategory') && (Number(row.CategoryID) !== Number(selected.CategoryID)
                    || Number(row.SubCategoryID) !== Number(selected.SubCategoryID))) continue;
                if ((selected[key] == null || selected[key] === '') && row[key] != null && row[key] !== '') {
                    selected[key] = row[key];
                }
            }
        }
        return selected;
    });
}

export async function getInitialData(db: sql.ConnectionPool) {
    const result = await db.request().execute('SP_GetInitialData');
    const areaColors = await fetchAreaColorMap(db);
    const areaVisualStyles = await fetchAreaVisualStyles(db);
    const roofAppearances = await fetchRoofAppearances(db);

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

    const { overviewFloorId } = getAirportOperations();
    const floors = result.recordsets[4].map((row: any) => ({
        id: row.FloorId,
        mappedinId: typeof row.FloorCode === 'string' && row.FloorCode.trim().toLowerCase() === 'overview'
            ? overviewFloorId : row.MappedinId,
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
    canonicalLocationRows(result.recordsets[5]).forEach((row: any) => {
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
        areaColors,
        areaVisualStyles,
        roofAppearances
    };
}
