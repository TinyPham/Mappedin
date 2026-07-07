/**
 * ================================================================
 * Script nén batch tất cả file GLB trong thư mục Model3D
 * ================================================================
 * 
 * Sử dụng: node tools/optimize_models.js
 * 
 * Quy trình:
 * 1. Backup toàn bộ Model3D/ → Model3D_backup/
 * 2. Nén từng file GLB bằng gltf-transform (Draco + WebP + Simplify)
 * 3. Tạo báo cáo so sánh kích thước trước/sau
 * 
 * Yêu cầu cài đặt:
 *   npm install -g @gltf-transform/cli
 * 
 * Lưu ý:
 * - File gốc được giữ nguyên trong Model3D_backup/
 * - Nếu nén bị lỗi, file gốc sẽ được giữ lại (không bị ghi đè)
 * - Có thể chạy lại nhiều lần (backup chỉ tạo 1 lần)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================
// CẤU HÌNH
// ============================================
const MODEL_DIR = path.join(__dirname, '..', 'Model3D');
const BACKUP_DIR = path.join(__dirname, '..', 'Model3D_backup');
const TEMP_DIR = path.join(__dirname, '..', 'Model3D_temp');

// Tỷ lệ giảm polygon (0.5 = giảm 50%, 0.3 = giảm 70%)
const SIMPLIFY_RATIO = 0.5;

// ============================================
// KIỂM TRA ĐIỀU KIỆN
// ============================================
function checkPrerequisites() {
    console.log('🔍 Kiểm tra điều kiện...');

    // Kiểm tra gltf-transform đã cài chưa
    try {
        execSync('gltf-transform --version', { stdio: 'pipe' });
        console.log('  ✅ gltf-transform đã cài đặt');
    } catch {
        console.error('  ❌ Chưa cài gltf-transform!');
        console.error('  📦 Hãy chạy: npm install -g @gltf-transform/cli');
        process.exit(1);
    }

    // Kiểm tra thư mục Model3D tồn tại
    if (!fs.existsSync(MODEL_DIR)) {
        console.error(`  ❌ Không tìm thấy thư mục: ${MODEL_DIR}`);
        process.exit(1);
    }

    console.log(`  ✅ Thư mục Model3D: ${MODEL_DIR}`);
}

// ============================================
// BACKUP
// ============================================
function backupModels() {
    if (fs.existsSync(BACKUP_DIR)) {
        console.log('📦 Thư mục backup đã tồn tại, bỏ qua bước backup.');
        return;
    }

    console.log('📦 Đang backup Model3D → Model3D_backup...');

    // Tạo thư mục backup
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    // Copy toàn bộ file GLB
    const files = fs.readdirSync(MODEL_DIR).filter(f => f.endsWith('.glb'));
    let copied = 0;

    for (const file of files) {
        const src = path.join(MODEL_DIR, file);
        const dest = path.join(BACKUP_DIR, file);

        // Chỉ copy file (bỏ qua thư mục con như thumbnail/)
        if (fs.statSync(src).isFile()) {
            fs.copyFileSync(src, dest);
            copied++;
        }
    }

    // Copy thư mục thumbnail nếu có
    const thumbDir = path.join(MODEL_DIR, 'thumbnail');
    if (fs.existsSync(thumbDir)) {
        const backupThumbDir = path.join(BACKUP_DIR, 'thumbnail');
        fs.mkdirSync(backupThumbDir, { recursive: true });
        const thumbFiles = fs.readdirSync(thumbDir);
        for (const tf of thumbFiles) {
            const tSrc = path.join(thumbDir, tf);
            if (fs.statSync(tSrc).isFile()) {
                fs.copyFileSync(tSrc, path.join(backupThumbDir, tf));
            }
        }
    }

    console.log(`  ✅ Đã backup ${copied} file GLB vào Model3D_backup/`);
}

// ============================================
// XÓA FILE AN TOÀN (retry khi bị lock)
// ============================================
function safeDelete(filePath) {
    if (!fs.existsSync(filePath)) return;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            fs.unlinkSync(filePath);
            return;
        } catch (err) {
            if (err.code === 'EBUSY' || err.code === 'EPERM') {
                // File đang bị lock, chờ rồi thử lại
                const waitMs = 500 * (attempt + 1);
                const start = Date.now();
                while (Date.now() - start < waitMs) { /* busy wait */ }
            } else {
                return; // Lỗi khác, bỏ qua
            }
        }
    }
    // Sau 3 lần vẫn không xóa được, bỏ qua (sẽ dọn khi rmSync thư mục tạm)
}

