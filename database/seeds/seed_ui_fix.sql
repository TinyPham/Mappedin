-- ============================================
-- UI & LANGUAGE UPDATE SCRIPT
-- Target Database: MappedIn3DModels
-- ============================================
USE [MappedIn3DModels]
GO

-- Clean up existing and re-seed
DELETE FROM Translation_UI;
GO

INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('directions_btn', 'label', N'Dẫn đường', N'Directions', N'导航', N'ナビ', N'길찾기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('from', 'label', N'Đi từ:', N'From:', N'起点：', N'出発地：', N'출발:');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('to', 'label', N'Đi đến:', N'To:', N'终点：', N'到着地：', N'도착:');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('clear', 'label', N'Xóa', N'Clear', N'清除', N'クリア', N'지우기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('start_preview', 'label', N'Bắt đầu', N'Start', N'开始', N'スタート', N'시작');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('route_preview', 'label', N'Xem trước lộ trình', N'Route Preview', N'路线预览', N'ルートプレビュー', N'경로 미리보기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('route_found', 'badge', N'Đã tìm thấy đường đi', N'Route found', N'已找到路线', N'ルートが見つかりました', N'경로를 찾았습니다');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_departure', 'action', N'Khởi hành', N'Departure', N'出发', N'出発', N'출발');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_arrival', 'action', N'Kết thúc', N'Arrival', N'到达', N'到着', N'도착');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_stopover', 'action', N'Điểm dừng', N'Stopover', N'经停点', N'経由地', N'경유지');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_continue', 'action', N'Tiếp tục', N'Continue', N'继续', N'直進', N'계속');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_go_straight', 'action', N'Đi thẳng', N'Go straight', N'直行', N'直進', N'직진');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn_left', 'action', N'Rẽ trái', N'Turn left', N'左转', N'左折', N'좌회전');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn_right', 'action', N'Rẽ rải', N'Turn right', N'右转', N'右折', N'우회전');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_slight_left', 'action', N'Rẽ trái nhẹ', N'Slight left', N'向左微转', N'左に少し曲がる', N'약간 좌회전');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_slight_right', 'action', N'Rẽ phải nhẹ', N'Slight right', N'向右微转', N'右に少し曲がる', N'약간 우회전');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn_around', 'action', N'Quay lại', N'Turn around', N'掉头', N'戻る', N'되돌아가기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_enter', 'action', N'Vào', N'Enter', N'进入', N'入る', N'입력');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_exit', 'action', N'Ra', N'Exit', N'离开', N'出る', N'출구');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_take_connection', 'action', N'Đi qua cổng liên kết', N'Take connection', N'采取连接', N'乗り継ぎ', N'연결 이용');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_exit_connection', 'action', N'Rời khỏi liên kết', N'Exit connection', N'离开连接', N'連絡通路を出る', N'연결 종료');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('elevator', 'object', N'thang máy', N'elevator', N'电梯', N'エレベーター', N'엘리베이터');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('escalator', 'object', N'thang cuốn', N'escalator', N'自动扶梯', N'エスカレーター', N'에스컬레이터');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('direction_up', 'object', N'đi lên', N'go up', N'向上', N'上へ', N'위로');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('direction_down', 'object', N'đi xuống', N'go down', N'向下', N'下へ', N'아래로');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('speed_label', 'label', N'Tốc độ:', N'Speed:', N'速度:', N'速度:', N'속도:');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('minute_label', 'time', N'phút', N'min', N'分', N'分', N'분');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('second_label', 'time', N'giây', N'sec', N'秒', N'秒', N'초');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('minute_label_short', 'time', N'phút', N'min', N'分', N'分', N'분');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('add_model', 'label', N'Thêm model 3D', N'Add 3D Model', N'添加3D模型', N'3Dモデル追加', N'3D 모델 추가');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('classification_btn', 'label', N'Phân loại khu vực', N'Area Classification', N'区域分类', N'エリア分類', N'구역 분류');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('select_model_title', 'title', N'Chọn mô hình 3D', N'Select 3D Model', N'选择3D模型', N'3Dモデル選択', N'3D 모델 선택');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('classification_title', 'title', N'Phân loại khu vực', N'Area Classification', N'区域分类', N'エリア分類', N'구역 분류');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('main_categories', 'title', N'Danh mục chính', N'Main Categories', N'主分类', N'メインカテゴリ', N'주요 카테고리');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('sub_categories', 'title', N'Danh mục con', N'Subcategories', N'子分类', N'サブカテゴリ', N'하위 카테고리');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('search_placeholder', 'placeholder', N'Tìm kiếm khu vực, điểm đến...', N'Search areas, destinations...', N'搜索区域、目的地...', N'エリア・目的地を検索...', N'구역, 목적지 검색...');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('search_departure_placeholder', 'placeholder', N'Tìm điểm đi', N'Search Departure', N'搜索起点', N'出発地を検索', N'출발지 검색');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('search_destination_placeholder', 'placeholder', N'Tìm điểm đến', N'Search Destination', N'搜索终点', N'目的地を検索', N'목적지 검색');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('need_directions', 'label', N'Bạn cần chỉ đường?', N'Need directions?', N'需要路线指引吗？', N'経路案内が必要ですか？', N'길찾기가 필요하신가요?');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('step_by_step', 'label', N'CHỈ DẪN LỘ TRÌNH', N'ROUTE GUIDANCE', N'路线指南', N'経路案内', N'경로 안내');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('not_found', 'error', N'Không tìm thấy đường đi', N'Route not found', N'未找到路线', N'ルートが見つかりません', N'경로를 찾을 수 없습니다');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('error_nav', 'error', N'Lỗi khi tìm đường đi', N'Error finding route', N'寻道错误', N'ルート検索エラー', N'경로 검색 오류');