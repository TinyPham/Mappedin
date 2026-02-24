
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from root (fallback)
dotenv.config({ path: path.join(__dirname, '../.env') });

let config: sql.config | null = null;

// ===== CONFIG PRIORITY ORDER =====
// 1. Environment Variables (Render production) → HIGHEST PRIORITY
// 2. appsettings.json (local development) → FALLBACK
// ===================================

// PRIORITY 1: Check Environment Variables first (Render sets these)
if (process.env.DB_SERVER) {
    console.log('🌐 Using Environment Variables for DB config (Production)');
    config = {
        server: process.env.DB_SERVER,
        database: process.env.DB_NAME || 'MappedIn3DModels',
        user: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD || '',
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };
}

// PRIORITY 2: Fallback to appsettings.json (Local development)
if (!config) {
    // When running compiled (backend/dist/server.js), __dirname = backend/dist/
    // When running ts-node (backend/server.ts), __dirname = backend/
    let appSettingsPath = path.join(__dirname, 'appsettings.json');
    if (!fs.existsSync(appSettingsPath)) {
        appSettingsPath = path.join(__dirname, '..', 'appsettings.json');
    }
    if (fs.existsSync(appSettingsPath)) {
        try {
            const appSettings = JSON.parse(fs.readFileSync(appSettingsPath, 'utf-8'));
            const connectionString = appSettings.ConnectionStrings?.DefaultConnection;

            if (connectionString) {
                console.log('📄 Using appsettings.json for DB config (Local Dev)');

                const getPart = (key: string) => {
                    const match = connectionString.match(new RegExp(`${key}=([^;]+)`, 'i'));
                    return match ? match[1] : null;
                };

                config = {
                    server: getPart('Server') || 'localhost',
                    database: getPart('Database') || 'MappedIn3DModels',
                    user: getPart('User Id') || 'sa',
                    password: getPart('Password') || '',
                    options: {
                        encrypt: getPart('Encrypt') === 'true',
                        trustServerCertificate: getPart('TrustServerCertificate') === 'true'
                    }
                };
            }
        } catch (e) {
            console.warn('⚠️ Failed to parse appsettings.json:', e);
        }
    }
}

// LAST RESORT: Default config
if (!config) {
    config = {
        user: 'sa',
        password: '',
        server: 'localhost',
        database: 'MappedIn3DModels',
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    };
}

let pool: sql.ConnectionPool | null = null;

export const getDbConnection = async () => {
    if (pool) return pool;

    if (!config) throw new Error("Database configuration checking failed."); // Should not happen

    try {
        console.log(`🔌 Connecting to SQL Server: ${config.server}/${config.database}...`);
        pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');
        return pool;
    } catch (err) {
        console.error('❌ Database Connection Failed:', err);
        throw err;
    }
};

export const sqlQuery = async (query: string, params: { name: string, type: any, value: any }[] = []) => {
    const db = await getDbConnection();
    const request = db.request();

    params.forEach(p => {
        request.input(p.name, p.type, p.value);
    });

    return await request.query(query);
};

export { sql };
