
const fs = require('fs');
const path = require('path');

const translationsPath = path.join(__dirname, '../translations.json');
const outputPath = path.join(__dirname, '../database/seed_data.sql');

if (!fs.existsSync(translationsPath)) {
    console.error('translations.json not found!');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
let sql = '-- SEED DATA FROM TRANSLATIONS.JSON (Renamed Tables)\n\n';

// 1. Static UI Keys
sql += '-- 1. MasterData_UI_Keys & Translation_UI\n';
sql += 'DECLARE @KeyId INT;\n\n';

const staticKeys = data.static || {};
for (const key in staticKeys) {
    const keyData = staticKeys[key];
    // Insert Key
    sql += `IF NOT EXISTS (SELECT 1 FROM MasterData_UI_Keys WHERE KeyCode = '${key}')\n`;
    sql += `BEGIN\n`;
    sql += `    INSERT INTO MasterData_UI_Keys (ComponentId, KeyCode, DefaultValue) VALUES (NULL, '${key}', N'${keyData.en || keyData.vn}');\n`;
    sql += `    SET @KeyId = SCOPE_IDENTITY();\n`;
    sql += `END\n`;
    sql += `ELSE\n`;
    sql += `BEGIN\n`;
    sql += `    SELECT @KeyId = UIKeyId FROM MasterData_UI_Keys WHERE KeyCode = '${key}';\n`;
    sql += `END\n\n`;

    // Insert Translations
    for (const lang in keyData) {
        const text = keyData[lang].replace(/'/g, "''"); // Escape single quotes
        sql += `IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE UIKeyId = @KeyId AND LanguageId = '${lang}')\n`;
        sql += `    INSERT INTO Translation_UI (UIKeyId, LanguageId, TranslatedText) VALUES (@KeyId, '${lang}', N'${text}');\n`;
    }
    sql += '\n';
}

// 2. Dynamic Locations
sql += '-- 2. MasterData_Locations & Translation_Locations\n';
sql += 'DECLARE @LocId BIGINT;\n';
sql += 'DECLARE @DefaultCatId INT = 1; -- Fallback category\n\n';

// Ensure at least one category exists
sql += `IF NOT EXISTS (SELECT 1 FROM MasterData_LocationCategories WHERE CategoryId = 1)
BEGIN
    SET IDENTITY_INSERT MasterData_LocationCategories ON;
    INSERT INTO MasterData_LocationCategories (CategoryId, CategoryCode, SortOrder) VALUES (1, 'GENERAL', 1);
    SET IDENTITY_INSERT MasterData_LocationCategories OFF;
    INSERT INTO Translation_Categories (CategoryId, LanguageId, CategoryName) VALUES (1, 'en', 'General'), (1, 'vn', N'Chung');
END\n\n`;

const dynamicKeys = data.dynamic || {};
for (const id in dynamicKeys) {
    const locData = dynamicKeys[id];
    // Assuming 'id' is MappedinId
    // Generate a simple slug
    const slug = id.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    sql += `IF NOT EXISTS (SELECT 1 FROM MasterData_Locations WHERE MappedinId = '${id}')\n`;
    sql += `BEGIN\n`;
    sql += `    INSERT INTO MasterData_Locations (MappedinId, CategoryId, SlugKey) VALUES ('${id}', @DefaultCatId, '${slug}');\n`;
    sql += `    SET @LocId = SCOPE_IDENTITY();\n`;
    sql += `END\n`;
    sql += `ELSE\n`;
    sql += `BEGIN\n`;
    sql += `    SELECT @LocId = LocationId FROM MasterData_Locations WHERE MappedinId = '${id}';\n`;
    sql += `END\n\n`;

    // Translations
    for (const lang in locData) {
        const name = locData[lang].replace(/'/g, "''");
        sql += `IF NOT EXISTS (SELECT 1 FROM Translation_Locations WHERE LocationId = @LocId AND LanguageId = '${lang}')\n`;
        sql += `    INSERT INTO Translation_Locations (LocationId, LanguageId, DisplayName, LocalizedUrl) VALUES (@LocId, '${lang}', N'${name}', '/${lang}/${slug}');\n`;
    }
    sql += '\n';
}

fs.writeFileSync(outputPath, sql);
console.log('Seed SQL generated at:', outputPath);
