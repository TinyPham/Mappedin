/*
    LongThanhFlightBK bootstrap script
    ----------------------------------
    Purpose
    - Create a temporary development database for Long Thanh flight features.
    - Import raw data from ACISPDIN backup tables.
    - Normalize flights into the Long Thanh model:
        FlightNo, FlightDate, ArrDep, Route, Gate, CheckInIsland, CheckInCounterSpec, Belt
    - Expand CheckInCounterSpec into concrete counters for navigation.

    Notes
    - This database is temporary and can be removed from runtime when a live API is available.
    - Check-in row (CkiRow) is kept only in raw source tables; the normalized layer does not store it.
    - This script assumes the source database exists and is named ACISPDIN by default.

    Typical usage after running the full script:
    1. EXEC dbo.SP_SeedLongThanhMasters;
    2. EXEC dbo.SP_ImportRawFromACISPDIN @SourceDb = N'ACISPDIN', @UseBackupTables = 1;
    3. EXEC dbo.SP_GenerateFlightsFromRaw @FromDate = '2026-05-01', @ToDate = '2027-05-01', @ReplaceExisting = 1;
    4. EXEC dbo.SP_NormalizeFlightOperationalData;
    5. EXEC dbo.SP_ExpandFlightCheckInCounters;
    6. EXEC dbo.SP_ValidateFlightData;
*/

SET NOCOUNT ON;
GO

IF DB_ID(N'LongThanhFlightBK') IS NULL
BEGIN
    EXEC ('CREATE DATABASE [LongThanhFlightBK]');
END
GO

USE [LongThanhFlightBK];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/* -------------------------------------------------------------
   Drop old objects so the script stays rerunnable
------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.SP_GetFlightNavigationTargets', N'P') IS NOT NULL DROP PROCEDURE dbo.SP_GetFlightNavigationTargets;
IF OBJECT_ID(N'dbo.SP_GetFlights', N'P') IS NOT NULL DROP PROCEDURE dbo.SP_GetFlights;
IF OBJECT_ID(N'dbo.SP_SeedSampleFlightPlan', N'P') IS NOT NULL DROP PROCEDURE dbo.SP_SeedSampleFlightPlan;
IF OBJECT_ID(N'dbo.SP_InsertManualFlight', N'P') IS NOT NULL DROP PROCEDURE dbo.SP_InsertManualFlight;
IF OBJECT_ID(N'dbo.SP_ValidateFlightData', N'P') IS NOT NULL DROP PROCEDURE dbo.SP_ValidateFlightData;
IF OBJECT_ID(N'dbo.SP_ExpandFlightCheckInCounters', N'P') IS NOT NULL DROP PROCEDURE dbo.SP_ExpandFlightCheckInCounters;
IF OBJECT_ID(N'dbo.SP_NormalizeFlightOperationalData', N'P') IS NOT NULL DROP PROCEDURE dbo.SP_NormalizeFlightOperationalData;
IF OBJECT_ID(N'dbo.SP_GenerateFlightsFromRaw', N'P') IS NOT NULL DROP PROCEDURE dbo.SP_GenerateFlightsFromRaw;
IF OBJECT_ID(N'dbo.SP_ImportRawFromACISPDIN', N'P') IS NOT NULL DROP PROCEDURE dbo.SP_ImportRawFromACISPDIN;
IF OBJECT_ID(N'dbo.SP_SeedLongThanhMasters', N'P') IS NOT NULL DROP PROCEDURE dbo.SP_SeedLongThanhMasters;
GO

IF OBJECT_ID(N'dbo.fn_BuildContiguousCounterSpec', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_BuildContiguousCounterSpec;
IF OBJECT_ID(N'dbo.fn_NormalizeFlightRoute', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_NormalizeFlightRoute;
IF OBJECT_ID(N'dbo.fn_NormalizeCounterSpec', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_NormalizeCounterSpec;
IF OBJECT_ID(N'dbo.fn_ExtractFirstInt', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_ExtractFirstInt;
IF OBJECT_ID(N'dbo.fn_ParseCounterSpec', N'IF') IS NOT NULL DROP FUNCTION dbo.fn_ParseCounterSpec;
IF OBJECT_ID(N'dbo.fn_ParseCounterSpec', N'TF') IS NOT NULL DROP FUNCTION dbo.fn_ParseCounterSpec;
GO

IF OBJECT_ID(N'dbo.MigrationErrorLog', N'U') IS NOT NULL DROP TABLE dbo.MigrationErrorLog;
IF OBJECT_ID(N'dbo.MigrationBatchLog', N'U') IS NOT NULL DROP TABLE dbo.MigrationBatchLog;
IF OBJECT_ID(N'dbo.FlightCheckInCounter', N'U') IS NOT NULL DROP TABLE dbo.FlightCheckInCounter;
IF OBJECT_ID(N'dbo.Flight', N'U') IS NOT NULL DROP TABLE dbo.Flight;
IF OBJECT_ID(N'dbo.MasterCheckInCounter', N'U') IS NOT NULL DROP TABLE dbo.MasterCheckInCounter;
IF OBJECT_ID(N'dbo.MasterCheckInIsland', N'U') IS NOT NULL DROP TABLE dbo.MasterCheckInIsland;
IF OBJECT_ID(N'dbo.MasterGate', N'U') IS NOT NULL DROP TABLE dbo.MasterGate;
IF OBJECT_ID(N'dbo.MasterBelt', N'U') IS NOT NULL DROP TABLE dbo.MasterBelt;
IF OBJECT_ID(N'dbo.ListTimeRaw', N'U') IS NOT NULL DROP TABLE dbo.ListTimeRaw;
IF OBJECT_ID(N'dbo.ListCarrierRaw', N'U') IS NOT NULL DROP TABLE dbo.ListCarrierRaw;
IF OBJECT_ID(N'dbo.FlightStatusRaw', N'U') IS NOT NULL DROP TABLE dbo.FlightStatusRaw;
IF OBJECT_ID(N'dbo.ListFlightInfoRaw', N'U') IS NOT NULL DROP TABLE dbo.ListFlightInfoRaw;
IF OBJECT_ID(N'dbo.FlightInfoRaw', N'U') IS NOT NULL DROP TABLE dbo.FlightInfoRaw;
IF OBJECT_ID(N'dbo.FlightRaw', N'U') IS NOT NULL DROP TABLE dbo.FlightRaw;
GO

/* -------------------------------------------------------------
   Helper functions
------------------------------------------------------------- */
CREATE FUNCTION dbo.fn_ParseCounterSpec (@Spec NVARCHAR(100))
RETURNS @Counters TABLE (
    CounterNo INT NOT NULL PRIMARY KEY
)
AS
BEGIN
    DECLARE @work NVARCHAR(100) = REPLACE(REPLACE(ISNULL(@Spec, N''), N' ', N''), N';', N',');
    DECLARE @token NVARCHAR(50);
    DECLARE @dash INT;
    DECLARE @startNo INT;
    DECLARE @endNo INT;
    DECLARE @current INT;
    DECLARE @comma INT;

    WHILE LEN(@work) > 0
    BEGIN
        SET @comma = CHARINDEX(N',', @work);
        IF @comma = 0
        BEGIN
            SET @token = @work;
            SET @work = N'';
        END
        ELSE
        BEGIN
            SET @token = LEFT(@work, @comma - 1);
            SET @work = SUBSTRING(@work, @comma + 1, LEN(@work));
        END

        IF @token = N'' CONTINUE;

        SET @dash = CHARINDEX(N'-', @token);
        IF @dash > 0
        BEGIN
            SET @startNo = TRY_CONVERT(INT, LEFT(@token, @dash - 1));
            SET @endNo = TRY_CONVERT(INT, SUBSTRING(@token, @dash + 1, LEN(@token)));
        END
        ELSE
        BEGIN
            SET @startNo = TRY_CONVERT(INT, @token);
            SET @endNo = @startNo;
        END

        IF @startNo IS NULL OR @endNo IS NULL OR @startNo <= 0 OR @endNo <= 0 CONTINUE;
        IF @startNo > @endNo
        BEGIN
            DECLARE @swap INT = @startNo;
            SET @startNo = @endNo;
            SET @endNo = @swap;
        END

        SET @current = @startNo;
        WHILE @current <= @endNo
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM @Counters WHERE CounterNo = @current)
            BEGIN
                INSERT INTO @Counters (CounterNo) VALUES (@current);
            END
            SET @current += 1;
        END
    END

    RETURN;
