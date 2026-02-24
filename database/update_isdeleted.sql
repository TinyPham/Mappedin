-- =============================================
-- MIGRATION SCRIPT: ENABLE SOFT DELETE
-- Run this script to update your database schema
-- =============================================

USE MappedIn3DModels;
GO

-- 1. ADD IsDeleted COLUMN (IF NOT EXISTS)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Models3D') AND name = 'IsDeleted')
BEGIN
    PRINT '➕ Adding IsDeleted column...';
    ALTER TABLE dbo.Models3D
    ADD IsDeleted BIT NOT NULL DEFAULT 0;
END
ELSE
BEGIN
    PRINT '✅ IsDeleted column already exists.';
END
GO

-- 2. UPDATE STORED PROCEDURES (Using CREATE OR ALTER)
-- =============================================

PRINT '🔄 Updating Stored Procedures...';
GO

-- SP: GET MODEL BY UUID
CREATE OR ALTER PROCEDURE SP_GetModelByUUID
    @UUID NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM Models3D
    WHERE UUID = @UUID AND IsDeleted = 0;
END
GO

-- SP: GET ALL MODELS
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

-- SP: UPSERT MODEL
CREATE OR ALTER PROCEDURE SP_UpsertModel
    @UUID NVARCHAR(50),
    @ModelName NVARCHAR(200),
    @Description NVARCHAR(500),
    @ModelURL NVARCHAR(500),
    @Latitude DECIMAL(10, 8),
    @Longitude DECIMAL(11, 8),
    @FloorId NVARCHAR(100),
    @FloorName NVARCHAR(100),
    @RotationX DECIMAL(10, 4),
    @RotationY DECIMAL(10, 4),
    @RotationZ DECIMAL(10, 4),
    @ScaleX DECIMAL(10, 4),
    @ScaleY DECIMAL(10, 4),
    @ScaleZ DECIMAL(10, 4),
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
            IsDeleted = 0, -- Restore if previously deleted
            UpdatedAt = GETDATE()
    WHEN NOT MATCHED THEN
        INSERT (UUID, ModelName, Description, ModelURL, Latitude, Longitude, FloorId, FloorName, RotationX, RotationY, RotationZ, ScaleX, ScaleY, ScaleZ, CreatedBy, CreatedAt, IsDeleted, IsActive)
        VALUES (@UUID, @ModelName, @Description, @ModelURL, @Latitude, @Longitude, @FloorId, @FloorName, @RotationX, @RotationY, @RotationZ, @ScaleX, @ScaleY, @ScaleZ, @CreatedBy, GETDATE(), 0, 1);
END
GO

-- SP: DELETE MODEL (SOFT DELETE)
CREATE OR ALTER PROCEDURE SP_DeleteModel
    @UUID NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Models3D 
    SET IsDeleted = 1, 
        UpdatedAt = GETDATE()
    WHERE UUID = @UUID;
END
GO

PRINT '✅ Database update completed successfully!';
