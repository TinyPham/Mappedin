-- =============================================
-- Fix Categories and SubCategories Schema
-- Add back CategoryName and SubCategoryName columns
-- =============================================

-- Add CategoryName column to Categories if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND name = 'CategoryName')
BEGIN
    ALTER TABLE Categories ADD CategoryName NVARCHAR(255) NULL
    PRINT 'Added CategoryName column to Categories table'
END
GO

-- Add SubCategoryName column to SubCategories if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND name = 'SubCategoryName')
BEGIN
    ALTER TABLE SubCategories ADD SubCategoryName NVARCHAR(255) NULL
    PRINT 'Added SubCategoryName column to SubCategories table'
END
GO

-- Drop VN, EN, ZH, JA, KO columns from Categories if they exist
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND name = 'VN')
BEGIN
    ALTER TABLE Categories DROP COLUMN VN
    PRINT 'Dropped VN column from Categories table'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND name = 'EN')
BEGIN
    ALTER TABLE Categories DROP COLUMN EN
    PRINT 'Dropped EN column from Categories table'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND name = 'ZH')
BEGIN
    ALTER TABLE Categories DROP COLUMN ZH
    PRINT 'Dropped ZH column from Categories table'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND name = 'JA')
BEGIN
    ALTER TABLE Categories DROP COLUMN JA
    PRINT 'Dropped JA column from Categories table'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND name = 'KO')
BEGIN
    ALTER TABLE Categories DROP COLUMN KO
    PRINT 'Dropped KO column from Categories table'
END
GO

-- Drop VN, EN, ZH, JA, KO columns from SubCategories if they exist
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND name = 'VN')
BEGIN
    ALTER TABLE SubCategories DROP COLUMN VN
    PRINT 'Dropped VN column from SubCategories table'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND name = 'EN')
BEGIN
    ALTER TABLE SubCategories DROP COLUMN EN
    PRINT 'Dropped EN column from SubCategories table'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND name = 'ZH')
BEGIN
    ALTER TABLE SubCategories DROP COLUMN ZH
    PRINT 'Dropped ZH column from SubCategories table'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND name = 'JA')
BEGIN
    ALTER TABLE SubCategories DROP COLUMN JA
    PRINT 'Dropped JA column from SubCategories table'
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND name = 'KO')
BEGIN
    ALTER TABLE SubCategories DROP COLUMN KO
    PRINT 'Dropped KO column from SubCategories table'
END
GO

PRINT 'Schema fix completed successfully!'
PRINT 'Categories table now has: CategoryID, CategoryName, IconPath, DisplayOrder'
PRINT 'SubCategories table now has: SubCategoryID, CategoryID, SubCategoryName, IconPath, DisplayOrder'
