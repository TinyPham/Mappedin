USE [MappedIn3DModels]
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaInformation]') AND name = 'MappedinImageUrl')
BEGIN
    ALTER TABLE [dbo].[AreaInformation] ADD [MappedinImageUrl] NVARCHAR(500) NULL;
    PRINT 'Column MappedinImageUrl added to AreaInformation';
END
GO

-- Initialize MappedinImageUrl with current ImageUrl for existing records
UPDATE [dbo].[AreaInformation] 
SET [MappedinImageUrl] = [ImageUrl] 
WHERE [MappedinImageUrl] IS NULL;
GO
