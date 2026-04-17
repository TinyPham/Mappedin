-- ========================================
-- FIX MODELS3D DATA ISSUES
-- ========================================
-- This script fixes:
-- 1. URL paths: Replace '/Model3D/' with './Model3D/'
-- 2. FloorId values: Update to match actual Mappedin floor IDs

-- ========================================
-- STEP 1: Fix URL Paths
-- ========================================
-- Replace '/Model3D/' with './Model3D/' to fix 404 errors

UPDATE [dbo].[Models3D]
SET ModelURL = REPLACE(ModelURL, '/Model3D/', './Model3D/')
WHERE ModelURL LIKE '/Model3D/%';

PRINT 'Fixed URL paths: Replaced /Model3D/ with ./Model3D/';

-- ========================================
-- STEP 2: Fix FloorId Values
-- ========================================
-- Actual Floor IDs from Mappedin map data:
-- Overview:                    f_b370ebc2bc0fe8db
-- Tầng trệt (GF):              m_dae8f26a40f6017f  
-- Tầng 1 - Tầng đến (1F):      m_41a38d6d0411d397

-- Fix common typos/mismatches in FloorId

-- Fix Overview floor IDs (typo: e9db -> e8db)
UPDATE [dbo].[Models3D]
SET FloorId = 'f_b370ebc2bc0fe8db'
WHERE FloorId LIKE 'f_b370ebc2bc0fe%' 
  AND FloorId != 'f_b370ebc2bc0fe8db';

-- Fix GF floor IDs (common pattern: m_dee -> m_dae, etc.)
UPDATE [dbo].[Models3D]
SET FloorId = 'm_dae8f26a40f6017f'
WHERE FloorId LIKE 'm_dee8f26a%'
   OR FloorId LIKE 'm_dae8f26a4d%';  -- Also fix any partial matches

PRINT 'Fixed FloorId values to match actual Mappedin floor IDs';

-- ========================================
-- STEP 3: Verify the fixes
-- ========================================
SELECT 
    UUID,
    ModelName,
    ModelURL,
    FloorId,
    CASE 
        WHEN FloorId = 'f_b370ebc2bc0fe8db' THEN 'Overview'
        WHEN FloorId = 'm_dae8f26a40f6017f' THEN 'Tầng trệt (GF)'
        WHEN FloorId = 'm_41a38d6d0411d397' THEN 'Tầng 1 (1F)'
        ELSE 'OTHER/UNKNOWN'
    END AS FloorName
FROM [dbo].[Models3D]
WHERE IsDeleted = 0
ORDER BY Model3DID;

PRINT 'Verification complete. Check the results above.';
