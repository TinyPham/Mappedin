/*
    Kiosk device configuration patch
    Database: MappedIn3DModels

    Purpose:
    - Store physical kiosk configuration separately from Models3D.
    - Let website mode keep flexible user-selected origins.
    - Let kiosk mode load a default origin by kioskId.

    Safe to run multiple times.
*/

USE [MappedIn3DModels];
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

/* ============================================================
   1. Create table dbo.KioskDevices
   ============================================================ */

IF OBJECT_ID(N'dbo.KioskDevices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.KioskDevices (
        KioskId NVARCHAR(100) NOT NULL,
        DisplayName NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        OriginType NVARCHAR(30) NOT NULL,
        OriginMappedinID NVARCHAR(100) NULL,
        FloorId NVARCHAR(100) NULL,
        Latitude DECIMAL(18, 10) NULL,
        Longitude DECIMAL(18, 10) NULL,
        Heading DECIMAL(10, 4) NULL,
        DefaultZoom DECIMAL(10, 4) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_KioskDevices_IsActive DEFAULT (1),
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_KioskDevices_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_KioskDevices_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedBy NVARCHAR(100) NULL,
        CONSTRAINT PK_KioskDevices PRIMARY KEY CLUSTERED (KioskId)
    );
END;
GO

/* ============================================================
   2. Add missing columns if this patch is run on a partial table
   ============================================================ */

IF COL_LENGTH('dbo.KioskDevices', 'DisplayName') IS NULL
    ALTER TABLE dbo.KioskDevices ADD DisplayName NVARCHAR(200) NOT NULL CONSTRAINT DF_KioskDevices_DisplayName DEFAULT (N'Unnamed kiosk');
GO

IF COL_LENGTH('dbo.KioskDevices', 'Description') IS NULL
    ALTER TABLE dbo.KioskDevices ADD Description NVARCHAR(500) NULL;
GO

IF COL_LENGTH('dbo.KioskDevices', 'OriginType') IS NULL
    ALTER TABLE dbo.KioskDevices ADD OriginType NVARCHAR(30) NOT NULL CONSTRAINT DF_KioskDevices_OriginType DEFAULT (N'coordinate');
GO

IF COL_LENGTH('dbo.KioskDevices', 'OriginMappedinID') IS NULL
    ALTER TABLE dbo.KioskDevices ADD OriginMappedinID NVARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.KioskDevices', 'FloorId') IS NULL
    ALTER TABLE dbo.KioskDevices ADD FloorId NVARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.KioskDevices', 'Latitude') IS NULL
    ALTER TABLE dbo.KioskDevices ADD Latitude DECIMAL(18, 10) NULL;
GO

IF COL_LENGTH('dbo.KioskDevices', 'Longitude') IS NULL
    ALTER TABLE dbo.KioskDevices ADD Longitude DECIMAL(18, 10) NULL;
GO

IF COL_LENGTH('dbo.KioskDevices', 'Heading') IS NULL
    ALTER TABLE dbo.KioskDevices ADD Heading DECIMAL(10, 4) NULL;
GO

IF COL_LENGTH('dbo.KioskDevices', 'DefaultZoom') IS NULL
    ALTER TABLE dbo.KioskDevices ADD DefaultZoom DECIMAL(10, 4) NULL;
GO

IF COL_LENGTH('dbo.KioskDevices', 'IsActive') IS NULL
    ALTER TABLE dbo.KioskDevices ADD IsActive BIT NOT NULL CONSTRAINT DF_KioskDevices_IsActive DEFAULT (1);
GO

IF COL_LENGTH('dbo.KioskDevices', 'CreatedAt') IS NULL
    ALTER TABLE dbo.KioskDevices ADD CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_KioskDevices_CreatedAt DEFAULT (SYSUTCDATETIME());
GO

IF COL_LENGTH('dbo.KioskDevices', 'UpdatedAt') IS NULL
    ALTER TABLE dbo.KioskDevices ADD UpdatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_KioskDevices_UpdatedAt DEFAULT (SYSUTCDATETIME());
GO

