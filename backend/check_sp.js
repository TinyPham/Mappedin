const sql = require('mssql');
const cfg = {
  server: '152.42.217.126',
  database: 'MappedIn3DModels',
  user: 'sa',
  password: 'Longthanh@2026',
  options: { encrypt: true, trustServerCertificate: true }
};

// Bản dịch cho các subcategory bị thiếu
const translations = {
  'Phòng chờ thương gia': {
    EN: 'Business Lounge',
    ZH: '商务贵宾候机室',
    JA: 'ビジネスラウンジ',
    KO: '비즈니스 라운지'
  },
  'Phòng chờ ga đi quốc nội': {
    EN: 'Domestic Departure Lounge',
    ZH: '国内出发候机室',
    JA: '国内線出発ラウンジ',
    KO: '국내선 출발 라운지'
  },
  'Phòng chờ ga đi quốc tế': {
    EN: 'International Departure Lounge',
    ZH: '国际出发候机室',
    JA: '国際線出発ラウンジ',
    KO: '국제선 출발 라운지'
  },
  'Phòng chờ visa': {
    EN: 'Visa Lounge',
    ZH: '签证候机室',
    JA: 'ビザラウンジ',
    KO: '비자 라운지'
  },
  'Rượu & Đồ uống có cồn': {
    EN: 'Alcohol & Spirits',
    ZH: '酒类和烈酒',
    JA: 'アルコール飲料',
    KO: '주류'
  }
};

async function main() {
  const db = await sql.connect(cfg);

  for (const [vnName, trans] of Object.entries(translations)) {
    const result = await db.request()
      .input('VN', sql.NVarChar(200), vnName)
      .input('EN', sql.NVarChar(200), trans.EN)
      .input('ZH', sql.NVarChar(200), trans.ZH)
      .input('JA', sql.NVarChar(200), trans.JA)
      .input('KO', sql.NVarChar(200), trans.KO)
      .query(`
        UPDATE SubCategories 
        SET EN = @EN, ZH = @ZH, JA = @JA, KO = @KO
        WHERE SubCategoryName = @VN AND (EN IS NULL OR EN = '')
      `);
    console.log(`✅ "${vnName}" → Updated ${result.rowsAffected[0]} rows`);
  }

  // Verify
  console.log("\n=== VERIFICATION ===");
  const r = await db.request().query(`
    SELECT SubCategoryID, SubCategoryName, EN, JA, KO
    FROM SubCategories
    WHERE SubCategoryName IN (
      N'Phòng chờ thương gia', N'Phòng chờ ga đi quốc nội',
      N'Phòng chờ ga đi quốc tế', N'Phòng chờ visa',
      N'Rượu & Đồ uống có cồn'
    )
  `);
  r.recordset.forEach(row => console.log(JSON.stringify(row)));

  // Double check: any remaining missing?
  const r2 = await db.request().query(`
    SELECT COUNT(*) as stillMissing FROM SubCategories WHERE (JA IS NULL OR JA = '')
  `);
  console.log("\nStill missing JA:", r2.recordset[0].stillMissing);

  await db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