END
GO

CREATE FUNCTION dbo.fn_ExtractFirstInt (@Text NVARCHAR(200))
RETURNS INT
AS
BEGIN
    DECLARE @value NVARCHAR(50) = N'';
    DECLARE @i INT = 1;
    DECLARE @len INT = LEN(ISNULL(@Text, N''));
    DECLARE @started BIT = 0;
    DECLARE @ch NCHAR(1);

    WHILE @i <= @len
    BEGIN
        SET @ch = SUBSTRING(@Text, @i, 1);
        IF @ch LIKE N'[0-9]'
        BEGIN
            SET @value += @ch;
            SET @started = 1;
        END
        ELSE IF @started = 1
        BEGIN
            BREAK;
        END
        SET @i += 1;
    END

    RETURN TRY_CONVERT(INT, NULLIF(@value, N''));
END
GO

CREATE FUNCTION dbo.fn_NormalizeCounterSpec (@Spec NVARCHAR(100))
RETURNS NVARCHAR(100)
AS
BEGIN
    RETURN NULLIF(REPLACE(REPLACE(LTRIM(RTRIM(ISNULL(@Spec, N''))), N' ', N''), N';', N','), N'');
END
GO

CREATE FUNCTION dbo.fn_NormalizeFlightRoute (
    @Route NVARCHAR(100),
    @ArrDep CHAR(1)
)
RETURNS NVARCHAR(100)
AS
BEGIN
    DECLARE @clean NVARCHAR(100) = UPPER(LTRIM(RTRIM(ISNULL(@Route, N''))));
    DECLARE @dash INT;
    DECLARE @leftCode NVARCHAR(20);
    DECLARE @rightCode NVARCHAR(20);
    DECLARE @otherCode NVARCHAR(20);

    IF @clean = N''
        RETURN NULL;

    SET @clean = REPLACE(REPLACE(REPLACE(@clean, N' ', N''), N'/', N'-'), N'_', N'-');
    SET @dash = CHARINDEX(N'-', @clean);

    IF @dash > 0
    BEGIN
        SET @leftCode = NULLIF(LEFT(@clean, @dash - 1), N'');
        SET @rightCode = NULLIF(SUBSTRING(@clean, @dash + 1, LEN(@clean)), N'');
    END
    ELSE
    BEGIN
        SET @leftCode = @clean;
        SET @rightCode = NULL;
    END

    IF @ArrDep = 'D'
    BEGIN
        SET @otherCode = CASE
            WHEN @rightCode IS NOT NULL AND @rightCode NOT IN (N'LTH', N'DIN', N'SGN', N'TSN') THEN @rightCode
            WHEN @leftCode IS NOT NULL AND @leftCode NOT IN (N'LTH', N'DIN', N'SGN', N'TSN') THEN @leftCode
            ELSE COALESCE(@rightCode, @leftCode, N'UNK')
        END;
        RETURN N'LTH-' + @otherCode;
    END

    SET @otherCode = CASE
        WHEN @leftCode IS NOT NULL AND @leftCode NOT IN (N'LTH', N'DIN', N'SGN', N'TSN') THEN @leftCode
        WHEN @rightCode IS NOT NULL AND @rightCode NOT IN (N'LTH', N'DIN', N'SGN', N'TSN') THEN @rightCode
        ELSE COALESCE(@leftCode, @rightCode, N'UNK')
    END;

    RETURN @otherCode + N'-LTH';
END
GO

CREATE FUNCTION dbo.fn_BuildContiguousCounterSpec (
    @StartNo INT,
    @CounterCount INT
)
RETURNS NVARCHAR(100)
AS
BEGIN
    DECLARE @result NVARCHAR(100);
    DECLARE @endNo INT;

    IF @StartNo IS NULL OR @CounterCount IS NULL OR @StartNo <= 0 OR @CounterCount <= 0
        RETURN NULL;

    SET @endNo = @StartNo + @CounterCount - 1;
    IF @CounterCount = 1
        SET @result = CONVERT(NVARCHAR(20), @StartNo);
    ELSE
        SET @result = CONVERT(NVARCHAR(20), @StartNo) + N'-' + CONVERT(NVARCHAR(20), @endNo);

    RETURN @result;
END
GO

/* -------------------------------------------------------------
   Raw source tables
------------------------------------------------------------- */
CREATE TABLE dbo.FlightRaw (
    FlightRawId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SourceFlightId INT NULL,
    FlightNo VARCHAR(10) NULL,
    FlightDate DATE NULL,
    Route VARCHAR(20) NULL,
    LinkFlight VARCHAR(25) NULL,
    FlightDateTime DATETIME NULL,
    ArrDep VARCHAR(1) NULL,
    Status BIT NULL,
    FlightDateICAO DATE NULL,
    StandDateTime DATETIME NULL,
    FinishDateTime DATETIME NULL,
    RawJson NVARCHAR(MAX) NULL,
    ImportedAt DATETIME2 NOT NULL CONSTRAINT DF_FlightRaw_ImportedAt DEFAULT SYSDATETIME(),
    SourceSystem NVARCHAR(50) NOT NULL CONSTRAINT DF_FlightRaw_SourceSystem DEFAULT N'ACISPDIN'
);
GO

CREATE TABLE dbo.FlightInfoRaw (
    FlightInfoRawId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SourceFlightInfoId BIGINT NULL,
    SourceFlightId INT NOT NULL,
    ListFlightInfoId INT NOT NULL,
    InfoValue NVARCHAR(MAX) NULL,
    InputSource VARCHAR(40) NULL,
    InputTime DATETIME NULL,
    ImportedAt DATETIME2 NOT NULL CONSTRAINT DF_FlightInfoRaw_ImportedAt DEFAULT SYSDATETIME(),
    SourceSystem NVARCHAR(50) NOT NULL CONSTRAINT DF_FlightInfoRaw_SourceSystem DEFAULT N'ACISPDIN'
);
GO

