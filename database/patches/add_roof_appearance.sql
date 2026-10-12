IF OBJECT_ID(N'dbo.MapRoofAppearance', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MapRoofAppearance (
        MapID NVARCHAR(100) NOT NULL PRIMARY KEY,
        ConfigJson NVARCHAR(MAX) NOT NULL CHECK (ISJSON(ConfigJson) = 1),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
