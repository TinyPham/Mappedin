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
    parseAreaColorDeletePayload,
    parseAreaColorUpsertPayload
} from './areaColors';
import {
    deleteAreaColors,
    ensureAreaColorTableExists,
    fetchAreaColorMap,
    upsertAreaColors
} from './areaColorRepository';
import {
    getActiveCategories,
    getAssignedAreas,
    getSubCategoryLocations
} from './categoryAreaRepository';
import { getCategoryTree } from './categoryTreeRepository';
import { syncMappedinAreas } from './areaSyncRepository';
import { syncAvailableModel } from './availableModelSyncRepository';
import { assignSubCategoryAreas } from './categoryAssignmentRepository';
import { syncCategoryDirectory } from './categorySyncRepository';
import { syncMappedinLocations } from './locationSyncRepository';
import { buildAreaInformationPayloadFromAdminLocation } from './adminLocationRepository';
import { upsertAreaInformation } from './areaInfoRepository';
import { parseOverviewFloorSyncPayload } from './overviewFloorSync';
import {
    getFlightNavigationTargets,
    getFlights
} from './flights/flightRepository';
import { getInitialData } from './initDataRepository';
import {
    deleteModel,
    getAllModels,
    getAvailableModels,
    getModelByUuid,
    syncOverviewModelFloorId,
    upsertModel,
    upsertModels
} from './modelRepository';
import { registerAuthRoutes, requireAdmin } from './auth';
import { buildUniqueUploadName, parseImageDataUrl } from './uploads';

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
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
const isProduction = process.env.NODE_ENV === 'production';
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (!isProduction && allowedOrigins.length === 0) return callback(null, true);
        return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
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

if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
registerAuthRoutes(app);



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

