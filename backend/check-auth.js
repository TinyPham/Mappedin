const fs = require('fs');
const path = require('path');
const sql = require('mssql');

// Read appsettings.json
const appSettingsPath = path.join(__dirname, 'appsettings.json');
const appSettings = JSON.parse(fs.readFileSync(appSettingsPath, 'utf-8'));
const connStr = appSettings.ConnectionStrings.DefaultConnection;

// Parse connection string manually to show what we are using
const userIdMatch = connStr.match(/User Id=([^;]+)/i);
const passwordMatch = connStr.match(/Password=([^;]+)/i);
const serverMatch = connStr.match(/Server=([^;]+)/i);

const config = {
    server: serverMatch ? serverMatch[1] : 'localhost',
    database: 'MappedIn3DModels',
    user: userIdMatch ? userIdMatch[1] : 'sa',
    password: passwordMatch ? passwordMatch[1] : '',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function check() {
    console.log(`\n🔌 TEST KẾT NỐI TỪ APPSETTINGS...`);
    console.log(`   User: ${config.user}`);
    console.log(`   Pass: ${config.password}`);
    console.log(`   Server: ${config.server}`);

    try {
        await sql.connect(config);
        console.log('✅ KẾT NỐI THÀNH CÔNG! (Password OK)');
    } catch (err) {
        console.error('❌ KẾT NỐI THẤT BẠI!');
        console.error('   Lỗi:', err.message);

        if (err.message.includes('Login failed')) {
            console.log('\n⚠️ LÝ DO: Sai mật khẩu hoặc tài khoản `sa` chưa Enable.');
            console.log('👉 Hãy sửa password trong file appsettings.json nếu bạn đặt khác "123"');
        }
    }
}

check();