CREATE TABLE dbo.ListFlightInfoRaw (
    ListFlightInfoId INT NOT NULL PRIMARY KEY,
    ShortName VARCHAR(20) NULL,
    FullName VARCHAR(50) NULL,
    FiledType VARCHAR(20) NULL,
    Description NVARCHAR(500) NULL,
    ArrDep VARCHAR(1) NULL,
    SourceName VARCHAR(20) NULL,
    SourceNameMap VARCHAR(50) NULL,
    OrderBy INT NULL,
    IsTime BIT NULL,
    ImportedAt DATETIME2 NOT NULL CONSTRAINT DF_ListFlightInfoRaw_ImportedAt DEFAULT SYSDATETIME()
);
GO

CREATE TABLE dbo.FlightStatusRaw (
    FlightStatusId INT NOT NULL PRIMARY KEY,
    FlightStatusName VARCHAR(3) NULL,
    FieldName VARCHAR(10) NULL,
    Domestic INT NULL,
    International INT NULL,
    Sortby INT NULL,
    Remarks NVARCHAR(250) NULL,
    ImportedAt DATETIME2 NOT NULL CONSTRAINT DF_FlightStatusRaw_ImportedAt DEFAULT SYSDATETIME()
);
GO

CREATE TABLE dbo.ListCarrierRaw (
    Carrier VARCHAR(2) NOT NULL PRIMARY KEY,
    Code3 VARCHAR(3) NULL,
    CarrierName NVARCHAR(100) NULL,
    NumericCode VARCHAR(5) NULL,
    Country VARCHAR(2) NULL,
    PNLButtons VARCHAR(50) NULL,
    Status VARCHAR(3) NULL,
    CheckinOpen INT NULL,
    FirstBag INT NULL,
    LastBag INT NULL,
    Mgha VARCHAR(10) NULL,
    LastModifiedDate DATETIME NULL,
    LastModifiedBy VARCHAR(1000) NULL,
    ImportedAt DATETIME2 NOT NULL CONSTRAINT DF_ListCarrierRaw_ImportedAt DEFAULT SYSDATETIME()
);
GO

CREATE TABLE dbo.ListTimeRaw (
    ListTimeId INT NOT NULL PRIMARY KEY,
    TimeSTR VARCHAR(5) NULL,
    TimeUTC VARCHAR(5) NULL,
    TimeLocal VARCHAR(5) NULL,
    TimeMinute INT NULL,
    TimeFIDS VARCHAR(5) NULL,
    TimeFIDSBlock5UP VARCHAR(5) NULL,
    TimeFIDSBlock5DOWN VARCHAR(5) NULL,
    ImportedAt DATETIME2 NOT NULL CONSTRAINT DF_ListTimeRaw_ImportedAt DEFAULT SYSDATETIME()
);
GO

/* -------------------------------------------------------------
   Long Thanh master data
------------------------------------------------------------- */
CREATE TABLE dbo.MasterGate (
    Gate INT NOT NULL PRIMARY KEY,
    IsActive BIT NOT NULL CONSTRAINT DF_MasterGate_IsActive DEFAULT 1
);
GO

CREATE TABLE dbo.MasterCheckInIsland (
    CheckInIsland CHAR(1) NOT NULL PRIMARY KEY,
    MinCounter INT NOT NULL,
    MaxCounter INT NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_MasterCheckInIsland_IsActive DEFAULT 1
);
GO

CREATE TABLE dbo.MasterCheckInCounter (
    CheckInIsland CHAR(1) NOT NULL,
    CounterNo INT NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_MasterCheckInCounter_IsActive DEFAULT 1,
    CONSTRAINT PK_MasterCheckInCounter PRIMARY KEY (CheckInIsland, CounterNo),
    CONSTRAINT FK_MasterCheckInCounter_Island
        FOREIGN KEY (CheckInIsland) REFERENCES dbo.MasterCheckInIsland(CheckInIsland)
);
GO

CREATE TABLE dbo.MasterBelt (
    Belt INT NOT NULL PRIMARY KEY,
    BeltType NVARCHAR(30) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_MasterBelt_IsActive DEFAULT 1
);
GO

/* -------------------------------------------------------------
   Normalized flight tables
------------------------------------------------------------- */
CREATE TABLE dbo.Flight (
    FlightId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SourceFlightId INT NULL,
    FlightNo NVARCHAR(50) NOT NULL,
    FlightDate DATE NOT NULL,
    ArrDep CHAR(1) NOT NULL,
    Route NVARCHAR(100) NULL,
    Airline NVARCHAR(200) NULL,
    Status NVARCHAR(100) NULL,
    ScheduledTime TIME NULL,
    EstimatedTime TIME NULL,
    ActualTime TIME NULL,
    Gate INT NULL,
    CheckInIsland CHAR(1) NULL,
    CheckInCounterSpec NVARCHAR(100) NULL,
    Belt INT NULL,
    IsSimulatedCheckIn BIT NOT NULL CONSTRAINT DF_Flight_IsSimulatedCheckIn DEFAULT 0,
    IsSimulatedGate BIT NOT NULL CONSTRAINT DF_Flight_IsSimulatedGate DEFAULT 0,
    IsSimulatedBelt BIT NOT NULL CONSTRAINT DF_Flight_IsSimulatedBelt DEFAULT 0,
    RawPayload NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Flight_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Flight_UpdatedAt DEFAULT SYSDATETIME(),
    CONSTRAINT CK_Flight_ArrDep CHECK (ArrDep IN ('A', 'D')),
    CONSTRAINT FK_Flight_Gate FOREIGN KEY (Gate) REFERENCES dbo.MasterGate(Gate),
    CONSTRAINT FK_Flight_CheckInIsland FOREIGN KEY (CheckInIsland) REFERENCES dbo.MasterCheckInIsland(CheckInIsland),
    CONSTRAINT FK_Flight_Belt FOREIGN KEY (Belt) REFERENCES dbo.MasterBelt(Belt)
);
GO

CREATE TABLE dbo.FlightCheckInCounter (
    FlightId BIGINT NOT NULL,
    CheckInIsland CHAR(1) NOT NULL,
    CounterNo INT NOT NULL,
    CONSTRAINT PK_FlightCheckInCounter PRIMARY KEY (FlightId, CheckInIsland, CounterNo),
    CONSTRAINT FK_FlightCheckInCounter_Flight
        FOREIGN KEY (FlightId) REFERENCES dbo.Flight(FlightId),
    CONSTRAINT FK_FlightCheckInCounter_Master
        FOREIGN KEY (CheckInIsland, CounterNo)
        REFERENCES dbo.MasterCheckInCounter(CheckInIsland, CounterNo)
);
GO

CREATE TABLE dbo.MigrationBatchLog (
    MigrationBatchId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    BatchType NVARCHAR(50) NOT NULL,
    StartedAt DATETIME2 NOT NULL CONSTRAINT DF_MigrationBatchLog_StartedAt DEFAULT SYSDATETIME(),
    FinishedAt DATETIME2 NULL,
    Status NVARCHAR(30) NOT NULL,
    Notes NVARCHAR(1000) NULL
);
GO

CREATE TABLE dbo.MigrationErrorLog (
    MigrationErrorId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    MigrationBatchId BIGINT NULL,
    SourceFlightId INT NULL,
    ErrorStage NVARCHAR(100) NOT NULL,
    ErrorMessage NVARCHAR(2000) NOT NULL,
    RawData NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_MigrationErrorLog_CreatedAt DEFAULT SYSDATETIME()
);
GO

