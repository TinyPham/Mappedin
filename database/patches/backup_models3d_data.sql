-- =============================================
-- Backup Data for [dbo].[Models3D]
-- Date: 2026-01-21
-- Source: User provided data + current database state
-- =============================================

USE [MappedIn3DModels]
GO

-- Clear existing data (OPTIONAL - uncomment if needed)
-- DELETE FROM [dbo].[Models3D];
-- GO

-- =============================================
-- AIRPLANE MODELS (Static Models)
-- =============================================
INSERT INTO [dbo].[Models3D] 
    ([UUID], [ModelName], [Description], [ModelURL], [Latitude], [Longitude], [FloorId], 
     [RotationX], [RotationY], [RotationZ], [ScaleX], [ScaleY], [ScaleZ], [IsActive], [IsDeleted])
VALUES
    ('airplane-1', 'Airplane', 'Static Model', './Model3D/airplane.glb', 
     10.77315555, 107.03798811, NULL, 90, 124, 15, 30, 30, 30, 1, 0),
    
    ('airplane-2', 'Airplane', 'Static Model', './Model3D/airplane.glb', 
     10.77282996, 107.03720583, NULL, 90, 124, 15, 30, 30, 30, 1, 0),
    
    ('airplane-3', 'Airplane', 'Static Model', './Model3D/airplane.glb', 
     10.77282031, 107.03651169, NULL, 90, 124, 15, 30, 30, 30, 1, 0),
    
    ('airplane-4', 'Airplane', 'Static Model', './Model3D/airplane.glb', 
     10.77374222, 107.03846897, NULL, 90, 124, 15, 30, 30, 30, 1, 0),
    
    ('airplane-5', 'Airplane', 'Static Model', './Model3D/airplane.glb', 
     10.77462295, 107.03855908, NULL, 90, 124, 15, 30, 30, 30, 1, 0);
GO

-- =============================================
-- CAR MODELS (Added via Picker - from current DB)
-- =============================================
INSERT INTO [dbo].[Models3D] 
    ([UUID], [ModelName], [Description], [ModelURL], [Latitude], [Longitude], 
     [FloorId], [RotationX], [RotationY], [RotationZ], 
     [ScaleX], [ScaleY], [ScaleZ], [IsActive], [IsDeleted])
VALUES 
    ('car-mm4', 'Car', 'Added via Picker', '/Model3D/car.json', 
     10.7699731594, 107.0364808093, 'f_b370ebc2bc0fe9db', 
     90.0000, 90.0000, 1.0000, 
     2000.0000, 2000.0000, 2000.0000, 1, 0),

    ('car-ka7', 'Car', 'Added via Picker', '/Model3D/car.json', 
     10.7721158930, 107.0397350325, 'm_dee8f26a4df60178', 
     90.0000, 90.0000, 1.0000, 
     2.0000, 2.0000, 2.0000, 1, 0);
GO

-- =============================================
-- AIRPLANE (Added via Picker - from current DB)
-- =============================================
INSERT INTO [dbo].[Models3D] 
    ([UUID], [ModelName], [Description], [ModelURL], [Latitude], [Longitude], 
     [FloorId], [RotationX], [RotationY], [RotationZ], 
     [ScaleX], [ScaleY], [ScaleZ], [IsActive], [IsDeleted])
VALUES 
    ('airplane-rq4z', 'Airplane', 'Added via Picker', '/Model3D/airplane.glb', 
     10.7720790842, 107.0397038941, 'm_dee8f26a4df60178', 
     90.0000, 90.0000, 1.0000, 
     2.0000, 2.0000, 2.0000, 1, 0);
GO

PRINT 'Models3D data restored successfully!';
GO