IF COL_LENGTH('dbo.KioskDevices', 'UpdatedBy') IS NULL
    ALTER TABLE dbo.KioskDevices ADD UpdatedBy NVARCHAR(100) NULL;
GO

/* ============================================================
   3. Add constraints and indexes
   ============================================================ */

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_KioskDevices_KioskId_NotBlank'
      AND parent_object_id = OBJECT_ID(N'dbo.KioskDevices')
)
BEGIN
    ALTER TABLE dbo.KioskDevices
    ADD CONSTRAINT CK_KioskDevices_KioskId_NotBlank
    CHECK (LEN(LTRIM(RTRIM(KioskId))) > 0);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_KioskDevices_DisplayName_NotBlank'
      AND parent_object_id = OBJECT_ID(N'dbo.KioskDevices')
)
BEGIN
    ALTER TABLE dbo.KioskDevices
    ADD CONSTRAINT CK_KioskDevices_DisplayName_NotBlank
    CHECK (LEN(LTRIM(RTRIM(DisplayName))) > 0);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_KioskDevices_OriginType'
      AND parent_object_id = OBJECT_ID(N'dbo.KioskDevices')
)
BEGIN
    ALTER TABLE dbo.KioskDevices
    ADD CONSTRAINT CK_KioskDevices_OriginType
    CHECK (OriginType IN (N'mappedinObject', N'coordinate'));
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_KioskDevices_CoordinateRange'
      AND parent_object_id = OBJECT_ID(N'dbo.KioskDevices')
)
BEGIN
    ALTER TABLE dbo.KioskDevices
    ADD CONSTRAINT CK_KioskDevices_CoordinateRange
    CHECK (
        (Latitude IS NULL OR (Latitude >= -90 AND Latitude <= 90))
        AND
        (Longitude IS NULL OR (Longitude >= -180 AND Longitude <= 180))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_KioskDevices_HeadingRange'
      AND parent_object_id = OBJECT_ID(N'dbo.KioskDevices')
)
BEGIN
    ALTER TABLE dbo.KioskDevices
    ADD CONSTRAINT CK_KioskDevices_HeadingRange
    CHECK (Heading IS NULL OR (Heading >= 0 AND Heading < 360));
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_KioskDevices_DefaultZoomRange'
      AND parent_object_id = OBJECT_ID(N'dbo.KioskDevices')
)
BEGIN
    ALTER TABLE dbo.KioskDevices
    ADD CONSTRAINT CK_KioskDevices_DefaultZoomRange
    CHECK (DefaultZoom IS NULL OR (DefaultZoom >= 1 AND DefaultZoom <= 30));
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_KioskDevices_OriginFields'
      AND parent_object_id = OBJECT_ID(N'dbo.KioskDevices')
)
BEGIN
    ALTER TABLE dbo.KioskDevices
    ADD CONSTRAINT CK_KioskDevices_OriginFields
    CHECK (
        (
            OriginType = N'mappedinObject'
            AND OriginMappedinID IS NOT NULL
            AND LEN(LTRIM(RTRIM(OriginMappedinID))) > 0
        )
        OR
        (
            OriginType = N'coordinate'
            AND Latitude IS NOT NULL
            AND Longitude IS NOT NULL
            AND FloorId IS NOT NULL
            AND LEN(LTRIM(RTRIM(FloorId))) > 0
        )
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_KioskDevices_IsActive'
      AND object_id = OBJECT_ID(N'dbo.KioskDevices')
)
BEGIN
    CREATE INDEX IX_KioskDevices_IsActive
    ON dbo.KioskDevices(IsActive);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_KioskDevices_OriginMappedinID'
      AND object_id = OBJECT_ID(N'dbo.KioskDevices')
)
BEGIN
    CREATE INDEX IX_KioskDevices_OriginMappedinID
    ON dbo.KioskDevices(OriginMappedinID)
    WHERE OriginMappedinID IS NOT NULL;
END;
GO

/* ============================================================
   4. Trigger: keep UpdatedAt fresh on direct table updates
   ============================================================ */

CREATE OR ALTER TRIGGER dbo.TR_KioskDevices_SetUpdatedAt
ON dbo.KioskDevices
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(UpdatedAt)
        RETURN;

    UPDATE target
    SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.KioskDevices AS target
    INNER JOIN inserted AS source
        ON source.KioskId = target.KioskId;
