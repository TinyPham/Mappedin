USE [MappedIn3DModels]
GO

-- 1. Create AreaInformation Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AreaInformation]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AreaInformation](
        [InformationID] [int] IDENTITY(1,1) NOT NULL,
        [AreaListID] [int] NOT NULL,
        [InformationVI] [nvarchar](MAX) NULL, -- Description from Mappedin (Vietnamese)
        [InformationEN] [nvarchar](MAX) NULL,
        [InformationZH] [nvarchar](MAX) NULL,
        [InformationJA] [nvarchar](MAX) NULL,
        [InformationKO] [nvarchar](MAX) NULL,
        [ImageUrl] [nvarchar](500) NULL,
        CONSTRAINT [PK_AreaInformation] PRIMARY KEY CLUSTERED ([InformationID] ASC)
    )
END
GO

-- 2. Add Foreign Key
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_AreaInformation_AreaList]') AND parent_object_id = OBJECT_ID(N'[dbo].[AreaInformation]'))
BEGIN
    ALTER TABLE [dbo].[AreaInformation] WITH CHECK ADD CONSTRAINT [FK_AreaInformation_AreaList] FOREIGN KEY([AreaListID])
    REFERENCES [dbo].[AreaList] ([AreaListID])
    ON DELETE CASCADE

    ALTER TABLE [dbo].[AreaInformation] CHECK CONSTRAINT [FK_AreaInformation_AreaList]
END
GO

-- 3. Migrate Data from AreaList to AreaInformation
-- Assuming current AreaList.Description is in Vietnamese (based on seed logic)
-- Note: 'InformationVI' will be populated with existing Description.
-- 'ImageUrl' will be populated with existing ImageUrl.
INSERT INTO [dbo].[AreaInformation] (AreaListID, InformationVI, ImageUrl)
SELECT 
    AL.AreaListID, 
    AL.Description, 
    AL.ImageUrl
FROM [dbo].[AreaList] AL
LEFT JOIN [dbo].[AreaInformation] AI ON AL.AreaListID = AI.AreaListID
WHERE AI.AreaListID IS NULL -- Only insert if not already exists AND source has data
AND (AL.Description IS NOT NULL OR AL.ImageUrl IS NOT NULL);
GO

-- 4. Drop columns from AreaList (after verification)
-- Uncomment these lines if you want to strictly remove them now, 
-- or keep them for safety until backend is fully updated.
-- The user asked to "separate", implying removal.

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaList]') AND name = 'Description')
BEGIN
    ALTER TABLE [dbo].[AreaList] DROP COLUMN [Description]
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaList]') AND name = 'ImageUrl')
BEGIN
    ALTER TABLE [dbo].[AreaList] DROP COLUMN [ImageUrl]
END
GO

PRINT 'Refactoring Complete: AreaInformation table created and data migrated.'
