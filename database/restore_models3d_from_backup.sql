-- =============================================
-- Script: Restore Models3D data from backup
-- Date: 2026-01-21
-- =============================================

-- Step 1: Restore backup to temporary database
-- (Uncomment and modify paths if needed)

/*
RESTORE DATABASE [MappedIn3DModels_Backup_Temp]
FROM DISK = N'C:\Backup-SQL\BACKUP-SQL-MAPPEDIN\backup-mappedin-17012026.bak'
WITH MOVE 'MappedIn3DModels' TO N'C:\Backup-SQL\TEMP\MappedIn3DModels_Backup_Temp.mdf',
     MOVE 'MappedIn3DModels_log' TO N'C:\Backup-SQL\TEMP\MappedIn3DModels_Backup_Temp_log.ldf',
     REPLACE,
     STATS = 5;
GO
*/

-- Step 2: View data from the restored backup (after restore completes)
-- Run this to see what data exists in the backup:

/*
USE [MappedIn3DModels_Backup_Temp]
GO

SELECT * FROM [dbo].[Models3D]
ORDER BY CreatedAt;
GO
*/

-- Step 3: Generate INSERT statements to restore data to current database
-- This will output INSERT statements you can run on your main database

/*
USE [MappedIn3DModels_Backup_Temp]
GO

SELECT 
    'INSERT INTO [MappedIn3DModels].[dbo].[Models3D] ' +
    '([UUID], [ModelName], [Description], [ModelURL], [Latitude], [Longitude], ' +
    '[FloorId], [FloorName], [RotationX], [RotationY], [RotationZ], ' +
    '[ScaleX], [ScaleY], [ScaleZ], [CreatedAt], [IsActive]) VALUES (' +
    '''' + ISNULL([UUID], '') + ''', ' +
    '''' + ISNULL(REPLACE([ModelName], '''', ''''''), '') + ''', ' +
    '''' + ISNULL(REPLACE([Description], '''', ''''''), '') + ''', ' +
    '''' + ISNULL([ModelURL], '') + ''', ' +
    CAST([Latitude] AS NVARCHAR(50)) + ', ' +
    CAST([Longitude] AS NVARCHAR(50)) + ', ' +
    '''' + ISNULL([FloorId], '') + ''', ' +
    'NULL, ' +
    CAST(ISNULL([RotationX], 0) AS NVARCHAR(20)) + ', ' +
    CAST(ISNULL([RotationY], 0) AS NVARCHAR(20)) + ', ' +
    CAST(ISNULL([RotationZ], 0) AS NVARCHAR(20)) + ', ' +
    CAST(ISNULL([ScaleX], 1) AS NVARCHAR(20)) + ', ' +
    CAST(ISNULL([ScaleY], 1) AS NVARCHAR(20)) + ', ' +
    CAST(ISNULL([ScaleZ], 1) AS NVARCHAR(20)) + ', ' +
    '''' + CONVERT(NVARCHAR(30), [CreatedAt], 120) + ''', ' +
    CAST(ISNULL([IsActive], 1) AS NVARCHAR(1)) + ');'
FROM [dbo].[Models3D]
WHERE [IsDeleted] = 0 OR [IsDeleted] IS NULL;
GO
*/

-- Step 4: After copying data, drop the temp database
/*
USE [master]
GO
DROP DATABASE [MappedIn3DModels_Backup_Temp];
GO
*/

-- =============================================
-- ALTERNATIVE: Quick File List from Backup (without restore)
-- This shows what's in the backup file without restoring
-- =============================================

RESTORE FILELISTONLY 
FROM DISK = N'C:\Backup-SQL\BACKUP-SQL-MAPPEDIN\backup-mappedin-17012026.bak';
GO

-- Show backup header info
RESTORE HEADERONLY 
FROM DISK = N'C:\Backup-SQL\BACKUP-SQL-MAPPEDIN\backup-mappedin-17012026.bak';
GO
