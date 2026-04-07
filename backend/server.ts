// =============================================
// Backend API for 3D Models - Node.js + Express + SQL Server
// =============================================

import express from 'express';
import { getDbConnection, sql } from './db';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

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

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve Static Files
// When running compiled: backend/dist/server.js -> root is ../../
// When running ts-node:  backend/server.ts -> root is ../
const ROOT_DIR = __filename.endsWith('.js')
    ? path.join(__dirname, '../..')
    : path.join(__dirname, '..');
const FRONTEND_DIST = path.join(ROOT_DIR, 'dist');

app.use('/icon-category', express.static(path.join(ROOT_DIR, 'icon-category')));
app.use('/Model3D', express.static(path.join(ROOT_DIR, 'Model3D')));
app.use('/uploads', express.static(path.join(ROOT_DIR, 'uploads')));

// Serve Vite-built frontend
if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
}
app.use('/', express.static(ROOT_DIR));


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
        const { id, vn, en, zh, ja, ko, imageUrl, mappedinImageUrl } = req.body;
        // id is MappedinID (e.g. m_...)

        if (!id) return res.status(400).json({ error: 'Missing ID' });

        const db = await getDbConnection();

        await db.request()
            .input('MappedinId', sql.NVarChar(100), id)
            .input('VN', sql.NVarChar(sql.MAX), vn)
            .input('EN', sql.NVarChar(sql.MAX), en)
            .input('ZH', sql.NVarChar(sql.MAX), zh)
            .input('JA', sql.NVarChar(sql.MAX), ja)
            .input('KO', sql.NVarChar(sql.MAX), ko)
            .input('ImageUrl', sql.NVarChar(500), imageUrl)
            .input('MappedinImageUrl', sql.NVarChar(500), mappedinImageUrl || null)
            .execute('SP_UpsertAreaInformation');

        res.json({ success: true });
    } catch (err: any) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET all models
