import type sql from 'mssql';

export async function getCategoryTree(db: sql.ConnectionPool) {
    const result = await db.request().execute('SP_GetCategoryTree');
    const cats = result.recordsets[0] || [];
    const subs = result.recordsets[1] || [];

    return cats.map(c => ({
        id: c.CategoryID,
        name: c.VN,
        vn: c.VN,
        en: c.EN,
        zh: c.ZH,
        ja: c.JA,
        ko: c.KO,
        icon: c.IconPath,
        subcategories: subs.filter((s: any) => s.CategoryID === c.CategoryID).map((s: any) => ({
            id: s.SubCategoryID,
            name: s.VN,
            vn: s.VN,
            en: s.EN,
            zh: s.ZH,
            ja: s.JA,
            ko: s.KO,
            icon: s.IconPath
        }))
    }));
}
