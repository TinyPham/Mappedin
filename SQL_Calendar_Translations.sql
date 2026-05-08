-- =============================================
-- SQL Script: Bổ sung các bản dịch cho Lịch (Calendar) vào bảng Translation_UI
-- Ngày: 08/05/2026
-- =============================================

USE [MappedIn3DModels]
GO

-- 1. Các nhãn điều khiển Lịch
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'today_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'today_label', N'label', N'Hôm nay', N'Today', N'今天', N'今日', N'오늘');
ELSE
UPDATE [dbo].[Translation_UI] SET [VN] = N'Hôm nay', [EN] = N'Today', [ZH] = N'今天', [JA] = N'今日', [KO] = N'오늘' WHERE [KeyCode] = 'today_label';

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'clear_label')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'clear_label', N'label', N'Xóa', N'Clear', N'清除', N'クリア', N'지우기');

-- 2. Tên các tháng (month_1 -> month_12)
DECLARE @m INT = 1;
WHILE @m <= 12
BEGIN
    DECLARE @keyCode NVARCHAR(50) = 'month_' + CAST(@m AS NVARCHAR(2));
    IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = @keyCode)
    BEGIN
        IF @m = 1 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 1', N'January', N'一月', N'1月', N'1월');
        IF @m = 2 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 2', N'February', N'二月', N'2月', N'2월');
        IF @m = 3 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 3', N'March', N'三月', N'3月', N'3월');
        IF @m = 4 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 4', N'April', N'四月', N'4月', N'4월');
        IF @m = 5 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 5', N'May', N'五月', N'5月', N'5월');
        IF @m = 6 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 6', N'June', N'六月', N'6月', N'6월');
        IF @m = 7 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 7', N'July', N'七月', N'7月', N'7월');
        IF @m = 8 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 8', N'August', N'八月', N'8月', N'8월');
        IF @m = 9 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 9', N'September', N'九月', N'9月', N'9월');
        IF @m = 10 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 10', N'October', N'十月', N'10月', N'10월');
        IF @m = 11 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 11', N'November', N'十一月', N'11月', N'11월');
        IF @m = 12 INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO]) VALUES (@keyCode, N'calendar', N'Tháng 12', N'December', N'十二月', N'12月', N'12월');
    END
    SET @m = @m + 1;
END

-- 3. Tên các thứ (day_0 -> day_6)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'day_0')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'day_0', N'calendar', N'CN', N'Su', N'日', N'日', N'일');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'day_1')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'day_1', N'calendar', N'T2', N'Mo', N'一', N'月', N'월');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'day_2')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'day_2', N'calendar', N'T3', N'Tu', N'二', N'火', N'화');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'day_3')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'day_3', N'calendar', N'T4', N'We', N'三', N'水', N'수');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'day_4')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'day_4', N'calendar', N'T5', N'Th', N'四', N'木', N'목');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'day_5')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'day_5', N'calendar', N'T6', N'Fr', N'五', N'金', N'금');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Translation_UI] WHERE [KeyCode] = 'day_6')
INSERT INTO [dbo].[Translation_UI] ([KeyCode], [KeyType], [VN], [EN], [ZH], [JA], [KO])
VALUES (N'day_6', N'calendar', N'T7', N'Sa', N'六', N'土', N'토');

GO
PRINT N'✅ Đã bổ sung các bản dịch Lịch (Calendar) vào bảng Translation_UI.';
