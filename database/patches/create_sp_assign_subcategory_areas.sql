/*
Purpose:
  Create a stored procedure candidate for assigning Mappedin areas to one
  subcategory. This mirrors the current backend behavior and is intended to be
  reviewed/run manually in SSMS before the backend is switched to call it.

Usage example in SSMS:

  DECLARE @MappedinIDs dbo.MappedinIDList;
  INSERT INTO @MappedinIDs (MappedinID) VALUES (N'm_area_1'), (N'm_area_2');
  EXEC dbo.SP_AssignSubCategoryAreas
      @SubCategoryID = 1,
      @MappedinIDs = @MappedinIDs;
*/

IF TYPE_ID(N'dbo.MappedinIDList') IS NULL
BEGIN
    CREATE TYPE dbo.MappedinIDList AS TABLE
    (
        MappedinID NVARCHAR(100) NOT NULL PRIMARY KEY
    );
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_AssignSubCategoryAreas
    @SubCategoryID INT,
    @MappedinIDs dbo.MappedinIDList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM dbo.AreaCategory
        WHERE SubCategoryID = @SubCategoryID;

        INSERT INTO dbo.AreaList (MappedinID, Name, VN, EN)
        SELECT ids.MappedinID, ids.MappedinID, ids.MappedinID, ids.MappedinID
        FROM @MappedinIDs AS ids
        WHERE NOT EXISTS (
            SELECT 1
            FROM dbo.AreaList AS existing
            WHERE existing.MappedinID = ids.MappedinID
        );

        DELETE ac
        FROM dbo.AreaCategory AS ac
        INNER JOIN dbo.AreaList AS al
            ON al.AreaListID = ac.AreaListID
        INNER JOIN @MappedinIDs AS ids
            ON ids.MappedinID = al.MappedinID;

        INSERT INTO dbo.AreaCategory (AreaListID, SubCategoryID)
        SELECT al.AreaListID, @SubCategoryID
        FROM dbo.AreaList AS al
        INNER JOIN @MappedinIDs AS ids
            ON ids.MappedinID = al.MappedinID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
GO
