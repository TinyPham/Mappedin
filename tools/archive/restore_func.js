
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Longthanh@2026',
    server: '152.42.217.126',
    port: 1433,
    database: 'LongThanhFlightBK',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function restoreFunc() {
    try {
        let pool = await sql.connect(config);
        console.log('Connected');
        
        const res = await pool.request().query("SELECT definition FROM ACISPDIN.sys.sql_modules WHERE object_id = OBJECT_ID('ACISPDIN.dbo.fn_CalcRemark')");
        let def = res.recordset[0].definition;
        
        // Replace CREATE FUNCTION with CREATE OR ALTER if possible, but let's just drop first
        await pool.request().query("IF OBJECT_ID('fn_CalcRemark', 'FN') IS NOT NULL DROP FUNCTION fn_CalcRemark");
        await pool.request().query(def);
        
        console.log('Function fn_CalcRemark restored.');
        await sql.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

restoreFunc();
