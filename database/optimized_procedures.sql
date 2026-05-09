-- =============================================
-- Optimized Stored Procedures for CMS/I18N
-- =============================================

-- 1. SP_GetInitialData: Fetch all basic app data in a single call
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

    -- Results 6: Locations (AreaList + Translations)
    SELECT 
        AL.AreaListID, 
        AL.MappedinID, 
        AL.VN, AL.EN, AL.ZH, AL.JA, AL.KO,
        AI.RunUrl, AI.UIImageUrl, AI.MappedinImageUrl,
        AI.InformationVI, AI.InformationEN, AI.InformationZH, AI.InformationJA, AI.InformationKO,
        AI.Phone,
        AI.OpeningHours,
        AI.LocationDetail_VN, AI.LocationDetail_EN, AI.LocationDetail_ZH, AI.LocationDetail_JA, AI.LocationDetail_KO,
        AC.SubCategoryID,
        SC.CategoryID,
        SC.IconPath AS SubCategoryIconPath,
        SC.SubCategoryName AS SubCategoryVN,
        SC.EN AS SubCategoryEN,
        SC.ZH AS SubCategoryZH,
        SC.JA AS SubCategoryJA,
        SC.KO AS SubCategoryKO
    FROM AreaList AL
    LEFT JOIN AreaCategory AC ON AL.AreaListID = AC.AreaListID
    LEFT JOIN SubCategories SC ON AC.SubCategoryID = SC.SubCategoryID
    LEFT JOIN AreaInformation AI ON AL.AreaListID = AI.AreaListID;
END
GO

-- 2. SP_UpsertAreaInformation: Handle area info updates
IF OBJECT_ID('SP_UpsertAreaInformation', 'P') IS NOT NULL DROP PROCEDURE SP_UpsertAreaInformation;
GO
CREATE PROCEDURE SP_UpsertAreaInformation
    @MappedinId NVARCHAR(100),
    @VN NVARCHAR(MAX),
    @EN NVARCHAR(MAX),
    @ZH NVARCHAR(MAX),
    @JA NVARCHAR(MAX),
    @KO NVARCHAR(MAX),
    @ImageUrl NVARCHAR(500),
    @MappedinImageUrl NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @AreaListID INT;
    SELECT @AreaListID = AreaListID FROM AreaList WHERE MappedinID = @MappedinId;

    IF @AreaListID IS NOT NULL
    BEGIN
        MERGE INTO AreaInformation AS Target
        USING (SELECT @AreaListID AS AreaListID) AS Source
        ON Target.AreaListID = Source.AreaListID
        WHEN MATCHED THEN
            UPDATE SET 
                InformationVI = @VN,
                InformationEN = @EN,
                InformationZH = @ZH,
                InformationJA = @JA,
                InformationKO = @KO,
                UIImageUrl = @ImageUrl,
                RunUrl = @ImageUrl,
                MappedinImageUrl = @MappedinImageUrl
        WHEN NOT MATCHED THEN
            INSERT (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, UIImageUrl, RunUrl, MappedinImageUrl)
            VALUES (@AreaListID, @VN, @EN, @ZH, @JA, @KO, @ImageUrl, @ImageUrl, @MappedinImageUrl);
    END
END
GO

-- 3. SP_GetAvailableModels
IF OBJECT_ID('SP_GetAvailableModels', 'P') IS NOT NULL DROP PROCEDURE SP_GetAvailableModels;
GO
CREATE PROCEDURE SP_GetAvailableModels
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM AvailableModels WHERE IsActive = 1 ORDER BY ModelName;
END
GO

