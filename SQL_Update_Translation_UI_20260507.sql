-- =============================================
-- SQL Script: Cập nhật Translation_UI và Translation_Floors
-- Ngày: 07/05/2026
-- Mục đích: Bổ sung 31 key UI đang thiếu trong bảng Translation_UI
--           và sửa tên tầng Overview từ "Toàn cảnh" thành "Tổng quan"
-- =============================================

USE [MappedIn3DModels]
GO

-- =============================================
-- PHẦN 1: CẬP NHẬT Translation_Floors
-- Sửa tên VN cho Overview từ "Toàn cảnh" → "Tổng quan"
-- =============================================

-- 1a. Sửa tên tầng Overview
UPDATE [dbo].[Translation_Floors]
SET [VN] = N'Tổng quan'
WHERE [FloorCode] = 'OVERVIEW';

-- 1b. Đảm bảo tên tầng trệt và các tầng đúng chuẩn
UPDATE [dbo].[Translation_Floors] SET [VN] = N'Tầng trệt' WHERE [FloorCode] = 'GF';
UPDATE [dbo].[Translation_Floors] SET [VN] = N'Tầng 1' WHERE [FloorCode] = '1F';
UPDATE [dbo].[Translation_Floors] SET [VN] = N'Tầng 2' WHERE [FloorCode] = '2F';
UPDATE [dbo].[Translation_Floors] SET [VN] = N'Tầng 3' WHERE [FloorCode] = '3F';

PRINT N'✅ Translation_Floors đã cập nhật xong.';
GO

-- =============================================
-- PHẦN 2: BỔ SUNG 31 KEY THIẾU VÀO Translation_UI
-- Các key này đang chỉ tồn tại trong STATIC_UI_FALLBACKS
-- (hardcode trong index.ts) nhưng chưa có trong DB
-- =============================================

-- Kiểm tra và INSERT từng key (dùng MERGE để tránh trùng lặp)
-- Key: locations_count
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'locations_count')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'locations_count', N'label', N'vị trí', N'locations', N'个位置', N'か所', N'위치');

-- Key: loading_3d_map
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'loading_3d_map')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'loading_3d_map', N'status', N'Đang khởi tạo bản đồ 3D Cảng Hàng không Quốc tế Long Thành...', N'Initializing 3D Map for Long Thanh International Airport...', N'正在初始化龙城国际机场3D地图...', N'ロンタイン国際空港の3Dマップを初期化中...', N'롱탄 국제공항 3D 지도 초기화 중...');

-- Key: loading_complete
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'loading_complete')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'loading_complete', N'status', N'Hoàn tất!', N'Completed!', N'完成!', N'完了!', N'완료!');

-- Key: flight_status_active
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_status_active')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_status_active', N'status', N'Đang khai thác', N'Active', N'运营中', N'運航中', N'운항 중');

-- Key: searching
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'searching')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'searching', N'status', N'Đang tìm...', N'Searching...', N'搜索中...', N'検索中...', N'검색 중...');

-- Key: to_floor_label
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'to_floor_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'to_floor_label', N'label', N'đến', N'to', N'到', N'へ', N'~로');

-- Key: at_floor_label
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'at_floor_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'at_floor_label', N'label', N'tại', N'at', N'在', N'で', N'에서');

-- Key: no_results_found
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'no_results_found')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'no_results_found', N'error', N'Không tìm thấy kết quả', N'No results found', N'未找到结果', N'結果が見つかりません', N'검색 결과가 없습니다');

-- Key: towards
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'towards')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'towards', N'action', N'về hướng', N'towards', N'往', N'方向', N'방향으로');

-- Key: near
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'near')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'near', N'action', N'gần', N'near', N'靠近', N'近く', N'근처');

-- Key: past
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'past')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'past', N'action', N'qua', N'past', N'经过', N'通過', N'지나서');

-- Key: step_label
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'step_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'step_label', N'label', N'Bước', N'Step', N'第', N'次', N'단계');

-- Key: action_take
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'action_take')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'action_take', N'action', N'Đi', N'Take', N'乘坐', N'利用', N'타다');

