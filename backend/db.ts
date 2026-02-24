
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from root (fallback)
dotenv.config({ path: path.join(__dirname, '../.env') });

let config: sql.config | null = null;

// Try to load from appsettings.json first
const appSettingsPath = path.join(__dirname, 'appsettings.json');
if (fs.existsSync(appSettingsPath)) {
    try {
        const appSettings = JSON.parse(fs.readFileSync(appSettingsPath, 'utf-8'));
        const connectionString = appSettings.ConnectionStrings?.DefaultConnection;

        if (connectionString) {
            console.log('📄 Found ConnectionString in appsettings.json');

            // Basic parsing of Connection String
            // "Server=DESKTOP-1711NIU;Database=MappedIn3DModels;User Id=sa;Password=123@;Encrypt=true;TrustServerCertificate=true;"
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
        console.warn('⚠️ Failed to parse appsettings.json, falling back to .env:', e);
    }
}

// Fallback to .env if appsettings failed or missing
if (!config) {
    config = {
        user: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD || 'your_password',
        server: process.env.DB_SERVER || 'localhost',
        database: process.env.DB_NAME || 'MappedIn3DModels',
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