CREATE INDEX IX_FlightRaw_SourceFlightId ON dbo.FlightRaw(SourceFlightId);
CREATE INDEX IX_FlightInfoRaw_SourceFlightId ON dbo.FlightInfoRaw(SourceFlightId);
CREATE INDEX IX_FlightInfoRaw_ListFlightInfoId ON dbo.FlightInfoRaw(ListFlightInfoId);
CREATE INDEX IX_Flight_FlightDate_ArrDep ON dbo.Flight(FlightDate, ArrDep);
CREATE INDEX IX_Flight_FlightNo ON dbo.Flight(FlightNo);
CREATE INDEX IX_Flight_Status ON dbo.Flight(Status);
CREATE INDEX IX_Flight_Gate ON dbo.Flight(Gate);
CREATE INDEX IX_Flight_Belt ON dbo.Flight(Belt);
CREATE INDEX IX_Flight_CheckInIsland ON dbo.Flight(CheckInIsland);
GO

/* -------------------------------------------------------------
   Seed procedure for Long Thanh masters
------------------------------------------------------------- */
CREATE PROCEDURE dbo.SP_SeedLongThanhMasters
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM dbo.FlightCheckInCounter;
    DELETE FROM dbo.Flight;
    DELETE FROM dbo.MasterCheckInCounter;
    DELETE FROM dbo.MasterCheckInIsland;
    DELETE FROM dbo.MasterGate;
    DELETE FROM dbo.MasterBelt;

    ;WITH n AS (
        SELECT 1 AS ValueNo
        UNION ALL
        SELECT ValueNo + 1 FROM n WHERE ValueNo < 49
    )
    INSERT INTO dbo.MasterGate (Gate)
    SELECT ValueNo
    FROM n
    OPTION (MAXRECURSION 100);

    INSERT INTO dbo.MasterCheckInIsland (CheckInIsland, MinCounter, MaxCounter)
    VALUES
        ('A', 1, 14),
        ('B', 1, 28),
        ('C', 1, 28),
        ('D', 1, 28),
        ('E', 1, 14),
        ('F', 1, 14),
        ('G', 1, 28),
        ('H', 1, 28),
        ('I', 1, 28),
        ('J', 1, 14);

    ;WITH Islands AS (
        SELECT CheckInIsland, MinCounter, MaxCounter
        FROM dbo.MasterCheckInIsland
    ),
    Counters AS (
        SELECT CheckInIsland, MinCounter AS CounterNo, MaxCounter
        FROM Islands
        UNION ALL
        SELECT CheckInIsland, CounterNo + 1, MaxCounter
        FROM Counters
        WHERE CounterNo < MaxCounter
    )
    INSERT INTO dbo.MasterCheckInCounter (CheckInIsland, CounterNo)
    SELECT CheckInIsland, CounterNo
    FROM Counters
    OPTION (MAXRECURSION 500);

    ;WITH n AS (
        SELECT 1 AS Belt
        UNION ALL
        SELECT Belt + 1 FROM n WHERE Belt < 16
    )
    INSERT INTO dbo.MasterBelt (Belt, BeltType)
    SELECT
        Belt,
        CASE WHEN Belt BETWEEN 1 AND 3 THEN N'Domestic' ELSE N'International' END
    FROM n
    OPTION (MAXRECURSION 100);
END
GO

/* -------------------------------------------------------------
   Import raw data from ACISPDIN
------------------------------------------------------------- */
CREATE PROCEDURE dbo.SP_ImportRawFromACISPDIN
    @SourceDb SYSNAME = N'ACISPDIN',
    @UseBackupTables BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @FlightTable SYSNAME = CASE WHEN @UseBackupTables = 1 THEN N'BKFlight' ELSE N'Flight' END;
    DECLARE @FlightInfoTable SYSNAME = CASE WHEN @UseBackupTables = 1 THEN N'BKFlightInfo' ELSE N'FlightInfo' END;
    DECLARE @sql NVARCHAR(MAX);
    DECLARE @BatchId BIGINT;

    INSERT INTO dbo.MigrationBatchLog (BatchType, Status, Notes)
    VALUES (N'IMPORT_RAW', N'STARTED', N'Import raw data from source database');
    SET @BatchId = SCOPE_IDENTITY();

    BEGIN TRY
        DELETE FROM dbo.FlightInfoRaw;
        DELETE FROM dbo.FlightRaw;
        DELETE FROM dbo.ListFlightInfoRaw;
        DELETE FROM dbo.FlightStatusRaw;
        DELETE FROM dbo.ListCarrierRaw;
        DELETE FROM dbo.ListTimeRaw;

        SET @sql = N'
            INSERT INTO dbo.FlightRaw (
                SourceFlightId, FlightNo, FlightDate, Route, LinkFlight,
                FlightDateTime, ArrDep, Status, FlightDateICAO, StandDateTime, FinishDateTime
            )
            SELECT
                FlightId, FlightNo, FlightDate, Route, LinkFlight,
                FlightDateTime, ArrDep, Status, FlightDateICAO, StandDateTime, FinishDateTime
            FROM ' + QUOTENAME(@SourceDb) + N'.dbo.' + QUOTENAME(@FlightTable) + N';
        ';
        EXEC sp_executesql @sql;

        SET @sql = N'
            INSERT INTO dbo.FlightInfoRaw (
                SourceFlightInfoId, SourceFlightId, ListFlightInfoId, InfoValue, InputSource, InputTime
            )
            SELECT
                FlightInfoId, FlightId, ListFlightInfoId, InfoValue, InputSource, InputTime
            FROM ' + QUOTENAME(@SourceDb) + N'.dbo.' + QUOTENAME(@FlightInfoTable) + N';
        ';
        EXEC sp_executesql @sql;

        SET @sql = N'
            INSERT INTO dbo.ListFlightInfoRaw (
                ListFlightInfoId, ShortName, FullName, FiledType, Description, ArrDep, SourceName, SourceNameMap, OrderBy, IsTime
            )
            SELECT
                ListFlightInfoId, ShortName, FullName, FiledType, Description, ArrDep, SourceName, SourceNameMap, OrderBy, IsTime
            FROM ' + QUOTENAME(@SourceDb) + N'.dbo.[ListFlightInfo];
        ';
        EXEC sp_executesql @sql;

        SET @sql = N'
            INSERT INTO dbo.FlightStatusRaw (
                FlightStatusId, FlightStatusName, FieldName, Domestic, International, Sortby, Remarks
            )
            SELECT
                FlightStatusId, FlightStatusName, FieldName, Domestic, International, Sortby, Remarks
            FROM ' + QUOTENAME(@SourceDb) + N'.dbo.[FlightStatus];
        ';
        EXEC sp_executesql @sql;

        SET @sql = N'
            INSERT INTO dbo.ListCarrierRaw (
                Carrier, Code3, CarrierName, NumericCode, Country, PNLButtons, Status,
                CheckinOpen, FirstBag, LastBag, Mgha, LastModifiedDate, LastModifiedBy
            )
            SELECT
                Carrier, Code3, CarrierName, NumericCode, Country, PNLButtons, Status,
                CheckinOpen, FirstBag, LastBag, Mgha, LastModifiedDate, LastModifiedBy
            FROM ' + QUOTENAME(@SourceDb) + N'.dbo.[ListCarrier];
        ';
        EXEC sp_executesql @sql;

        SET @sql = N'
            INSERT INTO dbo.ListTimeRaw (
                ListTimeId, TimeSTR, TimeUTC, TimeLocal, TimeMinute, TimeFIDS, TimeFIDSBlock5UP, TimeFIDSBlock5DOWN
            )
            SELECT
                ListTimeId, TimeSTR, TimeUTC, TimeLocal, TimeMinute, TimeFIDS, TimeFIDSBlock5UP, TimeFIDSBlock5DOWN
            FROM ' + QUOTENAME(@SourceDb) + N'.dbo.[ListTime];
        ';
        EXEC sp_executesql @sql;

        UPDATE dbo.MigrationBatchLog
        SET FinishedAt = SYSDATETIME(), Status = N'SUCCEEDED'
        WHERE MigrationBatchId = @BatchId;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.MigrationErrorLog (ErrorStage, ErrorMessage, RawData)
        VALUES (N'IMPORT_RAW', ERROR_MESSAGE(), NULL);

        UPDATE dbo.MigrationBatchLog
        SET FinishedAt = SYSDATETIME(), Status = N'FAILED', Notes = ERROR_MESSAGE()
        WHERE MigrationBatchId = @BatchId;

        THROW;
    END CATCH
