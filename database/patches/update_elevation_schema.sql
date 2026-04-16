-- =============================================
-- Migration Script: Add Elevation to Models3D
-- Script Date: 2026-04-07
-- =============================================

-- 1. Thêm cột Elevation vào bảng Models3D (nếu chưa có)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Models3D') AND name = 'Elevation')
BEGIN
    ALTER TABLE dbo.Models3D ADD Elevation DECIMAL(18, 4) DEFAULT 0;
    PRINT 'Đã thêm cột Elevation vào bảng Models3D.';
END
ELSE
BEGIN
    PRINT 'Cột Elevation đã tồn tại trong bảng Models3D.';
END
GO

-- 2. Cập nhật Stored Procedure SP_UpsertModel để hỗ trợ biến @Elevation
CREATE OR ALTER PROCEDURE [dbo].[SP_UpsertModel]
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
PRINT 'Đã cập nhật Stored Procedure SP_UpsertModel thành công.';
