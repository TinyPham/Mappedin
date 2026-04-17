-- Add or Update 'towards'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'towards')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('towards', 'label', N'về hướng', N'towards', N'往', N'方向', N'방향으로');
GO

-- Add or Update 'near'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'near')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('near', 'label', N'gần', N'near', N'靠近', N'近く', N'근처');
GO

-- Add or Update 'past'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'past')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('past', 'label', N'qua', N'past', N'经过', N'通過', N'지나서');
GO

-- Add or Update 'step_label'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'step_label')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('step_label', 'label', N'Bước', N'Step', N'第', N'次', N'단계');
GO

-- Add or Update 'step_by_step'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'step_by_step')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('step_by_step', 'label', N'Hướng dẫn từng bước:', N'Step-by-step instructions:', N'逐步说明:', N'ステップバイステップの手順:', N'단계별 지침:');
GO

-- Add or Update 'not_found'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'not_found')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('not_found', 'label', N'Không tìm thấy đường đi', N'Route not found', N'未找到路线', N'ルートが見つかりません', N'경로를 찾을 수 없습니다');
GO

-- Add or Update 'error_nav'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'error_nav')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('error_nav', 'label', N'Lỗi khi tìm đường đi', N'Error finding route', N'寻道错误', N'ルート検索エラー', N'경로 검색 오류');
GO

-- Add or Update 'route_found'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'route_found')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('route_found', 'label', N'Đã tìm thấy đường đi', N'Route found', N'已找到路线', N'ルートが見つかりました', N'경로를 찾았습니다');
GO

-- Add or Update 'elevator'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'elevator')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('elevator', 'label', N'thang máy', N'elevator', N'电梯', N'エレベーター', N'엘리베이터');
GO

-- Add or Update 'escalator'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'escalator')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('escalator', 'label', N'thang cuốn', N'escalator', N'自动扶梯', N'エスカレーター', N'에스컬레이터');
GO

-- Add or Update 'direction_up'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'direction_up')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('direction_up', 'label', N'đi lên', N'go up', N'向上', N'上へ', N'위로');
GO

-- Add or Update 'direction_down'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'direction_down')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('direction_down', 'label', N'đi xuống', N'go down', N'向下', N'下へ', N'아래로');
GO

-- Add or Update 'action_take'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_take')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_take', 'label', N'Đi', N'Take', N'乘坐', N'利用', N'타다');
GO

-- Add or Update 'action_exit_connection'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_exit_connection')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_exit_connection', 'label', N'Ra khỏi', N'Exit from', N'退出', N'出る', N'나가기');
GO

-- Add or Update 'minute_label'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'minute_label')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('minute_label', 'label', N'phút', N'min', N'分', N'分', N'분');
GO

-- Add or Update 'second_label'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'second_label')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('second_label', 'label', N'giây', N'sec', N'秒', N'秒', N'초');
GO

-- Add or Update 'action_start'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_start')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_start', 'label', N'Bắt đầu', N'Start', N'开始', N'開始', N'시작');
GO

-- Add or Update 'action_departure'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_departure')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_departure', 'label', N'Khởi hành', N'Departure', N'出发', N'出発', N'출발');
GO

-- Add or Update 'action_arrival'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_arrival')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_arrival', 'label', N'Kết thúc', N'Arrival', N'到达', N'到着', N'도착');
GO

-- Add or Update 'action_continue'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_continue')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_continue', 'label', N'Tiếp tục', N'Continue', N'继续', N'直進', N'계속');
GO

-- Add or Update 'action_turn'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_turn')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn', 'label', N'Rẽ', N'Turn', N'转向', N'曲がる', N'회전');
GO

-- Add or Update 'action_turn_left'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_turn_left')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn_left', 'label', N'Rẽ trái', N'Turn left', N'左转', N'左折', N'좌회전');
GO

-- Add or Update 'action_turn_right'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_turn_right')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn_right', 'label', N'Rẽ phải', N'Turn right', N'右转', N'右折', N'우회전');
GO

-- Add or Update 'action_turn_around'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_turn_around')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn_around', 'label', N'Quay lại', N'Turn around', N'掉头', N'戻る', N'되돌아가기');
GO

-- Add or Update 'action_arrive'
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'action_arrive')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_arrive', 'label', N'Đến nơi', N'Arrive', N'到达', N'到着', N'도착');
GO