END;
GO

/* ============================================================
   5. Public procedure: get one active kiosk config
   ============================================================ */

CREATE OR ALTER PROCEDURE dbo.SP_GetKioskConfig
    @KioskId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NormalizedKioskId NVARCHAR(100) = UPPER(LTRIM(RTRIM(@KioskId)));

    SELECT
        KioskId,
        DisplayName,
        Description,
        OriginType,
        OriginMappedinID,
        FloorId,
        Latitude,
        Longitude,
        Heading,
        DefaultZoom,
        IsActive,
        CreatedAt,
        UpdatedAt,
        UpdatedBy
    FROM dbo.KioskDevices
    WHERE KioskId = @NormalizedKioskId
      AND IsActive = 1;
END;
GO

/* ============================================================
   6. Admin procedure: get one kiosk config, active or inactive
   ============================================================ */

CREATE OR ALTER PROCEDURE dbo.SP_GetKioskDeviceById
    @KioskId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NormalizedKioskId NVARCHAR(100) = UPPER(LTRIM(RTRIM(@KioskId)));

    SELECT
        KioskId,
        DisplayName,
        Description,
        OriginType,
        OriginMappedinID,
        FloorId,
        Latitude,
        Longitude,
        Heading,
        DefaultZoom,
        IsActive,
        CreatedAt,
        UpdatedAt,
        UpdatedBy
    FROM dbo.KioskDevices
    WHERE KioskId = @NormalizedKioskId;
END;
GO

/* ============================================================
   7. Admin procedure: list all kiosk configs
   ============================================================ */

CREATE OR ALTER PROCEDURE dbo.SP_GetAllKioskDevices
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        KioskId,
        DisplayName,
        Description,
        OriginType,
        OriginMappedinID,
        FloorId,
        Latitude,
        Longitude,
        Heading,
        DefaultZoom,
        IsActive,
        CreatedAt,
        UpdatedAt,
        UpdatedBy
    FROM dbo.KioskDevices
    ORDER BY KioskId;
END;
GO

/* ============================================================
   8. Admin procedure: create/update kiosk config
   ============================================================ */

