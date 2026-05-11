-- =============================================
-- SQL Script: Bổ sung các bản dịch còn thiếu cho UI Chuyến bay
-- Ngày: 08/05/2026
-- =============================================

USE [MappedIn3DModels]
GO

-- Bổ sung các key đang dùng trong index.ts và index.html
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'loading_flights')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'loading_flights', N'status', N'Đang tải dữ liệu chuyến bay...', N'Loading flight data...', N'正在加载航班数据...', N'フライトデータを読み込み中...', N'비행 데이터 로딩 중...');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_empty')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_empty', N'status', N'Không có chuyến bay phù hợp.', N'No matching flights found.', N'未找到匹配的航班。', N'該当するフライトが見つかりません。', N'일치하는 비행이 없습니다.');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'find_route')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'find_route', N'action', N'Tìm đường', N'Find Route', N'查找路线', N'ルート検索', N'경로 찾기');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'nav_blocked_by_status')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'nav_blocked_by_status', N'label', N'Tính năng dẫn đường tạm khóa do trạng thái: {status}', N'Navigation unavailable due to status: {status}', N'由于状态原因，导航不可用：{status}', N'ステータスのためナビゲーションを利用できません: {status}', N'상태로 인해 길찾기를 사용할 수 없습니다: {status}');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'issue_missing_gate')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'issue_missing_gate', N'error', N'Chuyến bay chưa có dữ liệu gate.', N'Gate data missing for this flight.', N'此航班缺少登机口数据。', N'このフライトのゲートデータがありません。', N'이 비행의 게이트 데이터가 없습니다.');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'issue_no_gate_mapping')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'issue_no_gate_mapping', N'error', N'Chưa cấu hình mapping gate cho chuyến bay này.', N'Gate mapping not configured for this flight.', N'未为此航班配置登机口映射。', N'このフライトのゲートマッピングが設定されていません。', N'이 비행의 게이트 매핑이 구성되지 않았습니다.');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'error_load_flights')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'error_load_flights', N'error', N'Không tải được danh sách chuyến bay', N'Failed to load flight list', N'无法加载航班列表', N'フライトリストの読み込みに失敗しました', N'비행 목록을 불러오지 못했습니다');

PRINT N'✅ Đã bổ sung các bản dịch còn thiếu cho UI Chuyến bay.';
GO