-- 4. SP_Admin_UpsertLocation: Handle master data and translation updates for a location
IF OBJECT_ID('SP_Admin_UpsertLocation', 'P') IS NOT NULL DROP PROCEDURE SP_Admin_UpsertLocation;
GO
CREATE PROCEDURE SP_Admin_UpsertLocation
    @MappedinId NVARCHAR(100),
    @CategoryId INT,
    @SlugKey VARCHAR(255),
    @LogoUrl VARCHAR(500),
    @CoverImageUrl VARCHAR(500),
    @PhoneNumber VARCHAR(50),
    @WebsiteLink VARCHAR(500),
    @SocialMediaLinks NVARCHAR(MAX),
    @OperatingHours NVARCHAR(MAX),
    @VN NVARCHAR(255),
    @EN NVARCHAR(255),
    @ZH NVARCHAR(255),
    @JA NVARCHAR(255),
    @KO NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @LocationId BIGINT;
        SELECT @LocationId = LocationId FROM MasterData_Locations WHERE MappedinId = @MappedinId;

        -- 1. Upsert MasterData_Locations
        IF @LocationId IS NOT NULL
        BEGIN
            UPDATE MasterData_Locations 
            SET CategoryId=@CategoryId, SlugKey=@SlugKey, LogoUrl=@LogoUrl, CoverImageUrl=@CoverImageUrl, 
                PhoneNumber=@PhoneNumber, WebsiteLink=@WebsiteLink, SocialMediaLinks=@SocialMediaLinks, 
                OperatingHours=@OperatingHours, ModifiedDate=GETDATE()
            WHERE LocationId=@LocationId;
        END
        ELSE
        BEGIN
            INSERT INTO MasterData_Locations (MappedinId, CategoryId, SlugKey, LogoUrl, CoverImageUrl, PhoneNumber, WebsiteLink, SocialMediaLinks, OperatingHours)
            VALUES (@MappedinId, @CategoryId, @SlugKey, @LogoUrl, @CoverImageUrl, @PhoneNumber, @WebsiteLink, @SocialMediaLinks, @OperatingHours);
            SET @LocationId = SCOPE_IDENTITY();
        END

        -- 2. Upsert AreaList Translations
        UPDATE AreaList 
        SET VN=@VN, EN=@EN, ZH=@ZH, JA=@JA, KO=@KO
        WHERE MappedinID = @MappedinId;

        COMMIT TRANSACTION;
        SELECT @LocationId AS LocationId;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- 5. SP_SyncMappedinLocation: Single location sync from Mappedin source
IF OBJECT_ID('SP_SyncMappedinLocation', 'P') IS NOT NULL DROP PROCEDURE SP_SyncMappedinLocation;
GO
CREATE PROCEDURE SP_SyncMappedinLocation
    @MappedinId NVARCHAR(100),
    @Name NVARCHAR(200),
    @Description NVARCHAR(MAX),
    @ImageUrl NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @AreaListID INT;
    
    -- 1. Ensure AreaList exists
    SELECT @AreaListID = AreaListID FROM AreaList WHERE MappedinID = @MappedinId;
    
    IF @AreaListID IS NULL
    BEGIN
        INSERT INTO AreaList (MappedinID, Name, VN, EN)
        VALUES (@MappedinId, @Name, @Name, @Name);
        SET @AreaListID = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE AreaList SET Name = @Name, VN = @Name WHERE AreaListID = @AreaListID;
    END

    -- 2. Sync AreaInformation
    IF NOT EXISTS (SELECT 1 FROM AreaInformation WHERE AreaListID = @AreaListID)
    BEGIN
        INSERT INTO AreaInformation (AreaListID, InformationVI, RunUrl, MappedinImageUrl)
        VALUES (@AreaListID, @Description, @ImageUrl, @ImageUrl);
    END
    ELSE
    BEGIN
        DECLARE @LastMappedinImg NVARCHAR(500);
        DECLARE @HasUIImage BIT;
        
        SELECT @LastMappedinImg = MappedinImageUrl, 
               @HasUIImage = CASE WHEN UIImageUrl IS NOT NULL AND UIImageUrl <> '' THEN 1 ELSE 0 END
        FROM AreaInformation WHERE AreaListID = @AreaListID;

        IF @ImageUrl IS NOT NULL AND @ImageUrl <> @LastMappedinImg
        BEGIN
            IF @HasUIImage = 1
            BEGIN
                UPDATE AreaInformation SET MappedinImageUrl = @ImageUrl WHERE AreaListID = @AreaListID;
            END
            ELSE
            BEGIN
                UPDATE AreaInformation SET RunUrl = @ImageUrl, MappedinImageUrl = @ImageUrl WHERE AreaListID = @AreaListID;
            END
        END
    END
    
    SELECT @AreaListID AS AreaListID;
