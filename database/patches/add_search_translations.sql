-- Add or Update 'locations_count' key
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'locations_count')
BEGIN
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('locations_count', 'label', N'vị trí', N'locations', N'个位置', N'か所', N'위치');
END
ELSE
BEGIN
    UPDATE Translation_UI SET VN = N'vị trí', EN = N'locations', ZH = N'个位置', JA = N'か所', KO = N'위치' 
    WHERE KeyCode = 'locations_count';
END
GO

-- Add or Update 'no_results_found' key
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'no_results_found')
BEGIN
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('no_results_found', 'label', N'Không tìm thấy kết quả', N'No results found', N'未找到结果', N'结果が見つかりません', N'검색 결과가 없습니다');
END
ELSE
BEGIN
    UPDATE Translation_UI SET VN = N'Không tìm thấy kết quả', EN = N'No results found', ZH = N'未找到结果', JA = N'结果が見つかりません', KO = N'검색 결과가 없습니다' 
    WHERE KeyCode = 'no_results_found';
END
GO

-- Add or Update floor labels
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'to_floor_label')
BEGIN
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('to_floor_label', 'label', N'đến', N'to', N'到', N'へ', N'~로');
END
ELSE
BEGIN
    UPDATE Translation_UI SET VN = N'đến', EN = N'to', ZH = N'到', JA = N'へ', KO = N'~로' 
    WHERE KeyCode = 'to_floor_label';
END
GO

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'at_floor_label')
BEGIN
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('at_floor_label', 'label', N'tại', N'at', N'在', N'で', N'에서');
END
ELSE
BEGIN
    UPDATE Translation_UI SET VN = N'tại', EN = N'at', ZH = N'在', JA = N'で', KO = N'에서' 
    WHERE KeyCode = 'at_floor_label';
END
GO

PRINT 'Enhanced UI translation keys for search and wayfinding (UPSERT applied).'
