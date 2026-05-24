import fs from 'fs';
import path from 'path';
import type sql from 'mssql';

type LocalizedName = {
    vn: string;
    en?: string;
    zh?: string;
    ja?: string;
    ko?: string;
};

type SyncCategoryDirectoryOptions = {
    getDbConnection: () => Promise<sql.ConnectionPool | null>;
    sqlTypes: typeof sql;
    categoryBaseDir: string;
    uiCategoryMap: Record<string, LocalizedName>;
    subCategoryMap: Record<string, LocalizedName>;
};

function toTitleFromSlug(value: string): string {
    return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export async function syncCategoryDirectory(options: SyncCategoryDirectoryOptions) {
    const {
        getDbConnection,
        sqlTypes,
        categoryBaseDir,
        uiCategoryMap,
        subCategoryMap
    } = options;

    try {
        const initialDb = await getDbConnection();
        if (!initialDb) {
            console.warn('Category sync skipped because database is unavailable.');
            return;
        }

        await initialDb.request().execute('SP_SyncCategoryStructure');

        if (!fs.existsSync(categoryBaseDir)) {
            console.warn(`Category directory not found at: ${categoryBaseDir}`);
            return;
        }

        console.log(`Scanning directory: ${categoryBaseDir}`);
        const rootFolders = fs.readdirSync(categoryBaseDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        console.log(`Found ${rootFolders.length} category folders`);

        for (const folder of rootFolders) {
            const categoryInfo = uiCategoryMap[folder] || { vn: folder, en: folder, zh: folder, ja: folder, ko: folder };
            const iconFile = `${folder.toLowerCase().replace(/&/g, '-and-')}.png`;
            const iconPath = fs.existsSync(path.join(categoryBaseDir, iconFile)) ? iconFile : null;

            const db = await getDbConnection();
            if (!db) {
                console.warn('Category sync stopped because database became unavailable.');
                return;
            }

            const catResult = await db.request()
                .input('Name', sqlTypes.NVarChar(200), categoryInfo.vn)
                .input('EN', sqlTypes.NVarChar(200), categoryInfo.en || categoryInfo.vn)
                .input('ZH', sqlTypes.NVarChar(200), categoryInfo.zh || categoryInfo.vn)
                .input('JA', sqlTypes.NVarChar(200), categoryInfo.ja || categoryInfo.vn)
                .input('KO', sqlTypes.NVarChar(200), categoryInfo.ko || categoryInfo.vn)
                .input('Icon', sqlTypes.NVarChar(500), iconPath)
                .query(`
                    DECLARE @CID INT;
                    SELECT @CID = CategoryID FROM Categories WHERE IconPath = @Icon;
                    IF @CID IS NULL
                        SELECT @CID = CategoryID FROM Categories WHERE CategoryName = @Name;

                    IF @CID IS NOT NULL
                    BEGIN
                        UPDATE Categories SET
                            CategoryName = ISNULL(NULLIF(CategoryName, ''), @Name),
                            EN = ISNULL(NULLIF(EN, ''), @EN),
                            ZH = ISNULL(NULLIF(ZH, ''), @ZH),
                            JA = ISNULL(NULLIF(JA, ''), @JA),
                            KO = ISNULL(NULLIF(KO, ''), @KO),
                            IconPath = @Icon
                        WHERE CategoryID = @CID;
                    END
                    ELSE
                    BEGIN
                        INSERT INTO Categories (CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (@Name, @EN, @ZH, @JA, @KO, @Icon, 0);
                        SELECT @CID = SCOPE_IDENTITY();
                    END
                    SELECT @CID as CategoryID;
                `);

            const categoryId = catResult.recordset[0].CategoryID;
            const subDir = path.join(categoryBaseDir, folder);
            const subFiles = fs.readdirSync(subDir);
            let subCount = 0;

            for (const subFile of subFiles) {
                if (path.extname(subFile).toLowerCase() !== '.png') continue;

                const baseFileName = path.basename(subFile, '.png').toLowerCase().trim();
                const generatedName = toTitleFromSlug(baseFileName);
                const subInfo = subCategoryMap[baseFileName] || {
                    vn: generatedName,
                    en: generatedName,
                    zh: baseFileName,
                    ja: baseFileName,
                    ko: baseFileName
                };

                const subIconPath = `${folder}/${subFile}`;
                const syncDb = await getDbConnection();
                if (!syncDb) {
                    console.warn('Subcategory sync stopped because database became unavailable.');
                    return;
                }

                await syncDb.request()
                    .input('CatID', sqlTypes.Int, categoryId)
                    .input('VN', sqlTypes.NVarChar(200), subInfo.vn)
                    .input('EN', sqlTypes.NVarChar(200), subInfo.en || subInfo.vn)
                    .input('ZH', sqlTypes.NVarChar(200), subInfo.zh || subInfo.vn)
                    .input('JA', sqlTypes.NVarChar(200), subInfo.ja || subInfo.vn)
                    .input('KO', sqlTypes.NVarChar(200), subInfo.ko || subInfo.vn)
                    .input('EngName', sqlTypes.NVarChar(200), generatedName)
                    .input('Icon', sqlTypes.NVarChar(500), subIconPath)
                    .query(`
                        DECLARE @SID INT;
                        SELECT @SID = SubCategoryID FROM SubCategories WHERE IconPath = @Icon AND CategoryID = @CatID;

                        IF @SID IS NOT NULL
                        BEGIN
                            UPDATE SubCategories SET
                                SubCategoryName = ISNULL(NULLIF(SubCategoryName, ''), @VN),
                                EN = ISNULL(NULLIF(EN, ''), @EN),
                                ZH = ISNULL(NULLIF(ZH, ''), @ZH),
                                JA = ISNULL(NULLIF(JA, ''), @JA),
                                KO = ISNULL(NULLIF(KO, ''), @KO),
                                IconPath = @Icon
                            WHERE SubCategoryID = @SID;
                        END
                        ELSE
                        BEGIN
                            SELECT @SID = SubCategoryID FROM SubCategories WHERE (SubCategoryName = @EngName OR SubCategoryName = @VN) AND CategoryID = @CatID;

                            IF @SID IS NOT NULL
                            BEGIN
                                UPDATE SubCategories SET
                                    SubCategoryName = ISNULL(NULLIF(SubCategoryName, ''), @VN),
                                    EN = ISNULL(NULLIF(EN, ''), @EN),
                                    ZH = ISNULL(NULLIF(ZH, ''), @ZH),
                                    JA = ISNULL(NULLIF(JA, ''), @JA),
                                    KO = ISNULL(NULLIF(KO, ''), @KO),
                                    IconPath = @Icon
                                WHERE SubCategoryID = @SID;
                            END
                            ELSE
                            BEGIN
                                INSERT INTO SubCategories (CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder)
                                VALUES (@CatID, @VN, @EN, @ZH, @JA, @KO, @Icon, 0);
                            END
                        END

                        DELETE FROM SubCategories
                        WHERE CategoryID = @CatID
                        AND (IconPath = @Icon OR SubCategoryName = @EngName OR (SubCategoryName = @VN AND SubCategoryID != @SID))
                        AND SubCategoryID != @SID;
                    `);
                subCount++;
            }

            console.log(`Synced ${categoryInfo.vn}: ${subCount} subcategories`);
        }

        console.log('Database category cleanup and sync complete');
    } catch (err: any) {
        console.error('Error syncing categories:', err);
    }
}