END
GO

/* -------------------------------------------------------------
   Generate normalized flights from raw source dates
------------------------------------------------------------- */
CREATE PROCEDURE dbo.SP_GenerateFlightsFromRaw
    @FromDate DATE,
    @ToDate DATE,
    @ReplaceExisting BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF @FromDate IS NULL OR @ToDate IS NULL OR @FromDate > @ToDate
    BEGIN
        THROW 50010, 'Invalid date range.', 1;
    END;

    IF @ReplaceExisting = 1
    BEGIN
        DELETE FC
        FROM dbo.FlightCheckInCounter FC
        INNER JOIN dbo.Flight F ON F.FlightId = FC.FlightId
        WHERE F.FlightDate BETWEEN @FromDate AND @ToDate;

        DELETE FROM dbo.Flight
        WHERE FlightDate BETWEEN @FromDate AND @ToDate;
    END

    ;WITH Templates AS (
        SELECT
            FR.SourceFlightId,
            FR.FlightNo,
            FR.FlightDate,
            FR.Route,
            FR.ArrDep,
            FR.FlightDateTime,
            CASE
                WHEN FR.FlightDate IS NULL THEN NULL
                ELSE TRY_CONVERT(
                    DATE,
                    CONCAT(
                        YEAR(@FromDate) + CASE
                            WHEN (MONTH(FR.FlightDate) * 100 + DAY(FR.FlightDate)) < (MONTH(@FromDate) * 100 + DAY(@FromDate))
                                THEN 1
                            ELSE 0
                        END,
                        N'-',
                        RIGHT(N'0' + CONVERT(NVARCHAR(2), MONTH(FR.FlightDate)), 2),
                        N'-',
                        RIGHT(N'0' + CONVERT(NVARCHAR(2), DAY(FR.FlightDate)), 2)
                    )
                )
            END AS TargetFlightDate
        FROM dbo.FlightRaw FR
        WHERE FR.FlightNo IS NOT NULL
    )
    INSERT INTO dbo.Flight (
        SourceFlightId, FlightNo, FlightDate, ArrDep, Route, ScheduledTime, RawPayload
    )
    SELECT
        T.SourceFlightId,
        CASE
            WHEN LEN(T.FlightNo) > 2
                THEN LEFT(T.FlightNo, 2) + RIGHT(
                    REPLICATE(N'0', LEN(T.FlightNo) - 2) +
                    CONVERT(
                        NVARCHAR(20),
                        (ABS(CHECKSUM(CONCAT(T.FlightNo, N'|', CONVERT(NVARCHAR(10), T.TargetFlightDate, 120)))) %
                            (CASE
                                WHEN LEN(T.FlightNo) - 2 <= 1 THEN 9
                                WHEN LEN(T.FlightNo) - 2 = 2 THEN 90
                                WHEN LEN(T.FlightNo) - 2 = 3 THEN 900
                                WHEN LEN(T.FlightNo) - 2 = 4 THEN 9000
                                ELSE 90000
                             END)
                        ) +
                        (CASE
                            WHEN LEN(T.FlightNo) - 2 <= 1 THEN 1
                            WHEN LEN(T.FlightNo) - 2 = 2 THEN 10
                            WHEN LEN(T.FlightNo) - 2 = 3 THEN 100
                            WHEN LEN(T.FlightNo) - 2 = 4 THEN 1000
                            ELSE 10000
                         END)
                    ),
                    LEN(T.FlightNo) - 2
                )
            ELSE T.FlightNo
        END,
        T.TargetFlightDate,
        COALESCE(NULLIF(T.ArrDep, ''), 'D'),
        dbo.fn_NormalizeFlightRoute(T.Route, COALESCE(NULLIF(T.ArrDep, ''), 'D')),
        COALESCE(
            NULLIF(TRY_CONVERT(TIME, T.FlightDateTime), CAST('00:00:00' AS TIME)),
            TIMEFROMPARTS(
                5 + (
                    ABS(CHECKSUM(CONCAT(T.FlightNo, N'|', CONVERT(NVARCHAR(10), T.TargetFlightDate, 120), N'|HOUR')))
                    % 18
                ),
                ABS(CHECKSUM(CONCAT(T.FlightNo, N'|', CONVERT(NVARCHAR(10), T.TargetFlightDate, 120), N'|MINUTE'))) % 60,
                0,
                0,
                0
            )
        ),
        NULL
    FROM Templates T
    WHERE T.TargetFlightDate BETWEEN @FromDate AND @ToDate;
END
GO

