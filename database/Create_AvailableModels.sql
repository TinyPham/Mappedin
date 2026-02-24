USE [MappedIn3DModels]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 1. Create Table AvailableModels
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AvailableModels]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AvailableModels](
        [AvailableModelsId] [int] IDENTITY(1,1) NOT NULL,
        [ModelName] [nvarchar](200) NOT NULL,
        [FileName] [nvarchar](500) NOT NULL, -- e.g. airplane.glb
        [Thumbnail] [nvarchar](500) NULL,    -- e.g. airplane.jpg
        [DefaultScaleX] [decimal](10, 4) DEFAULT 2,
        [DefaultScaleY] [decimal](10, 4) DEFAULT 2,
        [DefaultScaleZ] [decimal](10, 4) DEFAULT 2,
        [DefaultRotationX] [decimal](10, 4) DEFAULT 90,
        [DefaultRotationY] [decimal](10, 4) DEFAULT 90,
        [DefaultRotationZ] [decimal](10, 4) DEFAULT 1,
        [IsActive] [bit] DEFAULT 1,
        [CreatedAt] [datetime] DEFAULT GETDATE(),
        [UpdatedAt] [datetime] DEFAULT GETDATE(),
     CONSTRAINT [PK_AvailableModels] PRIMARY KEY CLUSTERED 
    (
        [AvailableModelsId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- 2. Stored Procedure: SP_SyncAvailableModel
-- Upserts based on FileName
CREATE OR ALTER PROCEDURE [dbo].[SP_SyncAvailableModel]
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

-- 3. Stored Procedure: SP_GetAvailableModels
CREATE OR ALTER PROCEDURE [dbo].[SP_GetAvailableModels]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM AvailableModels WHERE IsActive = 1 ORDER BY ModelName;
END
GO
