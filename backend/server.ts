// =============================================
// Backend API for 3D Models - Node.js + Express + SQL Server
// =============================================

import express from 'express';
import { getDbConnection, sql } from './db';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import {
    buildAreaColorMap,
    parseAreaColorDeletePayload,
    parseAreaColorUpsertPayload
} from './areaColors';
import { parseOverviewFloorSyncPayload } from './overviewFloorSync';
import {
    getFlightNavigationTargets,
    getFlights
} from './flights/flightRepository';

const app = express();

// Load appsettings.json (Config handled in db.ts now)
// We just need PORT
const appSettingsPath = path.join(__dirname, 'appsettings.json');
let appSettings: any = {};
if (fs.existsSync(appSettingsPath)) {
    try {
        appSettings = JSON.parse(fs.readFileSync(appSettingsPath, 'utf-8'));
    } catch (e) { }
}

const PORT = appSettings.AppSettings?.Port || process.env.PORT || 3002;

// Determine root and dist directories
const ROOT_DIR = __filename.endsWith('.js')
    ? path.join(__dirname, '../..')
    : path.join(__dirname, '..');
const FRONTEND_DIST = path.join(ROOT_DIR, 'dist');

// Middleware
// Bật nén Gzip/Brotli tự động cho mọi response HTTP (giảm ~30% bandwidth)
app.use(compression());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/icon-category', express.static(path.join(ROOT_DIR, 'icon-category')));
app.use('/Model3D', express.static(path.join(ROOT_DIR, 'Model3D'), {
    maxAge: '30d',
    immutable: true,
    etag: true,
    lastModified: true
}));
app.use('/uploads', express.static(path.join(ROOT_DIR, 'uploads')));

if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
}
app.use('/', express.static(ROOT_DIR));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



// Initialize database connection
async function initDB() {
    try {
        await getDbConnection();
        // Sync Categories on startup (if needed)
        // await syncCategories(); 
    } catch (err) {
        console.error('Failed to init DB:', err);
    }
}

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Serve uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// =============================================
// API Endpoints
// =============================================

async function fetchAreaColorMap(db: sql.ConnectionPool) {
    const result = await db.request().query(`
        IF OBJECT_ID(N'dbo.AreaColorOverrides', N'U') IS NULL
            SELECT CAST(NULL AS NVARCHAR(100)) AS MappedinID, CAST(NULL AS NVARCHAR(7)) AS ColorHex WHERE 1 = 0;
        ELSE
            SELECT MappedinID, ColorHex FROM dbo.AreaColorOverrides;
    `);

    return buildAreaColorMap(result.recordset || []);
}

async function ensureAreaColorTableExists(db: sql.ConnectionPool) {
    const result = await db.request().query(`
        SELECT CASE WHEN OBJECT_ID(N'dbo.AreaColorOverrides', N'U') IS NULL THEN 0 ELSE 1 END AS ExistsFlag;
    `);

    if (!result.recordset?.[0]?.ExistsFlag) {
        throw new Error('AreaColorOverrides table does not exist. Apply the database patch first.');
    }
}

