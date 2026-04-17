-- Insert new placeholder keys for Wayfinding selection
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'select_origin_placeholder')
BEGIN
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('select_origin_placeholder', 'placeholder', 
            N'Chưa chọn điểm đi', N'Please select origin', 
            N'未选择起点', N'出発地を選択してください', N'출발지 미선택');
END

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'select_destination_placeholder')
BEGIN
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('select_destination_placeholder', 'placeholder', 
            N'Chưa chọn điểm đến', N'Please select destination', 
            N'未选择终点', N'目的地を選択してください', N'목적지 미선택');
END

-- Ensure status keys exist (as requested by user, though they likely do)
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'select_origin')
BEGIN
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('select_origin', 'status', 
            N'Vui lòng chọn điểm đi trên bản đồ', N'Please select a starting point on the map', 
            N'请在地图上选择起点', N'地図上で出発地を選択してください', N'지도에서 출발지를 선택하세요');
END

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'select_destination')
BEGIN
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('select_destination', 'status', 
            N'Vui lòng chọn điểm đến trên bản đồ', N'Please select a destination on the map', 
            N'请在地图上选择目的地', N'地図上で到着地を選択してください', N'지도에서 목적지를 선택하세요');
END

PRINT 'Updated UI translation keys.'
