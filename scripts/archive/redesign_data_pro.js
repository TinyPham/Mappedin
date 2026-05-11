
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Longthanh@2026',
    server: '152.42.217.126',
    port: 1433,
    database: 'LongThanhFlightBK',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        requestTimeout: 600000 
    }
};

const spCode = `
CREATE PROCEDURE dbo.SP_SeedFlightInfo_Pro
AS
BEGIN
    SET NOCOUNT ON;
    TRUNCATE TABLE dbo.FlightInfo;

    DECLARE @VN_Now_Time TIME = CAST(DATEADD(HOUR, 7, GETUTCDATE()) AS TIME);
    DECLARE @VN_Now_Date DATE = CAST(DATEADD(HOUR, 7, GETUTCDATE()) AS DATE);

    -- Base Times
    INSERT INTO dbo.FlightInfo (FlightId, ShortName, InfoValue)
    SELECT FlightId, CASE WHEN ArrDep = 'D' THEN 'SOBT' ELSE 'SIBT' END, REPLACE(LEFT(CONVERT(VARCHAR, ScheduledTime, 108), 5), ':', '') FROM dbo.Flight;

    INSERT INTO dbo.FlightInfo (FlightId, ShortName, InfoValue)
    SELECT FlightId, CASE WHEN ArrDep = 'D' THEN 'EOBT' ELSE 'EIBT' END, 
           CASE WHEN FlightId % 10 IN (3, 7) THEN REPLACE(LEFT(CONVERT(VARCHAR, DATEADD(MINUTE, 45, ScheduledTime), 108), 5), ':', '')
           ELSE REPLACE(LEFT(CONVERT(VARCHAR, ISNULL(EstimatedTime, ScheduledTime), 108), 5), ':', '') END
    FROM dbo.Flight;

    -- ATOT/ALDT (Only past)
    INSERT INTO dbo.FlightInfo (FlightId, ShortName, InfoValue)
    SELECT FlightId, CASE WHEN ArrDep = 'D' THEN 'ATOT' ELSE 'ALDT' END, REPLACE(LEFT(CONVERT(VARCHAR, ActualTime, 108), 5), ':', '')
    FROM dbo.Flight WHERE ActualTime IS NOT NULL AND (FlightDate < @VN_Now_Date OR (FlightDate = @VN_Now_Date AND CAST(ActualTime AS TIME) <= @VN_Now_Time));

    -- Departures
    INSERT INTO dbo.FlightInfo (FlightId, ShortName, InfoValue)
    SELECT FlightId, 'CkiOPN', REPLACE(LEFT(CONVERT(VARCHAR, DATEADD(MINUTE, -180, ScheduledTime), 108), 5), ':', '') FROM dbo.Flight WHERE ArrDep = 'D';
    INSERT INTO dbo.FlightInfo (FlightId, ShortName, InfoValue)
    SELECT FlightId, 'CkiClosedTime', REPLACE(LEFT(CONVERT(VARCHAR, DATEADD(MINUTE, -40, ScheduledTime), 108), 5), ':', '') FROM dbo.Flight WHERE ArrDep = 'D';
    INSERT INTO dbo.FlightInfo (FlightId, ShortName, InfoValue)
    SELECT FlightId, 'ASBT', REPLACE(LEFT(CONVERT(VARCHAR, DATEADD(MINUTE, -45, ScheduledTime), 108), 5), ':', '') FROM dbo.Flight WHERE ArrDep = 'D';

    -- Arrivals
    INSERT INTO dbo.FlightInfo (FlightId, ShortName, InfoValue)
    SELECT FlightId, 'AIBT', REPLACE(LEFT(CONVERT(VARCHAR, DATEADD(MINUTE, 5, ISNULL(ActualTime, ScheduledTime)), 108), 5), ':', '') FROM dbo.Flight WHERE ArrDep = 'A';
    INSERT INTO dbo.FlightInfo (FlightId, ShortName, InfoValue)
    SELECT FlightId, 'FirstBag', REPLACE(LEFT(CONVERT(VARCHAR, DATEADD(MINUTE, 20, ISNULL(ActualTime, ScheduledTime)), 108), 5), ':', '') FROM dbo.Flight WHERE ArrDep = 'A';
    INSERT INTO dbo.FlightInfo (FlightId, ShortName, InfoValue)
    SELECT FlightId, 'LastBag', REPLACE(LEFT(CONVERT(VARCHAR, DATEADD(MINUTE, 45, ISNULL(ActualTime, ScheduledTime)), 108), 5), ':', '') FROM dbo.Flight WHERE ArrDep = 'A';

    -- Diversity
    INSERT INTO dbo.FlightInfo (FlightId, ShortName, InfoValue)
    SELECT FlightId, 'Status', CASE WHEN FlightId % 20 = 5 THEN 'CNX' WHEN FlightId % 50 = 10 THEN 'DIV' ELSE 'SCH' END FROM dbo.Flight;
END
`;

async function deploy() {
    try {
        let pool = await sql.connect(config);
        console.log('Connected');
        await pool.request().query("IF OBJECT_ID('SP_SeedFlightInfo_Pro', 'P') IS NOT NULL DROP PROCEDURE SP_SeedFlightInfo_Pro");
        await pool.request().query(spCode);
        console.log('SP_Seed Deployed. Running seed...');
        await pool.request().execute('SP_SeedFlightInfo_Pro');
        console.log('Seeding Complete.');
        await sql.close();
    } catch (err) { console.error(err); }
}
deploy();
