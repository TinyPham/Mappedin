IF OBJECT_ID(N'dbo.AreaVisualOverrides', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AreaVisualOverrides (
        MappedinID NVARCHAR(100) NOT NULL PRIMARY KEY,
        StyleJson NVARCHAR(MAX) NOT NULL CHECK (ISJSON(StyleJson) = 1),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
