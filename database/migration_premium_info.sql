-- =============================================
-- Migration: Add Premium Metadata to AreaInformation (FINAL OPTIMIZED)
-- To support Changi/Incheon style airport info with minimum new columns
-- =============================================
USE [MappedIn3DModels];
GO

-- 1. Add new columns to AreaInformation (Only 7 new columns)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaInformation]') AND name = 'Phone')
BEGIN
    ALTER TABLE [dbo].[AreaInformation] ADD [Phone] NVARCHAR(50) NULL;
END

-- Opening Hours (Single column for all languages)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaInformation]') AND name = 'OpeningHours')
BEGIN
    ALTER TABLE [dbo].[AreaInformation] ADD [OpeningHours] NVARCHAR(100) NULL;
END

-- Location Detail (Multi-lang for rich text descriptions)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaInformation]') AND name = 'LocationDetail_VN')
BEGIN
    ALTER TABLE [dbo].[AreaInformation] ADD [LocationDetail_VN] NVARCHAR(MAX) NULL;
    ALTER TABLE [dbo].[AreaInformation] ADD [LocationDetail_EN] NVARCHAR(MAX) NULL;
    ALTER TABLE [dbo].[AreaInformation] ADD [LocationDetail_ZH] NVARCHAR(MAX) NULL;
    ALTER TABLE [dbo].[AreaInformation] ADD [LocationDetail_JA] NVARCHAR(MAX) NULL;
    ALTER TABLE [dbo].[AreaInformation] ADD [LocationDetail_KO] NVARCHAR(MAX) NULL;
END
-- NOTE: Features/Amenities will use the existing InformationVI, InformationEN, etc. columns
GO

-- 2. Update SP_GetInitialData to return these fields
IF OBJECT_ID('SP_GetInitialData', 'P') IS NOT NULL DROP PROCEDURE SP_GetInitialData;
GO
CREATE PROCEDURE SP_GetInitialData
AS
BEGIN
    SET NOCOUNT ON;

    -- Results 1: Languages
    SELECT * FROM MasterData_Languages WHERE IsActive = 1 ORDER BY SortOrder;

    -- Results 2: UI Translations
    SELECT UIKeyId, KeyCode, KeyType, VN, EN, ZH, JA, KO FROM Translation_UI;

    -- Results 3: Categories
    SELECT CategoryID, IconPath, CategoryName as VN, EN, ZH, JA, KO 
    FROM Categories 
    ORDER BY DisplayOrder, CategoryName;

    -- Results 4: SubCategories
    SELECT SubCategoryID, CategoryID, IconPath, SubCategoryName as VN, EN, ZH, JA, KO 
    FROM SubCategories 
    ORDER BY DisplayOrder, SubCategoryName;

    -- Results 5: Floors
    SELECT FloorId, MappedinId, FloorCode, SortOrder, VN, EN, ZH, JA, KO 
    FROM Translation_Floors 
    ORDER BY SortOrder;

    -- Results 6: Locations
    SELECT 
        AL.AreaListID, 
        AL.MappedinID, 
        AL.VN, AL.EN, AL.ZH, AL.JA, AL.KO,
        AI.RunUrl, AI.UIImageUrl, AI.MappedinImageUrl,
        AI.InformationVI, AI.InformationEN, AI.InformationZH, AI.InformationJA, AI.InformationKO,
        AI.Phone,
        AI.OpeningHours,
        AI.LocationDetail_VN, AI.LocationDetail_EN, AI.LocationDetail_ZH, AI.LocationDetail_JA, AI.LocationDetail_KO,
        SC.CategoryID,
        SC.IconPath
    FROM AreaList AL
    LEFT JOIN AreaCategory AC ON AL.AreaListID = AC.AreaListID
    LEFT JOIN SubCategories SC ON AC.SubCategoryID = SC.SubCategoryID
    LEFT JOIN AreaInformation AI ON AL.AreaListID = AI.AreaListID;
