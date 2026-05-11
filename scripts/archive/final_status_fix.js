
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
        requestTimeout: 300000
    }
};

const spCode = `
CREATE PROCEDURE dbo.SP_UpdateFlightStatuses
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Flight SET Status = NULL;

    DECLARE @FlightData TABLE (
        FlightId BIGINT, ArrDep CHAR(1), FlightDate DATE, FlightTime DATETIME,
        SOBT VARCHAR(10), EOBT VARCHAR(10), SIBT VARCHAR(10), EIBT VARCHAR(10),
        ATOT VARCHAR(10), ALDT VARCHAR(10), DGATE VARCHAR(20), Belt VARCHAR(20),
        Status VARCHAR(50), CkiOPN VARCHAR(10), CkiClosedTime VARCHAR(10),
        GateClosedTime VARCHAR(10), ASBT VARCHAR(10), FirstBag VARCHAR(10),
        LastBag VARCHAR(10), FlightNo VARCHAR(20)
    );

    INSERT INTO @FlightData 
    SELECT 
        F.FlightId, F.ArrDep, F.FlightDate, 
        CAST(F.FlightDate AS DATETIME) + CAST(F.ScheduledTime AS DATETIME),
        MAX(CASE WHEN FI.ShortName = 'SOBT' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'EOBT' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'SIBT' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'EIBT' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'ATOT' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'ALDT' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'DGATE' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'Belt' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'Status' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'CkiOPN' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'CkiClosedTime' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'GateClosedTime' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'ASBT' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'FirstBag' THEN FI.InfoValue END),
        MAX(CASE WHEN FI.ShortName = 'LastBag' THEN FI.InfoValue END),
        F.FlightNo
    FROM dbo.Flight F
    LEFT JOIN dbo.FlightInfo FI ON F.FlightId = FI.FlightId
    GROUP BY F.FlightId, F.ArrDep, F.FlightDate, F.ScheduledTime, F.FlightNo;

    CREATE TABLE #StatusResults (FlightId BIGINT, DesVn NVARCHAR(200), Priority INT);

    DECLARE @Formula VARCHAR(50), @Parameter VARCHAR(50), @CompareField VARCHAR(50), 
            @RemarkField VARCHAR(50), @DesVn NVARCHAR(200), @Priority INT, @RuleArrDep CHAR(1);

    DECLARE rule_cursor CURSOR FOR 
    SELECT Formula, Parameter, CompareField, RemarkField, DesVn, Priority, ArrDep
    FROM dbo.FIDS_Remark WHERE Status = 1;

    OPEN rule_cursor;
    FETCH NEXT FROM rule_cursor INTO @Formula, @Parameter, @CompareField, @RemarkField, @DesVn, @Priority, @RuleArrDep;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        INSERT INTO #StatusResults (FlightId, DesVn, Priority)
        SELECT fd.FlightId, @DesVn, @Priority
        FROM @FlightData fd
        WHERE ( @RuleArrDep IS NULL OR @RuleArrDep = '' OR @RuleArrDep = fd.ArrDep )
          AND dbo.fn_CalcRemark(@Formula, @Parameter, 
                CASE @CompareField WHEN 'SOBT' THEN fd.SOBT WHEN 'EOBT' THEN fd.EOBT WHEN 'ATOT' THEN fd.ATOT WHEN 'CkiOPN' THEN fd.CkiOPN WHEN 'ASBT' THEN fd.ASBT ELSE '' END, 
                '', 
                CASE @RemarkField WHEN 'SOBT' THEN fd.SOBT WHEN 'EOBT' THEN fd.EOBT WHEN 'ATOT' THEN fd.ATOT WHEN 'ALDT' THEN fd.ALDT WHEN 'CkiOPN' THEN fd.CkiOPN WHEN 'ASBT' THEN fd.ASBT WHEN 'Status' THEN fd.Status ELSE '' END, 
                '', 'SYSTEM', '', fd.FlightTime) = 1;
        FETCH NEXT FROM rule_cursor INTO @Formula, @Parameter, @CompareField, @RemarkField, @DesVn, @Priority, @RuleArrDep;
    END
    CLOSE rule_cursor; DEALLOCATE rule_cursor;

    WITH RankedResults AS (
        SELECT FlightId, DesVn, ROW_NUMBER() OVER (PARTITION BY FlightId ORDER BY Priority ASC) as rnk
        FROM #StatusResults
    )
    UPDATE f SET f.Status = rr.DesVn
    FROM dbo.Flight f JOIN RankedResults rr ON f.FlightId = rr.FlightId WHERE rr.rnk = 1;

    UPDATE dbo.Flight SET Status = N'Không xác định' WHERE Status IS NULL;
    DROP TABLE #StatusResults;
END
`;

async function deploy() {
    try {
        let pool = await sql.connect(config);
        console.log('Connected');
        await pool.request().query("IF OBJECT_ID('SP_UpdateFlightStatuses', 'P') IS NOT NULL DROP PROCEDURE SP_UpdateFlightStatuses");
        await pool.request().query(spCode);
        console.log('SP Deployed. Running calculation...');
        await pool.request().execute('SP_UpdateFlightStatuses');
        console.log('Calculation Complete.');
        await sql.close();
    } catch (err) { console.error(err); }
}
deploy();
