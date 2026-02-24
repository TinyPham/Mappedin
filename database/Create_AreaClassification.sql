USE [MappedIn3DModels]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 1. Bảng Categories
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Categories](
        [CategoryID] [int] IDENTITY(1,1) NOT NULL,
        [CategoryName] [nvarchar](200) NOT NULL,
        [IconPath] [nvarchar](500) NULL,
        [DisplayOrder] [int] DEFAULT 0,
     CONSTRAINT [PK_Categories] PRIMARY KEY CLUSTERED ([CategoryID] ASC)
    ) ON [PRIMARY]
END
GO

-- 2. Bảng SubCategories
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SubCategories](
        [SubCategoryID] [int] IDENTITY(1,1) NOT NULL,
        [CategoryID] [int] NOT NULL,
        [SubCategoryName] [nvarchar](200) NOT NULL,
        [IconPath] [nvarchar](500) NULL,
        [DisplayOrder] [int] DEFAULT 0,
     CONSTRAINT [PK_SubCategories] PRIMARY KEY CLUSTERED ([SubCategoryID] ASC),
     CONSTRAINT [FK_SubCategories_Categories] FOREIGN KEY([CategoryID]) REFERENCES [dbo].[Categories] ([CategoryID])
    ) ON [PRIMARY]
END
GO

-- 3. Bảng AreaList (Danh sách các khu vực/POI từ Mappedin)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AreaList]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AreaList](
        [AreaListID] [int] IDENTITY(1,1) NOT NULL,
        [MappedinID] [nvarchar](100) NOT NULL,
        [LocationName] [nvarchar](200) NULL,
        [FloorID] [nvarchar](100) NULL,
        [LastSync] [datetime] DEFAULT GETDATE(),
     CONSTRAINT [PK_AreaList] PRIMARY KEY CLUSTERED ([AreaListID] ASC),
     CONSTRAINT [UQ_AreaList_MappedinID] UNIQUE ([MappedinID])
    ) ON [PRIMARY]
END
GO

-- 4. Bảng AreaCategory (Gán khu vực vào phân loại con)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AreaCategory]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AreaCategory](
        [AreaCategoryID] [int] IDENTITY(1,1) NOT NULL,
        [AreaListID] [int] NOT NULL,
        [SubCategoryID] [int] NOT NULL,
     CONSTRAINT [PK_AreaCategory] PRIMARY KEY CLUSTERED ([AreaCategoryID] ASC),
     CONSTRAINT [FK_AreaCategory_AreaList] FOREIGN KEY([AreaListID]) REFERENCES [dbo].[AreaList] ([AreaListID]),
     CONSTRAINT [FK_AreaCategory_SubCategories] FOREIGN KEY([SubCategoryID]) REFERENCES [dbo].[SubCategories] ([SubCategoryID])
    ) ON [PRIMARY]
END
GO