END
GO

-- 3. Update SP_UpsertAreaInformation to handle detailed names, phone, hours, and location detail
IF OBJECT_ID('SP_UpsertAreaInformation', 'P') IS NOT NULL DROP PROCEDURE SP_UpsertAreaInformation;
GO
CREATE PROCEDURE SP_UpsertAreaInformation
    @MappedinId NVARCHAR(100),
    @NameVN NVARCHAR(200) = NULL,
    @NameEN NVARCHAR(200) = NULL,
    @NameZH NVARCHAR(200) = NULL,
    @NameJA NVARCHAR(200) = NULL,
    @NameKO NVARCHAR(200) = NULL,
    @VN NVARCHAR(MAX) = NULL, -- Description / Features
    @EN NVARCHAR(MAX) = NULL,
    @ZH NVARCHAR(MAX) = NULL,
    @JA NVARCHAR(MAX) = NULL,
    @KO NVARCHAR(MAX) = NULL,
    @ImageUrl NVARCHAR(500) = NULL,
    @MappedinImageUrl NVARCHAR(500) = NULL,
    @Phone NVARCHAR(50) = NULL,
    @OpeningHours NVARCHAR(100) = NULL,
    @LocationDetail_VN NVARCHAR(MAX) = NULL,
    @LocationDetail_EN NVARCHAR(MAX) = NULL,
    @LocationDetail_ZH NVARCHAR(MAX) = NULL,
    @LocationDetail_JA NVARCHAR(MAX) = NULL,
    @LocationDetail_KO NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ALID INT;
    SELECT @ALID = AreaListID FROM AreaList WHERE MappedinID = @MappedinId;

    IF @ALID IS NULL
    BEGIN
        INSERT INTO AreaList (MappedinID, Name, VN, EN, ZH, JA, KO)
        VALUES (@MappedinId, @MappedinId, ISNULL(@NameVN, @MappedinId), ISNULL(@NameEN, @MappedinId), 
                ISNULL(@NameZH, @MappedinId), ISNULL(@NameJA, @MappedinId), ISNULL(@NameKO, @MappedinId));
        SET @ALID = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE AreaList 
        SET VN = ISNULL(@NameVN, VN),
            EN = ISNULL(@NameEN, EN),
            ZH = ISNULL(@NameZH, ZH),
            JA = ISNULL(@NameJA, JA),
            KO = ISNULL(@NameKO, KO)
        WHERE AreaListID = @ALID;
    END

    IF EXISTS (SELECT 1 FROM AreaInformation WHERE AreaListID = @ALID)
    BEGIN
        UPDATE AreaInformation
        SET InformationVI = @VN, InformationEN = @EN, InformationZH = @ZH, InformationJA = @JA, InformationKO = @KO,
            UIImageUrl = @ImageUrl, MappedinImageUrl = @MappedinImageUrl,
            Phone = @Phone,
            OpeningHours = @OpeningHours,
            LocationDetail_VN = @LocationDetail_VN,
            LocationDetail_EN = @LocationDetail_EN,
            LocationDetail_ZH = @LocationDetail_ZH,
            LocationDetail_JA = @LocationDetail_JA,
            LocationDetail_KO = @LocationDetail_KO
        WHERE AreaListID = @ALID;
    END
    ELSE
    BEGIN
        INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, UIImageUrl, MappedinImageUrl, Phone, OpeningHours, LocationDetail_VN, LocationDetail_EN, LocationDetail_ZH, LocationDetail_JA, LocationDetail_KO)
        VALUES (@ALID, @VN, @EN, @ZH, @JA, @KO, @ImageUrl, @MappedinImageUrl, @Phone, @OpeningHours, @LocationDetail_VN, @LocationDetail_EN, @LocationDetail_ZH, @LocationDetail_JA, @LocationDetail_KO);
    END
END
GO
