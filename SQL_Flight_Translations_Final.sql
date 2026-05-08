-- =============================================
-- SQL Script: Bổ sung bản dịch tính năng Thông tin chuyến bay (Chuẩn Hàng Không)
-- Ngày: 07/05/2026
-- =============================================

USE [MappedIn3DModels]
GO

-- 1. Tiêu đề và các nhãn chính trong Modal
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_info_title')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_info_title', N'label', N'Thông tin chuyến bay', N'Flight Information', N'航班信息', N'フライト情報', N'비행 정보');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_departure')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_departure', N'label', N'Chuyến bay đi', N'Departures', N'离港', N'出発', N'출발');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_arrival')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_arrival', N'label', N'Chuyến bay đến', N'Arrivals', N'进港', N'到着', N'도착');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_date_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_date_label', N'label', N'Ngày chuyến bay', N'Flight Date', N'航班日期', N'フライト日', N'비행 날짜');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_search_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_search_label', N'label', N'Tìm kiếm chuyến bay', N'Search Flights', N'搜索航班', N'フライトを検索', N'비행 검색');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_search_placeholder')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_search_placeholder', N'placeholder', N'Nhập số hiệu chuyến bay', N'Enter flight number', N'输入航班号', N'便名を入力してください', N'편명을 입력하세요');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flights_found')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flights_found', N'label', N'chuyến bay', N'flights found', N'个航班', N'フライトが見つかりました', N'비행을 찾았습니다');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_status_filter_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_status_filter_label', N'label', N'Trạng thái', N'Status', N'状态', N'ステータス', N'상태');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_status_all')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_status_all', N'label', N'Tất cả trạng thái', N'All Statuses', N'所有状态', N'すべてのステータス', N'모든 trạng thái');

-- 2. Các nhãn trên thẻ chuyến bay (Card)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'scheduled_time_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'scheduled_time_label', N'label', N'DỰ KIẾN', N'SCHEDULED', N'预计', N'予定', N'예정');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'estimated_time_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'estimated_time_label', N'label', N'ƯỚC TÍNH', N'ESTIMATED', N'估计', N'推定', N'추정');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_gate_tag')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_gate_tag', N'label', N'Cửa', N'Gate', N'登机口', N'搭乗口', N'탑승구');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_checkin_tag')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_checkin_tag', N'label', N'Đảo', N'Island', N'值机岛', N'アイランド', N'아일랜드');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'flight_belt_tag')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'flight_belt_tag', N'label', N'Băng chuyền', N'Belt', N'行李转盘', N'ベルト', N'벨트');

-- 3. Các nút hành động dẫn đường
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'go_to_gate')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'go_to_gate', N'action', N'Dẫn đường đến Cửa', N'Navigate to Gate', N'导览至登机口', N'ゲートへの案内', N'게이트로 안내');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'go_to_checkin')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'go_to_checkin', N'action', N'Dẫn đường đến Check-in', N'Navigate to Check-in', N'导览至值机柜台', N'チェックインへの案内', N'체크인으로 안내');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'go_to_belt')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'go_to_belt', N'action', N'Dẫn đường đến Băng chuyền', N'Navigate to Belt', N'导览至行李转盘', N'ベルトへの案内', N'벨트로 안내');

-- 4. Trạng thái chuyến bay (Chuẩn Hàng Không)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'SCHEDULED')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'SCHEDULED', N'status', N'Đúng giờ', N'Scheduled', N'准点', N'定刻', N'정시');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'ARRIVED')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'ARRIVED', N'status', N'Đã hạ cánh', N'Arrived', N'已到达', N'到着済み', N'도착');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'BAGGAGE_LOADING')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'BAGGAGE_LOADING', N'status', N'Đang trả hành lý', N'Baggage Loading', N'行李装载中', N'手荷物受取中', N'수하물 수취 중');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'BAGGAGE_DONE')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'BAGGAGE_DONE', N'status', N'Đã trả xong hành lý', N'Baggage Done', N'行李提取完成', N'手荷物受取完了', N'수하물 수취 완료');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'DELAYED')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'DELAYED', N'status', N'Chậm chuyến', N'Delayed', N'延误', N'遅延', N'지연');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'CANCELLED')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'CANCELLED', N'status', N'Hủy chuyến', N'Cancelled', N'已取消', N'欠航', N'취소');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'BOARDING')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'BOARDING', N'status', N'Đang lên máy bay', N'Boarding', N'登机中', N'搭乗中', N'탑승 중');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'DEPARTED')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'DEPARTED', N'status', N'Đã cất cánh', N'Departed', N'已起飞', N'出発済み', N'출발');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'CHECKIN_OPEN')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'CHECKIN_OPEN', N'status', N'Đang làm thủ tục', N'Check-in Open', N'开放值机', N'チェックイン開始', N'체크인 중');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'CLOSED')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'CLOSED', N'status', N'Đóng cửa khởi hành', N'Gate Closed', N'登机口关闭', N'ゲートクローズ', N'게이트 마감');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'OTHER')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'OTHER', N'status', N'Thông tin khác', N'Other', N'其他', N'その他', N'기타');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'today_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'today_label', N'label', N'Hôm nay', N'Today', N'今天', N'今日', N'오늘');

GO
PRINT N'✅ Đã cập nhật bản dịch chuẩn hàng không cho Thông tin chuyến bay.';