CREATE OR ALTER PROCEDURE dbo.SP_UpsertKioskDevice
    @KioskId NVARCHAR(100),
    @DisplayName NVARCHAR(200),
    @Description NVARCHAR(500) = NULL,
    @OriginType NVARCHAR(30),
    @OriginMappedinID NVARCHAR(100) = NULL,
    @FloorId NVARCHAR(100) = NULL,
    @Latitude DECIMAL(18, 10) = NULL,
    @Longitude DECIMAL(18, 10) = NULL,
    @Heading DECIMAL(10, 4) = NULL,
    @DefaultZoom DECIMAL(10, 4) = NULL,
    @IsActive BIT = 1,
    @UpdatedBy NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @NormalizedKioskId NVARCHAR(100) = UPPER(LTRIM(RTRIM(@KioskId)));
    DECLARE @NormalizedOriginType NVARCHAR(30) = LTRIM(RTRIM(@OriginType));
    DECLARE @CleanDisplayName NVARCHAR(200) = NULLIF(LTRIM(RTRIM(@DisplayName)), N'');
    DECLARE @CleanOriginMappedinID NVARCHAR(100) = NULLIF(LTRIM(RTRIM(@OriginMappedinID)), N'');
    DECLARE @CleanFloorId NVARCHAR(100) = NULLIF(LTRIM(RTRIM(@FloorId)), N'');

    IF @NormalizedKioskId IS NULL OR LEN(@NormalizedKioskId) = 0
        THROW 51001, 'KioskId is required.', 1;

    IF @NormalizedKioskId LIKE N'%[^A-Z0-9_-]%'
        THROW 51002, 'KioskId can only contain letters, numbers, underscore, and dash.', 1;

    IF @CleanDisplayName IS NULL
        THROW 51003, 'DisplayName is required.', 1;

    IF @NormalizedOriginType NOT IN (N'mappedinObject', N'coordinate')
        THROW 51004, 'OriginType must be mappedinObject or coordinate.', 1;

    IF @Latitude IS NOT NULL AND (@Latitude < -90 OR @Latitude > 90)
        THROW 51005, 'Latitude must be between -90 and 90.', 1;

    IF @Longitude IS NOT NULL AND (@Longitude < -180 OR @Longitude > 180)
        THROW 51006, 'Longitude must be between -180 and 180.', 1;

    IF @Heading IS NOT NULL AND (@Heading < 0 OR @Heading >= 360)
        THROW 51007, 'Heading must be greater than or equal to 0 and less than 360.', 1;

    IF @DefaultZoom IS NOT NULL AND (@DefaultZoom < 1 OR @DefaultZoom > 30)
        THROW 51008, 'DefaultZoom must be between 1 and 30.', 1;

    IF @NormalizedOriginType = N'mappedinObject' AND @CleanOriginMappedinID IS NULL
        THROW 51009, 'OriginMappedinID is required when OriginType is mappedinObject.', 1;

    IF @NormalizedOriginType = N'coordinate'
       AND (@CleanFloorId IS NULL OR @Latitude IS NULL OR @Longitude IS NULL)
        THROW 51010, 'FloorId, Latitude, and Longitude are required when OriginType is coordinate.', 1;

    MERGE dbo.KioskDevices AS target
    USING (
        SELECT
            @NormalizedKioskId AS KioskId,
            @CleanDisplayName AS DisplayName,
            @Description AS Description,
            @NormalizedOriginType AS OriginType,
            CASE WHEN @NormalizedOriginType = N'mappedinObject' THEN @CleanOriginMappedinID ELSE NULL END AS OriginMappedinID,
            CASE WHEN @NormalizedOriginType = N'coordinate' THEN @CleanFloorId ELSE NULL END AS FloorId,
            CASE WHEN @NormalizedOriginType = N'coordinate' THEN @Latitude ELSE NULL END AS Latitude,
            CASE WHEN @NormalizedOriginType = N'coordinate' THEN @Longitude ELSE NULL END AS Longitude,
            @Heading AS Heading,
            @DefaultZoom AS DefaultZoom,
            ISNULL(@IsActive, 1) AS IsActive,
            @UpdatedBy AS UpdatedBy
    ) AS source
    ON target.KioskId = source.KioskId
    WHEN MATCHED THEN
        UPDATE SET
            DisplayName = source.DisplayName,
            Description = source.Description,
            OriginType = source.OriginType,
            OriginMappedinID = source.OriginMappedinID,
            FloorId = source.FloorId,
            Latitude = source.Latitude,
            Longitude = source.Longitude,
            Heading = source.Heading,
            DefaultZoom = source.DefaultZoom,
            IsActive = source.IsActive,
            UpdatedAt = SYSUTCDATETIME(),
            UpdatedBy = source.UpdatedBy
    WHEN NOT MATCHED THEN
        INSERT (
            KioskId,
            DisplayName,
            Description,
            OriginType,
            OriginMappedinID,
            FloorId,
            Latitude,
            Longitude,
            Heading,
            DefaultZoom,
            IsActive,
            UpdatedBy
        )
        VALUES (
            source.KioskId,
            source.DisplayName,
            source.Description,
            source.OriginType,
            source.OriginMappedinID,
            source.FloorId,
            source.Latitude,
            source.Longitude,
            source.Heading,
            source.DefaultZoom,
            source.IsActive,
            source.UpdatedBy
        );

    EXEC dbo.SP_GetKioskDeviceById @KioskId = @NormalizedKioskId;
END;
GO

/* ============================================================
   9. Admin procedure: set active/inactive
   ============================================================ */

CREATE OR ALTER PROCEDURE dbo.SP_SetKioskDeviceActive
    @KioskId NVARCHAR(100),
    @IsActive BIT,
    @UpdatedBy NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NormalizedKioskId NVARCHAR(100) = UPPER(LTRIM(RTRIM(@KioskId)));

    UPDATE dbo.KioskDevices
    SET
        IsActive = @IsActive,
        UpdatedAt = SYSUTCDATETIME(),
        UpdatedBy = @UpdatedBy
    WHERE KioskId = @NormalizedKioskId;

    SELECT @@ROWCOUNT AS UpdatedRows;
