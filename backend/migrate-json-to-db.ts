
import fs from 'fs';
import path from 'path';
import { getDbConnection, sql } from './db';

async function migrateJsonToDb() {
    try {
        const jsonPath = path.join(__dirname, '..', 'Model3D', 'tree.json');
        if (!fs.existsSync(jsonPath)) {
            console.error('❌ tree.json not found at:', jsonPath);
            return;
        }

        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const models = data.models || [];

        console.log(`📂 Found ${models.length} models in tree.json. Starting migration...`);

        const db = await getDbConnection();

        for (const m of models) {
            // Mapping Logic
            const uuid = m.id || `json-import-${Math.random().toString(36).substr(2, 9)}`;
            const name = m.modelId === 'three_palm' ? 'Palm Tree' : (m.modelId === 'custom-r6f5sb' ? 'Airplane' : m.modelId);
            const desc = 'Imported from tree.json';
            const url = m.url || m.modelId; // If no URL, use modelId as identifier

            // Map floorId - handle legacy IDs if necessary
            // In the DB, user mentioned Floor 2 is f_37289aacc039e64c
            let floorId = m.coordinate.floorId;
            if (floorId === 'm_d4b5674c0b15e099') floorId = 'f_37289aacc039e64c'; // Sync to new ID for Floor 2
            if (floorId === 'm_dae8f26a40f6017f') floorId = 'f_b370ebc2bc0f209e'; // Example sync for Floor G/1 if known

            const lat = m.coordinate.latitude;
            const lon = m.coordinate.longitude;

            const rotX = m.rotation[0] || 0;
            const rotY = m.rotation[1] || 0;
            const rotZ = m.rotation[2] || 0;

            const scaleX = m.scale[0] || 1;
            const scaleY = m.scale[1] || 1;
            const scaleZ = m.scale[2] || 1;

            const displayWebsite = 1; // Default to visible
            const createdBy = 'SystemMigration';

            console.log(`📤 Migrating ${name} (${uuid})...`);

            await db.request()
                .input('UUID', sql.NVarChar(50), uuid)
                .input('ModelName', sql.NVarChar(200), name)
                .input('Description', sql.NVarChar(500), desc)
                .input('ModelURL', sql.NVarChar(500), url)
                .input('Latitude', sql.Decimal(18, 10), lat)
                .input('Longitude', sql.Decimal(18, 10), lon)
                .input('FloorId', sql.NVarChar(100), floorId)
                .input('FloorName', sql.NVarChar(100), null)
                .input('RotationX', sql.Decimal(18, 4), rotX)
                .input('RotationY', sql.Decimal(18, 4), rotY)
                .input('RotationZ', sql.Decimal(18, 4), rotZ)
                .input('ScaleX', sql.Decimal(18, 4), scaleX)
                .input('ScaleY', sql.Decimal(18, 4), scaleY)
                .input('ScaleZ', sql.Decimal(18, 4), scaleZ)
                .input('DisplayWebsite', sql.Bit, displayWebsite)
                .input('CreatedBy', sql.NVarChar(100), createdBy)
                .execute('SP_UpsertModel');
        }

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrateJsonToDb();
