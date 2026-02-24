-- =============================================
-- Step 1: Create Database
-- =============================================
-- Run this first to create the database
CREATE DATABASE MappedIn3DModels;
GO

-- =============================================
-- Step 2: Use the database
-- =============================================
USE MappedIn3DModels;
GO

-- =============================================
-- Step 3: Create Table
-- =============================================
CREATE TABLE Models3D (
    -- Primary Key (Database Internal ID - auto-increment)
    Model3DID INT IDENTITY(1,1) PRIMARY KEY,
    
    -- UUID: Client-side identifier
    UUID NVARCHAR(50) NOT NULL UNIQUE,
    
    -- Model Information
    ModelName NVARCHAR(200) NULL,
    Description NVARCHAR(500) NULL,
    ModelURL NVARCHAR(500) NOT NULL,
    
    -- Geographic Coordinates (Kinh độ và Vĩ độ)
    Latitude DECIMAL(10, 8) NOT NULL,
    Longitude DECIMAL(11, 8) NOT NULL,
    
    -- Floor Information
    FloorId NVARCHAR(100) NULL,
    FloorName NVARCHAR(100) NULL,
    
    -- Rotation (X, Y, Z in degrees)
    RotationX DECIMAL(10, 4) NOT NULL DEFAULT 0,
    RotationY DECIMAL(10, 4) NOT NULL DEFAULT 0,
    RotationZ DECIMAL(10, 4) NOT NULL DEFAULT 0,
    
    -- Scale (X, Y, Z)
    ScaleX DECIMAL(10, 4) NOT NULL DEFAULT 1,
    ScaleY DECIMAL(10, 4) NOT NULL DEFAULT 1,
    ScaleZ DECIMAL(10, 4) NOT NULL DEFAULT 1,
    
    -- Soft Delete Flag
    IsDeleted BIT DEFAULT 0, 
    
    -- Metadata
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CreatedBy NVARCHAR(100) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT CHK_Latitude CHECK (Latitude BETWEEN -90 AND 90),
    CONSTRAINT CHK_Longitude CHECK (Longitude BETWEEN -180 AND 180)
);
GO

-- =============================================
-- Step 4: Create Indexes
-- =============================================
CREATE INDEX IX_Models3D_UUID ON Models3D(UUID);
CREATE INDEX IX_Models3D_FloorId ON Models3D(FloorId);
CREATE INDEX IX_Models3D_IsActive ON Models3D(IsActive);
CREATE INDEX IX_Models3D_CreatedAt ON Models3D(CreatedAt DESC);
GO

-- =============================================
-- Step 5: Create Update Trigger
-- =============================================
CREATE TRIGGER TR_Models3D_UpdateTimestamp
ON Models3D
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Models3D
    SET UpdatedAt = GETDATE()
    FROM Models3D m
    INNER JOIN inserted i ON m.Model3DID = i.Model3DID;
END;
GO

-- =============================================
-- Step 6: Insert Initial Data (5 Airplanes)
-- =============================================
INSERT INTO Models3D 
    (UUID, ModelName, Description, ModelURL, Latitude, Longitude, FloorId, 
     RotationX, RotationY, RotationZ, ScaleX, ScaleY, ScaleZ)
VALUES
    ('airplane-1', '', 'Static Model', './Model3D/airplane.glb', 
     10.77315555, 107.03798811, NULL, 90, 124, 15, 30, 30, 30),
    
    ('airplane-2', '', 'Static Model', './Model3D/airplane.glb', 
     10.77282996, 107.03720583, NULL, 90, 124, 15, 30, 30, 30),
    
    ('airplane-3', '', 'Static Model', './Model3D/airplane.glb', 
     10.77282031, 107.03651169, NULL, 90, 124, 15, 30, 30, 30),
    
    ('airplane-4', '', 'Static Model', './Model3D/airplane.glb', 
     10.77374222, 107.03846897, NULL, 90, 124, 15, 30, 30, 30),
    
    ('airplane-5', '', 'Static Model', './Model3D/airplane.glb', 
     10.77462295, 107.03855908, NULL, 90, 124, 15, 30, 30, 30);
GO

-- =============================================
-- Step 7: Verify Data
-- =============================================
SELECT * FROM Models3D;
GO

PRINT '✅ Database created successfully!';
PRINT '✅ Table Models3D created with 5 initial records';
