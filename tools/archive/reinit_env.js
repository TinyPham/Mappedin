
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Longthanh@2026',
    server: '152.42.217.126',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        requestTimeout: 60000
    }
};

async function reinit() {
    try {
        let pool = await sql.connect(config);
        console.log('Connected');

        // 1. Create tables in LongThanhFlightBK if not exist
        console.log('Creating tables in LongThanhFlightBK...');
        await pool.request().query(`
            USE LongThanhFlightBK;
            
            IF OBJECT_ID('ListTime', 'U') IS NULL
                SELECT * INTO ListTime FROM ACISPDIN.dbo.ListTime;
            
            IF OBJECT_ID('ListFlightInfo', 'U') IS NULL
                SELECT * INTO ListFlightInfo FROM ACISPDIN.dbo.ListFlightInfo;
            
            IF OBJECT_ID('FIDS_Remark', 'U') IS NULL
                SELECT * INTO FIDS_Remark FROM ACISPDIN.dbo.FIDS_Remark;

            IF OBJECT_ID('FlightInfo', 'U') IS NULL
            BEGIN
                CREATE TABLE FlightInfo (
                    FlightInfoId BIGINT IDENTITY(1,1) PRIMARY KEY,
                    FlightId BIGINT,
                    ShortName VARCHAR(50),
                    InfoValue NVARCHAR(MAX),
                    UpdateTime DATETIME DEFAULT GETDATE()
                );
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FlightInfo_FlightId' AND object_id = OBJECT_ID('FlightInfo'))
                    CREATE INDEX IX_FlightInfo_FlightId ON FlightInfo(FlightId);
            END
        `);

        // 2. Synchronize rules (make sure they are updated)
        console.log('Synchronizing rules from ACISPDIN...');
        await pool.request().query(`
            USE LongThanhFlightBK;
            IF OBJECT_ID('FIDS_Remark', 'U') IS NOT NULL DROP TABLE FIDS_Remark;
            SELECT * INTO FIDS_Remark FROM ACISPDIN.dbo.FIDS_Remark;
            
            IF OBJECT_ID('ListTime', 'U') IS NOT NULL DROP TABLE ListTime;
            SELECT * INTO ListTime FROM ACISPDIN.dbo.ListTime;
            
            IF OBJECT_ID('ListFlightInfo', 'U') IS NOT NULL DROP TABLE ListFlightInfo;
            SELECT * INTO ListFlightInfo FROM ACISPDIN.dbo.ListFlightInfo;

            -- Apply our immediate trigger fix for ATOT/ALDT
            UPDATE FIDS_Remark SET Formula = 'input', Parameter = '0' WHERE Code IN ('DEPARTED', 'A01-ARR');
        `);

        console.log('Environment Restored. Now deploying procedures...');
        await sql.close();
    } catch (err) {
        console.error('Error during reinit:', err);
    }
}

reinit();
