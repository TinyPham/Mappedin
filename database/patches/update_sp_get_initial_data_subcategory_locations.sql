CREATE OR ALTER PROCEDURE [dbo].[SP_GetInitialData]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM MasterData_Languages WHERE IsActive = 1 ORDER BY SortOrder;

    SELECT UIKeyId, KeyCode, KeyType, VN, EN, ZH, JA, KO
    FROM Translation_UI;

    SELECT CategoryID, IconPath, CategoryName AS VN, EN, ZH, JA, KO
    FROM Categories
    ORDER BY DisplayOrder, CategoryName;

    SELECT SubCategoryID, CategoryID, IconPath, SubCategoryName AS VN, EN, ZH, JA, KO
    FROM SubCategories
    ORDER BY DisplayOrder, SubCategoryName;

    SELECT FloorId, MappedinId, FloorCode, SortOrder, VN, EN, ZH, JA, KO
    FROM Translation_Floors
    ORDER BY SortOrder;

    SELECT
        AL.AreaListID,
        AL.MappedinID,
        AL.VN, AL.EN, AL.ZH, AL.JA, AL.KO,
        AI.RunUrl,
        AI.UIImageUrl,
        AI.MappedinImageUrl,
        AI.InformationVI,
        AI.InformationEN,
        AI.InformationZH,
        AI.InformationJA,
        AI.InformationKO,
        AI.Phone,
        AI.OpeningHours,
        AI.LocationDetail_VN,
        AI.LocationDetail_EN,
        AI.LocationDetail_ZH,
        AI.LocationDetail_JA,
        AI.LocationDetail_KO,
        AC.SubCategoryID,
        SC.CategoryID,
        SC.IconPath AS SubCategoryIconPath,
        SC.SubCategoryName AS SubCategoryVN,
        SC.EN AS SubCategoryEN,
        SC.ZH AS SubCategoryZH,
        SC.JA AS SubCategoryJA,
        SC.KO AS SubCategoryKO
    FROM AreaList AL
    LEFT JOIN AreaCategory AC ON AL.AreaListID = AC.AreaListID
    LEFT JOIN SubCategories SC ON AC.SubCategoryID = SC.SubCategoryID
    LEFT JOIN AreaInformation AI ON AL.AreaListID = AI.AreaListID;
END
GO

