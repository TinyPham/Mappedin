IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'direction_connector_and')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('direction_connector_and', 'action', N'và', N'and', N'并', N'そして', N'그리고');
GO

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_turn_left_lower')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('action_turn_left_lower', 'action', N'rẽ trái', N'turn left', N'左转', N'左折', N'좌회전');
GO

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_turn_right_lower')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('action_turn_right_lower', 'action', N'rẽ phải', N'turn right', N'右转', N'右折', N'우회전');
GO

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_go_straight_lower')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('action_go_straight_lower', 'action', N'đi thẳng', N'go straight', N'直行', N'直進', N'직진');
GO

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'at_floor_label')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('at_floor_label', 'label', N'tại', N'at', N'在', N'で', N'에서');
GO

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'connection_direction_up')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('connection_direction_up', 'action', N'lên', N'up', N'上', N'上へ', N'위로');
GO

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'connection_direction_down')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES ('connection_direction_down', 'action', N'xuống', N'down', N'下', N'下へ', N'아래로');
GO