END
GO
-- 6. SP_SyncCategoryStructure: Consolidate, Merge and Deduplicate Categories/Subcategories
IF OBJECT_ID('SP_SyncCategoryStructure', 'P') IS NOT NULL DROP PROCEDURE SP_SyncCategoryStructure;
GO
CREATE PROCEDURE SP_SyncCategoryStructure
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OldId INT, @NewId INT;

    -- 1. Handle 'Phòng chờ / Lounges' -> 'Thư giãn' Merge
    SELECT @OldId = CategoryID FROM Categories WHERE CategoryName = N'Phòng chờ';
    SELECT @NewId = CategoryID FROM Categories WHERE CategoryName = N'Thư giãn';

    IF @OldId IS NOT NULL
    BEGIN
        IF @NewId IS NOT NULL
        BEGIN
            UPDATE SubCategories SET CategoryID = @NewId WHERE CategoryID = @OldId;
            DELETE FROM Categories WHERE CategoryID = @OldId;
        END
        ELSE
        BEGIN
            UPDATE Categories SET CategoryName = N'Thư giãn' WHERE CategoryID = @OldId;
        END
    END

    -- 2. Handle 'Transportation' & 'Dịch vụ hành khách'
    UPDATE Categories SET CategoryName = N'Dịch vụ sân bay' WHERE CategoryName = N'Dịch vụ hành khách';
    DELETE FROM Categories WHERE CategoryName IN (N'Thủ tục chuyến bay', N'Transportation');

    -- Rename SubCategory
    UPDATE SubCategories 
    SET SubCategoryName = N'An ninh soi chiếu quốc tế', 
        IconPath = 'DepartureFlightProcedures/int-screening-security.png'
    WHERE IconPath LIKE '%/screening-security.png' OR SubCategoryName = N'An ninh soi chiếu';

    -- Merge 'Điểm đón taxi'
    SET @OldId = NULL; SET @NewId = NULL;
    SELECT @OldId = CategoryID FROM Categories WHERE CategoryName = N'Điểm đón taxi';
    SELECT @NewId = CategoryID FROM Categories WHERE CategoryName = N'Dịch vụ sân bay';
    IF @OldId IS NOT NULL AND @NewId IS NOT NULL
    BEGIN
        UPDATE SubCategories SET CategoryID = @NewId WHERE CategoryID = @OldId;
        DELETE FROM Categories WHERE CategoryID = @OldId;
    END

    -- 3. Procedure Migrations
    DECLARE @DepProcID INT, @ArrProcID INT;
    SELECT @DepProcID = CategoryID FROM Categories WHERE CategoryName = N'Thủ tục chuyến bay đi';
    IF @DepProcID IS NULL
    BEGIN
        INSERT INTO Categories (CategoryName, IconPath, DisplayOrder) VALUES (N'Thủ tục chuyến bay đi', NULL, 0);
        SELECT @DepProcID = SCOPE_IDENTITY();
    END
    
    SELECT @ArrProcID = CategoryID FROM Categories WHERE CategoryName = N'Thủ tục chuyến bay đến';
    IF @ArrProcID IS NULL
    BEGIN
        INSERT INTO Categories (CategoryName, IconPath, DisplayOrder) VALUES (N'Thủ tục chuyến bay đến', NULL, 0);
        SELECT @ArrProcID = SCOPE_IDENTITY();
    END

    UPDATE SubCategories SET CategoryID = @DepProcID, IconPath = 'DepartureFlightProcedures/checkin-area.png'
    WHERE (IconPath LIKE '%/checkin-area.png' OR SubCategoryName = N'Khu vực làm thủ tục') AND CategoryID != @DepProcID;

    UPDATE SubCategories SET CategoryID = @ArrProcID, IconPath = 'ArrivalFlightProcedures/baggage-claim-area.png'
    WHERE (IconPath LIKE '%/baggage-claim-area.png' OR SubCategoryName = N'Khu vực nhận hành lý') AND CategoryID != @ArrProcID;

    -- 4. Deduplicate SubCategories
    DECLARE @DedupCatID INT, @DedupSubName NVARCHAR(500), @KeepSubID INT;
    DECLARE cur CURSOR FOR
    SELECT CategoryID, SubCategoryName FROM SubCategories WHERE SubCategoryName IS NOT NULL
    GROUP BY CategoryID, SubCategoryName HAVING COUNT(*) > 1;
    
    OPEN cur;
    FETCH NEXT FROM cur INTO @DedupCatID, @DedupSubName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SELECT @KeepSubID = MAX(SubCategoryID) FROM SubCategories 
        WHERE CategoryID = @DedupCatID AND SubCategoryName = @DedupSubName;
        
        UPDATE AreaCategory SET SubCategoryID = @KeepSubID WHERE SubCategoryID IN (
            SELECT SubCategoryID FROM SubCategories WHERE CategoryID = @DedupCatID AND SubCategoryName = @DedupSubName AND SubCategoryID != @KeepSubID
        ) AND AreaListID NOT IN (SELECT AreaListID FROM AreaCategory WHERE SubCategoryID = @KeepSubID);
        
        DELETE FROM AreaCategory WHERE SubCategoryID IN (
            SELECT SubCategoryID FROM SubCategories WHERE CategoryID = @DedupCatID AND SubCategoryName = @DedupSubName AND SubCategoryID != @KeepSubID
        );
        
        DELETE FROM SubCategories WHERE CategoryID = @DedupCatID AND SubCategoryName = @DedupSubName AND SubCategoryID != @KeepSubID;
        FETCH NEXT FROM cur INTO @DedupCatID, @DedupSubName;
    END
    CLOSE cur; DEALLOCATE cur;