app.get('/api/models', async (req, res) => {
    try {
        const db = await getDbConnection();
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
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

const UI_CATEGORY_MAP: Record<string, string> = {
    "Accessible": "Hỗ trợ người khuyết tật",
    "Beauty": "Làm đẹp",
    "Connection": "Kết nối",
    "Electronic": "Điện tử",
    "Entertainment": "Thư giãn",
    "Fashion": "Thời trang",
    "Fitness": "Thể thao",
    "Food&Drink": "Ăn uống",
    "Lounge": "Phòng chờ",
    "Pharmacy": "Nhà thuốc",
    "AirportService": "Dịch vụ sân bay",
    "Store": "Cửa hàng",
    "DepartureFlightProcedures": "Thủ tục chuyến bay đi",
    "ArrivalFlightProcedures": "Thủ tục chuyến bay đến",
    "TransitProcedures": "Thủ tục nối chuyến"
};

const SUB_CATEGORY_MAP: Record<string, string> = {
    // Accessible
    "accessible": "Hỗ trợ người khuyết tật",

    // Beauty
    "cosmetic": "Mỹ phẩm",
    "spa-massage": "Spa & Massage",

    // Connection
    "elevator": "Thang máy",
    "entrance": "Lối vào",
    "escalator": "Thang cuốn",
    "gate": "Cửa khởi hành",

    // Electronic
    "electronic": "Thiết bị điện tử",

    // Entertainment / Relax
    "casino": "Casino",
    "gaming": "Khu trò chơi",
    "movie-theater": "Rạp chiếu phim",
    "massage-chair": "Ghế massage",
    "sleep-box": "Khu vực nghỉ ngơi",
    "pray-area": "Phòng cầu nguyện",

    // Fashion
    "accessories": "Phụ kiện",
    "eyewear": "Mắt kính",
    "footwear": "Giày dép",
    "handbag": "Túi xách",
    "jewelry": "Trang sức",
    "luxury-fashion": "Thời trang cao cấp",
    "sleepwear": "Đồ ngủ",

    // Fitness
    "gym": "Phòng tập Gym",

    // Food&Drink
    "alcohol": "Rượu & Đồ uống có cồn",
    "bakery": "Tiệm bánh",
    "bar": "Quầy Bar",
    "coffee": "Cà phê",
    "fast-food": "Thức ăn nhanh",
    "food-court": "Khu ẩm thực",
    "ice-cream": "Kem",
    "pizza": "Pizza",
    "restaurant": "Nhà hàng",

    // Pharmacy
    "pharmacy": "Nhà thuốc",

    // Service
    "atm": "Máy ATM",
    "car-parking": "Bãi đỗ xe ô tô",
    "currency-exchange": "Đổi ngoại tệ",
    "drinking-water-area": "Nước uống miễn phí",
    "exhibit": "Khu triển lãm",
    "family-restroom": "Nhà vệ sinh gia đình",
    "free-charging-station": "Trạm sạc miễn phí",
    "kid-area": "Khu vui chơi trẻ em",
    "lost-and-found": "Hành lý thất lạc",
    "motorbike-parking": "Bãi đỗ xe máy",
    "nursing-room": "Phòng mẹ và bé",
    "parking": "Bãi đỗ xe",
    "phone": "Điện thoại công cộng",
    "photography": "Khu chụp ảnh",
    "restroom": "Nhà vệ sinh",
    "shopping-cart": "Xe đẩy hành lý",
    "shower-room": "Phòng tắm",
    "smoking-room": "Phòng hút thuốc",
    "taxi-pickup-area": "Điểm đón Taxi",
    "tourist-information": "Thông tin du lịch",
    "wrapping-baggage-area": "Đóng gói hành lý",
    "yoga": "Phòng tập Yoga",

    // Store
    "book-shop": "Hiệu sách",
    "convenience-store": "Cửa hàng tiện lợi",
    "duty-free": "Cửa hàng miễn thuế",
    "souvenir-shop": "Cửa hàng lưu niệm",
    "flower-store": "Cửa hàng hoa",

    // Lounge
    "cip-lounge": "Phòng chờ thương gia",
    "dom-lounge": "Phòng chờ ga đi quốc nội",
    "int-lounge": "Phòng chờ ga đi quốc tế",
    "visa-lounge": "Phòng chờ visa",

    // ArrivalFlightProcedures
    "biomectric-regis": "Đăng ký sinh trắc học",
    "custom": "Hải quan",
    "oversize-luggage": "Hành lý quá khổ",
    "immigration": "Nhập cảnh",
    "int-arrival": "Khu ga đến quốc tế",
    "dom-arrival": "Khu ga đến quốc nội",
    "baggage-claim-area": "Khu vực nhận hành lý",

    // DepartureFlightProcedures
    "luggage-storage": "Lưu trữ hành lý",
    "fast-track": "Làn làm thủ tục ưu tiên",
    "emigration": "Xuất cảnh",
    "int-screening-security": "An ninh soi chiếu quốc tế",
    "dom-screening-security": "An ninh soi chiếu nội địa",
    "int-departure": "Khu ga đi quốc tế",
    "dom-departure": "Khu ga đi quốc nội",
    "checkin-area": "Khu vực làm thủ tục",

    // TransitProcedures
    "int-int-transit": "Nối chuyến Quốc tế - Quốc tế",
    "dom-dom-transit": "Nối chuyến Nội địa - Nội địa",
    "dom-int-transit": "Nối chuyến Nội địa - Quốc tế",

    // AirportService (Additions)
    "traditional-center": "Trung tâm văn hóa truyền thống",
    "landscape": "Cảnh quan",
    "post-service": "Dịch vụ bưu điện",
    "welcome-service": "Dịch vụ đón tiễn khách",
    "hotel-waiting-area": "Khu vực chờ xe khách sạn"
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
            const vietnameseName = UI_CATEGORY_MAP[folder] || folder;
            const iconFile = `${folder.toLowerCase().replace(/&/g, '-and-')}.png`;
            const iconPath = fs.existsSync(path.join(categoryBaseDir, iconFile)) ? iconFile : null;

            // 1. Upsert Category
            const db = await getDbConnection();
            const catResult = await db.request()
                .input('Name', sql.NVarChar(200), vietnameseName)
                .input('Icon', sql.NVarChar(500), iconPath)
                .query(`
                    DECLARE @CID INT;
                    -- 1. Look up by IconPath first (Stable ID based on folder name)
                    SELECT @CID = CategoryID FROM Categories WHERE IconPath = @Icon;

                    -- 2. Fallback to Name if Icon not found (e.g. icon changed or new)
                    IF @CID IS NULL
                        SELECT @CID = CategoryID FROM Categories WHERE CategoryName = @Name;
                    
                    IF @CID IS NOT NULL
                    BEGIN
                        -- Update Name (and Icon just in case)
                        UPDATE Categories SET CategoryName = @Name, IconPath = @Icon WHERE CategoryID = @CID;
                    END
                    ELSE
                    BEGIN
                        INSERT INTO Categories (CategoryName, IconPath, DisplayOrder) VALUES (@Name, @Icon, 0);
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
                const vnsName = SUB_CATEGORY_MAP[baseFileName] ||
                    baseFileName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                // Tên tiếng Anh mặc định (dùng để tìm và xóa các bản ghi cũ)
                const englishNameFallback = baseFileName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                const subIconPath = `${folder}/${subFile}`;

                const db = await getDbConnection();
                await db.request()
                    .input('CatID', sql.Int, categoryId)
                    .input('VNSName', sql.NVarChar(200), vnsName)
                    .input('EngName', sql.NVarChar(200), englishNameFallback)
                    .input('Icon', sql.NVarChar(500), subIconPath)
                    .query(`
                        DECLARE @SID INT;
                        -- 1. ƯU TIÊN TUYỆT ĐỐI: Tìm theo IconPath vì đây là định danh duy nhất của mỗi loại
                        SELECT @SID = SubCategoryID FROM SubCategories WHERE IconPath = @Icon AND CategoryID = @CatID;

                        IF @SID IS NOT NULL
                        BEGIN
                            -- PHẢI CẬP NHẬT: Luôn cập nhật tên mới nhất từ server.ts vào Database dựa trên ID tìm được
                            UPDATE SubCategories SET SubCategoryName = @VNSName WHERE SubCategoryID = @SID;
                        END
                        ELSE
                        BEGIN
                            -- 2. Nếu không thấy Icon (có thể do folder mới hoặc đường dẫn đổi), thử tìm theo tên English cũ để chuyển đổi
                            SELECT @SID = SubCategoryID FROM SubCategories WHERE (SubCategoryName = @EngName OR SubCategoryName = @VNSName) AND CategoryID = @CatID;
                            
                            IF @SID IS NOT NULL
                            BEGIN
                                -- Cập nhật cả Tên và Icon mới
                                UPDATE SubCategories SET SubCategoryName = @VNSName, IconPath = @Icon WHERE SubCategoryID = @SID;
                            END
                            ELSE
                            BEGIN
                                -- 3. Nếu hoàn toàn không có gì thì mới chèn mới
                                INSERT INTO SubCategories (CategoryID, SubCategoryName, IconPath, DisplayOrder) 
                                VALUES (@CatID, @VNSName, @Icon, 0);
                                SELECT @SID = SCOPE_IDENTITY();
                            END
                        END

                        -- 4. DỌN DẸP TRIỆT ĐỂ: Xóa bất kỳ bản ghi nào khác có cùng Icon hoặc cùng Tên (nhưng khác SID đang dùng)
                        -- Bước này loại bỏ tình trạng song ngữ và trùng lặp
                        DELETE FROM SubCategories 
                        WHERE CategoryID = @CatID 
                        AND (IconPath = @Icon OR SubCategoryName = @EngName OR (SubCategoryName = @VNSName AND SubCategoryID != @SID))
                        AND SubCategoryID != @SID;
                    `);
                subCount++;
            }
            console.log(`   ✅ Synced ${vietnameseName}: ${subCount} subcategories`);
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
            await db.request()
                .input('MID', sql.NVarChar(100), area.id)
                .input('Name', sql.NVarChar(200), area.name || null)
                .input('FID', sql.NVarChar(100), area.floorId || null)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM AreaList WHERE MappedinID = @MID)
                        INSERT INTO AreaList (MappedinID, LocationName, FloorID)
                        VALUES (@MID, @Name, @FID)
                    ELSE
                        UPDATE AreaList SET LocationName = @Name, FloorID = @FID, LastSync = GETDATE()
                        WHERE MappedinID = @MID
                `);
        }
        res.json({ success: true });
    } catch (err: any) {
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
                SELECT AL.* FROM AreaList AL
                JOIN AreaCategory AC ON AL.AreaListID = AC.AreaListID
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
        const result = await db.request().query("SELECT MappedinID, SubCategoryID FROM AreaList AL JOIN AreaCategory AC ON AL.AreaListID = AC.AreaListID");
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
    await initDB();
    await syncCategories(); // Sync Categories from icon-category
    await scanAndSyncModels(); // Initial Sync Models

    // =============================================
    // I18N & CMS API ENDPOINTS
    // =============================================

    // GET /api/init-data -> Fetch EVERYTHING needed for the app
    // Returns: { languages, ui, categories, subcategories, floors, locations }
    // Uses NEW COLUMN-BASED TRANSLATION TABLES
    app.get('/api/init-data', async (req, res) => {
        try {
            const db = await getDbConnection();
            const result = await db.request().execute('SP_GetInitialData');

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
                const mid = row.MappedinID;
                if (!mid) return;

                locations[mid] = {
                    id: row.AreaListID,
                    categoryId: row.CategoryID,
                    subCategoryIcon: row.IconPath,
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
                    }
                };
            });

            res.json({
                languages,
                ui: uiTranslations,
                categories,
                subcategories,
                floors,
                locations
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

    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 API Base URL: /api`);
    });
}

start();

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
