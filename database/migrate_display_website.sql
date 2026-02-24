-- =============================================
-- Migration: Add DisplayWebsite to Models3D
-- =============================================

USE MappedIn3DModels;
GO

-- 1. Add Column if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Models3D]') AND name = N'DisplayWebsite')
BEGIN
    ALTER TABLE [dbo].[Models3D] ADD [DisplayWebsite] BIT NOT NULL DEFAULT 0;
    PRINT '✅ Column DisplayWebsite added to Models3D';
END
GO

-- 2. Update SP_GetModelByUUID
CREATE OR ALTER PROCEDURE SP_GetModelByUUID
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
        DisplayWebsite
    FROM Models3D
    WHERE UUID = @UUID AND IsDeleted = 0;
END
GO

-- 3. Update SP_GetAllModels
CREATE OR ALTER PROCEDURE SP_GetAllModels
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * 
    FROM Models3D 
    WHERE IsDeleted = 0
    ORDER BY CreatedAt DESC;
END
GO

-- 4. Update SP_UpsertModel
CREATE OR ALTER PROCEDURE SP_UpsertModel
    @UUID NVARCHAR(50),
    @ModelName NVARCHAR(200),
    @Description NVARCHAR(500),
    @ModelURL NVARCHAR(500),
    @Latitude DECIMAL(18, 10),
    @Longitude DECIMAL(18, 10),
    @FloorId NVARCHAR(100),
    @FloorName NVARCHAR(100),
    @RotationX DECIMAL(18, 4),
    @RotationY DECIMAL(18, 4),
    @RotationZ DECIMAL(18, 4),
    @ScaleX DECIMAL(18, 4),
    @ScaleY DECIMAL(18, 4),
    @ScaleZ DECIMAL(18, 4),
    @DisplayWebsite BIT,
    @CreatedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    MERGE Models3D AS target
    USING (SELECT @UUID AS UUID) AS source
    ON (target.UUID = source.UUID)
    WHEN MATCHED THEN
        UPDATE SET
            ModelName = @ModelName,
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
            IsDeleted = 0, -- Restore if previously deleted
            UpdatedAt = GETDATE()
    WHEN NOT MATCHED THEN
        INSERT (UUID, ModelName, Description, ModelURL, Latitude, Longitude, FloorId, FloorName, RotationX, RotationY, RotationZ, ScaleX, ScaleY, ScaleZ, DisplayWebsite, CreatedBy, CreatedAt, IsDeleted, IsActive)
        VALUES (@UUID, @ModelName, @Description, @ModelURL, @Latitude, @Longitude, @FloorId, @FloorName, @RotationX, @RotationY, @RotationZ, @ScaleX, @ScaleY, @ScaleZ, @DisplayWebsite, @CreatedBy, GETDATE(), 0, 1);
END
GO

PRINT '✅ Models3D schema and procedures updated with DisplayWebsite!';