/* -------------------------------------------------------------
   Normalize Gate / Belt / CheckInIsland / CheckInCounterSpec
------------------------------------------------------------- */
CREATE PROCEDURE dbo.SP_NormalizeFlightOperationalData
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH InfoBase AS (
        SELECT
            FIR.SourceFlightId,
            LFI.ShortName,
            FIR.InfoValue
        FROM dbo.FlightInfoRaw FIR
        INNER JOIN dbo.ListFlightInfoRaw LFI ON LFI.ListFlightInfoId = FIR.ListFlightInfoId
    ),
    GateInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName IN ('DGATE', 'AGATE', 'Gate') THEN IB.InfoValue END) AS GateValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    BeltInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName = 'Belt' THEN IB.InfoValue END) AS BeltValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    StatusInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName IN ('Status', 'FLST') THEN IB.InfoValue END) AS StatusValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    ScheduledInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName IN ('SOBT', 'STD', 'STA', 'ScheduledTime') THEN IB.InfoValue END) AS ScheduledValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    EstimatedInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName IN ('ETOT', 'ETD', 'ETA', 'EstimatedTime') THEN IB.InfoValue END) AS EstimatedValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    ActualInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName IN ('ATOT', 'ATD', 'ATA', 'ALDT', 'ActualTime') THEN IB.InfoValue END) AS ActualValue
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    ),
    CheckInInfo AS (
        SELECT
            IB.SourceFlightId,
            MAX(CASE WHEN IB.ShortName = 'CkiRow' THEN IB.InfoValue END) AS CkiRow
        FROM InfoBase IB
        GROUP BY IB.SourceFlightId
    )
    UPDATE F
    SET
        F.Gate = CASE
            WHEN G.GateValue IS NULL THEN NULL
            ELSE dbo.fn_ExtractFirstInt(G.GateValue)
        END,
        F.Belt = CASE
            WHEN B.BeltValue IS NULL THEN NULL
            ELSE dbo.fn_ExtractFirstInt(B.BeltValue)
        END,
        F.Status = NULLIF(LTRIM(RTRIM(S.StatusValue)), ''),
        F.ScheduledTime = COALESCE(TRY_CONVERT(TIME, Sch.ScheduledValue), F.ScheduledTime),
        F.EstimatedTime = TRY_CONVERT(TIME, Est.EstimatedValue),
        F.ActualTime = TRY_CONVERT(TIME, Act.ActualValue),
        F.IsSimulatedCheckIn = 0,
        F.UpdatedAt = SYSDATETIME()
    FROM dbo.Flight F
    LEFT JOIN GateInfo G ON G.SourceFlightId = F.SourceFlightId
    LEFT JOIN BeltInfo B ON B.SourceFlightId = F.SourceFlightId
    LEFT JOIN StatusInfo S ON S.SourceFlightId = F.SourceFlightId
    LEFT JOIN ScheduledInfo Sch ON Sch.SourceFlightId = F.SourceFlightId
    LEFT JOIN EstimatedInfo Est ON Est.SourceFlightId = F.SourceFlightId
    LEFT JOIN ActualInfo Act ON Act.SourceFlightId = F.SourceFlightId;

    UPDATE F
    SET IsSimulatedGate = CASE WHEN F.Gate IS NULL THEN 1 ELSE 0 END
    FROM dbo.Flight F;

    UPDATE F
    SET IsSimulatedBelt = CASE WHEN F.Belt IS NULL THEN 1 ELSE 0 END
    FROM dbo.Flight F;

END
GO

/* -------------------------------------------------------------
   Expand CheckInCounterSpec into concrete counters
------------------------------------------------------------- */
CREATE PROCEDURE dbo.SP_ExpandFlightCheckInCounters
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM dbo.FlightCheckInCounter;

    INSERT INTO dbo.FlightCheckInCounter (FlightId, CheckInIsland, CounterNo)
    SELECT
        F.FlightId,
        F.CheckInIsland,
        P.CounterNo
    FROM dbo.Flight F
    CROSS APPLY dbo.fn_ParseCounterSpec(F.CheckInCounterSpec) P
    WHERE F.CheckInIsland IS NOT NULL
      AND F.CheckInCounterSpec IS NOT NULL;
END
GO

/* -------------------------------------------------------------
   Manual flight insert / curated seed data
------------------------------------------------------------- */
CREATE PROCEDURE dbo.SP_InsertManualFlight
    @FlightNo NVARCHAR(50),
    @FlightDate DATE,
    @ArrDep CHAR(1),
    @Route NVARCHAR(100) = NULL,
    @Airline NVARCHAR(200) = NULL,
    @Status NVARCHAR(100) = NULL,
    @ScheduledTime TIME = NULL,
    @EstimatedTime TIME = NULL,
    @ActualTime TIME = NULL,
    @Gate INT = NULL,
    @CheckInIsland CHAR(1) = NULL,
    @CheckInCounterSpec NVARCHAR(100) = NULL,
    @Belt INT = NULL,
    @SourceFlightId INT = NULL,
    @ReplaceExisting BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF @FlightNo IS NULL OR LTRIM(RTRIM(@FlightNo)) = N''
        THROW 50020, 'FlightNo is required.', 1;

    IF @FlightDate IS NULL
        THROW 50021, 'FlightDate is required.', 1;

    IF @ArrDep NOT IN ('A', 'D')
        THROW 50022, 'ArrDep must be A or D.', 1;

    IF @ScheduledTime IS NULL
        THROW 50023, 'ScheduledTime is required.', 1;

    IF @ActualTime IS NOT NULL AND @EstimatedTime IS NULL
        SET @EstimatedTime = @ActualTime;

    IF @ArrDep = 'A'
    BEGIN
        SET @Gate = NULL;
        SET @CheckInIsland = NULL;
        SET @CheckInCounterSpec = NULL;
    END
    ELSE
    BEGIN
        SET @Belt = NULL;
    END

    IF @ReplaceExisting = 1
    BEGIN
        DELETE FC
        FROM dbo.FlightCheckInCounter FC
        INNER JOIN dbo.Flight F ON F.FlightId = FC.FlightId
        WHERE F.FlightDate = @FlightDate
          AND F.ArrDep = @ArrDep
          AND F.FlightNo = @FlightNo;

        DELETE FROM dbo.Flight
        WHERE FlightDate = @FlightDate
          AND ArrDep = @ArrDep
          AND FlightNo = @FlightNo;
    END

    INSERT INTO dbo.Flight (
        SourceFlightId,
        FlightNo,
        FlightDate,
        ArrDep,
        Route,
        Airline,
        Status,
        ScheduledTime,
        EstimatedTime,
        ActualTime,
        Gate,
        CheckInIsland,
        CheckInCounterSpec,
        Belt,
        IsSimulatedCheckIn,
        IsSimulatedGate,
        IsSimulatedBelt,
        RawPayload
    )
    VALUES (
        @SourceFlightId,
        @FlightNo,
        @FlightDate,
        @ArrDep,
        dbo.fn_NormalizeFlightRoute(@Route, @ArrDep),
        @Airline,
        @Status,
        @ScheduledTime,
        @EstimatedTime,
        @ActualTime,
        @Gate,
        @CheckInIsland,
        dbo.fn_NormalizeCounterSpec(@CheckInCounterSpec),
        @Belt,
        0,
        0,
        0,
        NULL
    );

    DECLARE @FlightId BIGINT = SCOPE_IDENTITY();

    IF @ArrDep = 'D' AND @CheckInIsland IS NOT NULL AND dbo.fn_NormalizeCounterSpec(@CheckInCounterSpec) IS NOT NULL
    BEGIN
        INSERT INTO dbo.FlightCheckInCounter (FlightId, CheckInIsland, CounterNo)
        SELECT
            @FlightId,
            @CheckInIsland,
            P.CounterNo
        FROM dbo.fn_ParseCounterSpec(dbo.fn_NormalizeCounterSpec(@CheckInCounterSpec)) P;
    END
END
GO