// POST: Upload Image (Base64)
app.post('/api/upload-image', (req, res) => {
    try {
        const { image, filename } = req.body;
        if (!image || !filename) {
            return res.status(400).json({ error: 'Missing image or filename' });
        }

        // Remove header if present (e.g. "data:image/png;base64,")
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique name to prevent cache issues
        const uniqueName = `${Date.now()}_${filename}`;
        const filePath = path.join(UPLOADS_DIR, uniqueName);

        fs.writeFileSync(filePath, buffer);

        // Return public URL
        const protocol = req.protocol;
        const host = req.get('host');
        const publicUrl = `${protocol}://${host}/uploads/${uniqueName}`;

        res.json({ url: publicUrl });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// POST: Translate Text (Google Translate Proxy)
app.post('/api/translate', async (req, res) => {
    const { text, to } = req.body;
    if (!text) return res.json({ translatedText: "" });
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        // Google returns [[["translated_text", "original", ...], ...]]
        const translated = data[0][0][0];
        res.json({ translatedText: translated });
    } catch (err: any) {
        console.error('Translation error:', err);
        res.status(500).json({ error: 'Translation failed' });
    }
});

// POST: Update Area Information
app.post('/api/update-area-info', async (req, res) => {
    try {
        const {
            id,
            name_vi, name_en, name_zh, name_ja, name_ko,
            vn, en, zh, ja, ko,
            imageUrl, mappedinImageUrl,
            phone, openingHours,
            detail_vn, detail_en, detail_zh, detail_ja, detail_ko
        } = req.body;

        if (!id) return res.status(400).json({ error: 'Missing ID' });

        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        await db.request()
            .input('MappedinId', sql.NVarChar(100), id)
            .input('NameVN', sql.NVarChar(200), name_vi)
            .input('NameEN', sql.NVarChar(200), name_en)
            .input('NameZH', sql.NVarChar(200), name_zh)
            .input('NameJA', sql.NVarChar(200), name_ja)
            .input('NameKO', sql.NVarChar(200), name_ko)
            .input('VN', sql.NVarChar(sql.MAX), vn)
            .input('EN', sql.NVarChar(sql.MAX), en)
            .input('ZH', sql.NVarChar(sql.MAX), zh)
            .input('JA', sql.NVarChar(sql.MAX), ja)
            .input('KO', sql.NVarChar(sql.MAX), ko)
            .input('ImageUrl', sql.NVarChar(500), imageUrl)
            .input('MappedinImageUrl', sql.NVarChar(500), mappedinImageUrl || null)
            .input('Phone', sql.NVarChar(50), phone)
            .input('OpeningHours', sql.NVarChar(100), openingHours)
            .input('LocationDetail_VN', sql.NVarChar(sql.MAX), detail_vn)
            .input('LocationDetail_EN', sql.NVarChar(sql.MAX), detail_en)
            .input('LocationDetail_ZH', sql.NVarChar(sql.MAX), detail_zh)
            .input('LocationDetail_JA', sql.NVarChar(sql.MAX), detail_ja)
            .input('LocationDetail_KO', sql.NVarChar(sql.MAX), detail_ko)
            .execute('SP_UpsertAreaInformation');

        res.json({ success: true });
    } catch (err: any) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/area-colors', async (req, res) => {
    try {
        const { areaIds, color } = parseAreaColorUpsertPayload(req.body);
        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        await ensureAreaColorTableExists(db);

        for (const areaId of areaIds) {
            await db.request()
                .input('MappedinID', sql.NVarChar(100), areaId)
                .input('ColorHex', sql.NVarChar(7), color)
                .query(`
                    MERGE dbo.AreaColorOverrides AS target
                    USING (SELECT @MappedinID AS MappedinID, @ColorHex AS ColorHex) AS source
                    ON target.MappedinID = source.MappedinID
                    WHEN MATCHED THEN
                        UPDATE SET ColorHex = source.ColorHex, UpdatedAt = SYSUTCDATETIME()
                    WHEN NOT MATCHED THEN
                        INSERT (MappedinID, ColorHex, UpdatedAt)
                        VALUES (source.MappedinID, source.ColorHex, SYSUTCDATETIME());
                `);
        }

        const areaColors = await fetchAreaColorMap(db);
        res.json({ success: true, areaColors });
    } catch (err: any) {
        console.error('Area color upsert error:', err);
        res.status(400).json({ error: err.message || 'Failed to save area colors' });
    }
});

app.delete('/api/area-colors', async (req, res) => {
    try {
        const { areaIds } = parseAreaColorDeletePayload(req.body);
        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        await ensureAreaColorTableExists(db);

        for (const areaId of areaIds) {
            await db.request()
                .input('MappedinID', sql.NVarChar(100), areaId)
                .query(`DELETE FROM dbo.AreaColorOverrides WHERE MappedinID = @MappedinID;`);
        }

        const areaColors = await fetchAreaColorMap(db);
        res.json({ success: true, areaColors });
    } catch (err: any) {
        console.error('Area color delete error:', err);
        res.status(400).json({ error: err.message || 'Failed to delete area colors' });
    }
});

// GET all models
app.get('/api/models', async (req, res) => {
    try {
        const db = await getDbConnection();
        if (!db) {
            console.warn("⚠️ [Offline Mode] Returning empty models list");
            return res.json([]);
        }
        const result = await db.request()
            .execute('SP_GetAllModels');

        // Transform to match client format
        const models = result.recordset.map(row => {
            const url = row.ModelURL || '';
            const baseName = url.split('/').pop()?.split('.')[0] || '';
            const thumb = baseName ? `${baseName}.jpg` : null;

            return {
                uuid: row.UUID,
                url: url,
                name: row.ModelName || '',
                desc: row.Description || '',
                latitude: parseFloat(row.Latitude),
                longitude: parseFloat(row.Longitude),
                floorId: row.FloorId,
                rotation: [row.RotationX, row.RotationY, row.RotationZ],
                scale: [row.ScaleX, row.ScaleY, row.ScaleZ],
                displayWebsite: row.DisplayWebsite ? 1 : 0,
                thumb: thumb,
                elevation: row.Elevation != null ? parseFloat(row.Elevation) : 0
            };
        });


        res.json(models);
    } catch (err: any) {
        console.error('Error fetching models:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/models/sync-overview-floor', async (req, res) => {
    try {
        const { overviewFloorId } = parseOverviewFloorSyncPayload(req.body);

        const db = await getDbConnection();
        if (!db) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const result = await db.request()
            .input('RuntimeOverviewFloorId', sql.NVarChar(100), overviewFloorId)
            .execute('SP_UpdateOverviewModelFloorId');

        const updatedRows = Number(result.recordset?.[0]?.UpdatedRows ?? 0);
        res.json({ success: true, updatedRows });
    } catch (err: any) {
        console.error('Overview floor sync error:', err);
        res.status(400).json({ error: err.message || 'Failed to sync overview floor id' });
    }
});

app.get('/api/flights', async (req, res) => {
    try {
        const date = typeof req.query.date === 'string' ? req.query.date : null;
        const arrDep = typeof req.query.arrDep === 'string' ? req.query.arrDep.trim().toUpperCase() : null;
        const search = typeof req.query.search === 'string' ? req.query.search : null;

        if (arrDep && arrDep !== 'A' && arrDep !== 'D') {
            return res.status(400).json({ error: 'arrDep must be A or D' });
        }

        const flights = await getFlights({
            date,
            arrDep,
            search
        });

        res.json(flights);
    } catch (err: any) {
        console.error('Flight list error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch flights' });
    }
});

app.get('/api/flights/:id/navigation-targets', async (req, res) => {
    try {
        const flightId = Number(req.params.id);
        if (!Number.isInteger(flightId) || flightId <= 0) {
            return res.status(400).json({ error: 'Invalid flight id' });
        }

        const payload = await getFlightNavigationTargets(flightId);
        if (!payload.flight) {
            return res.status(404).json({ error: 'Flight not found' });
        }

        res.json({
            flight: payload.flight,
            counters: payload.counters
        });
    } catch (err: any) {
        console.error('Flight navigation target error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch flight navigation targets' });
    }
});

// GET model by UUID
app.get('/api/models/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;

        const db = await getDbConnection();
        const result = await db.request()
            .input('UUID', sql.NVarChar(50), uuid)
            .execute('SP_GetModelByUUID');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Model not found' });
        }

        const row = result.recordset[0];
        const url = row.ModelURL || '';
        const baseName = url.split('/').pop()?.split('.')[0] || '';
        const thumb = baseName ? `${baseName}.jpg` : null;

        const model = {
            uuid: row.UUID,
            url: url,
            name: row.ModelName || '',
            desc: row.Description || '',
            latitude: parseFloat(row.Latitude),
            longitude: parseFloat(row.Longitude),
            floorId: row.FloorId,
            rotation: [row.RotationX, row.RotationY, row.RotationZ],
            scale: [row.ScaleX, row.ScaleY, row.ScaleZ],
            displayWebsite: row.DisplayWebsite ? 1 : 0,
            thumb: thumb,
            elevation: row.Elevation != null ? parseFloat(row.Elevation) : 0
        };


        res.json(model);
    } catch (err: any) {
        console.error('Error fetching model:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST/PUT - Create or Update model
app.post('/api/models', async (req, res) => {
    try {
        const {
            uuid,
            url,
            name,
            desc,
            latitude,
            longitude,
            floorId,
            rotation,
            scale,
            displayWebsite,
            elevation
        } = req.body;


        // Validation
        if (!uuid || !url || !latitude || !longitude) {
            return res.status(400).json({
                error: 'Missing required fields: uuid, url, latitude, longitude'
            });
        }

        console.log(`💾 Persisting model: ${name} (${uuid}) at ${latitude}, ${longitude}`);
        const db = await getDbConnection();
        await db.request()
            .input('UUID', sql.NVarChar(50), uuid)
            .input('ModelName', sql.NVarChar(200), name || '')
            .input('Description', sql.NVarChar(500), desc || '')
            .input('ModelURL', sql.NVarChar(500), url)
            .input('Latitude', sql.Decimal(18, 10), latitude)
            .input('Longitude', sql.Decimal(18, 10), longitude)
            .input('FloorId', sql.NVarChar(100), floorId || null)
            .input('FloorName', sql.NVarChar(100), null)
            .input('RotationX', sql.Decimal(18, 4), rotation?.[0] ?? 0)
            .input('RotationY', sql.Decimal(18, 4), rotation?.[1] ?? 0)
            .input('RotationZ', sql.Decimal(18, 4), rotation?.[2] ?? 0)
            .input('ScaleX', sql.Decimal(18, 6), scale?.[0] ?? 1)
            .input('ScaleY', sql.Decimal(18, 6), scale?.[1] ?? 1)
            .input('ScaleZ', sql.Decimal(18, 6), scale?.[2] ?? 1)
            .input('DisplayWebsite', sql.Bit, displayWebsite ? 1 : 0)
            .input('CreatedBy', sql.NVarChar(100), null)
            .input('Elevation', sql.Decimal(18, 4), elevation ?? 0)
            .execute('SP_UpsertModel');


        res.json({ success: true, message: 'Model saved successfully' });
    } catch (err: any) {
        console.error('Error saving model:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE - Soft delete model
app.delete('/api/models/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;

        const db = await getDbConnection();
        await db.request()
            .input('UUID', sql.NVarChar(50), uuid)
            .execute('SP_DeleteModel');

        res.json({ success: true, message: 'Model deleted successfully' });
    } catch (err: any) {
        console.error('Error deleting model:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Batch save models (for initial migration from localStorage)
app.post('/api/models/batch', async (req, res) => {
    try {
        const { models } = req.body;

        if (!Array.isArray(models)) {
            return res.status(400).json({ error: 'models must be an array' });
        }

        const db = await getDbConnection();
        for (const model of models) {
            await db.request()
                .input('UUID', sql.NVarChar(50), model.uuid)
                .input('ModelName', sql.NVarChar(200), model.name || '')
                .input('Description', sql.NVarChar(500), model.desc || '')
                .input('ModelURL', sql.NVarChar(500), model.url)
                .input('Latitude', sql.Decimal(10, 8), model.latitude)
                .input('Longitude', sql.Decimal(11, 8), model.longitude)
                .input('FloorId', sql.NVarChar(100), model.floorId || null)
                .input('FloorName', sql.NVarChar(100), null)
                .input('RotationX', sql.Decimal(10, 4), model.rotation?.[0] ?? 0)
                .input('RotationY', sql.Decimal(10, 4), model.rotation?.[1] ?? 0)
                .input('RotationZ', sql.Decimal(10, 4), model.rotation?.[2] ?? 0)
                .input('ScaleX', sql.Decimal(10, 6), model.scale?.[0] ?? 1)
                .input('ScaleY', sql.Decimal(10, 6), model.scale?.[1] ?? 1)
                .input('ScaleZ', sql.Decimal(10, 6), model.scale?.[2] ?? 1)
                .input('DisplayWebsite', sql.Bit, model.displayWebsite ? 1 : 0)
                .input('CreatedBy', sql.NVarChar(100), 'batch-import')
                .execute('SP_UpsertModel');

        }

        res.json({
            success: true,
            message: `Successfully saved ${models.length} models`
        });
    } catch (err: any) {
        console.error('Error batch saving models:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET available models for picker (from AvailableModels table)
app.get('/api/available-models', async (req, res) => {
    try {
        const db = await getDbConnection();
        const result = await db.request()
            .execute('SP_GetAvailableModels');

        // DEBUG: Log first row to see actual column names
        if (result.recordset.length > 0) {
            console.log('📋 DEBUG AvailableModels columns:', Object.keys(result.recordset[0]));
            console.log('📋 DEBUG First row:', result.recordset[0]);
        }

        const models = result.recordset.map(row => ({
            id: row.AvailableModelId || row.AvailableModelID || row.Id || 0,
            name: row.ModelName || '',
            file: row.Filename || row.FileName || '',
            thumb: row.Thumbnail || row.ThumbNail || row.thumbnail || '',
            scale: [
                row.DefaultScaleX ?? row.DefaultIScaleX ?? 2,
                row.DefaultScaleY ?? row.DefaultIScaleY ?? 2,
                row.DefaultScaleZ ?? row.DefaultIScaleZ ?? 2
            ],
            rotation: [
                row.DefaultRotationX ?? row.DefaultIRotationX ?? 90,
                row.DefaultRotationY ?? row.DefaultIRotationY ?? 90,
                row.DefaultRotationZ ?? row.DefaultIRotationZ ?? 1
            ]
        }));

        console.log('📋 DEBUG Models response (first 2):', models.slice(0, 2));
        res.json(models);
    } catch (err: any) {
        console.error('Error fetching available models:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
app.get('/health', async (req, res) => {
    let dbStatus = "Disconnected";
    try {
        const db = await getDbConnection();
        if (db && (db as any).connected) {
            dbStatus = "Connected";
        }
    } catch (e) {
        dbStatus = "Error: " + (e as any).message;
    }

    res.json({
        status: 'OK',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// =============================================
// FILE WATCHER & SYNC LOGIC
// =============================================

// Default configurations for known models (to preserve scaling)
const KNOWN_DEFAULTS: Record<string, any> = {
    // Defaults are now managed in the database via update_model_defaults.sql
    // This fallback is only used for brand new models added to the folder
    // that haven't been configured in the DB yet.
    // Default: neutral orientation (Y-up, no rotation, 1:1 scale)
};

// =============================================
// CATEGORY & AREA CLASSIFICATION SYNC
// =============================================

const UI_CATEGORY_MAP: Record<string, any> = {
    "Accessible": { vn: "Hỗ trợ người khuyết tật", en: "Accessible", zh: "无障碍设施", ja: "バリアフリー", ko: "장애인 지원" },
    "Beauty": { vn: "Làm đẹp", en: "Beauty", zh: "美容", ja: "美容", ko: "미용" },
    "Connection": { vn: "Kết nối", en: "Connection", zh: "连接", ja: "接続", ko: "연결" },
    "Electronic": { vn: "Điện tử", en: "Electronic", zh: "电子", ja: "電子", ko: "전자" },
    "Entertainment": { vn: "Thư giãn", en: "Entertainment", zh: "娱乐", ja: "エンターテインメント", ko: "엔터테인먼트" },
    "Fashion": { vn: "Thời trang", en: "Fashion", zh: "时尚", ja: "ファッション", ko: "패션" },
    "Fitness": { vn: "Thể thao", en: "Fitness", zh: "健身", ja: "フィットネス", ko: "피트니스" },
    "Food&Drink": { vn: "Ăn uống", en: "Food & Drink", zh: "餐饮", ja: "飲食店", ko: "식음료" },
    "Lounge": { vn: "Phòng chờ", en: "Lounge", zh: "休息室", ja: "ラウンジ", ko: "라운지" },
    "Pharmacy": { vn: "Nhà thuốc", en: "Pharmacy", zh: "药房", ja: "薬局", ko: "약국" },
    "AirportService": { vn: "Dịch vụ sân bay", en: "Airport Service", zh: "机场服务", ja: "空港サービス", ko: "공항 서비스" },
    "Store": { vn: "Cửa hàng", en: "Store", zh: "商店", ja: "店舗", ko: "상점" },
    "DepartureFlightProcedures": { vn: "Thủ tục chuyến bay đi", en: "Departure Procedures", zh: "出港程序", ja: "出発手続き", ko: "출국 절차" },
    "ArrivalFlightProcedures": { vn: "Thủ tục chuyến bay đến", en: "Arrival Procedures", zh: "入港程序", ja: "到着手続き", ko: "입국 절차" },
    "TransitProcedures": { vn: "Thủ tục nối chuyến", en: "Transit Procedures", zh: "中转程序", ja: "乗り継ぎ手続き", ko: "환승 절차" }
};

const SUB_CATEGORY_MAP: Record<string, any> = {
    // Accessible
    "accessible": { vn: "Hỗ trợ người khuyết tật", en: "Accessible", zh: "无障碍设施", ja: "バリアフリー", ko: "장애인 지원" },

    // Beauty
    "cosmetic": { vn: "Mỹ phẩm", en: "Cosmetics", zh: "化妆品", ja: "化粧品", ko: "화장품" },
    "spa-massage": { vn: "Spa & Massage", en: "Spa & Massage", zh: "SP & 按摩", ja: "スパ＆マッサージ", ko: "스파 & 마사지" },

    // Connection
    "elevator": { vn: "Thang máy", en: "Elevator", zh: "电梯", ja: "エレベーター", ko: "엘리베이터" },
    "entrance": { vn: "Lối vào", en: "Entrance", zh: "入口", ja: "入口", ko: "입구" },
    "escalator": { vn: "Thang cuốn", en: "Escalator", zh: "自动扶梯", ja: "エスカレーター", ko: "에스컬레이터" },
    "gate": { vn: "Cửa khởi hành", en: "Departure Gate", zh: "登机口", ja: "搭乗口", ko: "탑승구" },

    // Electronic
    "electronic": { vn: "Thiết bị điện tử", en: "Electronics", zh: "电子产品", ja: "電子機器", ko: "전자 기기" },

    // Entertainment / Relax
    "casino": { vn: "Casino", en: "Casino", zh: "赌场", ja: "カジノ", ko: "카지노" },
    "gaming": { vn: "Khu trò chơi", en: "Gaming Zone", zh: "游戏区", ja: "ゲームゾーン", ko: "게임 존" },
    "movie-theater": { vn: "Rạp chiếu phim", en: "Movie Theater", zh: "电影院", ja: "映画館", ko: "영화관" },
    "massage-chair": { vn: "Ghế massage", en: "Massage Chair", zh: "按摩椅", ja: "マッサージチェア", ko: "안마 의자" },
    "sleep-box": { vn: "Khu vực nghỉ ngơi", en: "Rest Area", zh: "休息区", ja: "休憩エリア", ko: "휴게실" },
    "pray-area": { vn: "Phòng cầu nguyện", en: "Prayer Room", zh: "祈祷室", ja: "祈祷室", ko: "기도실" },

    // Fashion
    "accessories": { vn: "Phụ kiện", en: "Accessories", zh: "配饰", ja: "アクセサリー", ko: "액세서리" },
    "eyewear": { vn: "Mắt kính", en: "Eyewear", zh: "眼镜", ja: "アイウェア", ko: "안경" },
    "footwear": { vn: "Giày dép", en: "Footwear", zh: "鞋子", ja: "フットウェア", ko: "신발" },
    "handbag": { vn: "Túi xách", en: "Handbags", zh: "手提包", ja: "ハンドバッグ", ko: "핸드백" },
    "jewelry": { vn: "Trang sức", en: "Jewelry", zh: "珠宝", ja: "ジュエリー", ko: "보석" },
    "luxury-fashion": { vn: "Thời trang cao cấp", en: "Luxury Fashion", zh: "奢华时尚", ja: "ラグジュアリーファッション", ko: "명품 패션" },
    "sleepwear": { vn: "Đồ ngủ", en: "Sleepwear", zh: "睡衣", ja: "スリープウェア", ko: "잠옷" },

    // Fitness
    "gym": { vn: "Phòng tập Gym", en: "Gym", zh: "健身房", ja: "ジム", ko: "체육관" },

    // Food&Drink
    "alcohol": { vn: "Rượu & Đồ uống có cồn", en: "Alcohol", zh: "酒精饮料", ja: "アルコール", ko: "주류" },
    "bakery": { vn: "Tiệm bánh", en: "Bakery", zh: "面包店", ja: "ベーカリー", ko: "베이커리" },
    "bar": { vn: "Quầy Bar", en: "Bar", zh: "酒吧", ja: "バー", ko: "바" },
    "coffee": { vn: "Cà phê", en: "Coffee Shop", zh: "咖啡店", ja: "カフェ", ko: "커피숍" },
    "fast-food": { vn: "Thức ăn nhanh", en: "Fast Food", zh: "快餐", ja: "ファストフード", ko: "패스트푸드" },
    "food-court": { vn: "Khu ẩm thực", en: "Food Court", zh: "美食广场", ja: "フードコート", ko: "푸드 코트" },
    "ice-cream": { vn: "Kem", en: "Ice Cream", zh: "冰淇淋", ja: "アイスクリーム", ko: "아이스크림" },
    "pizza": { vn: "Pizza", en: "Pizza", zh: "比萨", ja: "ピザ", ko: "피자" },
    "restaurant": { vn: "Nhà hàng", en: "Restaurant", zh: "餐厅", ja: "レストラン", ko: "레스토랑" },

    // Pharmacy
    "pharmacy": { vn: "Nhà thuốc", en: "Pharmacy", zh: "药房", ja: "薬局", ko: "약국" },

    // Service
    "atm": { vn: "Máy ATM", en: "ATM", zh: "自动提款机", ja: "ATM", ko: "ATM" },
    "car-parking": { vn: "Bãi đỗ xe ô tô", en: "Car Parking", zh: "停车场", ja: "駐車場", ko: "주차장" },
    "currency-exchange": { vn: "Đổi ngoại tệ", en: "Currency Exchange", zh: "外币兑换", ja: "外貨両替", ko: "환전" },
    "drinking-water-area": { vn: "Nước uống miễn phí", en: "Drinking Water", zh: "饮用水", ja: "飲料水", ko: "음용수" },
    "exhibit": { vn: "Khu triển lãm", en: "Exhibit Area", zh: "展览区", ja: "展示エリア", ko: "전시 구역" },
    "family-restroom": { vn: "Nhà vệ sinh gia đình", en: "Family Restroom", zh: "家庭卫生间", ja: "ファミリー用トイレ", ko: "가족 화장실" },
    "free-charging-station": { vn: "Trạm sạc miễn phí", en: "Charging Station", zh: "充电站", ja: "充電スタンド", ko: "충전소" },
    "kid-area": { vn: "Khu vui chơi trẻ em", en: "Kid Area", zh: "儿童游乐区", ja: "キッズエリア", ko: "키즈 존" },
    "lost-and-found": { vn: "Hành lý thất lạc", en: "Lost & Found", zh: "失物招领", ja: "遺失物取扱所", ko: "분실물 센터" },
    "motorbike-parking": { vn: "Bãi đỗ xe máy", en: "Motorbike Parking", zh: "摩托车停车场", ja: "バイク駐車場", ko: "오토바이 주차장" },
    "nursing-room": { vn: "Phòng mẹ và bé", en: "Nursing Room", zh: "母婴室", ja: "授乳室", ko: "수유실" },
    "parking": { vn: "Bãi đỗ xe", en: "Parking", zh: "停车场", ja: "駐車場", ko: "주차장" },
    "phone": { vn: "Điện thoại công cộng", en: "Public Phone", zh: "公用电话", ja: "公衆電話", ko: "공중전화" },
    "photography": { vn: "Khu chụp ảnh", en: "Photo Zone", zh: "拍照区", ja: "フォトゾーン", ko: "포토 존" },
    "restroom": { vn: "Nhà vệ sinh", en: "Restroom", zh: "卫生间", ja: "トイレ", ko: "화장실" },
    "shopping-cart": { vn: "Xe đẩy hành lý", en: "Baggage Cart", zh: "行李车", ja: "手荷物カート", ko: "수하물 카트" },
    "shower-room": { vn: "Phòng tắm", en: "Shower Room", zh: "淋浴室", ja: "シャワールーム", ko: "샤워실" },
    "smoking-room": { vn: "Phòng hút thuốc", en: "Smoking Room", zh: "吸烟室", ja: "喫煙所", ko: "흡연실" },
    "taxi-pickup-area": { vn: "Điểm đón Taxi", en: "Taxi Stand", zh: "出租车站", ja: "タクシー乗り場", ko: "택시 승강장" },
    "tourist-information": { vn: "Thông tin du lịch", en: "Tourist Information", zh: "旅游信息", ja: "観光案内所", ko: "관광 안내소" },
    "wrapping-baggage-area": { vn: "Đóng gói hành lý", en: "Baggage Wrapping", zh: "行李打包", ja: "手荷物ラッピング", ko: "수하물 래핑" },
    "yoga": { vn: "Phòng tập Yoga", en: "Yoga Room", zh: "瑜伽室", ja: "ヨガコーナー", ko: "요가 룸" },

    // Store
    "book-shop": { vn: "Hiệu sách", en: "Bookstore", zh: "书店", ja: "書店", ko: "서점" },
    "convenience-store": { vn: "Cửa hàng tiện lợi", en: "Convenience Store", zh: "便利店", ja: "コンビニ", ko: "편의점" },
    "duty-free": { vn: "Cửa hàng miễn thuế", en: "Duty Free", zh: "免税店", ja: "免税店", ko: "면세점" },
    "souvenir-shop": { vn: "Cửa hàng lưu niệm", en: "Souvenir Shop", zh: "礼品店", ja: "お土産店", ko: "기념품점" },
    "flower-store": { vn: "Cửa hàng hoa", en: "Flower Shop", zh: "花店", ja: "フラワーショップ", ko: "꽃집" },

    // Lounge
    "cip-lounge": { vn: "Phòng chờ thương gia", en: "CIP Lounge", zh: "商务休息室", ja: "ビジネスラウンジ", ko: "비즈니스 라운지" },
    "dom-lounge": { vn: "Phòng chờ ga đi quốc nội", en: "Domestic Lounge", zh: "国内出发休息室", ja: "国内線出発ラウンジ", ko: "국내선 출발 라운지" },
    "int-lounge": { vn: "Phòng chờ ga đi quốc tế", en: "International Lounge", zh: "国际出发休息室", ja: "国際線出発ラウンジ", ko: "국제선 출발 라운지" },
    "visa-lounge": { vn: "Phòng chờ visa", en: "Visa Lounge", zh: "签证休息室", ja: "ビザラウンジ", ko: "비자 라운지" },

    // ArrivalFlightProcedures
    "biomectric-regis": { vn: "Đăng ký sinh trắc học", en: "Biometric Registration", zh: "生物识别登记", ja: "バイオメトリック登録", ko: "생체 인식 등록" },
    "custom": { vn: "Hải quan", en: "Customs", zh: "海关", ja: "税関", ko: "세관" },
    "oversize-luggage": { vn: "Hành lý quá khổ", en: "Oversize Baggage", zh: "超大行李", ja: "大型手荷物", ko: "대형 수하물" },
    "immigration": { vn: "Nhập cảnh", en: "Immigration", zh: "入境", ja: "入国審査", ko: "출입국 관리" },
    "int-arrival": { vn: "Khu ga đến quốc tế", en: "International Arrival", zh: "国际到达", ja: "国際線到着", ko: "국제선 도착" },
    "dom-arrival": { vn: "Khu ga đến quốc nội", en: "Domestic Arrival", zh: "国内到达", ja: "国内線到着", ko: "국내선 도착" },
    "baggage-claim-area": { vn: "Khu vực nhận hành lý", en: "Baggage Claim", zh: "行李提取", ja: "手荷物受取所", ko: "수하물 수취 지역" },

    // DepartureFlightProcedures
    "luggage-storage": { vn: "Lưu trữ hành lý", en: "Baggage Storage", zh: "行李寄存", ja: "手荷物預かり所", ko: "수하물 보관소" },
    "fast-track": { vn: "Làn làm thủ tục ưu tiên", en: "Fast Track", zh: "快速通道", ja: "ファストトラック", ko: "패스트 트랙" },
    "emigration": { vn: "Xuất cảnh", en: "Emigration", zh: "出境", ja: "出国審査", ko: "출국 심사" },
    "int-screening-security": { vn: "An ninh soi chiếu quốc tế", en: "International Security", zh: "国际安检", ja: "国際線保安検査", ko: "국제선 보안 검색" },
    "dom-screening-security": { vn: "An ninh soi chiếu nội địa", en: "Domestic Security", zh: "国内安检", ja: "国内線保安検査", ko: "국내선 보안 검색" },
    "int-departure": { vn: "Khu ga đi quốc tế", en: "International Departure", zh: "国际出发", ja: "国際線出発", ko: "국제선 출발" },
    "dom-departure": { vn: "Khu ga đi quốc nội", en: "Domestic Departure", zh: "国内出发", ja: "国内線出発", ko: "국내선 출발" },
    "checkin-area": { vn: "Khu vực làm thủ tục", en: "Check-in Area", zh: "值机区", ja: "チェックインエリア", ko: "체크인 구역" },

    // TransitProcedures
    "int-int-transit": { vn: "Nối chuyến Quốc tế - Quốc tế", en: "Int-Int Transit", zh: "国际-国际中转", ja: "国際線-国際線乗り継ぎ", ko: "국제선-국제선 환승" },
    "dom-dom-transit": { vn: "Nối chuyến Nội địa - Nội địa", en: "Dom-Dom Transit", zh: "国内-国内中转", ja: "国内線-国内線乗り継ぎ", ko: "국내선-국내선 환승" },
    "dom-int-transit": { vn: "Nối chuyến Nội địa - Quốc tế", en: "Dom-Int Transit", zh: "国内-国际中转", ja: "国内線-国際線乗り継ぎ", ko: "국내선-국제선 환승" },

    // AirportService (Additions)
    "traditional-center": { vn: "Trung tâm văn hóa truyền thống", en: "Traditional Culture Center", zh: "传统文化中心", ja: "伝統文化センター", ko: "전통문화센터" },
    "landscape": { vn: "Cảnh quan", en: "Landscape", zh: "景观", ja: "景観", ko: "조경" },
    "post-service": { vn: "Dịch vụ bưu điện", en: "Post Service", zh: "邮政服务", ja: "郵便サービス", ko: "우편 서비스" },
    "welcome-service": { vn: "Dịch vụ đón tiễn khách", en: "Welcome Service", zh: "迎接服务", ja: "ウェルカムサービス", ko: "환영 서비스" },
    "hotel-waiting-area": { vn: "Khu vực chờ xe khách sạn", en: "Hotel Waiting Area", zh: "酒店等待区", ja: "ホテル待機エリア", ko: "호텔 대기 구역" },
    "internet-lounge": { vn: "Phòng Internet", en: "Internet Lounge", zh: "互联网休息室", ja: "インターネットラウンジ", ko: "인터넷 라운지" }
};

async function syncCategories() {
    try {
        const db = await getDbConnection();
        // 1. Run Structural Consolidation (Merges, Deduplication, Re-naming)
        await db.request().execute('SP_SyncCategoryStructure');

        const categoryBaseDir = path.join(__dirname, '..', 'icon-category');
        if (!fs.existsSync(categoryBaseDir)) {
            console.warn(`⚠️ Category directory not found at: ${categoryBaseDir}`);
            return;
        }

        console.log(`📂 Scanning directory: ${categoryBaseDir}`);
        const rootFolders = fs.readdirSync(categoryBaseDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        console.log(`🔍 Found ${rootFolders.length} category folders`);

        for (const folder of rootFolders) {
            const categoryInfo = UI_CATEGORY_MAP[folder] || { vn: folder, en: folder, zh: folder, ja: folder, ko: folder };
            const iconFile = `${folder.toLowerCase().replace(/&/g, '-and-')}.png`;
            const iconPath = fs.existsSync(path.join(categoryBaseDir, iconFile)) ? iconFile : null;

            // 1. Upsert Category
            const db = await getDbConnection();
            const catResult = await db.request()
                .input('Name', sql.NVarChar(200), categoryInfo.vn)
                .input('EN', sql.NVarChar(200), categoryInfo.en || categoryInfo.vn)
                .input('ZH', sql.NVarChar(200), categoryInfo.zh || categoryInfo.vn)
                .input('JA', sql.NVarChar(200), categoryInfo.ja || categoryInfo.vn)
                .input('KO', sql.NVarChar(200), categoryInfo.ko || categoryInfo.vn)
                .input('Icon', sql.NVarChar(500), iconPath)
                .query(`
                    DECLARE @CID INT;
                    SELECT @CID = CategoryID FROM Categories WHERE IconPath = @Icon;
                    IF @CID IS NULL
                        SELECT @CID = CategoryID FROM Categories WHERE CategoryName = @Name;
                    
                    IF @CID IS NOT NULL
                    BEGIN
                        -- CHỈ CẬP NHẬT: Nếu tên trong DB đang trống thì mới nạp tên từ code, còn không thì giữ nguyên bản trong DB
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

            // 2. Sync SubCategories
            const subDir = path.join(categoryBaseDir, folder);
            const subFiles = fs.readdirSync(subDir);
            let subCount = 0;

            for (const subFile of subFiles) {
                if (path.extname(subFile).toLowerCase() !== '.png') continue;

                const baseFileName = path.basename(subFile, '.png').toLowerCase().trim();
                const subInfo = (SUB_CATEGORY_MAP[baseFileName] || {
                    vn: baseFileName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    en: baseFileName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    zh: baseFileName, ja: baseFileName, ko: baseFileName
                });

                // Tên tiếng Anh mặc định (dùng để tìm và xóa các bản ghi cũ)
                const englishNameFallback = baseFileName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                const subIconPath = `${folder}/${subFile}`;

                const db = await getDbConnection();
                await db.request()
                    .input('CatID', sql.Int, categoryId)
                    .input('VN', sql.NVarChar(200), subInfo.vn)
                    .input('EN', sql.NVarChar(200), subInfo.en || subInfo.vn)
                    .input('ZH', sql.NVarChar(200), subInfo.zh || subInfo.vn)
                    .input('JA', sql.NVarChar(200), subInfo.ja || subInfo.vn)
                    .input('KO', sql.NVarChar(200), subInfo.ko || subInfo.vn)
                    .input('EngName', sql.NVarChar(200), englishNameFallback)
                    .input('Icon', sql.NVarChar(500), subIconPath)
                    .query(`
                        DECLARE @SID INT;
                        -- 1. ƯU TIÊN TUYỆT ĐỐI: Tìm theo IconPath vì đây là định danh duy nhất của mỗi loại
                        SELECT @SID = SubCategoryID FROM SubCategories WHERE IconPath = @Icon AND CategoryID = @CatID;

                        IF @SID IS NOT NULL
                        BEGIN
                            -- CHỈ CẬP NHẬT: Ưu tiên dữ liệu trong DB. Nếu cột nào NULL/Trống thì mới lấy từ server.ts bù vào.
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
                            -- 2. Nếu không thấy Icon (có thể do folder mới hoặc đường dẫn đổi), thử tìm theo tên English cũ hoặc tên tiếng Việt hiện tại để chuyển đổi
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
                                -- 3. Nếu hoàn toàn không có gì thì mới chèn mới
                                INSERT INTO SubCategories (CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) 
                                VALUES (@CatID, @VN, @EN, @ZH, @JA, @KO, @Icon, 0);

                            END
                        END

                        -- 4. DỌN DẸP TRIỆT ĐỂ: Xóa bất kỳ bản ghi nào khác có cùng Icon hoặc cùng Tên (nhưng khác SID đang dùng)
                        -- Bước này loại bỏ tình trạng song ngữ và trùng lặp
                        DELETE FROM SubCategories 
                        WHERE CategoryID = @CatID 
                        AND (IconPath = @Icon OR SubCategoryName = @EngName OR (SubCategoryName = @VN AND SubCategoryID != @SID))
                        AND SubCategoryID != @SID;
                    `);
                subCount++;
            }
            console.log(`   ✅ Synced ${categoryInfo.vn}: ${subCount} subcategories`);
        }
        console.log("🚀 Database Cleanup & Sync Complete");
    } catch (err: any) {
        console.error("❌ Error syncing categories:", err);
    }
}

// =============================================
// AREA CLASSIFICATION API
// =============================================

// GET Category Tree
app.get('/api/categories', async (req, res) => {
    try {
        const db = await getDbConnection();
        const result = await db.request().execute('SP_GetCategoryTree');

        const cats = result.recordsets[0];
        const subs = result.recordsets[1];

        const tree = cats.map(c => ({
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

        res.json(tree);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// SYNC Areas from Map to DB
app.post('/api/areas/sync', async (req, res) => {
    try {
        const { areas } = req.body; // Array of { id, name, floorId }
        const db = await getDbConnection();
        for (const area of areas) {
            let finalName = area.name;
            // CHỐNG NHIỄM NGÔN NGỮ: Tự động dịch ngược các tên chung chung từ Mappedin SDK
            if (finalName === 'エスカレーター' || finalName === 'Escalator') finalName = 'Thang cuốn';
            if (finalName === 'エレベーター' || finalName === 'Elevator') finalName = 'Thang máy';

            await db.request()
                .input('MID', sql.NVarChar(100), area.id)
                .input('Name', sql.NVarChar(200), finalName || null)
                .input('FloorID', sql.NVarChar(100), area.floorId || null)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM AreaList WHERE MappedinID = @MID)
                        INSERT INTO AreaList (MappedinID, Name, VN, EN, FloorID)
                        VALUES (@MID, ISNULL(@Name, @MID), ISNULL(@Name, @MID), ISNULL(@Name, @MID), @FloorID)
                    ELSE
                        UPDATE AreaList
                        SET Name = ISNULL(@Name, Name),
                            FloorID = ISNULL(@FloorID, FloorID)
                        WHERE MappedinID = @MID
                `);
        }
        res.json({ success: true, count: areas.length });
    } catch (err: any) {
        console.error('SQL Error in /areas/sync:', err.message || err);
        res.status(500).json({ error: err.message });
    }
});

// GET Locations for a SubCategory
app.get('/api/categories/subcategory/:id/locations', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDbConnection();
        const result = await db.request()
            .input('SID', sql.Int, id)
            .query(`
                SELECT
                    AL.*,
                    AC.SubCategoryID,
                    SC.CategoryID,
                    SC.IconPath AS SubCategoryIconPath,
                    SC.SubCategoryName AS SubCategoryVN,
                    SC.EN AS SubCategoryEN,
                    SC.ZH AS SubCategoryZH,
                    SC.JA AS SubCategoryJA,
                    SC.KO AS SubCategoryKO
                FROM AreaList AL
                JOIN AreaCategory AC ON AL.AreaListID = AC.AreaListID
                LEFT JOIN SubCategories SC ON AC.SubCategoryID = SC.SubCategoryID
                WHERE AC.SubCategoryID = @SID
            `);
        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE Assignments for a SubCategory
app.post('/api/categories/subcategory/:id/assign', async (req, res) => {
    const db = await getDbConnection();
    const transaction = new sql.Transaction(db);
    try {
        await transaction.begin();
        const { id } = req.params;
        const { areaIds } = req.body; // Mappedin IDs

        // 1. Delete existing assignments for this subcategory
        await transaction.request()
            .input('SID', sql.Int, id)
            .query("DELETE FROM AreaCategory WHERE SubCategoryID = @SID");

        // 2. Add new ones
        for (const mid of areaIds) {
            await transaction.request()
                .input('MID', sql.NVarChar(100), mid)
                .input('SID', sql.Int, id)
                .query(`
                    DECLARE @ALID INT;
                    SELECT @ALID = AreaListID FROM AreaList WHERE MappedinID = @MID;

                    -- Auto-create if missing to ensure assignment works
                    IF @ALID IS NULL
                    BEGIN
                        INSERT INTO AreaList (MappedinID, Name, VN, EN) VALUES (@MID, @MID, @MID, @MID);
                        SET @ALID = SCOPE_IDENTITY();
                    END

                    IF @ALID IS NOT NULL
                    BEGIN
                        -- 1. Remove from any other subcategory (Steal/Move)
                        DELETE FROM AreaCategory WHERE AreaListID = @ALID;
                        
                        -- 2. Assign to current subcategory
                        INSERT INTO AreaCategory (AreaListID, SubCategoryID)
                        VALUES (@ALID, @SID);
                    END
                `);
        }

        await transaction.commit();
        res.json({ success: true });
    } catch (err: any) {
        await transaction.rollback();
        res.status(500).json({ error: err.message });
    }
});

// GET all assigned areas (to exclude from selectors)
app.get('/api/areas/assigned', async (req, res) => {
    try {
        const db = await getDbConnection();
        const result = await db.request().query(`
            SELECT
                AL.MappedinID,
                AL.FloorID,
                AC.SubCategoryID,
                SC.CategoryID
            FROM AreaList AL
            JOIN AreaCategory AC ON AL.AreaListID = AC.AreaListID
            LEFT JOIN SubCategories SC ON AC.SubCategoryID = SC.SubCategoryID
        `);
        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET active categories for grid (those with at least one assignment)
app.get('/api/categories/active', async (req, res) => {
    try {
        const db = await getDbConnection();
        const result = await db.request().query(`
            SELECT DISTINCT C.* FROM Categories C
            JOIN SubCategories SC ON C.CategoryID = SC.CategoryID
            JOIN AreaCategory AC ON SC.SubCategoryID = AC.SubCategoryID
            ORDER BY C.CategoryName
        `);
        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

async function scanAndSyncModels() {
    try {
        console.log("📂 Scanning Model3D directory for new assets...");
        const modelDir = path.join(__dirname, '..', 'Model3D');
        const thumbDir = path.join(__dirname, '..', 'Model3D', 'thumbnail');

        if (!fs.existsSync(modelDir)) {
            console.warn(`⚠️ Model directory not found: ${modelDir}`);
            return;
        }

        const files = fs.readdirSync(modelDir);

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (ext !== '.glb' && file !== 'car.json') continue; // Only support GLB and specific car.json

            const baseName = path.basename(file, ext); // e.g. "airplane"
            // Guess thumbnail: e.g. "airplane.jpg"
            // Check for thumbnail in multiple formats (.png, .jpg)
            let hasThumb = null;
            for (const thumbExt of ['.png', '.jpg', '.jpeg']) {
                const expectedThumb = baseName + thumbExt;
                const thumbPath = path.join(thumbDir, expectedThumb);
                if (fs.existsSync(thumbPath)) {
                    hasThumb = expectedThumb;
                    break;
                }
            }

            // Defaults
            const defaults = KNOWN_DEFAULTS[file] || { scale: [1, 1, 1], rotation: [0, 0, 0] };

            // Human readable name (Capitalize first letter, replace _ with space)
            const humanName = baseName.split('_')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

            // Sync to DB
            const db = await getDbConnection();
            await db.request()
                .input('ModelName', sql.NVarChar(200), humanName)
                .input('FileName', sql.NVarChar(500), file)
                .input('Thumbnail', sql.NVarChar(500), hasThumb) // Can be null
                .input('DefaultScaleX', sql.Decimal(10, 4), defaults.scale[0])
                .input('DefaultScaleY', sql.Decimal(10, 4), defaults.scale[1])
                .input('DefaultScaleZ', sql.Decimal(10, 4), defaults.scale[2])
                .input('DefaultRotationX', sql.Decimal(10, 4), defaults.rotation[0])
                .input('DefaultRotationY', sql.Decimal(10, 4), defaults.rotation[1])
                .input('DefaultRotationZ', sql.Decimal(10, 4), defaults.rotation[2])
                .execute('SP_SyncAvailableModel');

            // console.log(`   - Synced: ${file}`);
        }
        console.log("✅ Model Library Sync Complete");

    } catch (err: any) {
        console.error("❌ Error syncing models:", err);
    }
}

// GET Available Models for Picker
app.get('/api/available-models', async (req, res) => {
    try {
        // Optional: Re-scan on every request for "automatic update" feeling
        await scanAndSyncModels();

        const db = await getDbConnection();
        const result = await db.request().execute('SP_GetAvailableModels');

        const models = result.recordset.map(row => ({
            name: row.ModelName,
            file: row.FileName,
            thumb: row.Thumbnail,
            scale: [row.DefaultScaleX, row.DefaultScaleY, row.DefaultScaleZ],
            rotation: [row.DefaultRotationX, row.DefaultRotationY, row.DefaultRotationZ]
        }));

        res.json(models);
    } catch (err: any) {
        console.error('Error fetching available models:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DEPRECATED: Old JSON-based translation APIs have been replaced by SQL-based /api/init-data

// Start server
async function start() {
    await syncCategories(); // Sync Categories from icon-category
    await scanAndSyncModels(); // Initial Sync Models
}

// =============================================
// I18N & CMS API ENDPOINTS
// =============================================

// GET /api/init-data -> Fetch EVERYTHING needed for the app
// Returns: { languages, ui, categories, subcategories, floors, locations }
// Uses NEW COLUMN-BASED TRANSLATION TABLES
app.get('/api/init-data', async (req, res) => {
    try {
        const db = await getDbConnection();
        if (!db) {
            console.warn("⚠️ [Offline Mode] Database connection failed for init-data. Returning minimal fallback data.");
            return res.json({
                languages: [{ LanguageId: 'vi', LanguageName: 'Tiếng Việt' }, { LanguageId: 'en', LanguageName: 'English' }],
                ui: {},
                categories: [],
                subcategories: [],
                floors: [],
                locations: {},
                areaColors: {}
            });
        }
        const result = await db.request().execute('SP_GetInitialData');
        const areaColors = await fetchAreaColorMap(db);

        // 1. Languages (Result 0)
        const languages = result.recordsets[0];

        // 2. UI Translations (Result 1)
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

        // 3. Categories (Result 2)
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

        // 4. SubCategories (Result 3)
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

        // 5. Floors (Result 4)
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

        // 6. Locations (Result 5)
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

        res.json({
            languages,
            ui: uiTranslations,
            categories,
            subcategories,
            floors,
            locations,
            areaColors
        });

    } catch (err: any) {
        console.error('Error fetching init data:', err);
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: CREATE/UPDATE LOCATION
app.post('/api/admin/locations', async (req, res) => {
    try {
        const { mappedinId, categoryId, slug, logo, image, phone, website, socials, hours, translations } = req.body;
        const db = await getDbConnection();

        const vn = translations['vn']?.name || null;
        const en = translations['en']?.name || null;
        const zh = translations['zh']?.name || null;
        const ja = translations['ja']?.name || null;
        const ko = translations['ko']?.name || null;

        const result = await db.request()
            .input('MappedinId', sql.NVarChar(100), mappedinId)
            .input('CategoryId', sql.Int, categoryId)
            .input('SlugKey', sql.VarChar(255), slug)
            .input('LogoUrl', sql.VarChar(500), logo)
            .input('CoverImageUrl', sql.VarChar(500), image)
            .input('PhoneNumber', sql.VarChar(50), phone)
            .input('WebsiteLink', sql.VarChar(500), website)
            .input('SocialMediaLinks', sql.NVarChar(sql.MAX), JSON.stringify(socials))
            .input('OperatingHours', sql.NVarChar(sql.MAX), JSON.stringify(hours))
            .input('VN', sql.NVarChar(255), vn)
            .input('EN', sql.NVarChar(255), en)
            .input('ZH', sql.NVarChar(255), zh)
            .input('JA', sql.NVarChar(255), ja)
            .input('KO', sql.NVarChar(255), ko)
            .execute('SP_Admin_UpsertLocation');

        const locId = result.recordset[0].LocationId;
        res.json({ success: true, locationId: locId });
    } catch (err: any) {
        console.error('Error saving location:', err);
        res.status(500).json({ error: err.message });
    }
});

// BULK SYNC: Push Mappedin locations from frontend to DB
// Implements logic: Only overwrite if Mappedin actually changed, preserving manual UI edits.
app.post('/api/sync-locations', async (req, res) => {
    try {
        const { locations } = req.body; // Array of { id, name, description, imageUrl }
        if (!Array.isArray(locations) || locations.length === 0) {
            return res.status(400).json({ error: 'No locations provided' });
        }

        const db = await getDbConnection();
        let updated = 0;
        let inserted = 0;

        for (const loc of locations) {
            const mappedinId = loc.id;
            const name = loc.name || '';
            const incomingImg = loc.imageUrl || '';
            const description = loc.description || '';

            if (!mappedinId) continue;

            try {
                await db.request()
                    .input('MappedinId', sql.NVarChar(100), mappedinId)
                    .input('Name', sql.NVarChar(200), name)
                    .input('Description', sql.NVarChar(sql.MAX), description)
                    .input('ImageUrl', sql.NVarChar(500), incomingImg)
                    .execute('SP_SyncMappedinLocation');

                updated++; // SP handles insert or update logic
            } catch (e) {
                console.error(`Error syncing location ${mappedinId}:`, e);
            }
        }

        res.json({ success: true, inserted, updated });
    } catch (err: any) {
        console.error('Sync Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// CATCH-ALL ROUTE: Hỗ trợ SPA (Sửa lỗi 404 khi truy cập /vn/...)
// Chặn cuối cùng để nếu không khớp API hay file tĩnh thì mới trả về index.html
app.get('*', (req, res) => {
    const indexPath = fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))
        ? path.join(FRONTEND_DIST, 'index.html')
        : path.join(ROOT_DIR, 'index.html');

    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Not Found');
    }
});

// =============================================
// START SERVER
// =============================================
app.listen(Number(PORT), '0.0.0.0', async () => {
    console.log(`🚀 Server is flying at http://0.0.0.0:${PORT}`);
    console.log(`📊 API Base URL: /api`);

    // 1. Khởi tạo Database
    try {
        console.log("🔌 Initializing database connection...");
        const db = await getDbConnection();
        if (db) {
            console.log("✅ Database connection established.");

            // 2. Chạy việc đồng bộ file (Categories & Models) ở chế độ chạy ngầm
            start().then(() => {
                console.log("✅ Background synchronization (Categories & Models) completed.");
            }).catch(err => {
                console.error("❌ Error during background sync:", err);
            });
        } else {
            console.warn("⚠️ Server started but Database is NOT connected (Offline Mode).");
        }
    } catch (err) {
        console.error("❌ Critical error during database initialization:", err);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️ Shutting down server...');
    try {
        const db = await getDbConnection();
        await db.close();
    } catch (err) {
        console.log('DB already closed or not initialized');
    }
    process.exit(0);
});