// ============================================
// NÉN FILE GLB
// ============================================
function optimizeFile(inputPath, outputPath) {
    const rawFileName = path.basename(inputPath).toLowerCase();
    // Loại bỏ dấu tiếng Việt để so sánh an toàn
    const fileName = rawFileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

    const isPlant = fileName.includes('cay') || fileName.includes('vuon') || fileName.includes('tham') || fileName.includes('co') || fileName.includes('tree') || fileName.includes('palm') || fileName.includes('floral');

    // NẾU LÀ CÂY CỐI: KHÔNG NÉN, KHÔNG TỐI ƯU, KHÔNG CHỈNH SỬA
    // COPY NGUYÊN BẢN 100% ĐỂ TRÁNH LỖI SHADER
    if (isPlant) {
        console.log(`    🎨 TỐI ƯU TEXTURE (512px): ${path.basename(inputPath)}`);
        try {
            // Chỉ resize và dọn dẹp, không simplify/draco
            const cmd = [
                'gltf-transform',
                'cp', `"${inputPath}"`, `"${outputPath}"`,
                '&&',
                'gltf-transform',
                'resize', `"${outputPath}"`, `"${outputPath}"`, '--width 512 --height 512',
                '&&',
                'gltf-transform',
                'prune', `"${outputPath}"`, `"${outputPath}"`
            ].join(' ');
            execSync(cmd, { stdio: 'pipe' });
            return true;
        } catch (e) {
            // Fallback nếu resize lỗi thì copy nguyên bản
            execSync(`gltf-transform cp "${inputPath}" "${outputPath}"`, { stdio: 'pipe' });
            return true;
        }
    }

    // CÁC MODEL KHÁC: Nén WebP + Simplify để nhẹ máy
    const cmd = [
        'gltf-transform',
        'cp',
        `"${inputPath}"`,
        `"${outputPath}"`,
        '&&',
        'gltf-transform',
        'simplify',
        `"${outputPath}"`,
        `"${outputPath}"`,
        `--ratio ${SIMPLIFY_RATIO}`,
        '&&',
        'gltf-transform',
        'webp',
        `"${outputPath}"`,
        `"${outputPath}"`,
        '&&',
        'gltf-transform',
        'prune',
        `"${outputPath}"`,
        `"${outputPath}"`
    ].join(' ');

    try {
        execSync(cmd, {
            stdio: 'pipe',
            timeout: 300000
        });
        return true;
    } catch (err) {
        console.error(`    ⚠️ Lỗi nén: ${err.message}`);
        return false;
    }
}

// ============================================
// CHẠY NÉN BATCH
// ============================================
function runBatchOptimize() {
    const files = fs.readdirSync(MODEL_DIR)
        .filter(f => f.endsWith('.glb'))
        .sort();

    if (files.length === 0) {
        console.log('⚠️ Không có file GLB nào trong Model3D/');
        return;
    }

    console.log(`\n🚀 Bắt đầu nén ${files.length} file GLB...\n`);

    // Tạo thư mục tạm
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    const results = [];
    let totalOriginal = 0;
    let totalOptimized = 0;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const inputPath = path.join(MODEL_DIR, file);
        const tempPath = path.join(TEMP_DIR, file);
        const originalSize = fs.statSync(inputPath).size;

        process.stdout.write(`  [${i + 1}/${files.length}] ${file} (${(originalSize / 1024 / 1024).toFixed(2)} MB)... `);

        const success = optimizeFile(inputPath, tempPath);

        if (success && fs.existsSync(tempPath)) {
            const optimizedSize = fs.statSync(tempPath).size;
            const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

            // Chỉ thay thế nếu file nén nhỏ hơn
            if (optimizedSize < originalSize) {
                // Ghi đè file gốc bằng file nén
                fs.copyFileSync(tempPath, inputPath);
                console.log(`✅ ${(optimizedSize / 1024 / 1024).toFixed(2)} MB (-${reduction}%)`);
                totalOptimized += optimizedSize;
                successCount++;
            } else {
                console.log(`⏭️ Giữ nguyên (nén không hiệu quả)`);
                totalOptimized += originalSize;
                successCount++;
            }

            results.push({
                file,
                originalSize,
                optimizedSize: optimizedSize < originalSize ? optimizedSize : originalSize,
                reduction: optimizedSize < originalSize ? parseFloat(reduction) : 0
            });
        } else {
            console.log(`❌ Lỗi (giữ file gốc)`);
            totalOptimized += originalSize;
            failCount++;
            results.push({
                file,
                originalSize,
                optimizedSize: originalSize,
                reduction: 0
            });
        }

        totalOriginal += originalSize;

        // Xóa file tạm (retry nếu bị lock bởi backend)
        safeDelete(tempPath);
    }

    // Dọn thư mục tạm
    try {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch { }

    // ============================================
    // BÁO CÁO
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 BÁO CÁO NÉN GLB');
    console.log('='.repeat(60));
    console.log(`  Tổng file       : ${files.length}`);
    console.log(`  Thành công      : ${successCount}`);
    console.log(`  Thất bại        : ${failCount}`);
    console.log(`  Kích thước gốc  : ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Kích thước mới  : ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Giảm            : ${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    // Top 10 file giảm nhiều nhất
    const topReduced = results
        .filter(r => r.reduction > 0)
        .sort((a, b) => b.reduction - a.reduction)
        .slice(0, 10);

    if (topReduced.length > 0) {
        console.log('\n🏆 Top 10 file giảm nhiều nhất:');
        topReduced.forEach((r, i) => {
            console.log(`  ${i + 1}. ${r.file}: ${(r.originalSize / 1024 / 1024).toFixed(2)} → ${(r.optimizedSize / 1024 / 1024).toFixed(2)} MB (-${r.reduction}%)`);
        });
    }

    // Lưu báo cáo ra file
    const reportsDir = path.join(__dirname, '..', 'docs', 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    const reportPath = path.join(reportsDir, 'glb_optimization_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalFiles: files.length,
        successCount,
        failCount,
        totalOriginalMB: parseFloat((totalOriginal / 1024 / 1024).toFixed(2)),
        totalOptimizedMB: parseFloat((totalOptimized / 1024 / 1024).toFixed(2)),
        reductionPercent: parseFloat(((1 - totalOptimized / totalOriginal) * 100).toFixed(1)),
        details: results
    }, null, 2));

    console.log(`\n📄 Báo cáo chi tiết: ${reportPath}`);
    console.log(`📦 File gốc backup: ${BACKUP_DIR}/\n`);
}

// ============================================
// MAIN
// ============================================
console.log('');
console.log('╔══════════════════════════════════════════╗');
console.log('║  🗜️  GLB Model Optimizer for Mappedin   ║');
console.log('║  Draco + Simplify Compression            ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

checkPrerequisites();
backupModels();
runBatchOptimize();