CREATE PROCEDURE dbo.SP_SeedSampleFlightPlan
    @ReplaceExisting BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Flights TABLE (
        FlightNo NVARCHAR(50) NOT NULL,
        FlightDate DATE NOT NULL,
        ArrDep CHAR(1) NOT NULL,
        Route NVARCHAR(100) NULL,
        Airline NVARCHAR(200) NULL,
        Status NVARCHAR(100) NULL,
        ScheduledTime TIME NOT NULL,
        EstimatedTime TIME NULL,
        ActualTime TIME NULL,
        Gate INT NULL,
        CheckInIsland CHAR(1) NULL,
        CheckInCounterSpec NVARCHAR(100) NULL,
        Belt INT NULL
    );

    INSERT INTO @Flights (
        FlightNo, FlightDate, ArrDep, Route, Airline, Status,
        ScheduledTime, EstimatedTime, ActualTime, Gate, CheckInIsland, CheckInCounterSpec, Belt
    )
    VALUES
        (N'VN201', '2026-05-06', 'D', N'LTH-HAN', N'Vietnam Airlines', N'CHECKIN_OPEN', '17:30', NULL, NULL, 22, 'I', N'20-25', NULL),
        (N'VJ315', '2026-05-06', 'D', N'LTH-DAD', N'VietJet Air', N'BOARDING', '17:25', '17:25', NULL, 12, 'A', N'1-8', NULL),
        (N'QH222', '2026-05-06', 'D', N'LTH-HPH', N'Bamboo Airways', N'DELAYED', '16:55', '17:25', NULL, 2, 'C', N'9-14', NULL),
        (N'BL876', '2026-05-06', 'D', N'LTH-LJG', N'Pacific Airlines', N'CLOSED', '16:40', '16:40', NULL, 46, 'I', N'18-21', NULL),
        (N'KE456', '2026-05-06', 'D', N'LTH-ICN', N'Korean Air', N'BOARDING', '15:50', NULL, NULL, 24, 'D', N'3-8', NULL),
        (N'VN717', '2026-05-06', 'D', N'LTH-SGN', N'Vietnam Airlines', N'DEPARTED', '14:40', '14:45', '14:48', 8, 'C', N'21-27', NULL),
        (N'SQ182', '2026-05-06', 'D', N'LTH-SIN', N'Singapore Airlines', N'DEPARTED', '13:35', '13:40', '13:42', 31, 'F', N'1-6', NULL),
        (N'CX799', '2026-05-06', 'D', N'LTH-HKG', N'Cathay Pacific', N'CANCELLED', '18:05', NULL, NULL, 34, 'G', N'15-20', NULL),
        (N'VN101', '2026-05-06', 'A', N'HAN-LTH', N'Vietnam Airlines', N'ARRIVED', '17:20', '17:25', '17:24', NULL, NULL, NULL, 2),
        (N'VJ248', '2026-05-06', 'A', N'DAD-LTH', N'VietJet Air', N'BAGGAGE_LOADING', '16:45', '16:48', '16:49', NULL, NULL, NULL, 4),
        (N'QH105', '2026-05-06', 'A', N'HPH-LTH', N'Bamboo Airways', N'BAGGAGE_DONE', '15:55', '15:58', '15:58', NULL, NULL, NULL, 1),
        (N'KE684', '2026-05-06', 'A', N'ICN-LTH', N'Korean Air', N'DELAYED', '18:10', '18:35', NULL, NULL, NULL, NULL, 10),
        (N'VN202', '2026-05-07', 'D', N'LTH-HAN', N'Vietnam Airlines', N'CHECKIN_OPEN', '18:20', NULL, NULL, 18, 'H', N'10-16', NULL),
        (N'VJ402', '2026-05-07', 'D', N'LTH-PQC', N'VietJet Air', N'BOARDING', '17:45', '17:45', NULL, 7, 'B', N'5-10', NULL),
        (N'QH321', '2026-05-07', 'D', N'LTH-CXR', N'Bamboo Airways', N'DELAYED', '16:20', '16:55', NULL, 5, 'E', N'1-4', NULL),
        (N'BL612', '2026-05-07', 'D', N'LTH-BKK', N'Pacific Airlines', N'CHECKIN_OPEN', '15:35', NULL, NULL, 27, 'G', N'21-28', NULL),
        (N'OZ731', '2026-05-07', 'D', N'LTH-PUS', N'Asiana Airlines', N'CLOSED', '14:55', '14:55', NULL, 29, 'J', N'7-10', NULL),
        (N'VN918', '2026-05-07', 'D', N'LTH-DLI', N'Vietnam Airlines', N'DEPARTED', '12:40', '12:42', '12:46', 16, 'D', N'17-23', NULL),
        (N'QH110', '2026-05-07', 'A', N'DAD-LTH', N'Bamboo Airways', N'ARRIVED', '18:05', '18:07', '18:06', NULL, NULL, NULL, 3),
        (N'VJ509', '2026-05-07', 'A', N'SGN-LTH', N'VietJet Air', N'BAGGAGE_LOADING', '17:30', '17:33', '17:34', NULL, NULL, NULL, 5),
        (N'CX702', '2026-05-07', 'A', N'HKG-LTH', N'Cathay Pacific', N'DELAYED', '15:20', '15:50', NULL, NULL, NULL, NULL, 11),
        (N'KE685', '2026-05-07', 'A', N'ICN-LTH', N'Korean Air', N'BAGGAGE_DONE', '13:25', '13:27', '13:29', NULL, NULL, NULL, 8),
        (N'VN650', '2026-05-07', 'A', N'PQC-LTH', N'Vietnam Airlines', N'CANCELLED', '12:55', '13:20', NULL, NULL, NULL, NULL, 12),
        (N'QH777', '2026-05-07', 'A', N'VCA-LTH', N'Bamboo Airways', N'OTHER', '11:35', '11:42', NULL, NULL, NULL, NULL, 14),
        (N'VN355', '2026-05-08', 'D', N'LTH-HUI', N'Vietnam Airlines', N'CHECKIN_OPEN', '19:10', NULL, NULL, 11, 'A', N'9-14', NULL),
        (N'VJ910', '2026-05-08', 'D', N'LTH-SIN', N'VietJet Air', N'DELAYED', '18:30', '19:05', NULL, 37, 'F', N'7-12', NULL),
        (N'SQ183', '2026-05-08', 'D', N'LTH-SIN', N'Singapore Airlines', N'BOARDING', '17:55', '17:55', NULL, 32, 'I', N'1-8', NULL),
        (N'QH889', '2026-05-08', 'D', N'LTH-CAN', N'Bamboo Airways', N'CHECKIN_OPEN', '16:45', NULL, NULL, 40, 'H', N'18-24', NULL),
        (N'VN450', '2026-05-08', 'D', N'LTH-HKG', N'Vietnam Airlines', N'DEPARTED', '14:15', '14:18', '14:21', 20, 'B', N'12-18', NULL),
        (N'BL620', '2026-05-08', 'D', N'LTH-DLI', N'Pacific Airlines', N'CANCELLED', '15:05', NULL, NULL, 6, 'C', N'1-6', NULL),
        (N'VN102', '2026-05-08', 'A', N'HAN-LTH', N'Vietnam Airlines', N'ARRIVED', '18:15', '18:17', '18:19', NULL, NULL, NULL, 6),
        (N'VJ249', '2026-05-08', 'A', N'DAD-LTH', N'VietJet Air', N'BAGGAGE_LOADING', '17:50', '17:54', '17:55', NULL, NULL, NULL, 7),
        (N'SQ186', '2026-05-08', 'A', N'SIN-LTH', N'Singapore Airlines', N'DELAYED', '16:10', '16:45', NULL, NULL, NULL, NULL, 13),
        (N'QH118', '2026-05-08', 'A', N'CXR-LTH', N'Bamboo Airways', N'BAGGAGE_DONE', '14:20', '14:22', '14:24', NULL, NULL, NULL, 9);

    IF @ReplaceExisting = 1
    BEGIN
        DELETE FC
        FROM dbo.FlightCheckInCounter FC
        INNER JOIN dbo.Flight F ON F.FlightId = FC.FlightId
        WHERE F.FlightDate IN (SELECT DISTINCT FlightDate FROM @Flights);

        DELETE FROM dbo.Flight
        WHERE FlightDate IN (SELECT DISTINCT FlightDate FROM @Flights);
    END

    DECLARE
        @FlightNo NVARCHAR(50),
        @FlightDate DATE,
        @ArrDep CHAR(1),
        @Route NVARCHAR(100),
        @Airline NVARCHAR(200),
        @Status NVARCHAR(100),
        @ScheduledTime TIME,
        @EstimatedTime TIME,
        @ActualTime TIME,
        @Gate INT,
        @CheckInIsland CHAR(1),
        @CheckInCounterSpec NVARCHAR(100),
        @Belt INT;

    DECLARE flight_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT
            FlightNo, FlightDate, ArrDep, Route, Airline, Status,
            ScheduledTime, EstimatedTime, ActualTime, Gate, CheckInIsland, CheckInCounterSpec, Belt
        FROM @Flights;

    OPEN flight_cursor;
    FETCH NEXT FROM flight_cursor INTO
        @FlightNo, @FlightDate, @ArrDep, @Route, @Airline, @Status,
        @ScheduledTime, @EstimatedTime, @ActualTime, @Gate, @CheckInIsland, @CheckInCounterSpec, @Belt;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC dbo.SP_InsertManualFlight
            @FlightNo = @FlightNo,
            @FlightDate = @FlightDate,
            @ArrDep = @ArrDep,
            @Route = @Route,
            @Airline = @Airline,
            @Status = @Status,
            @ScheduledTime = @ScheduledTime,
            @EstimatedTime = @EstimatedTime,
            @ActualTime = @ActualTime,
            @Gate = @Gate,
            @CheckInIsland = @CheckInIsland,
            @CheckInCounterSpec = @CheckInCounterSpec,
            @Belt = @Belt,
            @ReplaceExisting = 0;

        FETCH NEXT FROM flight_cursor INTO
            @FlightNo, @FlightDate, @ArrDep, @Route, @Airline, @Status,
            @ScheduledTime, @EstimatedTime, @ActualTime, @Gate, @CheckInIsland, @CheckInCounterSpec, @Belt;
    END

    CLOSE flight_cursor;
    DEALLOCATE flight_cursor;
