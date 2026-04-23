
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from root (fallback)
dotenv.config({ path: path.join(__dirname, '../.env') });

let config: sql.config | null = null;

// 1. ƯU TIÊN: Appsettings.json (Dành cho Localhost - Máy của bạn)
let appSettingsPath = path.join(__dirname, 'appsettings.json');
if (!fs.existsSync(appSettingsPath)) {
    appSettingsPath = path.join(__dirname, '..', 'appsettings.json');
}

if (fs.existsSync(appSettingsPath)) {
    try {
        const appSettings = JSON.parse(fs.readFileSync(appSettingsPath, 'utf-8'));
        const connectionString = appSettings.ConnectionStrings?.DefaultConnection;

        if (connectionString) {
            console.log('🏠 [Local] Using appsettings.json for DB');
            const getPart = (key: string) => {
                // Regex cải tiến: Bỏ qua khoảng trắng trước và sau dấu = và dấu ;
                const regex = new RegExp(`${key}\\s*=\\s*([^;]+)`, 'i');
                const match = connectionString.match(regex);
                return match ? match[1].trim() : null;
            };

            config = {
                server: getPart('Server') || 'localhost',
                database: getPart('Database') || 'MappedIn3DModels',
                user: getPart('User Id') || 'sa',
                password: getPart('Password') || '',
                options: {
                    encrypt: getPart('Encrypt') === 'true',
                    trustServerCertificate: getPart('TrustServerCertificate') === 'true'
                },
                connectionTimeout: 30000, // 30 giây để đợi kết nối Online
                requestTimeout: 30000     // 30 giây cho mỗi truy vấn
            };
        }
    } catch (e) {
        console.warn('⚠️ Parse appsettings fail:', e);
    }
}

// 2. DỰ PHÒNG: Biến môi trường (Dành cho Render Production)
if (!config && process.env.DB_SERVER) {
    console.log('🌐 [Production] Using Environment Variables for DB');
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

// 3. MẶC ĐỊNH CUỐI CÙNG
if (!config) {
    config = {
        user: 'sa',
        password: '',
        server: 'localhost',
        database: 'MappedIn3DModels',
        options: { encrypt: false, trustServerCertificate: true }
    };
}

let pool: sql.ConnectionPool | null = null;

export const getDbConnection = async () => {
    if (pool && pool.connected) return pool;

    if (!config) {
        console.warn("⚠️ Database configuration missing.");
        return null;
    }

    try {
        const infoMsg = `🔌 [DB-DEBUG] Connecting to: ${config.server} (DB: ${config.database}, Encrypt: ${config.options.encrypt})`;
        console.log(infoMsg);

        pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');
        return pool;
    } catch (err) {
        console.error('❌ Database Connection Failed (Server will continue running):', err);
        pool = null; // Reset pool to try again next time
        return null;
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