-- Key: action_start
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'action_start')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'action_start', N'action', N'Bắt đầu', N'Start', N'开始', N'開始', N'시작');

-- Key: action_turn
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'action_turn')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'action_turn', N'action', N'Rẽ', N'Turn', N'转向', N'曲がる', N'회전');

-- Key: action_arrive
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'action_arrive')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'action_arrive', N'action', N'Đến nơi', N'Arrive', N'到达', N'到着', N'도착');

-- Key: venue_name
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'venue_name')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'venue_name', N'label', N'Cảng Hàng không Quốc tế Long Thành', N'Long Thanh International Airport', N'龙城国际机场', N'ロンタイン国際空港', N'롱탄 국제공항');

-- Key: linked_floors
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'linked_floors')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'linked_floors', N'label', N'Tầng liên kết', N'Connected Floors', N'连接楼层', N'接続フロア', N'연결된 층');

-- Key: route_start
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'route_start')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'route_start', N'action', N'Đi từ đây', N'Start', N'从这出发', N'ここから', N'여기서 출발');

-- Key: route_via
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'route_via')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'route_via', N'action', N'Điểm dừng', N'Via', N'经过', N'経由', N'경유');

-- Key: route_end
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'route_end')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'route_end', N'action', N'Tới đây', N'End', N'到这里', N'ここまで', N'여기까지');

-- Key: tab_search
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'tab_search')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'tab_search', N'label', N'Tìm kiếm', N'Search', N'搜索', N'検索', N'검색');

-- Key: full_route
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'full_route')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'full_route', N'label', N'Chi tiết', N'Full Route', N'完整路线', N'全ルート', N'전체 경로');

-- Key: back_btn
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'back_btn')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'back_btn', N'label', N'Quay lại danh mục', N'Back to categories', N'返回分类', N'カテゴリに戻る', N'카테고리로 돌아가기');

-- Key: area_color_btn
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'area_color_btn')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'area_color_btn', N'label', N'Màu nền khu vực', N'Area background', N'区域背景颜色', N'エリアの背景色', N'구역 배경색');

-- Key: tab_directions
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'tab_directions')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'tab_directions', N'label', N'Chỉ đường', N'Directions', N'路线', N'経路', N'길찾기');

-- Key: from_label
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'from_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'from_label', N'label', N'Đi từ', N'Departure', N'起点', N'出発地', N'출발지');

-- Key: to_label
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'to_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'to_label', N'label', N'Đi đến', N'Destination', N'终点', N'目的地', N'목적지');

-- Key: frequent_locations
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'frequent_locations')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'frequent_locations', N'label', N'Địa điểm gợi ý', N'Frequent Locations', N'常用地点', N'おすすめの場所', N'추천 장소');

-- Key: stopover_label
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'stopover_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'stopover_label', N'label', N'Điểm dừng', N'Stopover', N'中转点', N'経由地', N'경유지');

-- Key: stopover_placeholder
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'stopover_placeholder')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'stopover_placeholder', N'placeholder', N'Chọn điểm dừng', N'Select Stopover', N'选择中转点', N'経由地を選択', N'경유지 선택');

PRINT N'✅ Đã bổ sung 31 key thiếu vào Translation_UI.';
GO

-- =============================================
-- PHẦN 3: KIỂM TRA KẾT QUẢ
-- =============================================

-- Kiểm tra tổng số bản ghi Translation_UI
SELECT 'Translation_UI Total' AS [Table], COUNT(*) AS [RowCount] FROM [dbo].[Translation_UI]
UNION ALL
SELECT 'Translation_Floors Total', COUNT(*) FROM [dbo].[Translation_Floors];

-- Hiển thị tất cả Translation_Floors để xác nhận
SELECT * FROM [dbo].[Translation_Floors] ORDER BY [SortOrder];

-- Hiển thị 5 key mới thêm gần đây nhất
SELECT TOP 5 * FROM [dbo].[Translation_UI] ORDER BY [UIKeyId] DESC;

PRINT N'✅ Script hoàn tất. Vui lòng kiểm tra kết quả ở trên.';
GO
