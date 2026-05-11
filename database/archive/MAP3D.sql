USE [MappedIn3DModels]
GO
/****** Object:  Table [dbo].[AreaCategory]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AreaCategory](
	[AssignmentID] [int] IDENTITY(1,1) NOT NULL,
	[AreaListID] [int] NOT NULL,
	[SubCategoryID] [int] NOT NULL,
 CONSTRAINT [PK_AreaCategory] PRIMARY KEY CLUSTERED 
(
	[AssignmentID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AreaInformation]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AreaInformation](
	[InformationID] [int] IDENTITY(1,1) NOT NULL,
	[AreaListID] [int] NOT NULL,
	[InformationVI] [nvarchar](max) NULL,
	[InformationEN] [nvarchar](max) NULL,
	[InformationZH] [nvarchar](max) NULL,
	[InformationJA] [nvarchar](max) NULL,
	[InformationKO] [nvarchar](max) NULL,
	[UIImageUrl] [nvarchar](500) NULL,
	[MappedinImageUrl] [nvarchar](500) NULL,
	[RunUrl] [nvarchar](500) NULL,
 CONSTRAINT [PK_AreaInformation] PRIMARY KEY CLUSTERED 
(
	[InformationID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AreaList]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AreaList](
	[AreaListID] [int] IDENTITY(1,1) NOT NULL,
	[MappedinID] [nvarchar](100) NOT NULL,
	[Name] [nvarchar](255) NULL,
	[VN] [nvarchar](255) NULL,
	[EN] [nvarchar](255) NULL,
	[ZH] [nvarchar](255) NULL,
	[JA] [nvarchar](255) NULL,
	[KO] [nvarchar](255) NULL,
 CONSTRAINT [PK_AreaList] PRIMARY KEY CLUSTERED 
(
	[AreaListID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AvailableModels]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AvailableModels](
	[AvailableModelsId] [int] IDENTITY(1,1) NOT NULL,
	[ModelName] [nvarchar](200) NOT NULL,
	[FileName] [nvarchar](500) NOT NULL,
	[Thumbnail] [nvarchar](500) NULL,
	[DefaultScaleX] [decimal](18, 6) NULL,
	[DefaultScaleY] [decimal](18, 6) NULL,
	[DefaultScaleZ] [decimal](18, 6) NULL,
	[DefaultRotationX] [decimal](10, 4) NULL,
	[DefaultRotationY] [decimal](10, 4) NULL,
	[DefaultRotationZ] [decimal](10, 4) NULL,
	[IsActive] [bit] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
 CONSTRAINT [PK_AvailableModels] PRIMARY KEY CLUSTERED 
(
	[AvailableModelsId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Categories]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Categories](
	[CategoryID] [int] IDENTITY(1,1) NOT NULL,
	[IconPath] [nvarchar](500) NULL,
	[DisplayOrder] [int] NULL,
	[CategoryName] [nvarchar](255) NULL,
	[EN] [nvarchar](255) NULL,
	[ZH] [nvarchar](255) NULL,
	[JA] [nvarchar](255) NULL,
	[KO] [nvarchar](255) NULL,
 CONSTRAINT [PK_Categories] PRIMARY KEY CLUSTERED 
(
	[CategoryID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LocationAsset]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LocationAsset](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](500) NULL,
	[Description] [nvarchar](max) NULL,
	[Latitude] [float] NOT NULL,
	[Longitude] [float] NOT NULL,
	[FloorId] [nvarchar](200) NULL,
	[FloorName] [nvarchar](200) NULL,
	[Size] [float] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[CreatedBy] [nvarchar](200) NULL,
	[IsActive] [bit] NULL,
	[IsDeleted] [bit] NULL,
	[ERPEquipmentCode] [nvarchar](100) NULL,
	[UUID] [nvarchar](200) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MasterData_Languages]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MasterData_Languages](
	[LanguageId] [varchar](5) NOT NULL,
	[LanguageName] [nvarchar](50) NOT NULL,
	[FlagIcon] [varchar](255) NULL,
	[IsActive] [bit] NOT NULL,
	[SortOrder] [int] NOT NULL,
 CONSTRAINT [PK_MasterData_Languages] PRIMARY KEY CLUSTERED 
(
	[LanguageId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Models3D]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Models3D](
	[Model3DID] [int] IDENTITY(1,1) NOT NULL,
	[UUID] [nvarchar](50) NOT NULL,
	[ModelName] [nvarchar](200) NULL,
	[Description] [nvarchar](500) NULL,
	[ModelURL] [nvarchar](500) NOT NULL,
	[Latitude] [decimal](18, 10) NULL,
	[Longitude] [decimal](18, 10) NULL,
	[FloorId] [nvarchar](100) NULL,
	[FloorName] [nvarchar](100) NULL,
	[RotationX] [decimal](10, 4) NOT NULL,
	[RotationY] [decimal](10, 4) NOT NULL,
	[RotationZ] [decimal](10, 4) NOT NULL,
	[ScaleX] [decimal](18, 6) NOT NULL,
	[ScaleY] [decimal](18, 6) NOT NULL,
	[ScaleZ] [decimal](18, 6) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[IsActive] [bit] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
	[DisplayWebsite] [bit] NOT NULL,
	[Elevation] [decimal](18, 4) NULL,
PRIMARY KEY CLUSTERED 
(
	[Model3DID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[UUID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SubCategories]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SubCategories](
	[SubCategoryID] [int] IDENTITY(1,1) NOT NULL,
	[CategoryID] [int] NOT NULL,
	[IconPath] [nvarchar](500) NULL,
	[DisplayOrder] [int] NULL,
	[SubCategoryName] [nvarchar](255) NULL,
	[EN] [nvarchar](255) NULL,
	[ZH] [nvarchar](255) NULL,
	[JA] [nvarchar](255) NULL,
	[KO] [nvarchar](255) NULL,
 CONSTRAINT [PK_SubCategories] PRIMARY KEY CLUSTERED 
(
	[SubCategoryID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Translation_Floors]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Translation_Floors](
	[FloorId] [int] IDENTITY(1,1) NOT NULL,
	[MappedinId] [varchar](100) NULL,
	[FloorCode] [varchar](20) NULL,
	[SortOrder] [int] NULL,
	[VN] [nvarchar](255) NOT NULL,
	[EN] [nvarchar](255) NULL,
	[ZH] [nvarchar](255) NULL,
	[JA] [nvarchar](255) NULL,
	[KO] [nvarchar](255) NULL,
 CONSTRAINT [PK_Translation_Floors] PRIMARY KEY CLUSTERED 
(
	[FloorId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Translation_UI]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Translation_UI](
	[UIKeyId] [int] IDENTITY(1,1) NOT NULL,
	[KeyCode] [varchar](100) NOT NULL,
	[KeyType] [varchar](50) NULL,
	[VN] [nvarchar](500) NULL,
	[EN] [nvarchar](500) NULL,
	[ZH] [nvarchar](500) NULL,
	[JA] [nvarchar](500) NULL,
	[KO] [nvarchar](500) NULL,
 CONSTRAINT [PK_Translation_UI] PRIMARY KEY CLUSTERED 
(
	[UIKeyId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UK_Translation_UI_KeyCode] UNIQUE NONCLUSTERED 
(
	[KeyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [IX_Models3D_CreatedAt]    Script Date: 4/16/2026 3:46:38 PM ******/