// POST: Upload Image (Base64)
app.post('/api/upload-image', requireAdmin, async (req, res) => {
    try {
        const { image, filename } = req.body;
        if (!image || !filename) {
            return res.status(400).json({ error: 'Missing image or filename' });
        }

        const { buffer, extension } = parseImageDataUrl(image);
        const uniqueName = buildUniqueUploadName(filename, extension);
        const filePath = path.join(UPLOADS_DIR, uniqueName);

        await fs.promises.writeFile(filePath, buffer, { flag: 'wx' });

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
app.post('/api/update-area-info', requireAdmin, async (req, res) => {
    try {
        if (!req.body?.id) return res.status(400).json({ error: 'Missing ID' });

        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        await upsertAreaInformation(db, sql, req.body);

        res.json({ success: true });
    } catch (err: any) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/area-colors', requireAdmin, async (req, res) => {
    try {
        const { areaIds, color } = parseAreaColorUpsertPayload(req.body);
        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        await ensureAreaColorTableExists(db);

        await upsertAreaColors(db, sql, areaIds, color);

        const areaColors = await fetchAreaColorMap(db);
        res.json({ success: true, areaColors });
    } catch (err: any) {
        console.error('Area color upsert error:', err);
        res.status(400).json({ error: err.message || 'Failed to save area colors' });
    }
});

app.delete('/api/area-colors', requireAdmin, async (req, res) => {
    try {
        const { areaIds } = parseAreaColorDeletePayload(req.body);
        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        await ensureAreaColorTableExists(db);

        await deleteAreaColors(db, sql, areaIds);

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
        const models = await getAllModels(db);

        res.json(models);
    } catch (err: any) {
        console.error('Error fetching models:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/models/sync-overview-floor', requireAdmin, async (req, res) => {
    try {
        const { overviewFloorId } = parseOverviewFloorSyncPayload(req.body);

        const db = await getDbConnection();
        if (!db) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const updatedRows = await syncOverviewModelFloorId(db, sql, overviewFloorId);
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
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        const model = await getModelByUuid(db, sql, uuid);
        if (!model) {
            return res.status(404).json({ error: 'Model not found' });
        }

        res.json(model);
    } catch (err: any) {
        console.error('Error fetching model:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST/PUT - Create or Update model
app.post('/api/models', requireAdmin, async (req, res) => {
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
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        await upsertModel(db, sql, req.body);


        res.json({ success: true, message: 'Model saved successfully' });
    } catch (err: any) {
        console.error('Error saving model:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE - Soft delete model
app.delete('/api/models/:uuid', requireAdmin, async (req, res) => {
    try {
        const { uuid } = req.params;

        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        await deleteModel(db, sql, uuid);

        res.json({ success: true, message: 'Model deleted successfully' });
    } catch (err: any) {
        console.error('Error deleting model:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Batch save models (for initial migration from localStorage)
app.post('/api/models/batch', requireAdmin, async (req, res) => {
    try {
        const { models } = req.body;

        if (!Array.isArray(models)) {
            return res.status(400).json({ error: 'models must be an array' });
        }

        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        await upsertModels(db, sql, models);

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
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        const models = await getAvailableModels(db);

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
    "cosmetic": { vn: "Cửa hàng mỹ phẩm", en: "Cosmetic Store", zh: "化妆品店", ja: "化粧品店", ko: "화장품 매장" },
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
    "jewelry": { vn: "Cửa hàng trang sức", en: "Jewelry Store", zh: "珠宝店", ja: "ジュエリーショップ", ko: "쥬얼리 매장" },
    "fashion": { vn: "Cửa hàng thời trang", en: "Fashion Store", zh: "时尚店", ja: "ファッション店", ko: "패션 매장" },
    "luxury-fashion": { vn: "Thời trang cao cấp", en: "Luxury Fashion", zh: "奢华时尚", ja: "ラグジュアリーファッション", ko: "명품 패션" },
    "sleepwear": { vn: "Đồ ngủ", en: "Sleepwear", zh: "睡衣", ja: "スリープウェア", ko: "잠옷" },

    // Fitness
    "gym": { vn: "Phòng tập Gym", en: "Gym", zh: "健身房", ja: "ジム", ko: "체육관" },

    // Food&Drink
    "alcohol": { vn: "Rượu & Đồ uống có cồn", en: "Alcohol", zh: "酒精饮料", ja: "アルコール", ko: "주류" },
    "bakery": { vn: "Tiệm bánh", en: "Bakery", zh: "面包店", ja: "ベーカリー", ko: "베이커리" },
    "bar": { vn: "Quầy Bar", en: "Bar", zh: "酒吧", ja: "バー", ko: "바" },
    "coffee": { vn: "Cà phê", en: "Coffee Shop", zh: "咖啡店", ja: "カフェ", ko: "커피숍" },
    "fast-food": { vn: "Thức ăn nhanh và đồ uống", en: "Fast Food & Drink", zh: "快餐与饮料", ja: "ファストフード＆ドリンク", ko: "패스트푸드 및 음료" },
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
    await syncCategoryDirectory({
        getDbConnection,
        sqlTypes: sql,
        categoryBaseDir: path.join(__dirname, '..', 'icon-category'),
        uiCategoryMap: UI_CATEGORY_MAP,
        subCategoryMap: SUB_CATEGORY_MAP
    });
}
// =============================================
// AREA CLASSIFICATION API
// =============================================

// GET Category Tree
app.get('/api/categories', async (req, res) => {
    try {
        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });

        const tree = await getCategoryTree(db);
        res.json(tree);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// SYNC Areas from Map to DB
app.post('/api/areas/sync', requireAdmin, async (req, res) => {
    try {
        const { areas } = req.body; // Array of { id, name, floorId }
        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });
        await syncMappedinAreas(db, sql, areas);
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
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });
        const locations = await getSubCategoryLocations(db, sql, id);
        res.json(locations);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE Assignments for a SubCategory
app.post('/api/categories/subcategory/:id/assign', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { areaIds } = req.body; // Mappedin IDs
        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });
        await assignSubCategoryAreas(db, sql, id, areaIds);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET all assigned areas (to exclude from selectors)
app.get('/api/areas/assigned', async (req, res) => {
    try {
        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });
        const areas = await getAssignedAreas(db);
        res.json(areas);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET active categories for grid (those with at least one assignment)
app.get('/api/categories/active', async (req, res) => {
    try {
        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });
        const categories = await getActiveCategories(db);
        res.json(categories);
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
            if (!db) return;

            await syncAvailableModel(db, sql, {
                modelName: humanName,
                fileName: file,
                thumbnail: hasThumb,
                scale: defaults.scale,
                rotation: defaults.rotation
            });

            // console.log(`   - Synced: ${file}`);
        }
        console.log("✅ Model Library Sync Complete");

    } catch (err: any) {
        console.error("❌ Error syncing models:", err);
    }
}

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
        res.json(await getInitialData(db));

    } catch (err: any) {
        console.error('Error fetching init data:', err);
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: CREATE/UPDATE LOCATION
app.post('/api/admin/locations', requireAdmin, async (req, res) => {
    try {
        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });
        await upsertAreaInformation(db, sql, buildAreaInformationPayloadFromAdminLocation(req.body));
        res.json({ success: true });
    } catch (err: any) {
        console.error('Error saving location:', err);
        res.status(500).json({ error: err.message });
    }
});

// BULK SYNC: Push Mappedin locations from frontend to DB
// Implements logic: Only overwrite if Mappedin actually changed, preserving manual UI edits.
app.post('/api/sync-locations', requireAdmin, async (req, res) => {
    try {
        const { locations } = req.body; // Array of { id, name, description, imageUrl }
        if (!Array.isArray(locations) || locations.length === 0) {
            return res.status(400).json({ error: 'No locations provided' });
        }

        const db = await getDbConnection();
        if (!db) return res.status(503).json({ error: 'Database connection currently unavailable' });
        const { inserted, updated } = await syncMappedinLocations(db, sql, locations);

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