END
GO

/* -------------------------------------------------------------
   Validate normalized data
------------------------------------------------------------- */
CREATE PROCEDURE dbo.SP_ValidateFlightData
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM dbo.MigrationErrorLog
    WHERE ErrorStage = N'VALIDATION';

    INSERT INTO dbo.MigrationErrorLog (SourceFlightId, ErrorStage, ErrorMessage, RawData)
    SELECT
        F.SourceFlightId,
        N'VALIDATION',
        N'Gate is outside 1..49.',
        CONCAT(N'Gate=', COALESCE(CONVERT(NVARCHAR(20), F.Gate), N'NULL'))
    FROM dbo.Flight F
    WHERE F.Gate IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.MasterGate G WHERE G.Gate = F.Gate);

    INSERT INTO dbo.MigrationErrorLog (SourceFlightId, ErrorStage, ErrorMessage, RawData)
    SELECT
        F.SourceFlightId,
        N'VALIDATION',
        N'Belt is outside 1..16.',
        CONCAT(N'Belt=', COALESCE(CONVERT(NVARCHAR(20), F.Belt), N'NULL'))
    FROM dbo.Flight F
    WHERE F.Belt IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.MasterBelt B WHERE B.Belt = F.Belt);

    INSERT INTO dbo.MigrationErrorLog (SourceFlightId, ErrorStage, ErrorMessage, RawData)
    SELECT
        F.SourceFlightId,
        N'VALIDATION',
        N'CheckInCounterSpec exists without CheckInIsland.',
        F.CheckInCounterSpec
    FROM dbo.Flight F
    WHERE F.CheckInCounterSpec IS NOT NULL
      AND F.CheckInIsland IS NULL;

    INSERT INTO dbo.MigrationErrorLog (SourceFlightId, ErrorStage, ErrorMessage, RawData)
    SELECT
        F.SourceFlightId,
        N'VALIDATION',
        N'Expanded check-in counter is outside allowed island range.',
        CONCAT(F.CheckInIsland, N'-', P.CounterNo, N' from ', F.CheckInCounterSpec)
    FROM dbo.Flight F
    CROSS APPLY dbo.fn_ParseCounterSpec(F.CheckInCounterSpec) P
    LEFT JOIN dbo.MasterCheckInCounter M
        ON M.CheckInIsland = F.CheckInIsland
       AND M.CounterNo = P.CounterNo
    WHERE F.CheckInIsland IS NOT NULL
      AND F.CheckInCounterSpec IS NOT NULL
      AND M.CounterNo IS NULL;
END
GO

/* -------------------------------------------------------------
   Runtime procedures for backend APIs
------------------------------------------------------------- */
CREATE PROCEDURE dbo.SP_GetFlights
    @FlightDate DATE = NULL,
    @ArrDep CHAR(1) = NULL,
    @Search NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        F.FlightId,
        F.SourceFlightId,
        F.FlightNo,
        F.FlightDate,
        F.ArrDep,
        F.Route,
        F.Airline,
        F.Status,
        F.ScheduledTime,
        F.EstimatedTime,
        F.ActualTime,
        F.Gate,
        F.CheckInIsland,
        F.CheckInCounterSpec,
        F.Belt,
        F.IsSimulatedCheckIn,
        F.IsSimulatedGate,
        F.IsSimulatedBelt,
        F.CreatedAt,
        F.UpdatedAt
    FROM dbo.Flight F
    WHERE (@FlightDate IS NULL OR F.FlightDate = @FlightDate)
      AND (@ArrDep IS NULL OR F.ArrDep = @ArrDep)
      AND (
            @Search IS NULL
         OR F.FlightNo LIKE N'%' + @Search + N'%'
         OR F.Route LIKE N'%' + @Search + N'%'
      )
    ORDER BY
        F.FlightDate DESC,
        COALESCE(F.ScheduledTime, F.EstimatedTime, F.ActualTime) DESC,
        F.FlightNo ASC;
END
GO

CREATE PROCEDURE dbo.SP_GetFlightNavigationTargets
    @FlightId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        F.FlightId,
        F.ArrDep,
        F.Gate,
        F.CheckInIsland,
        F.CheckInCounterSpec,
        F.Belt
    FROM dbo.Flight F
    WHERE F.FlightId = @FlightId;

    SELECT
        FC.FlightId,
        FC.CheckInIsland,
        FC.CounterNo
    FROM dbo.FlightCheckInCounter FC
    WHERE FC.FlightId = @FlightId
    ORDER BY FC.CounterNo;
END
GO

/* -------------------------------------------------------------
   Initial seed so the database is usable immediately
------------------------------------------------------------- */
EXEC dbo.SP_SeedLongThanhMasters;
GO