END
GO

-- 7. SP_UpsertCategorySync: Upsert a main category and cleanup duplicates
IF OBJECT_ID('SP_UpsertCategorySync', 'P') IS NOT NULL DROP PROCEDURE SP_UpsertCategorySync;
GO
CREATE PROCEDURE SP_UpsertCategorySync
    @Name NVARCHAR(255),
    @IconPath NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @CID INT;

    -- 1. Try to find by IconPath first (Stable ID)
    SELECT @CID = CategoryID FROM Categories WHERE IconPath = @IconPath;

    -- 2. Fallback to Name
    IF @CID IS NULL
        SELECT @CID = CategoryID FROM Categories WHERE CategoryName = @Name;
    
    IF @CID IS NOT NULL
    BEGIN
        UPDATE Categories SET CategoryName = @Name, IconPath = @IconPath WHERE CategoryID = @CID;
    END
    ELSE
    BEGIN
        INSERT INTO Categories (CategoryName, IconPath, DisplayOrder) VALUES (@Name, @IconPath, 0);
        SET @CID = SCOPE_IDENTITY();
    END

    -- 3. Cleanup: Remove any other categories with same name or icon but different ID
    DELETE FROM Categories WHERE (CategoryName = @Name OR (IconPath = @IconPath AND @IconPath IS NOT NULL)) AND CategoryID <> @CID;

    SELECT @CID AS CategoryID;
END
GO

-- 8. SP_UpsertSubCategorySync: Upsert a subcategory and cleanup duplicates
IF OBJECT_ID('SP_UpsertSubCategorySync', 'P') IS NOT NULL DROP PROCEDURE SP_UpsertSubCategorySync;
GO
CREATE PROCEDURE SP_UpsertSubCategorySync
    @CategoryId INT,
    @Name NVARCHAR(255),
    @IconPath NVARCHAR(500),
    @EnglishNameFallback NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @SID INT;

    -- 1. Try to find by IconPath (Stable ID)
    SELECT @SID = SubCategoryID FROM SubCategories WHERE IconPath = @IconPath AND CategoryID = @CategoryId;

    -- 2. Fallback to Name or English Fallback
    IF @SID IS NULL
        SELECT @SID = SubCategoryID FROM SubCategories 
        WHERE (SubCategoryName = @Name OR (SubCategoryName = @EnglishNameFallback AND @EnglishNameFallback IS NOT NULL)) 
        AND CategoryID = @CategoryId;
    
    IF @SID IS NOT NULL
    BEGIN
        UPDATE SubCategories SET SubCategoryName = @Name, IconPath = @IconPath WHERE SubCategoryID = @SID;
    END
    ELSE
    BEGIN
        INSERT INTO SubCategories (CategoryID, SubCategoryName, IconPath, DisplayOrder) VALUES (@CategoryId, @Name, @IconPath, 0);
        SET @SID = SCOPE_IDENTITY();
    END

    -- 3. Cleanup: Remove any other subcategories in this category with same name or icon
    DELETE FROM SubCategories 
    WHERE CategoryID = @CategoryId 
    AND (IconPath = @IconPath OR SubCategoryName = @Name OR (SubCategoryName = @EnglishNameFallback AND @EnglishNameFallback IS NOT NULL))
    AND SubCategoryID <> @SID;

    SELECT @SID AS SubCategoryID;
END
GO

-- 9. SP_GetCategoryTree: Fetch full Category -> SubCategory hierarchy
IF OBJECT_ID('SP_GetCategoryTree', 'P') IS NOT NULL DROP PROCEDURE SP_GetCategoryTree;
GO
CREATE PROCEDURE SP_GetCategoryTree
AS
BEGIN
    SET NOCOUNT ON;

    -- Results 1: Categories
    SELECT CategoryID, CategoryName as VN, EN, ZH, JA, KO, IconPath, DisplayOrder
    FROM Categories
    ORDER BY DisplayOrder, CategoryName;

    -- Results 2: SubCategories
    SELECT SubCategoryID, CategoryID, SubCategoryName as VN, EN, ZH, JA, KO, IconPath, DisplayOrder
    FROM SubCategories
    ORDER BY DisplayOrder, SubCategoryName;
END
GO