CREATE NONCLUSTERED INDEX [IX_Models3D_CreatedAt] ON [dbo].[Models3D]
(
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Models3D_FloorId]    Script Date: 4/16/2026 3:46:38 PM ******/
CREATE NONCLUSTERED INDEX [IX_Models3D_FloorId] ON [dbo].[Models3D]
(
	[FloorId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Models3D_IsActive]    Script Date: 4/16/2026 3:46:38 PM ******/
CREATE NONCLUSTERED INDEX [IX_Models3D_IsActive] ON [dbo].[Models3D]
(
	[IsActive] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Models3D_UUID]    Script Date: 4/16/2026 3:46:38 PM ******/
CREATE NONCLUSTERED INDEX [IX_Models3D_UUID] ON [dbo].[Models3D]
(
	[UUID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[AvailableModels] ADD  DEFAULT ((1)) FOR [DefaultScaleX]
GO
ALTER TABLE [dbo].[AvailableModels] ADD  DEFAULT ((1)) FOR [DefaultScaleY]
GO
ALTER TABLE [dbo].[AvailableModels] ADD  DEFAULT ((1)) FOR [DefaultScaleZ]
GO
ALTER TABLE [dbo].[AvailableModels] ADD  DEFAULT ((0)) FOR [DefaultRotationX]
GO
ALTER TABLE [dbo].[AvailableModels] ADD  DEFAULT ((0)) FOR [DefaultRotationY]
GO
ALTER TABLE [dbo].[AvailableModels] ADD  DEFAULT ((0)) FOR [DefaultRotationZ]
GO
ALTER TABLE [dbo].[AvailableModels] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[AvailableModels] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[AvailableModels] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Categories] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO
ALTER TABLE [dbo].[LocationAsset] ADD  DEFAULT ((1.0)) FOR [Size]
GO
ALTER TABLE [dbo].[LocationAsset] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[LocationAsset] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[LocationAsset] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[LocationAsset] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[MasterData_Languages] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[MasterData_Languages] ADD  DEFAULT ((0)) FOR [SortOrder]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT ((0)) FOR [RotationX]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT ((0)) FOR [RotationY]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT ((0)) FOR [RotationZ]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT ((1)) FOR [ScaleX]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT ((1)) FOR [ScaleY]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT ((1)) FOR [ScaleZ]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT ((0)) FOR [DisplayWebsite]
GO
ALTER TABLE [dbo].[Models3D] ADD  DEFAULT ((0)) FOR [Elevation]
GO
ALTER TABLE [dbo].[SubCategories] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO
ALTER TABLE [dbo].[Translation_Floors] ADD  DEFAULT ((0)) FOR [SortOrder]
GO
ALTER TABLE [dbo].[AreaInformation]  WITH CHECK ADD  CONSTRAINT [FK_AreaInformation_AreaList] FOREIGN KEY([AreaListID])
REFERENCES [dbo].[AreaList] ([AreaListID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AreaInformation] CHECK CONSTRAINT [FK_AreaInformation_AreaList]
GO
ALTER TABLE [dbo].[SubCategories]  WITH CHECK ADD  CONSTRAINT [FK_SubCategories_Categories] FOREIGN KEY([CategoryID])
REFERENCES [dbo].[Categories] ([CategoryID])
GO
ALTER TABLE [dbo].[SubCategories] CHECK CONSTRAINT [FK_SubCategories_Categories]
GO
ALTER TABLE [dbo].[Models3D]  WITH CHECK ADD  CONSTRAINT [CHK_Latitude] CHECK  (([Latitude]>=(-90) AND [Latitude]<=(90)))
GO
ALTER TABLE [dbo].[Models3D] CHECK CONSTRAINT [CHK_Latitude]
GO
ALTER TABLE [dbo].[Models3D]  WITH CHECK ADD  CONSTRAINT [CHK_Longitude] CHECK  (([Longitude]>=(-180) AND [Longitude]<=(180)))
GO
ALTER TABLE [dbo].[Models3D] CHECK CONSTRAINT [CHK_Longitude]
GO
/****** Object:  StoredProcedure [dbo].[SP_Admin_UpsertLocation]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_Admin_UpsertLocation]
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
/****** Object:  StoredProcedure [dbo].[SP_DeleteLocationAsset]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_DeleteLocationAsset]
    @UUID NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE LocationAsset
    SET IsDeleted = 1,
        UpdatedAt = GETDATE()
    WHERE UUID = @UUID;
END
GO
/****** Object:  StoredProcedure [dbo].[SP_DeleteModel]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Delete model (Soft Delete)
CREATE   PROCEDURE [dbo].[SP_DeleteModel]
    @UUID NVARCHAR(50)
AS
BEGIN
    UPDATE Models3D SET IsDeleted = 1, UpdatedAt = GETDATE() WHERE UUID = @UUID;
END;
GO
/****** Object:  StoredProcedure [dbo].[SP_GetAllLocationAssets]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_GetAllLocationAssets]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        UUID,
        Name,
        Description,
        Latitude,
        Longitude,
        FloorId,
        FloorName,
        Size,
        ERPEquipmentCode,
        IsActive,
        IsDeleted
    FROM LocationAsset
    WHERE IsDeleted = 0 AND IsActive = 1;
END
GO
/****** Object:  StoredProcedure [dbo].[SP_GetAllModels]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 3. Update SP_GetAllModels
CREATE   PROCEDURE [dbo].[SP_GetAllModels]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * 
    FROM Models3D 
    WHERE IsDeleted = 0
    ORDER BY CreatedAt DESC;
END
GO
/****** Object:  StoredProcedure [dbo].[SP_GetAvailableModels]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_GetAvailableModels]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM AvailableModels WHERE IsActive = 1 ORDER BY ModelName;
END
GO
/****** Object:  StoredProcedure [dbo].[SP_GetCategoryTree]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_GetCategoryTree]
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
/****** Object:  StoredProcedure [dbo].[SP_GetInitialData]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_GetInitialData]
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
/****** Object:  StoredProcedure [dbo].[SP_GetLocationAssetByUUID]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_GetLocationAssetByUUID]
    @UUID NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        UUID,
        Name,
        Description,
        Latitude,
        Longitude,
        FloorId,
        FloorName,
        Size,
        ERPEquipmentCode,
        IsActive,
        IsDeleted
    FROM LocationAsset
    WHERE UUID = @UUID AND IsDeleted = 0;
END
GO
/****** Object:  StoredProcedure [dbo].[SP_GetModelByUUID]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 2. Cập nhật Procedure SP_GetModelByUUID để lấy thêm cột mới
CREATE   PROCEDURE [dbo].[SP_GetModelByUUID]
    @UUID NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        Model3DID, UUID, ModelName, Description, ModelURL,
        Latitude, Longitude, FloorId, FloorName,
        RotationX, RotationY, RotationZ,
        ScaleX, ScaleY, ScaleZ,
        CreatedAt, UpdatedAt, CreatedBy, IsActive, IsDeleted,
        DisplayWebsite -- Cột mới
    FROM Models3D
    WHERE UUID = @UUID AND IsDeleted = 0;
END
GO
/****** Object:  StoredProcedure [dbo].[SP_SyncAvailableModel]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 2. Stored Procedure: SP_SyncAvailableModel
-- Upserts based on FileName
CREATE   PROCEDURE [dbo].[SP_SyncAvailableModel]
    @ModelName nvarchar(200),
    @FileName nvarchar(500),
    @Thumbnail nvarchar(500),
    @DefaultScaleX decimal(10,4),
    @DefaultScaleY decimal(10,4),
    @DefaultScaleZ decimal(10,4),
    @DefaultRotationX decimal(10,4),
    @DefaultRotationY decimal(10,4),
    @DefaultRotationZ decimal(10,4)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM AvailableModels WHERE FileName = @FileName)
    BEGIN
        -- Update
        UPDATE AvailableModels
        SET ModelName = @ModelName,
            Thumbnail = @Thumbnail,
            UpdatedAt = GETDATE()
            -- We typically DON'T update defaults if user tuned them? 
            -- But here we assume file system source of truth for basic defaults or just keep existing.
            -- Let's update Thumbnail and Name.
        WHERE FileName = @FileName;
    END
    ELSE
    BEGIN
        -- Insert
        INSERT INTO AvailableModels (ModelName, FileName, Thumbnail, 
            DefaultScaleX, DefaultScaleY, DefaultScaleZ, 
            DefaultRotationX, DefaultRotationY, DefaultRotationZ)
        VALUES (@ModelName, @FileName, @Thumbnail, 
            @DefaultScaleX, @DefaultScaleY, @DefaultScaleZ,
            @DefaultRotationX, @DefaultRotationY, @DefaultRotationZ);
    END
END
GO
/****** Object:  StoredProcedure [dbo].[SP_SyncCategoryStructure]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_SyncCategoryStructure]
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
/****** Object:  StoredProcedure [dbo].[SP_SyncMappedinLocation]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_SyncMappedinLocation]
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
/****** Object:  StoredProcedure [dbo].[SP_UpsertAreaInformation]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_UpsertAreaInformation]
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
/****** Object:  StoredProcedure [dbo].[SP_UpsertCategorySync]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_UpsertCategorySync]
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
/****** Object:  StoredProcedure [dbo].[SP_UpsertLocationAsset]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_UpsertLocationAsset]
    @UUID NVARCHAR(200),
    @Name NVARCHAR(500) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @Latitude FLOAT,
    @Longitude FLOAT,
    @FloorId NVARCHAR(200) = NULL,
    @FloorName NVARCHAR(200) = NULL,
    @Size FLOAT = 1.0,
    @ERPEquipmentCode NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM LocationAsset WHERE UUID = @UUID)
    BEGIN
        UPDATE LocationAsset
        SET Name = @Name,
            Description = @Description,
            Latitude = @Latitude,
            Longitude = @Longitude,
            FloorId = @FloorId,
            FloorName = @FloorName,
            Size = @Size,
            ERPEquipmentCode = @ERPEquipmentCode,
            UpdatedAt = GETDATE(),
            IsActive = 1,
            IsDeleted = 0
        WHERE UUID = @UUID;
    END
    ELSE
    BEGIN
        INSERT INTO LocationAsset (UUID, Name, Description, Latitude, Longitude, FloorId, FloorName, Size, ERPEquipmentCode, CreatedAt, UpdatedAt, IsActive, IsDeleted)
        VALUES (@UUID, @Name, @Description, @Latitude, @Longitude, @FloorId, @FloorName, @Size, @ERPEquipmentCode, GETDATE(), GETDATE(), 1, 0);
    END
    
    -- Return the upserted record
    SELECT 
        UUID,
        Name,
        Description,
        Latitude,
        Longitude,
        FloorId,
        FloorName,
        Size,
        ERPEquipmentCode,
        IsActive,
        IsDeleted
    FROM LocationAsset
    WHERE UUID = @UUID;
END
GO
/****** Object:  StoredProcedure [dbo].[SP_UpsertModel]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 2. Cập nhật Stored Procedure SP_UpsertModel để hỗ trợ biến @Elevation
CREATE   PROCEDURE [dbo].[SP_UpsertModel]
    @UUID NVARCHAR(50),
    @ModelName NVARCHAR(200) = '',
    @Description NVARCHAR(500) = '',
    @ModelURL NVARCHAR(500),
    @Latitude DECIMAL(18,10),
    @Longitude DECIMAL(18,10),
    @FloorId NVARCHAR(100) = NULL,
    @FloorName NVARCHAR(100) = NULL,
    @RotationX DECIMAL(18,4) = 0,
    @RotationY DECIMAL(18,4) = 0,
    @RotationZ DECIMAL(18,4) = 0,
    @ScaleX DECIMAL(18,6) = 1,
    @ScaleY DECIMAL(18,6) = 1,
    @ScaleZ DECIMAL(18,6) = 1,
    @DisplayWebsite BIT = 0,
    @CreatedBy NVARCHAR(100) = NULL,
    @Elevation DECIMAL(18,4) = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Models3D WHERE UUID = @UUID)
    BEGIN
        UPDATE Models3D
        SET ModelName = @ModelName,
            Description = @Description,
            ModelURL = @ModelURL,
            Latitude = @Latitude,
            Longitude = @Longitude,
            FloorId = @FloorId,
            FloorName = @FloorName,
            RotationX = @RotationX,
            RotationY = @RotationY,
            RotationZ = @RotationZ,
            ScaleX = @ScaleX,
            ScaleY = @ScaleY,
            ScaleZ = @ScaleZ,
            DisplayWebsite = @DisplayWebsite,
            UpdatedAt = GETDATE(),
            IsDeleted = 0,
            Elevation = @Elevation
        WHERE UUID = @UUID;
    END
    ELSE
    BEGIN
        INSERT INTO Models3D (
            UUID, ModelName, Description, ModelURL, 
            Latitude, Longitude, FloorId, FloorName, 
            RotationX, RotationY, RotationZ, 
            ScaleX, ScaleY, ScaleZ, 
            DisplayWebsite, CreatedBy, Elevation
        )
        VALUES (
            @UUID, @ModelName, @Description, @ModelURL, 
            @Latitude, @Longitude, @FloorId, @FloorName, 
            @RotationX, @RotationY, @RotationZ, 
            @ScaleX, @ScaleY, @ScaleZ, 
            @DisplayWebsite, @CreatedBy, @Elevation
        );
    END
END
GO
/****** Object:  StoredProcedure [dbo].[SP_UpsertSubCategorySync]    Script Date: 4/16/2026 3:46:38 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_UpsertSubCategorySync]
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