END;
GO

/* ============================================================
   10. Optional demo seed data

   Default is 0 so production databases are not polluted.
   Change @SeedDemoKiosks to 1 if you want 5 sample kiosks.
   ============================================================ */

DECLARE @SeedDemoKiosks BIT = 0;

IF @SeedDemoKiosks = 1
BEGIN
    EXEC dbo.SP_UpsertKioskDevice
        @KioskId = N'LT-KIOSK-01',
        @DisplayName = N'Kiosk Main Entrance 01',
        @Description = N'Demo kiosk near main entrance.',
        @OriginType = N'coordinate',
        @FloorId = N'm_1523f7dcde647c40',
        @Latitude = 10.7731180000,
        @Longitude = 107.0403540000,
        @Heading = 90,
        @DefaultZoom = 19,
        @IsActive = 1,
        @UpdatedBy = N'seed';

    EXEC dbo.SP_UpsertKioskDevice
        @KioskId = N'LT-KIOSK-02',
        @DisplayName = N'Kiosk Check-in A',
        @Description = N'Demo kiosk near check-in area A.',
        @OriginType = N'coordinate',
        @FloorId = N'm_1523f7dcde647c40',
        @Latitude = 10.7725310000,
        @Longitude = 107.0396740000,
        @Heading = 45,
        @DefaultZoom = 19,
        @IsActive = 1,
        @UpdatedBy = N'seed';

    EXEC dbo.SP_UpsertKioskDevice
        @KioskId = N'LT-KIOSK-03',
        @DisplayName = N'Kiosk Check-in B',
        @Description = N'Demo kiosk near check-in area B.',
        @OriginType = N'coordinate',
        @FloorId = N'm_1523f7dcde647c40',
        @Latitude = 10.7729550000,
        @Longitude = 107.0401570000,
        @Heading = 40,
        @DefaultZoom = 19,
        @IsActive = 1,
        @UpdatedBy = N'seed';

    EXEC dbo.SP_UpsertKioskDevice
        @KioskId = N'LT-KIOSK-04',
        @DisplayName = N'Kiosk Arrival Hall',
        @Description = N'Demo kiosk near arrival hall.',
        @OriginType = N'coordinate',
        @FloorId = N'm_1523f7dcde647c40',
        @Latitude = 10.7734890000,
        @Longitude = 107.0408830000,
        @Heading = 180,
        @DefaultZoom = 19,
        @IsActive = 1,
        @UpdatedBy = N'seed';

    EXEC dbo.SP_UpsertKioskDevice
        @KioskId = N'LT-KIOSK-05',
        @DisplayName = N'Kiosk Baggage Claim',
        @Description = N'Demo kiosk near baggage claim.',
        @OriginType = N'coordinate',
        @FloorId = N'm_1523f7dcde647c40',
        @Latitude = 10.7740870000,
        @Longitude = 107.0421790000,
        @Heading = 205,
        @DefaultZoom = 19,
        @IsActive = 1,
        @UpdatedBy = N'seed';
END;
GO

/* ============================================================
   11. Verification
   ============================================================ */

SELECT
    TABLE_NAME = N'KioskDevices',
    ExistsFlag = CASE WHEN OBJECT_ID(N'dbo.KioskDevices', N'U') IS NULL THEN 0 ELSE 1 END;

SELECT
    name AS ProcedureName
FROM sys.procedures
WHERE name IN (
    N'SP_GetKioskConfig',
    N'SP_GetKioskDeviceById',
    N'SP_GetAllKioskDevices',
    N'SP_UpsertKioskDevice',
    N'SP_SetKioskDeviceActive'
)
ORDER BY name;

SELECT
    KioskId,
    DisplayName,
    OriginType,
    OriginMappedinID,
    FloorId,
    Latitude,
    Longitude,
    Heading,
    DefaultZoom,
    IsActive,
    UpdatedAt,
    UpdatedBy
FROM dbo.KioskDevices
ORDER BY KioskId;
GO
