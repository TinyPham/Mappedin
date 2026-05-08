-- =============================================
-- SQL Script: Bổ sung các bản dịch thông báo lỗi cho UI Chuyến bay
-- Ngày: 08/05/2026
-- =============================================

USE [MappedIn3DModels]
GO

-- Bổ sung các key thông báo lỗi
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'error_nav_data')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'error_nav_data', N'error', N'Không lấy được dữ liệu điều hướng chuyến bay', N'Failed to fetch flight navigation data', N'无法获取航班导航数据', N'フライトナビゲーションデータの取得に失敗しました', N'비행 길찾기 데이터를 가져오지 못했습니다');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'error_flight_not_found')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'error_flight_not_found', N'error', N'Không tìm thấy dữ liệu chuyến bay', N'Flight data not found', N'未找到航班数据', N'フライトデータが見つかりません', N'비행 데이터를 찾을 수 없습니다');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'error_gate_not_found')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'error_gate_not_found', N'error', N'Không tìm thấy gate trên bản đồ', N'Gate not found on map', N'地图上未找到登机口', N'マップ上にゲートが見つかりません', N'지도에서 게이트를 찾을 수 없습니다');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'error_checkin_not_found')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'error_checkin_not_found', N'error', N'Không tìm thấy check-in trên bản đồ', N'Check-in counter not found on map', N'地图上未找到值机柜台', N'マップ上にチェックインカウンターが見つかりません', N'지도에서 체크인 카운터를 찾을 수 없습니다');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'error_missing_route_points')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'error_missing_route_points', N'error', N'Thiếu gate hoặc check-in để tạo đường đi', N'Missing gate or check-in to create route', N'缺少登机口或值机柜台以创建路线', N'ルート作成に必要なゲートまたはチェックインが不足しています', N'경로를 생성하기 위한 게이트 또는 체크인이 누락되었습니다');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'error_belt_not_found')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'error_belt_not_found', N'error', N'Không tìm thấy băng chuyền trên bản đồ', N'Baggage belt not found on map', N'地图上未找到行李转盘', N'マップ上に手荷物ベルトが見つかりません', N'지도에서 수하물 벨트를 찾을 수 없습니다');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'error_flight_action')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'error_flight_action', N'error', N'Không thực hiện được thao tác chuyến bay', N'Failed to perform flight action', N'无法执行航班操作', N'フライト操作を実行できませんでした', N'비행 작업을 수행하지 못했습니다');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'issue_missing_checkin')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'issue_missing_checkin', N'error', N'Chuyến bay chưa có dữ liệu check-in.', N'Check-in data missing for this flight.', N'此航班缺少值机数据。', N'このフライトのチェックインデータがありません。', N'이 비행의 체크인 데이터가 없습니다.');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'issue_no_checkin_mapping')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'issue_no_checkin_mapping', N'error', N'Chưa cấu hình mapping check-in cho chuyến bay này.', N'Check-in mapping not configured for this flight.', N'未为此航班配置值机映射。', N'このフライトのチェックインマッピングが設定されていません。', N'이 비행의 체크인 매핑이 구성되지 않았습니다.');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'issue_missing_belt')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'issue_missing_belt', N'error', N'Chuyến bay chưa có dữ liệu băng chuyền.', N'Baggage belt data missing for this flight.', N'此航班缺少行李转盘数据。', N'このフライトの手荷物ベルトデータがありません。', N'이 비행의 수하물 벨트 데이터가 없습니다.');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'issue_no_belt_mapping')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'issue_no_belt_mapping', N'error', N'Chưa cấu hình mapping băng chuyền cho chuyến bay này.', N'Baggage belt mapping not configured for this flight.', N'未为此航班配置行李转盘映射。', N'このフライトの手荷物ベルトマッピングが設定されていません。', N'이 비행의 수하물 벨트 매핑이 구성되지 않았습니다.');

PRINT N'✅ Đã bổ sung các bản dịch thông báo lỗi cho UI Chuyến bay.';
GO
