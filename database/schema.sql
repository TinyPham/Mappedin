-- ============================================
-- NEW SCHEMA: COLUMN-BASED TRANSLATIONS
-- Each translation row has 5 language columns
-- Easier to manage and edit data
-- ============================================

-- =============================================
-- DROP EXISTING TRANSLATION TABLES
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Translation_Locations]') AND type in (N'U')) DROP TABLE [dbo].[Translation_Locations];
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Translation_Categories]') AND type in (N'U')) DROP TABLE [dbo].[Translation_Categories];
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Translation_UI]') AND type in (N'U')) DROP TABLE [dbo].[Translation_UI];

-- Also drop the obsolete MasterData_UI_Keys since we'll merge into direct columns
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MasterData_UI_Keys]') AND type in (N'U')) DROP TABLE [dbo].[MasterData_UI_Keys];
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MasterData_Locations]') AND type in (N'U')) DROP TABLE [dbo].[MasterData_Locations];
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MasterData_LocationCategories]') AND type in (N'U')) DROP TABLE [dbo].[MasterData_LocationCategories];

PRINT N'✅ Old tables dropped';

-- =============================================
-- NEW TABLES WITH COLUMN-BASED TRANSLATIONS
-- =============================================

-- 1. UI TRANSLATIONS (Labels, Buttons, Placeholders)
CREATE TABLE [dbo].[Translation_UI] (
    [UIKeyId] INT IDENTITY(1,1) NOT NULL,
    [KeyCode] VARCHAR(100) NOT NULL,           -- 'directions_btn', 'search_placeholder'
    [KeyType] VARCHAR(50) NULL,                -- 'label', 'placeholder', 'floor', 'title'
    [VN] NVARCHAR(500) NULL,                   -- Vietnamese
    [EN] NVARCHAR(500) NULL,                   -- English
    [ZH] NVARCHAR(500) NULL,                   -- Chinese
    [JA] NVARCHAR(500) NULL,                   -- Japanese
    [KO] NVARCHAR(500) NULL,                   -- Korean
    CONSTRAINT [PK_Translation_UI] PRIMARY KEY CLUSTERED ([UIKeyId] ASC),
    CONSTRAINT [UK_Translation_UI_KeyCode] UNIQUE NONCLUSTERED ([KeyCode] ASC)
);
GO

PRINT N'✅ Translation_UI created';

-- 2. CATEGORY TRANSLATIONS
CREATE TABLE [dbo].[Translation_Categories] (
    [CategoryId] INT NOT NULL,                  -- Maps to Categories.CategoryID
    [IconPath] NVARCHAR(255) NULL,              -- Icon file path
    [VN] NVARCHAR(255) NOT NULL,               -- Vietnamese
    [EN] NVARCHAR(255) NULL,                   -- English
    [ZH] NVARCHAR(255) NULL,                   -- Chinese
    [JA] NVARCHAR(255) NULL,                   -- Japanese
    [KO] NVARCHAR(255) NULL,                   -- Korean
    CONSTRAINT [PK_Translation_Categories] PRIMARY KEY CLUSTERED ([CategoryId] ASC)
);
GO

PRINT N'✅ Translation_Categories created';

-- 3. SUBCATEGORY TRANSLATIONS
CREATE TABLE [dbo].[Translation_SubCategories] (
    [SubCategoryId] INT NOT NULL,               -- Maps to SubCategories.SubCategoryID
    [CategoryId] INT NULL,                  -- Parent category
    [IconPath] NVARCHAR(255) NULL,              -- Icon file path
    [VN] NVARCHAR(255) NOT NULL,               -- Vietnamese
    [EN] NVARCHAR(255) NULL,                   -- English
    [ZH] NVARCHAR(255) NULL,                   -- Chinese
    [JA] NVARCHAR(255) NULL,                   -- Japanese
    [KO] NVARCHAR(255) NULL,                   -- Korean
    CONSTRAINT [PK_Translation_SubCategories] PRIMARY KEY CLUSTERED ([SubCategoryId] ASC)
);
GO

PRINT N'✅ Translation_SubCategories created';

-- 4. LOCATION TRANSLATIONS (Map Objects with MappedinId)
CREATE TABLE [dbo].[Translation_Locations] (
    [LocationId] BIGINT IDENTITY(1,1) NOT NULL,
    [MappedinId] VARCHAR(100) NULL,             -- s_dea0b3d07f4eb13c
    [LocationType] VARCHAR(50) NULL,            -- 'room', 'poi', 'area'
    [CategoryId] INT NULL,                      -- Optional category link
    [VN] NVARCHAR(500) NOT NULL,               -- Vietnamese
    [EN] NVARCHAR(500) NULL,                   -- English
    [ZH] NVARCHAR(500) NULL,                   -- Chinese
    [JA] NVARCHAR(500) NULL,                   -- Japanese
    [KO] NVARCHAR(500) NULL,                   -- Korean
    CONSTRAINT [PK_Translation_Locations] PRIMARY KEY CLUSTERED ([LocationId] ASC)
);
GO

CREATE NONCLUSTERED INDEX [IX_Translation_Locations_MappedinId] ON [dbo].[Translation_Locations] ([MappedinId]);
GO

PRINT N'✅ Translation_Locations created';

-- 5. FLOOR TRANSLATIONS
CREATE TABLE [dbo].[Translation_Floors] (
    [FloorId] INT IDENTITY(1,1) NOT NULL,
    [MappedinId] VARCHAR(100) NULL,             -- m_dae8f26a40f6017f
    [FloorCode] VARCHAR(20) NULL,               -- 'GF', '1F', '2F', '3F', 'ROOF'
    [SortOrder] INT DEFAULT 0,
    [VN] NVARCHAR(255) NOT NULL,               -- Vietnamese
    [EN] NVARCHAR(255) NULL,                   -- English
    [ZH] NVARCHAR(255) NULL,                   -- Chinese
    [JA] NVARCHAR(255) NULL,                   -- Japanese
    [KO] NVARCHAR(255) NULL,                   -- Korean
    CONSTRAINT [PK_Translation_Floors] PRIMARY KEY CLUSTERED ([FloorId] ASC)
);
GO

PRINT N'✅ Translation_Floors created';

-- =============================================
-- SUMMARY
-- =============================================
PRINT N'';
PRINT N'════════════════════════════════════════════════════════════════';
PRINT N'✅ NEW COLUMN-BASED SCHEMA CREATED!';
PRINT N'════════════════════════════════════════════════════════════════';
PRINT N'   Tables created:';
PRINT N'   • Translation_UI          (KeyCode, VN, EN, ZH, JA, KO)';
PRINT N'   • Translation_Categories  (CategoryId, VN, EN, ZH, JA, KO)';
PRINT N'   • Translation_SubCategories (SubCategoryId, VN, EN, ZH, JA, KO)';
PRINT N'   • Translation_Locations   (MappedinId, VN, EN, ZH, JA, KO)';
PRINT N'   • Translation_Floors      (FloorCode, VN, EN, ZH, JA, KO)';
PRINT N'════════════════════════════════════════════════════════════════';
PRINT N'';
PRINT N'Next: Run seed.sql to populate data';
