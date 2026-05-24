const fs = require('fs');
const path = require('path');

const translationsPath = path.join(__dirname, '..', 'translations.json');
const outputPath = path.join(__dirname, '..', '..', 'database', 'seeds', 'generated_translations.sql');
const languages = ['vn', 'en', 'zh', 'ja', 'ko'];

function escapeSql(value) {
    if (value === undefined || value === null || value === '') {
        return 'NULL';
    }

    return `N'${String(value).replace(/'/g, "''")}'`;
}

function pickDefaultName(values) {
    return values.vn || values.en || values.zh || values.ja || values.ko || '';
}

if (!fs.existsSync(translationsPath)) {
    console.error('translations.json not found');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
let sql = '-- Seed data generated from backend/translations.json\n';
sql += '-- Targets current schema only: Translation_UI and AreaList.\n\n';

const staticKeys = data.static || {};
for (const [key, values] of Object.entries(staticKeys)) {
    sql += `MERGE dbo.Translation_UI AS target\n`;
    sql += `USING (SELECT '${key.replace(/'/g, "''")}' AS KeyCode) AS source\n`;
    sql += `ON target.KeyCode = source.KeyCode\n`;
    sql += `WHEN MATCHED THEN UPDATE SET\n`;
    sql += languages.map((lang) => `    ${lang.toUpperCase()} = ${escapeSql(values[lang])}`).join(',\n');
    sql += `\nWHEN NOT MATCHED THEN\n`;
    sql += `    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)\n`;
    sql += `    VALUES (source.KeyCode, 'label', ${languages.map((lang) => escapeSql(values[lang])).join(', ')});\n\n`;
}

const dynamicKeys = data.dynamic || {};
for (const [mappedinId, values] of Object.entries(dynamicKeys)) {
    const escapedMappedinId = mappedinId.replace(/'/g, "''");
    const defaultName = pickDefaultName(values);
    sql += `MERGE dbo.AreaList AS target\n`;
    sql += `USING (SELECT '${escapedMappedinId}' AS MappedinID) AS source\n`;
    sql += `ON target.MappedinID = source.MappedinID\n`;
    sql += `WHEN MATCHED THEN UPDATE SET\n`;
    sql += `    Name = COALESCE(NULLIF(Name, ''), ${escapeSql(defaultName)}),\n`;
    sql += languages.map((lang) => `    ${lang.toUpperCase()} = ${escapeSql(values[lang])}`).join(',\n');
    sql += `\nWHEN NOT MATCHED THEN\n`;
    sql += `    INSERT (MappedinID, Name, VN, EN, ZH, JA, KO)\n`;
    sql += `    VALUES (source.MappedinID, ${escapeSql(defaultName)}, ${languages.map((lang) => escapeSql(values[lang])).join(', ')});\n\n`;
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sql);
console.log('Seed SQL generated at:', outputPath);
