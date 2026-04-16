USE [MappedIn3DModels]
GO

-- 1. Rename ImageUrl to UIImageUrl
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaInformation]') AND name = 'ImageUrl')
BEGIN
    EXEC sp_rename 'dbo.AreaInformation.ImageUrl', 'UIImageUrl', 'COLUMN';
    PRINT 'Renamed ImageUrl to UIImageUrl';
END
GO

-- 2. Add MappedinImageUrl
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaInformation]') AND name = 'MappedinImageUrl')
BEGIN
    ALTER TABLE [dbo].[AreaInformation] ADD [MappedinImageUrl] NVARCHAR(500) NULL;
    PRINT 'Added MappedinImageUrl column';
END
GO

-- 3. Add RunUrl
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaInformation]') AND name = 'RunUrl')
BEGIN
    ALTER TABLE [dbo].[AreaInformation] ADD [RunUrl] NVARCHAR(500) NULL;
    PRINT 'Added RunUrl column';
END
GO

-- 4. Data Initialization
-- Set RunUrl to UIImageUrl initially
UPDATE [dbo].[AreaInformation] SET [RunUrl] = [UIImageUrl] WHERE [RunUrl] IS NULL;
-- Set MappedinImageUrl if it looks like a mappedin link
UPDATE [dbo].[AreaInformation] SET [MappedinImageUrl] = [UIImageUrl] 
WHERE [MappedinImageUrl] IS NULL AND [UIImageUrl] LIKE '%mappedin.com%';
GO
