/*
    Mappedin flight navigation mapping
    ---------------------------------
    Purpose:
    - Keep all Mappedin-specific navigation identifiers inside the Mappedin database.
    - Do not add Mappedin fields into LongThanhFlightBK / aviation data.

    Tables:
    - dbo.FlightGateNavigationMap
    - dbo.FlightBeltNavigationMap
    - dbo.FlightCheckInCounterNavigationMap

    Notes:
    - Gate and belt seed blocks below can auto-populate from AreaList when naming matches.
    - Check-in counter mapping usually needs object-level IDs such as "Quầy thủ tục 15 - Đảo H".
      If those records already exist in AreaList, use the manual MERGE section at the bottom.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.FlightGateNavigationMap', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FlightGateNavigationMap (
        GateNo INT NOT NULL PRIMARY KEY,
        MappedinID NVARCHAR(100) NOT NULL,
        AreaListID INT NULL,
        DisplayName NVARCHAR(200) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_FlightGateNavigationMap_IsActive DEFAULT 1,
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_FlightGateNavigationMap_UpdatedAt DEFAULT SYSDATETIME()
    );
END
GO

IF OBJECT_ID(N'dbo.FlightBeltNavigationMap', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FlightBeltNavigationMap (
        BeltNo INT NOT NULL PRIMARY KEY,
        MappedinID NVARCHAR(100) NOT NULL,
        AreaListID INT NULL,
        DisplayName NVARCHAR(200) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_FlightBeltNavigationMap_IsActive DEFAULT 1,
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_FlightBeltNavigationMap_UpdatedAt DEFAULT SYSDATETIME()
    );
END
GO

IF OBJECT_ID(N'dbo.FlightCheckInCounterNavigationMap', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FlightCheckInCounterNavigationMap (
        CheckInIsland CHAR(1) NOT NULL,
        CounterNo INT NOT NULL,
        MappedinID NVARCHAR(100) NOT NULL,
        AreaListID INT NULL,
        DisplayName NVARCHAR(200) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_FlightCheckInCounterNavigationMap_IsActive DEFAULT 1,
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_FlightCheckInCounterNavigationMap_UpdatedAt DEFAULT SYSDATETIME(),
        CONSTRAINT PK_FlightCheckInCounterNavigationMap PRIMARY KEY (CheckInIsland, CounterNo)
    );
END
GO

/* -------------------------------------------------------------
   Seed gate mapping from AreaList where gate number is numeric
------------------------------------------------------------- */
;WITH GateCandidates AS (
    SELECT
        AL.AreaListID,
        AL.MappedinID,
        COALESCE(NULLIF(AL.VN, N''), NULLIF(AL.Name, N''), NULLIF(AL.EN, N'')) AS DisplayName,
        TRY_CONVERT(
            INT,
            NULLIF(
                REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(AL.EN, AL.VN, AL.Name), N'Gate', N''), N'Cửa ra tàu bay', N''), N'-', N''), N' ', N''), NCHAR(9), N''),
                N''
            )
        ) AS GateNo
    FROM dbo.AreaList AL
    WHERE COALESCE(AL.EN, AL.VN, AL.Name) LIKE N'%Gate%'
       OR COALESCE(AL.VN, AL.Name, AL.EN) LIKE N'%Cửa ra tàu bay%'
)
MERGE dbo.FlightGateNavigationMap AS target
USING (
    SELECT GateNo, MappedinID, AreaListID, DisplayName
    FROM GateCandidates
    WHERE GateNo IS NOT NULL
) AS source
ON target.GateNo = source.GateNo
WHEN MATCHED THEN
    UPDATE SET
        target.MappedinID = source.MappedinID,
        target.AreaListID = source.AreaListID,
        target.DisplayName = source.DisplayName,
        target.IsActive = 1,
        target.UpdatedAt = SYSDATETIME()
WHEN NOT MATCHED THEN
    INSERT (GateNo, MappedinID, AreaListID, DisplayName)
    VALUES (source.GateNo, source.MappedinID, source.AreaListID, source.DisplayName);
GO

/* -------------------------------------------------------------
   Seed belt mapping from baggage claim islands 01..16
   Belt navigation will route to the baggage-claim island object.
------------------------------------------------------------- */
;WITH BeltCandidates AS (
    SELECT
        AL.AreaListID,
        AL.MappedinID,
        COALESCE(NULLIF(AL.VN, N''), NULLIF(AL.Name, N''), NULLIF(AL.EN, N'')) AS DisplayName,
        TRY_CONVERT(
            INT,
            RIGHT(REPLACE(REPLACE(REPLACE(COALESCE(AL.EN, AL.VN, AL.Name), N'Baggage Claim Island', N''), N'Đảo nhận hành lý', N''), N' ', N''), 2)
        ) AS BeltNo
    FROM dbo.AreaList AL
    WHERE COALESCE(AL.EN, N'') LIKE N'Baggage Claim Island%'
       OR COALESCE(AL.VN, AL.Name, N'') LIKE N'Đảo nhận hành lý%'
)
MERGE dbo.FlightBeltNavigationMap AS target
USING (
    SELECT BeltNo, MappedinID, AreaListID, DisplayName
    FROM BeltCandidates
    WHERE BeltNo IS NOT NULL
) AS source
ON target.BeltNo = source.BeltNo
WHEN MATCHED THEN
    UPDATE SET
        target.MappedinID = source.MappedinID,
        target.AreaListID = source.AreaListID,
        target.DisplayName = source.DisplayName,
        target.IsActive = 1,
        target.UpdatedAt = SYSDATETIME()
WHEN NOT MATCHED THEN
    INSERT (BeltNo, MappedinID, AreaListID, DisplayName)
    VALUES (source.BeltNo, source.MappedinID, source.AreaListID, source.DisplayName);
GO

/* -------------------------------------------------------------
   Manual upsert template for check-in counters
   Replace values below with real Mappedin object IDs from your map.
------------------------------------------------------------- */
MERGE dbo.FlightCheckInCounterNavigationMap AS target
USING (
    VALUES
        -- Example:
        -- ('H', 18, N'actual_mappedin_id_here', NULL, N'Quầy thủ tục 18 - Đảo H')
        -- ('H', 19, N'actual_mappedin_id_here', NULL, N'Quầy thủ tục 19 - Đảo H')
        ('~', -1, N'placeholder', NULL, N'placeholder')
) AS source (CheckInIsland, CounterNo, MappedinID, AreaListID, DisplayName)
ON target.CheckInIsland = source.CheckInIsland
AND target.CounterNo = source.CounterNo
WHEN MATCHED AND source.CounterNo > 0 THEN
    UPDATE SET
        target.MappedinID = source.MappedinID,
        target.AreaListID = source.AreaListID,
        target.DisplayName = source.DisplayName,
        target.IsActive = 1,
        target.UpdatedAt = SYSDATETIME()
WHEN NOT MATCHED AND source.CounterNo > 0 THEN
    INSERT (CheckInIsland, CounterNo, MappedinID, AreaListID, DisplayName)
    VALUES (source.CheckInIsland, source.CounterNo, source.MappedinID, source.AreaListID, source.DisplayName);
GO

DELETE FROM dbo.FlightCheckInCounterNavigationMap
WHERE CheckInIsland = '~' AND CounterNo = -1;
GO
