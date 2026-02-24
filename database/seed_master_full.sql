USE [MappedIn3DModels]
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MasterData_Languages]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[MasterData_Languages]([LanguageId] [varchar](5) NOT NULL, [LanguageName] [nvarchar](50) NOT NULL, [SortOrder] [int] NOT NULL, [IsActive] [bit] NOT NULL, CONSTRAINT [PK_MasterData_Languages] PRIMARY KEY CLUSTERED ([LanguageId] ASC))
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Translation_UI]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Translation_UI]([UIKeyId] [int] IDENTITY(1,1) NOT NULL, [KeyCode] [varchar](100) NOT NULL, [KeyType] [varchar](50) NULL, [VN] [nvarchar](500) NULL, [EN] [nvarchar](500) NULL, [ZH] [nvarchar](500) NULL, [JA] [nvarchar](500) NULL, [KO] [nvarchar](500) NULL, CONSTRAINT [PK_Translation_UI] PRIMARY KEY CLUSTERED ([UIKeyId] ASC))
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Translation_Floors]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Translation_Floors]([FloorId] [int] NOT NULL, [MappedinId] [varchar](50) NOT NULL, [FloorCode] [varchar](20) NOT NULL, [SortOrder] [int] NOT NULL, [VN] [nvarchar](100) NULL, [EN] [nvarchar](100) NULL, [ZH] [nvarchar](100) NULL, [JA] [nvarchar](100) NULL, [KO] [nvarchar](100) NULL, CONSTRAINT [PK_Translation_Floors] PRIMARY KEY CLUSTERED ([FloorId] ASC))
END
GO
IF OBJECT_ID(N'[dbo].[Translation_Locations]', N'U') IS NOT NULL DROP TABLE [dbo].[Translation_Locations];
GO
IF OBJECT_ID(N'[dbo].[MasterData_UI_Components]', N'U') IS NOT NULL DROP TABLE [dbo].[MasterData_UI_Components];
GO
IF OBJECT_ID(N'[dbo].[Translation_Categories]', N'U') IS NOT NULL DROP TABLE [dbo].[Translation_Categories];
GO
IF OBJECT_ID(N'[dbo].[Translation_SubCategories]', N'U') IS NOT NULL DROP TABLE [dbo].[Translation_SubCategories];
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AreaCategory]') AND type in (N'U'))
BEGIN
    DROP TABLE [dbo].[AreaCategory]
END
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AreaList]') AND type in (N'U'))
BEGIN
    DROP TABLE [dbo].[AreaList]
END
GO
CREATE TABLE [dbo].[AreaList]([AreaListID] [int] IDENTITY(1,1) NOT NULL, [MappedinID] [nvarchar](100) NOT NULL, [Name] [nvarchar](255) NULL, [VN] [nvarchar](255) NULL, [EN] [nvarchar](255) NULL, [ZH] [nvarchar](255) NULL, [JA] [nvarchar](255) NULL, [KO] [nvarchar](255) NULL, CONSTRAINT [PK_AreaList] PRIMARY KEY CLUSTERED ([AreaListID] ASC))
GO
CREATE TABLE [dbo].[AreaCategory]([AssignmentID] [int] IDENTITY(1,1) NOT NULL, [AreaListID] [int] NOT NULL, [SubCategoryID] [int] NOT NULL, CONSTRAINT [PK_AreaCategory] PRIMARY KEY CLUSTERED ([AssignmentID] ASC))
GO
ALTER TABLE [dbo].[AreaCategory]  WITH CHECK ADD  CONSTRAINT [FK_AreaCategory_AreaList] FOREIGN KEY([AreaListID])
REFERENCES [dbo].[AreaList] ([AreaListID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AreaCategory] CHECK CONSTRAINT [FK_AreaCategory_AreaList]
GO

-- 1. Seed Languages
DELETE FROM MasterData_Languages;
INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('vn', N'Tiếng Việt', 1, 1);
INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('en', N'English', 2, 1);
INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('zh', N'中文 (Chinese)', 3, 1);
INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('ja', N'日本語 (Japanese)', 4, 1);
INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('ko', N'한국어 (Korean)', 5, 1);

-- 2. Seed UI
DELETE FROM Translation_UI;
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('venue_name', 'title', N'Cảng Hàng không Quốc tế Long Thành', N'Long Thanh International Airport', N'隆塔国际机场', N'ロンタイン国際空港', N'롱탄 국제공항');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('from', 'label', N'Đi từ:', N'From:', N'起点：', N'出発地：', N'출발:');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('to', 'label', N'Đi đến:', N'To:', N'终点：', N'到着地：', N'도착:');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('clear', 'label', N'Xóa', N'Clear', N'清除', N'クリア', N'지우기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('start_preview', 'label', N'Bắt đầu', N'Start', N'开始', N'スタート', N'시작');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('stop_preview', 'label', N'Dừng', N'Stop', N'停止', N'ストップ', N'정지');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('not_found', 'message', N'Không tìm thấy đường đi', N'No path found', N'未找到路线', N'ルートが見つかりません', N'경로를 찾을 수 없습니다');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('error_nav', 'message', N'Lỗi khi tìm đường đi', N'Error finding path', N'查找路线时出错', N'ルート検索中にエラーが発生しました', N'경로 검색 중 오류가 발생했습니다');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('select_origin', 'status', N'Vui lòng chọn điểm đi trên bản đồ', N'Please select a starting point on the map', N'请在地图上选择起点', N'地図上で出発地を選択してください', N'지도에서 출발지를 선택하세요');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('select_destination', 'status', N'Vui lòng chọn điểm đến trên bản đồ', N'Please select a destination on the map', N'请在地图上选择目的地', N'地図上で到着地を選択してください', N'지도에서 목적지를 선택하세요');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('step_by_step', 'title', N'Hướng dẫn từng bước:', N'Step-by-step instructions:', N'分步指引：', N'ステップバイステップの案内：', N'단계별 안내:');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('step_label', 'label', N'Bước', N'Step', N'步骤', N'ステップ', N'단계');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('unnamed_area', 'label', N'Khu vực không tên', N'Unnamed Area', N'未命名区域', N'名前のないエリア', N'이름 없는 구역');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('no_desc', 'label', N'Không có mô tả.', N'No description available.', N'无描述。', N'説明はありません。', N'설명이 없습니다.');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_start', 'nav', N'Bắt đầu', N'Start', N'开始', N'スタート', N'시작');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_departure', 'nav', N'Khởi hành', N'Departure', N'出发', N'出発', N'출발');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_arrival', 'nav', N'Kết thúc', N'Arrival', N'到达', N'到着', N'도착');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_continue', 'nav', N'Tiếp tục', N'Continue', N'继续', N'直進', N'계속');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn', 'nav', N'Rẽ', N'Turn', N'转弯', N'曲がる', N'회전');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn_left', 'nav', N'Rẽ trái', N'Turn left', N'左转', N'左折', N'좌회전');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn_right', 'nav', N'Rẽ phải', N'Turn right', N'右转', N'右折', N'우회전');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn_slight_left', 'nav', N'Rẽ nhẹ trái', N'Slight left', N'向左微转', N'少し左', N'왼쪽으로 살짝');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn_slight_right', 'nav', N'Rẽ nhẹ phải', N'Slight right', N'向右微转', N'少し右', N'오른쪽으로 살짝');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_turn_around', 'nav', N'Quay lại', N'Turn around', N'掉头', N'Uターン', N'회전');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_arrive', 'nav', N'Đến nơi', N'Arrive', N'到达', N'到着', N'도착');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_enter', 'nav', N'Vào', N'Enter', N'进入', N'入る', N'들어가기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_exit', 'nav', N'Ra', N'Exit', N'Exit', N'出る', N'나가기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_go', 'nav', N'Đi', N'Go', N'去', N'行く', N'가기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_take_connection', 'nav', N'Vào', N'Enter', N'进入', N'入る', N'들어가기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_exit_connection', 'nav', N'Ra khỏi', N'Exit', N'离开', N'出る', N'나가기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_up', 'nav', N'và lên lầu', N'and go up', N'并上楼', N'そして上へ', N'그리고 위층으로');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_down', 'nav', N'và xuống lầu', N'and go down', N'并下楼', N'そして下へ', N'그리고 아래층으로');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('action_in', 'nav', N'vào', N'into', N'进入', N'へ', N'~(으)로');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('add_model', 'label', N'Thêm model 3D', N'Add 3D Model', N'添加3D模型', N'3Dモデル追加', N'3D 모델 추가');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('classification_btn', 'label', N'Phân loại khu vực', N'Area Classification', N'区域分类', N'エリア分類', N'구역 분류');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('select_model_title', 'title', N'Chọn mô hình 3D', N'Select 3D Model', N'选择3D模型', N'3Dモデル選択', N'3D 모델 선택');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('classification_title', 'title', N'Phân loại khu vực', N'Area Classification', N'区域分类', N'エリア分類', N'구역 분류');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('main_categories', 'title', N'Danh mục chính', N'Main Categories', N'主分类', N'メインカテゴリ', N'주요 카테고리');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('sub_categories', 'title', N'Danh mục con', N'Subcategories', N'子分类', N'サブカテゴリ', N'하위 카테고리');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('search_placeholder', 'placeholder', N'Tìm kiếm khu vực, điểm đến...', N'Search areas, destinations...', N'搜索区域、目的地...', N'エリア・目的地を検索...', N'구역, 목적지 검색...');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('no_categories_for_floor', 'message', N'Không có danh mục cho tầng này', N'No categories for this floor', N'该楼层没有分类', N'このフロアにはカテゴリがありません', N'이 층에는 카테고리가 없습니다');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('floor_roof', 'floor', N'Tầng mái', N'Roof Level', N'屋顶层', N'屋上階', N'옥상층');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('floor_3f_checkin', 'floor', N'Tầng 3 - Tầng checkin', N'3F - Check-in Floor', N'3层 - 值机层', N'3階 - チェックインフロア', N'3층 - 체크인 층');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('floor_2f_departure', 'floor', N'Tầng 2 - Tầng đi', N'2F - Departure Floor', N'2层 - 出发层', N'2階 - 出発フロア', N'2층 - 출발 층');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('floor_1f_arrival', 'floor', N'Tầng 1 - Tầng đến', N'1F - Arrival Floor', N'1层 - 到达层', N'1階 - 到着フロア', N'1층 - 도착 층');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('floor_gf_shuttle', 'floor', N'Tầng trệt - Xe đưa đón', N'GF - Shuttle Bus Floor', N'底楼', N'1階（地上階）', N'지상층');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('elevator', 'label', N'Thang máy', N'Elevator', N'电梯', N'エレベーター', N'엘리베이터');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('escalator', 'label', N'Thang cuốn', N'Escalator', N'扶梯', N'エスカレーター', N'에스컬레이터');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('stairway', 'label', N'Cầu thang bộ', N'Stairs', N'楼梯', N'階段', N'계단');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('connection', 'label', N'Kết nối', N'Connection', N'连接', N'接続', N'연결');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('route_found', 'status', N'Đã tìm thấy đường đi', N'Route found', N'已找到路线', N'ルートが見つかりました', N'경로를 찾았습니다');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('select_origin_alert', 'message', N'Chưa có điểm xuất phát. Vui lòng chọn điểm xuất phát trên bản đồ.', N'Please select a starting point on the map.', N'请在地图上选择起点。', N'地図上で出発地を選択してください。', N'지도에서 출발지를 선택하세요.');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('select_destination_alert', 'message', N'Chưa có điểm đích đến. Vui lòng chọn điểm đích đến trên bản đồ.', N'Please select a destination on the map.', N'请在地图上选择目的地。', N'地図上で到着地を選択してください。', N'지도에서 목적지를 선택하세요.');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('linked_floors', 'label', N'Tầng liên kết:', N'Linked floors:', N'关联楼层：', N'関連フロア：', N'연결된 층:');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('floor', 'label', N'Tầng', N'Floor', N'楼层', N'フロア', N'층');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('back_btn', 'label', N'Quay lại', N'Back', N'返回', N'戻る', N'뒤로');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('no_desc', 'message', N'Không có mô tả.', N'No description.', N'没有描述。', N'説明なし。', N'설명 없음');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('main_entrance', 'label', N'Cổng chính', N'Main Entrance', N'正门', N'メインエントランス', N'정문');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('venue_name', 'label', N'Cảng Hàng không Quốc tế Long Thành', N'Long Thanh International Airport', N'隆城国际机场', N'ロンタイン国際空港', N'롱탄 국제공항');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('select_origin_placeholder', 'placeholder', N'Chưa chọn điểm đi', N'Please select origin', N'未选择起点', N'出発地を選択してください', N'출발지 미선택');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('select_destination_placeholder', 'placeholder', N'Chưa chọn điểm đến', N'Please select destination', N'未选择终点', N'目的地を選択してください', N'목적지 미선택');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('directions_btn', 'label', N'Dẫn đường', N'Get Directions', N'路线', N'道順', N'길 안내');

-- 3. Seed Floors
DELETE FROM Translation_Floors;
SET IDENTITY_INSERT Translation_Floors ON;
INSERT INTO Translation_Floors (FloorId, MappedinId, FloorCode, SortOrder, VN, EN, ZH, JA, KO) VALUES (1, 'm_dae8f26a40f6017f', 'GF', 1, N'Tầng trệt', N'Ground Floor', N'底楼', N'1階', N'지상층');
INSERT INTO Translation_Floors (FloorId, MappedinId, FloorCode, SortOrder, VN, EN, ZH, JA, KO) VALUES (2, 'm_41a38d6d0411d397', '1F', 2, N'Tầng 1', N'1st Floor', N'1层', N'1階', N'1층');
INSERT INTO Translation_Floors (FloorId, MappedinId, FloorCode, SortOrder, VN, EN, ZH, JA, KO) VALUES (3, 'm_d4b5674c0b15e099', '2F', 3, N'Tầng 2', N'2nd Floor', N'2层', N'2階', N'2층');
INSERT INTO Translation_Floors (FloorId, MappedinId, FloorCode, SortOrder, VN, EN, ZH, JA, KO) VALUES (4, 'm_1523f7dcde647c40', '3F', 4, N'Tầng 3', N'3rd Floor', N'3层', N'3階', N'3층');
INSERT INTO Translation_Floors (FloorId, MappedinId, FloorCode, SortOrder, VN, EN, ZH, JA, KO) VALUES (5, 'm_419c5f0d5c054d24', 'ROOF', 5, N'Tầng mái', N'Roof Level', N'屋顶层', N'屋上階', N'옥상층');
SET IDENTITY_INSERT Translation_Floors OFF;

-- 4. Seed Categories (Merged Translations)
-- 4a. Migrate Categories schema
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND name = 'EN')
BEGIN
    ALTER TABLE Categories ADD EN NVARCHAR(255) NULL
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND name = 'ZH')
BEGIN
    ALTER TABLE Categories ADD ZH NVARCHAR(255) NULL
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND name = 'JA')
BEGIN
    ALTER TABLE Categories ADD JA NVARCHAR(255) NULL
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND name = 'KO')
BEGIN
    ALTER TABLE Categories ADD KO NVARCHAR(255) NULL
END
GO
DELETE FROM SubCategories;
DELETE FROM Categories;

SET IDENTITY_INSERT Categories ON;
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (8, N'Ăn uống', N'Food & Beverage', N'餐饮', N'飲食', N'식음료', 'food-and-drink.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (11, N'Cửa hàng', N'Shopping', N'购物', N'ショッピング', N'쇼핑', 'store.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (10, N'Dịch vụ sân bay', N'Airport Services', N'机场服务', N'空港サービス', N'공항 서비스', 'airportservice.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (4, N'Điện tử', N'Electronics', N'电子产品', N'電子機器', N'전자제품', 'electronic.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (1, N'Hỗ trợ người khuyết tật', N'Accessibility', N'无障碍设施', N'バリアフリー', N'교통약자 지원', 'accessible.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (3, N'Kết nối', N'Connections', N'交通连接', N'連絡通路', N'연결시설', 'connection.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (2, N'Làm đẹp', N'Beauty', N'美容', N'ビューティー', N'뷰티', 'beauty.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (9, N'Nhà thuốc', N'Pharmacy', N'药房', N'薬局', N'약국', 'pharmacy.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (14, N'Phòng chờ', N'Lounges', N'贵宾室', N'ラウンジ', N'라운지', 'lounge.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (7, N'Thể thao', N'Fitness', N'健身', N'フィットネス', N'피트니스', 'fitness.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (6, N'Thời trang', N'Fashion', N'时尚', N'ファッション', N'패션', 'fashion.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (13, N'Thư giãn', N'Entertainment', N'休闲娱乐', N'エンターテインメント', N'エンターテインメント', 'entertainment.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (18, N'Thủ tục chuyến bay đến', N'Arrival Procedures', N'到达手续', N'到着手続き', N'도착 수속', 'arrivalflightprocedures.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (19, N'Thủ tục chuyến bay đi', N'Departure Procedures', N'出发手续', N'出発手続き', N'출발 수속', 'departureflightprocedures.png', 0);
INSERT INTO Categories (CategoryID, CategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (20, N'Thủ tục nối chuyến', N'Transfer Procedures', N'中转手续', N'乗継手続き', N'환승 수속', 'transitprocedures.png', 0);
SET IDENTITY_INSERT Categories OFF;

-- 5. Seed SubCategories (Merged Translations)
-- 5a. Migrate SubCategories schema
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND name = 'EN')
BEGIN
    ALTER TABLE SubCategories ADD EN NVARCHAR(255) NULL
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND name = 'ZH')
BEGIN
    ALTER TABLE SubCategories ADD ZH NVARCHAR(255) NULL
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND name = 'JA')
BEGIN
    ALTER TABLE SubCategories ADD JA NVARCHAR(255) NULL
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND name = 'KO')
BEGIN
    ALTER TABLE SubCategories ADD KO NVARCHAR(255) NULL
END
GO
SET IDENTITY_INSERT SubCategories ON;
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (185, 10, N'ATM', N'ATM', N'自动取款机', N'ATM (現金自動預け払い機)', N'ATM (현금 인출기)', 'AirportService/atm.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (182, 11, N'Cửa hàng rượu và thuốc lá', N'Liquor & Tobacco Store', N'烟酒商店', N'酒＆タバコ店', N'주류 및 담배 판매점', 'Store/alcohol.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (165, 3, N'Cổng đến', N'Arrival Gate', N'到达口', N'到着ゲート', N'도착 게이트', 'connection.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (163, 8, N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리', 'Food&Drink/bakery.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (164, 8, N'Quầy cà phê', N'Coffee Shop', N'咖啡店', N'コーヒーショップ', N'커피숍', 'Food&Drink/coffee.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (183, 18, N'Khu nhận hành lý', N'Baggage Claim', N'行李提取', N'手荷物受取所', N'수하물 수취', 'arrivalflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (160, 8, N'Quầy bán món ăn địa phương', N'Local Food', N'当地美食', N'郷土料理', N'현지 음식', 'Food&Drink/restaurant.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (161, 8, N'Quầy bán món tráng miệng', N'Dessert Shop', N'甜品店', N'デザートショップ', N'디저트 가게', 'Food&Drink/ice-cream.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (162, 10, N'Quầy dịch vụ viễn thông', N'Telecom Service', N'电信服务', N'通信サービス', N'통신 서비스', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (166, 14, N'Phòng Internet', N'Internet Lounge', N'网吧', N'インターネットラウンジ', N'인터넷 라운지', 'lounge.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (167, 10, N'Khu vực bọc hành lý', N'Luggage Wrapping', N'行李打包区', N'手荷物ラッピングエリア', N'수하물 포장 구역', 'AirportService/wrapping-baggage-area.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (168, 8, N'Khu ẩm thực cao cấp', N'Fine Dining', N'高级餐饮', N'高級ダイニング', N'파인 다이닝', 'Food&Drink/restaurant.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (169, 11, N'Cửa hàng bán lẻ', N'Retail Shop', N'零售店', N'小売店', N'소매점', 'store.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (170, 8, N'Quầy thực phẩm đóng gói', N'Packaged Food', N'包装食品', N'加工食品', N'포장 식품', 'Food&Drink/fast-food.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (171, 6, N'Cửa hàng thời trang', N'Fashion Shop', N'时装店', N'ファッションショップ', N'패션 매장', 'fashion.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (172, 19, N'Khu ga đi nội địa', N'Domestic Departures', N'国内出发', N'国内線出発', N'국내선 출발', 'departureflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (173, 13, N'Khu nghỉ ngơi', N'Rest Area', N'休息区', N'休憩エリア', N'휴식 공간', 'entertainment.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (174, 9, N'Phòng y tế', N'Medical Room', N'医务室', N'医務室', N'의무실', 'pharmacy.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (175, 8, N'F&B', N'Food & Beverage', N'餐饮', N'飲食', N'식음료', 'food-and-drink.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (176, 20, N'Điểm nối chuyến', N'Transfer Point', N'转机点', N'乗り継ぎポイント', N'환승 지점', 'transitprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (177, 10, N'Văn phòng', N'Office', N'办公室', N'オフィス', N'사무실', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (178, 10, N'Hệ thống băng chuyền hành lý', N'Baggage Conveyor System', N'行李传送带', N'手荷物コンベヤー', N'수하물 컨베이어', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (179, 11, N'Cửa hàng bán sản phẩm du lịch', N'Travel Goods', N'旅行用品', N'旅行用品', N'여행 용품', 'store.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (180, 8, N'Ẩm thực quốc tế', N'Global Food', N'国际美食', N'多国籍料理', N'세계 음식', 'Food&Drink/restaurant.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (181, 10, N'Đường công vụ', N'Service Road', N'公务路', N'業務用道路', N'업무용 도로', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (184, 8, N'Quầy đồ ăn nhanh', N'Fast Food', N'快餐', N'ファストフード', N'패스트푸드', 'Food&Drink/fast-food.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (79, 8, N'Cà phê', N'Coffee', N'咖啡', N'カフェ', N'커피', 'Food&Drink/coffee.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (82, 8, N'Kem', N'Ice Cream', N'冰淇淋', N'アイスクリーム', N'아이스크림', 'Food&Drink/ice-cream.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (81, 8, N'Khu ẩm thực', N'Food Court', N'美食广场', N'フードコート', N'푸드코트', 'Food&Drink/food-court.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (83, 8, N'Nhà hàng', N'Restaurant', N'餐厅', N'レストラン', N'레스토랑', 'Food&Drink/restaurant.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (27, 8, N'Pizza', N'Pizza', N'披萨', N'ピザ', N'피자', 'Food&Drink/pizza.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (78, 8, N'Quầy Bar', N'Bar', N'酒吧', N'バー', N'바', 'Food&Drink/bar.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (76, 8, N'Rượu & Đồ uống có cồn', N'Alcohol & Spirits', N'酒类', N'アルコール', N'주류', 'Food&Drink/alcohol.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (80, 8, N'Thức ăn nhanh', N'Fast Food', N'快餐', N'ファストフード', N'패스트푸드', 'Food&Drink/fast-food.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (77, 8, N'Tiệm bánh', N'Bakery', N'面包店', N'ベーカリー', N'베이커리', 'Food&Drink/bakery.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (122, 11, N'Cửa hàng hoa', N'Flower Shop', N'花店', N'フラワーショップ', N'꽃집', 'Store/flower-store.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (111, 11, N'Cửa hàng bán đồ lưu niệm', N'Souvenir Shop', N'纪念品店', N'お土産店', N'기념품점', 'Store/souvenir-shop.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (110, 11, N'Cửa hàng miễn thuế', N'Duty Free Shop', N'免税店', N'免税店', N'면세점', 'Store/duty-free.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (109, 11, N'Cửa hàng tiện lợi', N'Convenience Store', N'便利店', N'コンビニ', N'편의점', 'Store/convenience-store.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (108, 11, N'Cửa hàng sách', N'Bookstore', N'书店', N'書店', N'서점', 'Store/book-shop.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (98, 10, N'Bãi đỗ xe', N'Parking', N'停车场', N'駐車場', N'주차장', 'AirportService/parking.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (96, 10, N'Bãi đỗ xe máy', N'Motorbike Parking', N'摩托车停车场', N'バイク駐輪場', N'오토바이 주차장', 'AirportService/motorbike-parking.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (87, 10, N'Bãi đỗ xe ô tô', N'Car Parking', N'汽车停车场', N'車駐車場', N'자동차 주차장', 'AirportService/car-parking.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (141, 10, N'Cảnh quan', N'Landscape', N'景观', N'ランドスケープ', N'조경', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (142, 10, N'Dịch vụ bưu điện', N'Post Service', N'邮政服务', N'郵便服务', N'우편 서비스', 'AirportService/post-service.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (143, 10, N'Dịch vụ đón tiễn khách', N'Welcome Service', N'迎送服务', N'お迎えサービス', N'영접 서비스', 'AirportService/welcome-service.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (104, 10, N'Điểm đón Taxi', N'Taxi Pickup', N'出租车乘车点', N'タクシー乗り場', N'택시 승차장', 'AirportService/taxi-pickup-area.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (99, 10, N'Điện thoại công cộng', N'Public Phone', N'公用电话', N'公衆電話', N'공중전화', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (89, 10, N'Đổi ngoại tệ', N'Currency Exchange', N'货币兑换', N'両替', N'환전', 'AirportService/currency-exchange.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (106, 10, N'Đóng gói hành lý', N'Baggage Wrapping', N'行李打包', N'手荷物ラッピング', N'수하물 포장', 'AirportService/wrapping-baggage-area.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (95, 10, N'Hành lý thất lạc', N'Lost & Found', N'失物招领', N'遺失物取扱所', N'분실물 센터', 'AirportService/lost-and-found.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (100, 10, N'Khu chụp ảnh', N'Photo Zone', N'拍照区', N'フォトスポット', N'포토존', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (91, 10, N'Khu triển lãm', N'Exhibition Area', N'展览区', N'展示エリア', N'전시 구역', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (140, 10, N'Khu vực nghỉ chờ xe đưa đón khách sạn', N'Hotel Shuttle Waiting', N'酒店班车等候区', N'ホテルシャトル待機所', N'호텔 셔틀 대기 구역', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (94, 10, N'Khu vui chơi trẻ em', N'Kids Zone', N'儿童游乐区', N'キッズゾーン', N'어린이 놀이터', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (85, 10, N'Máy ATM', N'ATM', N'自动取款机', N'ATM (現金自動預け払い機)', N'ATM (현금 인출기)', 'AirportService/atm.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (101, 10, N'Nhà vệ sinh', N'Restroom', N'洗手间', N'トイレ', N'화장실', 'AirportService/restroom.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (92, 10, N'Nhà vệ sinh gia đình', N'Family Restroom', N'家庭卫生间', N'ファミリートイレ', N'가족 화장실', 'AirportService/family-restroom.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (90, 10, N'Nước uống miễn phí', N'Free Drinking Water', N'免费饮水', N'無料給水', N'무료 음수대', 'AirportService/drinking-water-area.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (103, 10, N'Phòng hút thuốc', N'Smoking Room', N'吸烟室', N'喫煙室', N'흡연실', 'AirportService/smoking-room.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (97, 10, N'Phòng mẹ và bé', N'Nursing Room', N'母婴室', N'授乳室', N'수유실', 'AirportService/nursing-room.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (102, 10, N'Phòng tắm', N'Shower Room', N'淋浴间', N'シャワールーム', N'샤워실', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (107, 10, N'Phòng tập Yoga', N'Yoga Room', N'瑜伽室', N'ヨガルーム', N'요가실', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (105, 10, N'Quầy thông tin du lịch', N'Tourist Information', N'旅游信息', N'観光案内', N'관광 안내', 'AirportService/tourist-information.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (93, 10, N'Trạm sạc miễn phí', N'Free Charging Station', N'免费充电站', N'無料充電ステーション', N'무료 충전소', 'AirportService/free-charging-station.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (123, 10, N'Trung tâm văn hóa truyền thống', N'Traditional Cultural Center', N'传统文化中心', N'伝統文化センター', N'전통문화센터', 'airportservice.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (64, 4, N'Thiết bị điện tử', N'Electronics', N'电子设备', N'電子機器', N'전자기기', 'electronic.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (57, 1, N'Hỗ trợ người khuyết tật', N'Accessibility', N'无障碍设施', N'バリアフリー', N'교통약자 지원', 'accessible.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (63, 3, N'Cửa khởi hành', N'Gate', N'登机口', N'ゲート', N'게이트', 'connection.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (61, 3, N'Lối vào', N'Entrance', N'入口', N'入口', N'입구', 'connection.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (62, 3, N'Thang cuốn', N'Escalator', N'扶梯', N'エスカレーター', N'에스컬레이터', 'connection.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (60, 3, N'Thang máy', N'Elevator', N'电梯', N'エレベーター', N'엘리베이터', 'connection.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (58, 2, N'Mỹ phẩm', N'Cosmetics', N'化妆品', N'コスメ', N'화장품', 'beauty.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (59, 2, N'Spa & Massage', N'Spa & Massage', N'水疗按摩', N'スパ&マッサージ', N'스파&마사지', 'beauty.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (84, 9, N'Nhà thuốc', N'Pharmacy', N'药房', N'薬局', N'약국', 'pharmacy.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (119, 14, N'Phòng chờ ga đi quốc nội', N'Domestic Departure Lounge', N'国内出发贵宾室', N'国内線出発ラウンジ', N'국내선 출발 라운지', 'lounge.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (120, 14, N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지', 'lounge.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (118, 14, N'Phòng chờ hạng thương gia', N'Business Class Lounge', N'商务舱贵宾室', N'ビジネスクラスラウンジ', N'비즈니스 라운지', 'lounge.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (121, 14, N'Phòng chờ visa', N'Visa Lounge', N'签证贵宾室', N'ビザラウンジ', N'비자 라운지', 'lounge.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (75, 7, N'Phòng tập Gym', N'Gym', N'健身房', N'ジム', N'헬스장', 'Fitness/fitness.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (74, 6, N'Đồ ngủ', N'Sleepwear', N'睡衣', N'パジャマ', N'잠옷', 'fashion.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (70, 6, N'Giày dép', N'Footwear', N'鞋类', N'シューズ', N'신발', 'fashion.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (69, 6, N'Mắt kính', N'Eyewear', N'眼镜', N'眼鏡', N'안경', 'fashion.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (68, 6, N'Phụ kiện', N'Accessories', N'配饰', N'アクセサリー', N'액세서리', 'fashion.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (73, 6, N'Thời trang cao cấp', N'Luxury Fashion', N'高端时尚', N'ラグジュアリーファッション', N'럭셔리 패션', 'fashion.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (72, 6, N'Trang sức', N'Jewelry', N'珠宝', N'ジュエリー', N'주얼리', 'fashion.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (71, 6, N'Túi xách', N'Handbag', N'手袋', N'ハンドバッグ', N'핸드백', 'fashion.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (112, 13, N'Casino', N'Casino', N'赌场', N'カジノ', N'카지노', 'entertainment.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (114, 13, N'Ghế massage', N'Massage Chair', N'按摩椅', N'マッサージチェア', N'마사지 의자', 'entertainment.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (113, 13, N'Khu trò chơi', N'Gaming Zone', N'游戏区', N'ゲームゾーン', N'게임존', 'entertainment.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (140, 13, N'Khu vực nghỉ ngơi', N'Rest Area', N'休息区', N'休憩エリア', N'휴식 공간', 'entertainment.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (116, 13, N'Phòng cầu nguyện', N'Prayer Room', N'祈祷室', N'祈祷室', N'기도실', 'entertainment.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (115, 13, N'Rạp chiếu phim', N'Movie Theater', N'电影院', N'映画館', N'영화관', 'entertainment.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (124, 18, N'Đăng ký sinh trắc học', N'Biometric Registration', N'生物识别登记', N'生体認証登録', N'생체 인식 등록', 'arrivalflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (125, 18, N'Hải quan', N'Customs', N'海关', N'税関', N'세관', 'arrivalflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (129, 18, N'Hành lý quá khổ', N'Oversized Baggage', N'超大行李', N'大型手荷物', N'대형 수하물', 'arrivalflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (126, 18, N'Khu ga đến quốc nội', N'Domestic Arrivals', N'国内到达', N'国内線到着', N'국내선 도착', 'arrivalflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (128, 18, N'Khu ga đến quốc tế', N'International Arrivals', N'国际到达', N'国際線到着', N'국제선 도착', 'arrivalflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (86, 18, N'Khu vực nhận hành lý', N'Baggage Claim', N'行李提取', N'手荷物受取所', N'수하물 수취', 'arrivalflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (127, 18, N'Nhập cảnh', N'Immigration', N'入境', N'入国審査', N'입국 심사', 'arrivalflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (139, 19, N'An ninh soi chiếu nội địa', N'Domestic Security Screening', N'国内安检', N'国内線保安検査', N'국내선 보안 검색', 'departureflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (135, 19, N'An ninh soi chiếu quốc tế', N'International Security Screening', N'国际安检', N'国際線保安検査', N'국제선 보안 검색', 'departureflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (130, 19, N'Khu ga đi quốc nội', N'Domestic Departures', N'国内出发', N'国内線出発', N'국내선 출발', 'departureflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (133, 19, N'Khu ga đi quốc tế', N'International Departures', N'国际出发', N'国際線出発', N'국제선 출발', 'departureflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (88, 19, N'Khu vực làm thủ tục', N'Check-in Area', N'值机区', N'チェックインエリア', N'체크인 구역', 'departureflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (132, 19, N'Làn làm thủ tục ưu tiên', N'Priority Check-in Lane', N'优先值机通道', N'優先チェックインレーン', N'우선 체크인 레인', 'departureflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (134, 19, N'Lưu trữ hành lý', N'Luggage Storage', N'行李寄存', N'手荷物一時預かり', N'수하물 보관', 'departureflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (131, 19, N'Xuất cảnh', N'Emigration', N'出境', N'出国審査', N'출국 심사', 'departureflightprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (136, 20, N'Nối chuyến Nội địa - Nội địa', N'Domestic to Domestic Transfer', N'国内转国内', N'国内線乗継', N'국내-국내 환승', 'transitprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (137, 20, N'Nối chuyến Nội địa - Quốc tế', N'Domestic to International Transfer', N'国内转国际', N'国内-国际線乗継', N'국내-국제 환승', 'transitprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (138, 20, N'Nối chuyến Quốc tế - Quốc tế', N'International to International Transfer', N'国际转国际', N'国际線乗継', N'국제-국제 환승', 'transitprocedures.png', 0);
INSERT INTO SubCategories (SubCategoryID, CategoryID, SubCategoryName, EN, ZH, JA, KO, IconPath, DisplayOrder) VALUES (138, 20, N'Nối chuyến Quốc tế - Quốc tế', N'International to International Transfer', N'国际转国际', N'国际线乗継', N'국제-국제 환승', 'transitprocedures.png', 0);
SET IDENTITY_INSERT SubCategories OFF;

-- 6. Drop obsolete Translation tables
IF OBJECT_ID(N'[dbo].[Translation_Categories]', N'U') IS NOT NULL DROP TABLE [dbo].[Translation_Categories];
IF OBJECT_ID(N'[dbo].[Translation_SubCategories]', N'U') IS NOT NULL DROP TABLE [dbo].[Translation_SubCategories];

-- 6. Seed AreaList & Assignments (with Schema Migration)
DELETE FROM AreaList;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaList]') AND name = 'VN')
BEGIN
    ALTER TABLE AreaList ADD VN NVARCHAR(255) NULL
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaList]') AND name = 'EN')
BEGIN
    ALTER TABLE AreaList ADD EN NVARCHAR(255) NULL
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaList]') AND name = 'ZH')
BEGIN
    ALTER TABLE AreaList ADD ZH NVARCHAR(255) NULL
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaList]') AND name = 'JA')
BEGIN
    ALTER TABLE AreaList ADD JA NVARCHAR(255) NULL
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AreaList]') AND name = 'KO')
BEGIN
    ALTER TABLE AreaList ADD KO NVARCHAR(255) NULL
END
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AreaInformation]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[AreaInformation]([InformationID] [int] IDENTITY(1,1) NOT NULL, [AreaListID] [int] NOT NULL, [InformationVI] [nvarchar](MAX) NULL, [InformationEN] [nvarchar](MAX) NULL, [InformationZH] [nvarchar](MAX) NULL, [InformationJA] [nvarchar](MAX) NULL, [InformationKO] [nvarchar](MAX) NULL, [ImageUrl] [nvarchar](500) NULL, CONSTRAINT [PK_AreaInformation] PRIMARY KEY CLUSTERED ([InformationID] ASC))
END
GO
ALTER TABLE [dbo].[AreaInformation] WITH CHECK ADD CONSTRAINT [FK_AreaInformation_AreaList] FOREIGN KEY([AreaListID])
REFERENCES [dbo].[AreaList] ([AreaListID])
ON DELETE CASCADE
GO
DELETE FROM AreaInformation;
GO

SET IDENTITY_INSERT AreaList ON;
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (1, 's_dea0b3d07f4eb13c', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (1, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (1, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (2, 's_ae8311c5c4a7093e', N'Cửa hàng tiện lợi', N'Cửa hàng tiện lợi', N'convenience store', N'便利店', N'コンビニ', N'편의점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (2, N'Khám phá nhiều loại sản phẩm tại Cửa hàng tiện lợi.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at convenience store.\nAttractive offers await you.', N'在 便利店 发现各种产品。\n诱人的优惠等着您。', N'コンビニ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'편의점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (2, 109);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (3, 's_42e9e3758c837e0c', N'Phòng y tế', N'Phòng y tế', N'Medical Room', N'医务室', N'医務室', N'의무실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (3, 174);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (4, 's_429137a08e13e068', N'Quầy bán món ăn địa phương', N'Quầy bán món ăn địa phương', N'Local food', N'当地美食', N'郷土料理', N'현지 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (4, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán món ăn địa phương.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Local food.\nConvenient location for passengers.', N'在 当地美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'郷土料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'현지 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (4, 160);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (5, 's_3c287a0ac4e0a4c2', N'Quầy bán món ăn địa phương', N'Quầy bán món ăn địa phương', N'Local food', N'当地美食', N'郷土料理', N'현지 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (5, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán món ăn địa phương.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Local food.\nConvenient location for passengers.', N'在 当地美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'郷土料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'현지 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (5, 160);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (6, 's_b51ee3eb03417ea2', N'Cửa hàng tiện lợi', N'Cửa hàng tiện lợi', N'convenience store', N'便利店', N'コンビニ', N'편의점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (6, N'Khám phá nhiều loại sản phẩm tại Cửa hàng tiện lợi.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at convenience store.\nAttractive offers await you.', N'在 便利店 发现各种产品。\n诱人的优惠等着您。', N'コンビニ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'편의점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (6, 109);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (7, 's_41f27643a59a83b1', N'Phòng cầu nguyện', N'Phòng cầu nguyện', N'Prayer Room', N'祈祷室', N'祈祷室', N'기도실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (7, 116);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (8, 's_d349f86e46397d58', N'Quầy cà phê', N'Quầy cà phê', N'Coffee', N'咖啡店', N'コーヒーショップ', N'커피숍');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (8, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy cà phê.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Coffee.\nConvenient location for passengers.', N'在 咖啡店 享用美味的餐点和饮料。\n方便旅客的位置。', N'コーヒーショップ で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'커피숍 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (8, 164);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (9, 's_7209785b40c31ff3', N'ATM', N'ATM', N'ATM', N'自动取款机', N'ATM (現金自動預け払い機)', N'ATM (현금 인출기)');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (9, 185);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (10, 's_b046cff71dd5fd66', N'Quầy thông tin du lịch', N'Quầy thông tin du lịch', N'Travel Information Support)', N'旅游信息', N'観光案内', N'관광 안내');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (10, 105);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (11, 's_48c5eb2f2a9cdcef', N'Quầy bán món tráng miệng', N'Quầy bán món tráng miệng', N'dessert shop', N'甜品店', N'デザートショップ', N'디저트 가게');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (11, N'Khám phá nhiều loại sản phẩm tại Quầy bán món tráng miệng.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at dessert shop.\nAttractive offers await you.', N'在 甜品店 发现各种产品。\n诱人的优惠等着您。', N'デザートショップ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'디저트 가게 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (11, 161);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (12, 's_67c511131c449faa', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (12, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (12, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (13, 's_253b06189260056a', N'Quầy đồ ăn nhanh', N'Quầy đồ ăn nhanh', N'Fast food', N'快餐', N'ファストフード', N'패스트푸드');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (13, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy đồ ăn nhanh.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Fast food.\nConvenient location for passengers.', N'在 快餐 享用美味的餐点和饮料。\n方便旅客的位置。', N'ファストフード で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'패스트푸드 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (13, 184);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (14, 's_1e088ccf76cdfda0', N'Quầy thu đổi ngoại tệ', N'Quầy thu đổi ngoại tệ', N'Foreign Exchange', N'货币兑换', N'両替', N'환전');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (14, 89);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (15, 's_7b9e39347666083e', N'Quầy dịch vụ viễn thông', N'Quầy dịch vụ viễn thông', N'Telecom', N'电信服务', N'通信サービス', N'통신 서비스');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (15, 162);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (16, 's_ab7d735b5606686b', N'Khu vực nghỉ chờ xe đưa đón khách sạn', N'Khu vực nghỉ chờ xe đưa đón khách sạn', N'Hotel Lounge', N'酒店班车等候区', N'ホテルシャトル待機所', N'호텔 셔틀 대기 구역');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (16, N'Thư giãn thoải mái tại Khu vực nghỉ chờ xe đưa đón khách sạn.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at Hotel Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 酒店班车等候区 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'ホテルシャトル待機所 で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'호텔 셔틀 대기 구역 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (16, 140);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (17, 's_44700465a4271642', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (17, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (17, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (18, 's_f2a8c7f9e17bd7f0', N'Quầy bán đồ ăn', N'Quầy bán đồ ăn', N'Food Court', N'美食广场', N'フードコート', N'푸드코트');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (18, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán đồ ăn.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Food Court.\nConvenient location for passengers.', N'在 美食广场 享用美味的餐点和饮料。\n方便旅客的位置。', N'フードコート で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'푸드코트 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (18, 81);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (19, 's_f26639727936643a', N'Quầy cà phê và bánh ngọt - Khu cách ly', N'Quầy cà phê và bánh ngọt - Khu cách ly', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (19, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (20, 's_9f653754094f3080', N'Khu vực ghế Massage - Khu cách ly', N'Khu vực ghế Massage - Khu cách ly', N'Massage Chair', N'按摩椅', N'マッサージチェア', N'마사지 의자');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (20, 114);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (21, 's_8ef86c5f67e7a4b5', N'Khu vực ghế Massage - Khu cách ly', N'Khu vực ghế Massage - Khu cách ly', N'Massage Chair', N'按摩椅', N'マッサージチェア', N'마사지 의자');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (21, 114);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (22, 's_0e839cef7e3fec34', N'Khu ga đi nội địa', N'Khu ga đi nội địa', N'Domestic Departure Area', N'国内出发', N'国内線出発', N'국내선 출발');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (22, 172);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (23, 's_6cc860e82ef2201f', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (23, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (23, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (24, 's_b9e48319875b983d', N'Cổng đến', N'Cổng đến', N'Arrival gate', N'到达口', N'到着ゲート', N'도착 게이트');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (24, 165);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (25, 's_f7db17aa4d530a32', N'Cổng đến', N'Cổng đến', N'Arrival gate', N'到达口', N'到着ゲート', N'도착 게이트');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (25, 165);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (26, 's_89d47337f8c8bd24', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (26, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (26, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (27, 's_20b034c9c28c7000', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (27, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (27, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (28, 's_dd4be79a8c172cc1', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (28, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (29, 's_c67688f2947bc036', N'Hải quan', N'Hải quan', N'Custom', N'海关', N'税関', N'세관');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (29, 125);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (30, 's_2786487805120fd6', N'Quầy bán món ăn địa phương', N'Quầy bán món ăn địa phương', N'Local food', N'当地美食', N'郷土料理', N'현지 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (30, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán món ăn địa phương.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Local food.\nConvenient location for passengers.', N'在 当地美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'郷土料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'현지 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (30, 160);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (31, 's_5b691ae274ee14e1', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (31, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (32, 's_7ecf16782092d0a1', N'Cửa hàng sách', N'Cửa hàng sách', N'Book Store', N'书店', N'書店', N'서점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (32, N'Khám phá nhiều loại sản phẩm tại Cửa hàng sách.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Book Store.\nAttractive offers await you.', N'在 书店 发现各种产品。\n诱人的优惠等着您。', N'書店 で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'서점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (32, 108);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (33, 's_256164a13fc0b012', N'Nhà thuốc', N'Nhà thuốc', N'Pharmacy', N'药房', N'薬局', N'약국');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (33, 84);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (34, 's_9c6f1b146b026574', N'Văn phòng đăng ký sinh trắc học nhập cảnh', N'Văn phòng đăng ký sinh trắc học nhập cảnh', N'Biometrics Immigration Registration Office', N'办公室', N'オフィス', N'사무실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (34, 177);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (35, 's_42d25e1f4bd334ea', N'F&B', N'F&B', N'Food and Beverage', N'餐饮', N'飲食', N'식음료');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (35, N'Thưởng thức các món ăn ngon và đồ uống tại F&B.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Food and Beverage.\nConvenient location for passengers.', N'在 餐饮 享用美味的餐点和饮料。\n方便旅客的位置。', N'飲食 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'식음료 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (35, 175);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (36, 's_c655a23c233bb4b9', N'F&B', N'F&B', N'Food and Beverage', N'餐饮', N'飲食', N'식음료');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (36, N'Thưởng thức các món ăn ngon và đồ uống tại F&B.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Food and Beverage.\nConvenient location for passengers.', N'在 餐饮 享用美味的餐点和饮料。\n方便旅客的位置。', N'飲食 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'식음료 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (36, 175);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (37, 's_62764022ca48240b', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (37, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (37, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (38, 's_823ecefc37d7476d', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (38, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (39, 's_308d7cbadf27957e', N'Trung tâm văn hóa truyền thống', N'Trung tâm văn hóa truyền thống', N'Traditional cultural center', N'传统文化中心', N'伝統文化センター', N'전통문화센터');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (39, 123);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (40, 's_d9123c2b55e50460', N'Tiệm hoa', N'Tiệm hoa', N'Flower shop', N'花店', N'フラワーショップ', N'꽃집');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (40, N'Khám phá nhiều loại sản phẩm tại Tiệm hoa.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Flower shop.\nAttractive offers await you.', N'在 花店 发现各种产品。\n诱人的优惠等着您。', N'フラワーショップ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'꽃집 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (40, 122);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (41, 's_143d7cd72d10258d', N'Quầy đồ ăn nhanh', N'Quầy đồ ăn nhanh', N'Fast food', N'快餐', N'ファストフード', N'패스트푸드');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (41, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy đồ ăn nhanh.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Fast food.\nConvenient location for passengers.', N'在 快餐 享用美味的餐点和饮料。\n方便旅客的位置。', N'ファストフード で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'패스트푸드 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (41, 184);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (42, 's_7c00b94263e1c8ff', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (42, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (42, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (43, 's_283224b18f1758ed', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (43, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (43, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (44, 's_e4165f2d7440d73f', N'Ngân hàng/ATM/Đổi ngoại tê', N'Ngân hàng/ATM/Đổi ngoại tê', N'Bank/ATM/Exchange', N'自动取款机', N'ATM (現金自動預け払い機)', N'ATM (현금 인출기)');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (44, 185);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (45, 's_b9fd1ccea81778ec', N'Quầy thông tin du lịch', N'Quầy thông tin du lịch', N'Travel Information Support)', N'旅游信息', N'観光案内', N'관광 안내');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (45, 105);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (46, 's_bfab578fd633d474', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (46, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (46, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (47, 's_c045feea4d6d94d3', N'Hải quan', N'Hải quan', N'Custom', N'海关', N'税関', N'세관');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (47, 125);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (48, 's_b53bd4936602420e', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (48, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (48, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (49, 's_ce983c85dee0089d', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (49, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (49, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (50, 's_50a297e2a7a29bd5', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (50, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (50, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (51, 's_83e3588b8f19df32', N'Cửa hàng miễn thuế', N'Cửa hàng miễn thuế', N'Arrival duty-free', N'免税店', N'免税店', N'면세점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (51, 110);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (52, 's_832125761bfdb15f', N'Cửa hàng miễn thuế', N'Cửa hàng miễn thuế', N'Arrival duty-free', N'免税店', N'免税店', N'면세점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (52, 110);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (53, 's_58ead98862089bcf', N'Cửa hàng miễn thuế', N'Cửa hàng miễn thuế', N'Arrival duty-free', N'免税店', N'免税店', N'면세점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (53, 110);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (54, 's_cc50789f991e558b', N'Cửa hàng miễn thuế', N'Cửa hàng miễn thuế', N'Arrival duty-free', N'免税店', N'免税店', N'면세점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (54, 110);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (55, 's_1c97cc6cdb43cdf0', N'Cửa hàng bán lẻ', N'Cửa hàng bán lẻ', N'Retail', N'零售店', N'小売店', N'소매점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (55, 169);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (56, 's_06c5a058ba462632', N'Dịch vụ đón tiễn khách tại sân bay', N'Dịch vụ đón tiễn khách tại sân bay', N'Pick up service', N'迎送服务', N'お迎えサービス', N'영접 서비스');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (56, 143);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (57, 's_a7c2ad981fdbc346', N'Quầy cà phê và bánh ngọt - Khu cách ly', N'Quầy cà phê và bánh ngọt - Khu cách ly', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (57, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (58, 's_772cb7df29e181f0', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (58, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (58, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (59, 's_29cbbdecb0651bdc', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (59, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (59, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (60, 's_a70504c9c90bdbe9', N'Khu ga đến nội địa', N'Khu ga đến nội địa', N'Domestic Arrivals Area', N'国内到达', N'国内線到着', N'국내선 도착');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (60, 126);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (61, 's_063ba7014e6bb914', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (61, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (61, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (62, 's_d7ec4496283c2e38', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (62, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (62, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (63, 's_7579c394686a4d1a', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (63, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (63, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (64, 's_8f2cce587e5b1221', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (64, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (64, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (65, 's_f900065298e65c7c', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (65, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (65, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (66, 's_2866395e7cb1a21f', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (66, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (66, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (67, 's_ca7f6a9801cc391c', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (67, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (67, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (68, 's_add7d5a643d892ac', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (68, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (68, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (69, 's_695e21e0645d6b45', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (69, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (69, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (70, 's_a5db7727b319899c', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (70, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (70, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (71, 's_f858e90c34472c82', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (71, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (71, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (72, 's_9eab612f0b9e195a', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (72, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (72, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (73, 's_87c0db7d56c69567', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (73, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (73, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (74, 's_6c462d6b304b7afa', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (74, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (74, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (75, 's_1c0ee69af353cf9b', N'Quầy bán món ăn địa phương', N'Quầy bán món ăn địa phương', N'Local food', N'当地美食', N'郷土料理', N'현지 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (75, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán món ăn địa phương.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Local food.\nConvenient location for passengers.', N'在 当地美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'郷土料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'현지 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (75, 160);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (76, 's_5d2b22be589ca755', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (76, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (77, 's_a537e3760f77178c', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (77, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (77, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (78, 's_4706804534718db3', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (78, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (78, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (79, 's_a6d8932dac2af0b8', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (79, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (79, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (80, 's_14e49bd8315b2faf', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (80, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (80, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (81, 's_04c42bb5309f0692', N'Phòng chờ VISA', N'Phòng chờ VISA', N'Visa Waiting Room', N'签证贵宾室', N'ビザラウンジ', N'비자 라운지');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (81, 121);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (82, 's_98cd245b277b0cea', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (82, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (82, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (83, 's_512006bc6572faa5', N'Hành lý quá khổ chuyến đến', N'Hành lý quá khổ chuyến đến', N'Arrival OOG', N'超大行李', N'大型手荷物', N'대형 수하물');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (83, 129);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (84, 's_1f8dd9a5d4c170ed', N'Quầy hành lý thất lạc', N'Quầy hành lý thất lạc', N'Lost & Found', N'失物招领', N'遺失物取扱所', N'분실물 센터');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (84, 95);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (85, 's_f6db98aea65a131b', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (85, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (85, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (86, 's_0e33f87bbbcdc2fa', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (86, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (86, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (87, 's_2eec5b61cc4c3220', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (87, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (88, 's_0fe20dc0134f31a3', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (88, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (88, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (89, 's_f5a6caa77ef72628', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (89, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (89, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (90, 's_a4c97c46927327b8', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (90, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (90, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (91, 's_72a501b44e053174', N'Điểm nối chuyến NĐ-QT', N'Điểm nối chuyến NĐ-QT', N'Transfer Point Dom-Int', N'转机点', N'乗り継ぎポイント', N'환승 지점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (91, 176);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (92, 's_a375bc14623629e3', N'Điểm nối chuyến NĐ-NĐ', N'Điểm nối chuyến NĐ-NĐ', N'Transfer Point Dom-Dom', N'转机点', N'乗り継ぎポイント', N'환승 지점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (92, 176);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (93, 's_0e26ebb825ec04a8', N'Điểm nối chuyến QT-QT', N'Điểm nối chuyến QT-QT', N'Transfer Point Int-Int', N'转机点', N'乗り継ぎポイント', N'환승 지점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (93, 176);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (94, 's_d8d644a6d88faaed', N'Quầy hành lý thất lạc quốc nội', N'Quầy hành lý thất lạc quốc nội', N'Domestic Lost & Found Counter', N'失物招领', N'遺失物取扱所', N'분실물 센터');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (94, 95);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (95, 'ar_1cb78b6697bde842', N'Khu vực nhập cảnh', N'Khu vực nhập cảnh', N'Immigration', N'入境', N'入国審査', N'입국 심사');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (95, 127);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (96, 'ar_3ba366e7feebc88d', N'Khu vực nhập cảnh', N'Khu vực nhập cảnh', N'Immigration', N'入境', N'入国審査', N'입국 심사');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (96, 127);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (97, 'ar_f41a24d9d20ee6f0', N'Khu vực nhập cảnh', N'Khu vực nhập cảnh', N'Immigration', N'入境', N'入国審査', N'입국 심사');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (97, 127);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (98, 'ar_ca875a9a6cc93da0', N'Khu vực nhập cảnh', N'Khu vực nhập cảnh', N'Immigration', N'入境', N'入国審査', N'입국 심사');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (98, 127);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (99, 's_d3e768ad2c0abcb9', N'Sảnh đến', N'Sảnh đến', N'tầng trệt', N'tầng trệt', N'tầng trệt', N'tầng trệt');
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (100, 's_747aae916e4dde68', N'Đường công vụ', N'Đường công vụ', N'Service road', N'公务路', N'業務用道路', N'업무용 도로');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (100, 181);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (101, 's_735bd7669d1ca7af', N'Đường công vụ', N'Đường công vụ', N'Service road', N'公务路', N'業務用道路', N'업무용 도로');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (101, 181);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (102, 's_902df6f80b1a1441', N'Đường công vụ', N'Đường công vụ', N'Service road', N'公务路', N'業務用道路', N'업무용 도로');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (102, 181);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (103, 's_e605cd6f79cb696c', N'Đường công vụ', N'Đường công vụ', N'Service road', N'公务路', N'業務用道路', N'업무용 도로');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (103, 181);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (104, 's_5a59ddd3f5727c9d', N'Khu nhận hành lý nội địa', N'Khu nhận hành lý nội địa', N'Domestic Baggage Reclaim', N'行李提取', N'手荷物受取所', N'수하물 수취');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (104, 183);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (105, 's_03696d366f487bd4', N'Khu nhận hành lý quốc tế', N'Khu nhận hành lý quốc tế', N'International Baggage Reclaim', N'行李提取', N'手荷物受取所', N'수하물 수취');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (105, 183);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (106, 's_e976da08babd01a8', N'Khu nhận hành lý quốc tế', N'Khu nhận hành lý quốc tế', N'International Baggage Reclaim', N'行李提取', N'手荷物受取所', N'수하물 수취');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (106, 183);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (107, 'e_b827a9a63872f1bc', N'Cửa ra tàu bay - 135', N'Cửa ra tàu bay - 135', N'Gate 135', N'登机口 135', N'ゲート 135', N'게이트 135');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (107, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (108, 'e_1277e6948a3b43be', N'Cửa ra tàu bay - 136', N'Cửa ra tàu bay - 136', N'Gate 136', N'登机口 136', N'ゲート 136', N'게이트 136');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (108, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (109, 'e_e5ecd84f77bfb5a5', N'Cửa ra tàu bay - 134', N'Cửa ra tàu bay - 134', N'Gate 134', N'登机口 134', N'ゲート 134', N'게이트 134');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (109, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (110, 'e_ffa8785fbbf8f380', N'Cửa ra tàu bay - 132', N'Cửa ra tàu bay - 132', N'Gate 132', N'登机口 132', N'ゲート 132', N'게이트 132');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (110, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (111, 'e_c5f8906f747bcd04', N'Cửa ra tàu bay - 133', N'Cửa ra tàu bay - 133', N'Gate 133', N'登机口 133', N'ゲート 133', N'게이트 133');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (111, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (112, 'e_61fb2f9333e9f6eb', N'Cửa ra tàu bay - 131', N'Cửa ra tàu bay - 131', N'Gate 131', N'登机口 131', N'ゲート 131', N'게이트 131');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (112, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (113, 'e_1ac11b3beb89c85f', N'Cửa ra tàu bay - 130', N'Cửa ra tàu bay - 130', N'Gate 130', N'登机口 130', N'ゲート 130', N'게이트 130');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (113, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (114, 'e_ee18d5c2158c070c', N'Quầy bán món ăn địa phương', N'Quầy bán món ăn địa phương', N'Local food', N'当地美食', N'郷土料理', N'현지 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (114, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán món ăn địa phương.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Local food.\nConvenient location for passengers.', N'在 当地美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'郷土料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'현지 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (114, 160);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (115, 'e_264d05d9b03b7ffd', N'Cửa ra tàu bay - 5B', N'Cửa ra tàu bay - 5B', N'Gate 5B', N'登机口 5B', N'ゲート 5B', N'게이트 5B');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (115, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (116, 'e_45720d12643f044d', N'Cửa ra tàu bay - 5A', N'Cửa ra tàu bay - 5A', N'Gate 5A', N'登机口 5A', N'ゲート 5A', N'게이트 5A');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (116, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (117, 'e_555f18b114a2be4d', N'Cửa ra tàu bay - 11', N'Cửa ra tàu bay - 11', N'Gate 11', N'登机口 11', N'ゲート 11', N'게이트 11');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (117, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (118, 'e_08e68594ce9240df', N'Cửa ra tàu bay - 21', N'Cửa ra tàu bay - 21', N'Gate 21', N'登机口 21', N'ゲート 21', N'게이트 21');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (118, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (119, 'e_dd79261777557273', N'Cửa ra tàu bay - 28B', N'Cửa ra tàu bay - 28B', N'Gate 28B', N'登机口 28B', N'ゲート 28B', N'게이트 28B');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (119, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (120, 'e_d5d955ef7ce15cf6', N'Cửa ra tàu bay - 16', N'Cửa ra tàu bay - 16', N'Gate 16', N'登机口 16', N'ゲート 16', N'게이트 16');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (120, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (121, 'e_a8815b8fec2a357a', N'Cửa ra tàu bay - 28A', N'Cửa ra tàu bay - 28A', N'Gate 28A', N'登机口 28A', N'ゲート 28A', N'게이트 28A');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (121, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (122, 's_541b67d37ddf33eb', N'Văn phòng', N'Văn phòng', N'Office', N'办公室', N'オフィス', N'사무실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (122, 177);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (123, 's_b6419b9459526ab0', N'Văn phòng', N'Văn phòng', N'Office', N'办公室', N'オフィス', N'사무실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (123, 177);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (124, 's_90cbf23bf33153c5', N'Khu ẩm thực cao cấp', N'Khu ẩm thực cao cấp', N'Dining room', N'高级餐饮', N'高級ダイニング', N'파인 다이닝');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (124, 168);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (125, 's_2642be6775f00e8d', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (125, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (125, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (126, 's_216b7975a00713e6', N'Quầy thu đổi ngoại tệ', N'Quầy thu đổi ngoại tệ', N'Foreign Exchange', N'货币兑换', N'両替', N'환전');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (126, 89);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (127, 's_121550869199e6a9', N'Cửa hàng mỹ phẩm', N'Cửa hàng mỹ phẩm', N'Cosmetic', N'化妆品', N'コスメ', N'화장품');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (127, 58);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (128, 's_b44b9985872568f9', N'Cửa hàng trang sức', N'Cửa hàng trang sức', N'Jewelry and watch store', N'珠宝', N'ジュエリー', N'주얼리');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (128, N'Khám phá nhiều loại sản phẩm tại Cửa hàng trang sức.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Jewelry and watch store.\nAttractive offers await you.', N'在 珠宝 发现各种产品。\n诱人的优惠等着您。', N'ジュエリー で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'주얼리 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (128, 72);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (129, 's_0d96307dc8a33896', N'Cửa hàng rượu và thuốc lá', N'Cửa hàng rượu và thuốc lá', N'Liquor & Tobacco Store', N'烟酒商店', N'酒＆タバコ店', N'주류 및 담배 판매점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (129, N'Khám phá nhiều loại sản phẩm tại Cửa hàng rượu và thuốc lá.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Liquor & Tobacco Store.\nAttractive offers await you.', N'在 烟酒商店 发现各种产品。\n诱人的优惠等着您。', N'酒＆タバコ店 で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'주류 및 담배 판매점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (129, 182);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (130, 's_895bddd0cba59891', N'Trung tâm văn hóa truyền thống', N'Trung tâm văn hóa truyền thống', N'Traditional cultural center', N'传统文化中心', N'伝統文化センター', N'전통문화센터');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (130, 123);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (131, 's_32a654dbbb0f1b6c', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (131, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (131, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (132, 's_fa6deebd1efa683a', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (132, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (132, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (133, 's_1c4ddd02732445dd', N'Nhà thuốc', N'Nhà thuốc', N'Pharmacy', N'药房', N'薬局', N'약국');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (133, 84);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (134, 's_0e13ebc436e64677', N'Cửa hàng mỹ phẩm', N'Cửa hàng mỹ phẩm', N'Cosmetic', N'化妆品', N'コスメ', N'화장품');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (134, 58);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (135, 's_88fa42b37a404d3a', N'Cửa hàng trang sức', N'Cửa hàng trang sức', N'Jewelry and watch store', N'珠宝', N'ジュエリー', N'주얼리');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (135, N'Khám phá nhiều loại sản phẩm tại Cửa hàng trang sức.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Jewelry and watch store.\nAttractive offers await you.', N'在 珠宝 发现各种产品。\n诱人的优惠等着您。', N'ジュエリー で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'주얼리 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (135, 72);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (136, 's_f8a26f40ef40fe45', N'Cửa hàng mỹ phẩm', N'Cửa hàng mỹ phẩm', N'Cosmetic', N'化妆品', N'コスメ', N'화장품');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (136, 58);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (137, 's_65ddc69c144bc562', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (137, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (137, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (138, 's_8125e2b351bedcd2', N'Hệ thống băng chuyền hành lý', N'Hệ thống băng chuyền hành lý', N'Baggage Conveyor System', N'行李传送带', N'手荷物コンベヤー', N'수하물 컨베이어');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (138, 178);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (139, 's_002cb558a646e57e', N'Cửa hàng đồ điện tử', N'Cửa hàng đồ điện tử', N'Electronics Store', N'电子设备', N'電子機器', N'전자기기');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (139, N'Khám phá nhiều loại sản phẩm tại Cửa hàng đồ điện tử.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Electronics Store.\nAttractive offers await you.', N'在 电子设备 发现各种产品。\n诱人的优惠等着您。', N'電子機器 で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'전자기기 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (139, 64);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (140, 's_94c8be89f50debeb', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (140, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (140, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (141, 's_a932e5fc18a82a2f', N'Phòng cầu nguyện', N'Phòng cầu nguyện', N'Prayer Room', N'祈祷室', N'祈祷室', N'기도실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (141, 116);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (142, 's_661cc9a53ed20dad', N'Phòng chờ hạng thương gia', N'Phòng chờ hạng thương gia', N'CIP', N'商务舱贵宾室', N'ビジネスクラスラウンジ', N'비즈니스 라운지');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (142, 118);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (143, 's_6cee8f911c60d363', N'Phòng chờ hạng thương gia', N'Phòng chờ hạng thương gia', N'CIP', N'商务舱贵宾室', N'ビジネスクラスラウンジ', N'비즈니스 라운지');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (143, 118);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (144, 's_7259dc5439346264', N'Phòng chờ hạng thương gia', N'Phòng chờ hạng thương gia', N'CIP', N'商务舱贵宾室', N'ビジネスクラスラウンジ', N'비즈니스 라운지');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (144, 118);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (145, 's_5da019cd4f11db6c', N'Khu vui chơi trẻ em', N'Khu vui chơi trẻ em', N'Kids zone', N'儿童游乐区', N'キッズゾーン', N'어린이 놀이터');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (145, 94);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (146, 's_244a641e882bc8dc', N'Cửa hàng bán sản phẩm du lịch', N'Cửa hàng bán sản phẩm du lịch', N'Travel goods', N'旅行用品', N'旅行用品', N'여행 용품');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (146, 179);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (147, 's_e698f4ed04c31039', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (147, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (147, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (148, 's_a739a9c3932c94fa', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (148, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (148, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (149, 's_fc7b02fdacf08611', N'Phòng Internet', N'Phòng Internet', N'Internet Lounge', N'网吧', N'インターネットラウンジ', N'인터넷 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (149, N'Thư giãn thoải mái tại Phòng Internet.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at Internet Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 网吧 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'インターネットラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'인터넷 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (149, 166);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (150, 's_f217fffdbc217890', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (150, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (151, 's_cc7167316907a7d2', N'Khu vực ghế Massage - Khu cách ly', N'Khu vực ghế Massage - Khu cách ly', N'Massage Chair', N'按摩椅', N'マッサージチェア', N'마사지 의자');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (151, 114);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (152, 's_37cbe38c5739a5b7', N'Quầy bán món ăn địa phương', N'Quầy bán món ăn địa phương', N'Local food', N'当地美食', N'郷土料理', N'현지 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (152, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán món ăn địa phương.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Local food.\nConvenient location for passengers.', N'在 当地美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'郷土料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'현지 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (152, 160);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (153, 's_fa64466c42ca32e1', N'Cửa hàng tiện lợi', N'Cửa hàng tiện lợi', N'convenience store', N'便利店', N'コンビニ', N'편의점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (153, N'Khám phá nhiều loại sản phẩm tại Cửa hàng tiện lợi.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at convenience store.\nAttractive offers await you.', N'在 便利店 发现各种产品。\n诱人的优惠等着您。', N'コンビニ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'편의점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (153, 109);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (154, 's_2615096c3de4afcf', N'Quầy cà phê', N'Quầy cà phê', N'Coffee', N'咖啡店', N'コーヒーショップ', N'커피숍');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (154, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy cà phê.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Coffee.\nConvenient location for passengers.', N'在 咖啡店 享用美味的餐点和饮料。\n方便旅客的位置。', N'コーヒーショップ で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'커피숍 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (154, 164);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (155, 's_9ed9e3fae0e45b6c', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (155, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (155, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (156, 's_edc6d85e92c6f046', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (156, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (156, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (157, 's_8479a1012caf15ef', N'Cửa hàng tiện lợi', N'Cửa hàng tiện lợi', N'convenience store', N'便利店', N'コンビニ', N'편의점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (157, N'Khám phá nhiều loại sản phẩm tại Cửa hàng tiện lợi.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at convenience store.\nAttractive offers await you.', N'在 便利店 发现各种产品。\n诱人的优惠等着您。', N'コンビニ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'편의점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (157, 109);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (158, 's_ad7bf02bd443a36c', N'Cửa hàng bán lẻ', N'Cửa hàng bán lẻ', N'Retail', N'零售店', N'小売店', N'소매점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (158, 169);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (159, 's_c49e458806dc7775', N'Phòng chờ ga đi quốc nội/ quốc tế', N'Phòng chờ ga đi quốc nội/ quốc tế', N'Dom/Int Departure Lounge', N'国内出发贵宾室', N'国内線出発ラウンジ', N'국내선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (159, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc nội/ quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at Dom/Int Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国内出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国内線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국내선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (159, 119);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (160, 's_b7d7974e0f3ad86d', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (160, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (160, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (161, 's_de3a5027f20588f9', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (161, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (161, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (162, 's_660fe9be05bf5be5', N'Khu vực ghế Massage - Khu cách ly', N'Khu vực ghế Massage - Khu cách ly', N'Massage Chair', N'按摩椅', N'マッサージチェア', N'마사지 의자');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (162, 114);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (163, 's_7a3c7dcf79c3d0d9', N'Cửa hàng bán đồ lưu niệm', N'Cửa hàng bán đồ lưu niệm', N'Souvenir shop', N'纪念品店', N'お土産店', N'기념품점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (163, N'Khám phá nhiều loại sản phẩm tại Cửa hàng bán đồ lưu niệm.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Souvenir shop.\nAttractive offers await you.', N'在 纪念品店 发现各种产品。\n诱人的优惠等着您。', N'お土産店 で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'기념품점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (163, 111);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (164, 's_5b4be104310203b9', N'Quầy bar thư giãn', N'Quầy bar thư giãn', N'Casual Bar', N'酒吧', N'バー', N'바');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (164, 78);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (165, 's_d62c3eecda5ffc04', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (165, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (165, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (166, 's_8dff23699ff3a530', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (166, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (166, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (167, 's_2d3ecc63cc8cb2a2', N'Khu nghỉ ngơi', N'Khu nghỉ ngơi', N'Nap zone', N'休息区', N'休憩エリア', N'휴식 공간');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (167, 173);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (168, 's_c4ac6dc577169053', N'Khu vực ghế Massage - Khu cách ly', N'Khu vực ghế Massage - Khu cách ly', N'Massage Chair', N'按摩椅', N'マッサージチェア', N'마사지 의자');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (168, 114);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (169, 's_b33a792c389d06e7', N'Phòng hút thuốc', N'Phòng hút thuốc', N'Smoking room', N'吸烟室', N'喫煙室', N'흡연실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (169, 103);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (170, 's_d5d4a0c94c805fc0', N'Cửa hàng mỹ phẩm', N'Cửa hàng mỹ phẩm', N'Cosmetic', N'化妆品', N'コスメ', N'화장품');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (170, 58);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (171, 's_6a5aa0b67cf1f559', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (171, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (172, 's_4da6f620f9948cd9', N'Quầy bán món ăn địa phương', N'Quầy bán món ăn địa phương', N'Local food', N'当地美食', N'郷土料理', N'현지 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (172, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán món ăn địa phương.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Local food.\nConvenient location for passengers.', N'在 当地美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'郷土料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'현지 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (172, 160);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (173, 's_338931eeb30a4722', N'Cửa hàng rượu và thuốc lá', N'Cửa hàng rượu và thuốc lá', N'Liquor & Tobacco Store', N'烟酒商店', N'酒＆タバコ店', N'주류 및 담배 판매점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (173, N'Khám phá nhiều loại sản phẩm tại Cửa hàng rượu và thuốc lá.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Liquor & Tobacco Store.\nAttractive offers await you.', N'在 烟酒商店 发现各种产品。\n诱人的优惠等着您。', N'酒＆タバコ店 で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'주류 및 담배 판매점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (173, 182);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (174, 's_347582828ed810e5', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (174, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (175, 's_e19454c323e24de3', N'Khu ẩm thực cao cấp', N'Khu ẩm thực cao cấp', N'Dining room', N'高级餐饮', N'高級ダイニング', N'파인 다이닝');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (175, 168);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (176, 's_d759546c2055e5bc', N'Cửa hàng thời trang', N'Cửa hàng thời trang', N'Fashion shop', N'时装店', N'ファッションショップ', N'패션 매장');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (176, N'Khám phá nhiều loại sản phẩm tại Cửa hàng thời trang.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Fashion shop.\nAttractive offers await you.', N'在 时装店 发现各种产品。\n诱人的优惠等着您。', N'ファッションショップ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'패션 매장 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (176, 171);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (177, 's_6fe2c395f06c6cc7', N'Quầy thực phẩm đóng gói', N'Quầy thực phẩm đóng gói', N'Package Food', N'包装食品', N'加工食品', N'포장 식품');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (177, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy thực phẩm đóng gói.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Package Food.\nConvenient location for passengers.', N'在 包装食品 享用美味的餐点和饮料。\n方便旅客的位置。', N'加工食品 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'포장 식품 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (177, 170);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (178, 's_25b60d4d538c6bd4', N'Cửa hàng mỹ phẩm', N'Cửa hàng mỹ phẩm', N'Cosmetic', N'化妆品', N'コスメ', N'화장품');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (178, 58);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (179, 's_d96876f038a28272', N'Cửa hàng thời trang', N'Cửa hàng thời trang', N'Fashion shop', N'时装店', N'ファッションショップ', N'패션 매장');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (179, N'Khám phá nhiều loại sản phẩm tại Cửa hàng thời trang.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Fashion shop.\nAttractive offers await you.', N'在 时装店 发现各种产品。\n诱人的优惠等着您。', N'ファッションショップ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'패션 매장 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (179, 171);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (180, 's_ad433f95b05c8ece', N'Cửa hàng thời trang', N'Cửa hàng thời trang', N'Fashion shop', N'时装店', N'ファッションショップ', N'패션 매장');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (180, N'Khám phá nhiều loại sản phẩm tại Cửa hàng thời trang.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Fashion shop.\nAttractive offers await you.', N'在 时装店 发现各种产品。\n诱人的优惠等着您。', N'ファッションショップ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'패션 매장 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (180, 171);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (181, 's_00508a6929b8584c', N'Cửa hàng thời trang', N'Cửa hàng thời trang', N'Fashion shop', N'时装店', N'ファッションショップ', N'패션 매장');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (181, N'Khám phá nhiều loại sản phẩm tại Cửa hàng thời trang.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Fashion shop.\nAttractive offers await you.', N'在 时装店 发现各种产品。\n诱人的优惠等着您。', N'ファッションショップ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'패션 매장 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (181, 171);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (182, 's_5e70b889b9580d0a', N'Cửa hàng rượu và thuốc lá', N'Cửa hàng rượu và thuốc lá', N'Liquor & Tobacco Store', N'烟酒商店', N'酒＆タバコ店', N'주류 및 담배 판매점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (182, N'Khám phá nhiều loại sản phẩm tại Cửa hàng rượu và thuốc lá.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Liquor & Tobacco Store.\nAttractive offers await you.', N'在 烟酒商店 发现各种产品。\n诱人的优惠等着您。', N'酒＆タバコ店 で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'주류 및 담배 판매점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (182, 182);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (183, 's_8d21a6bbf370272b', N'Cửa hàng thời trang', N'Cửa hàng thời trang', N'Fashion shop', N'时装店', N'ファッションショップ', N'패션 매장');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (183, N'Khám phá nhiều loại sản phẩm tại Cửa hàng thời trang.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Fashion shop.\nAttractive offers await you.', N'在 时装店 发现各种产品。\n诱人的优惠等着您。', N'ファッションショップ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'패션 매장 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (183, 171);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (184, 's_0e366df3d718b553', N'Quầy thực phẩm đóng gói', N'Quầy thực phẩm đóng gói', N'Package Food', N'包装食品', N'加工食品', N'포장 식품');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (184, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy thực phẩm đóng gói.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Package Food.\nConvenient location for passengers.', N'在 包装食品 享用美味的餐点和饮料。\n方便旅客的位置。', N'加工食品 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'포장 식품 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (184, 170);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (185, 's_557f2f311aa020e9', N'Cửa hàng thời trang', N'Cửa hàng thời trang', N'Fashion shop', N'时装店', N'ファッションショップ', N'패션 매장');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (185, N'Khám phá nhiều loại sản phẩm tại Cửa hàng thời trang.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Fashion shop.\nAttractive offers await you.', N'在 时装店 发现各种产品。\n诱人的优惠等着您。', N'ファッションショップ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'패션 매장 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (185, 171);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (186, 's_78e17ae52c860883', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (186, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (187, 's_f007a1a08d0535ca', N'Khu ẩm thực cao cấp', N'Khu ẩm thực cao cấp', N'Dining room', N'高级餐饮', N'高級ダイニング', N'파인 다이닝');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (187, 168);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (188, 's_8f2ad2b9ab43aeaa', N'Cửa hàng mỹ phẩm', N'Cửa hàng mỹ phẩm', N'Cosmetic', N'化妆品', N'コスメ', N'화장품');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (188, 58);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (189, 's_447f2e72f6b88cc7', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (189, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (190, 's_6d1ada40b89169f4', N'Cửa hàng bán lẻ', N'Cửa hàng bán lẻ', N'Retail', N'零售店', N'小売店', N'소매점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (190, 169);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (191, 's_7c1139b65c34fb95', N'Ẩm thực quốc tế', N'Ẩm thực quốc tế', N'Global Food', N'国际美食', N'多国籍料理', N'세계 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (191, N'Thưởng thức các món ăn ngon và đồ uống tại Ẩm thực quốc tế.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Global Food.\nConvenient location for passengers.', N'在 国际美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'多国籍料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'세계 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (191, 180);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (192, 's_3ca59844f21e44d2', N'Khu vực ghế Massage - Khu cách ly', N'Khu vực ghế Massage - Khu cách ly', N'Massage Chair', N'按摩椅', N'マッサージチェア', N'마사지 의자');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (192, 114);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (193, 's_40969f9990f1ad68', N'Phòng Internet', N'Phòng Internet', N'Internet Lounge', N'网吧', N'インターネットラウンジ', N'인터넷 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (193, N'Thư giãn thoải mái tại Phòng Internet.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at Internet Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 网吧 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'インターネットラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'인터넷 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (193, 166);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (194, 's_5dff95c90a0fdb7d', N'Khu vui chơi trẻ em', N'Khu vui chơi trẻ em', N'Kids zone', N'儿童游乐区', N'キッズゾーン', N'어린이 놀이터');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (194, 94);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (195, 's_5d7fd29cd3d14fc6', N'Cửa hàng bán đồ lưu niệm', N'Cửa hàng bán đồ lưu niệm', N'Souvenir shop', N'纪念品店', N'お土産店', N'기념품점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (195, N'Khám phá nhiều loại sản phẩm tại Cửa hàng bán đồ lưu niệm.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Souvenir shop.\nAttractive offers await you.', N'在 纪念品店 发现各种产品。\n诱人的优惠等着您。', N'お土産店 で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'기념품점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (195, 111);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (196, 's_93b64aa92dbff527', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (196, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (196, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (197, 's_3b8df2aa433fb8c5', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (197, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (197, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (198, 's_c1a6532f408cbf94', N'Phòng hút thuốc', N'Phòng hút thuốc', N'Smoking room', N'吸烟室', N'喫煙室', N'흡연실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (198, 103);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (199, 's_0f4d503ba243b786', N'Ẩm thực quốc tế', N'Ẩm thực quốc tế', N'Global Food', N'国际美食', N'多国籍料理', N'세계 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (199, N'Thưởng thức các món ăn ngon và đồ uống tại Ẩm thực quốc tế.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Global Food.\nConvenient location for passengers.', N'在 国际美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'多国籍料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'세계 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (199, 180);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (200, 's_f8ec30ed6aadf3a5', N'Khu vực ghế Massage - Khu cách ly', N'Khu vực ghế Massage - Khu cách ly', N'Massage Chair', N'按摩椅', N'マッサージチェア', N'마사지 의자');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (200, 114);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (201, 's_97f1e54fa8d57676', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (201, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (201, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (202, 's_0bbd1234e4e42baf', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (202, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (202, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (203, 's_ee75806d088bec1e', N'Khu nghỉ ngơi', N'Khu nghỉ ngơi', N'Nap zone', N'休息区', N'休憩エリア', N'휴식 공간');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (203, 173);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (204, 's_ec8fff416b508cc6', N'Quầy bar thư giãn', N'Quầy bar thư giãn', N'Casual Bar', N'酒吧', N'バー', N'바');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (204, 78);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (205, 's_d2c157e37cb73267', N'Cửa hàng bán lẻ', N'Cửa hàng bán lẻ', N'Retail', N'零售店', N'小売店', N'소매점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (205, 169);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (206, 's_157104bdcda25544', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (206, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (207, 's_22ccf76980e9c096', N'Quầy bán món tráng miệng', N'Quầy bán món tráng miệng', N'dessert shop', N'甜品店', N'デザートショップ', N'디저트 가게');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (207, N'Khám phá nhiều loại sản phẩm tại Quầy bán món tráng miệng.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at dessert shop.\nAttractive offers await you.', N'在 甜品店 发现各种产品。\n诱人的优惠等着您。', N'デザートショップ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'디저트 가게 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (207, 161);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (208, 's_5a42276b7134903a', N'Cửa hàng bán đồ lưu niệm', N'Cửa hàng bán đồ lưu niệm', N'Souvenir shop', N'纪念品店', N'お土産店', N'기념품점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (208, N'Khám phá nhiều loại sản phẩm tại Cửa hàng bán đồ lưu niệm.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Souvenir shop.\nAttractive offers await you.', N'在 纪念品店 发现各种产品。\n诱人的优惠等着您。', N'お土産店 で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'기념품점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (208, 111);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (209, 's_406d856dbbffad8e', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (209, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (209, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (210, 's_5fcb4b583b4773df', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (210, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (210, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (211, 's_715045bebbf00f6d', N'Khu nghỉ ngơi', N'Khu nghỉ ngơi', N'Nap zone', N'休息区', N'休憩エリア', N'휴식 공간');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (211, 173);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (212, 's_2d33af8da25b3322', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (212, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (213, 's_901a3a2fbed898b5', N'Quầy bán món ăn địa phương', N'Quầy bán món ăn địa phương', N'Local food', N'当地美食', N'郷土料理', N'현지 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (213, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán món ăn địa phương.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Local food.\nConvenient location for passengers.', N'在 当地美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'郷土料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'현지 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (213, 160);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (214, 's_0a3dfd9baffbade1', N'Khu ẩm thực cao cấp', N'Khu ẩm thực cao cấp', N'Dining room', N'高级餐饮', N'高級ダイニング', N'파인 다이닝');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (214, 168);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (215, 's_1b39d0ca70c1c30b', N'Cảnh quan', N'Cảnh quan', N'Landscape', N'景观', N'ランドスケープ', N'조경');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (215, 141);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (216, 's_25c02f72d6070109', N'Cảnh quan', N'Cảnh quan', N'Landscape', N'景观', N'ランドスケープ', N'조경');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (216, 141);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (217, 's_d0c392ebbcf494ea', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (217, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (218, 's_322cb6b21c9a35f9', N'Cửa hàng đồ điện tử', N'Cửa hàng đồ điện tử', N'Electronics Store', N'电子设备', N'電子機器', N'전자기기');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (218, N'Khám phá nhiều loại sản phẩm tại Cửa hàng đồ điện tử.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at Electronics Store.\nAttractive offers await you.', N'在 电子设备 发现各种产品。\n诱人的优惠等着您。', N'電子機器 で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'전자기기 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (218, 64);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (219, 's_f9706c268aac272e', N'Khu ẩm thực cao cấp', N'Khu ẩm thực cao cấp', N'Dining room', N'高级餐饮', N'高級ダイニング', N'파인 다이닝');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (219, 168);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (220, 's_32d2ebc5498e41d6', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (220, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (220, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (221, 's_192e20d2f6ea6bdf', N'Cửa hàng mỹ phẩm', N'Cửa hàng mỹ phẩm', N'Cosmetic', N'化妆品', N'コスメ', N'화장품');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (221, 58);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (222, 's_e91cefd216d0367e', N'Phòng chăm sóc em bé', N'Phòng chăm sóc em bé', N'Nursing room', N'母婴室', N'授乳室', N'수유실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (222, 97);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (223, 's_6ca20f4a81d59748', N'Phòng chăm sóc em bé', N'Phòng chăm sóc em bé', N'Nursing room', N'母婴室', N'授乳室', N'수유실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (223, 97);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (224, 's_e1e6f8913efa8554', N'Phòng y tế', N'Phòng y tế', N'Medical Room', N'医务室', N'医務室', N'의무실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (224, 174);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (225, 's_71dc501287ea57df', N'Khu vực bọc hành lý', N'Khu vực bọc hành lý', N'Luggage Wrapping Area', N'行李打包区', N'手荷物ラッピングエリア', N'수하물 포장 구역');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (225, 167);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (226, 's_879105f9f6c5a78d', N'Khu vực bọc hành lý', N'Khu vực bọc hành lý', N'Luggage Wrapping Area', N'行李打包区', N'手荷物ラッピングエリア', N'수하물 포장 구역');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (226, 167);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (227, 's_233e7224b54ae05b', N'Khu vực bọc hành lý', N'Khu vực bọc hành lý', N'Luggage Wrapping Area', N'行李打包区', N'手荷物ラッピングエリア', N'수하물 포장 구역');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (227, 167);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (228, 's_50852cf314319c8e', N'Khu vực bọc hành lý', N'Khu vực bọc hành lý', N'Luggage Wrapping Area', N'行李打包区', N'手荷物ラッピングエリア', N'수하물 포장 구역');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (228, 167);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (229, 's_52ab4c19f98bbe3b', N'Quầy thông tin du lịch', N'Quầy thông tin du lịch', N'Travel Information Support)', N'旅游信息', N'観光案内', N'관광 안내');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (229, 105);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (230, 's_b9340223de265d56', N'Quầy thông tin du lịch', N'Quầy thông tin du lịch', N'Travel Information Support)', N'旅游信息', N'観光案内', N'관광 안내');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (230, 105);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (231, 's_9605235694629a21', N'Cửa hàng tiện lợi', N'Cửa hàng tiện lợi', N'convenience store', N'便利店', N'コンビニ', N'편의점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (231, N'Khám phá nhiều loại sản phẩm tại Cửa hàng tiện lợi.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at convenience store.\nAttractive offers await you.', N'在 便利店 发现各种产品。\n诱人的优惠等着您。', N'コンビニ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'편의점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (231, 109);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (232, 's_ee4ed4af0db2a16a', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (232, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (232, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (233, 's_50badf0e3e6b9d37', N'Phòng lưu trữ hành lý', N'Phòng lưu trữ hành lý', N'Luggage Storage Room', N'行李寄存', N'手荷物一時預かり', N'수하물 보관');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (233, 134);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (234, 's_66786e44960a0e2c', N'Quầy cà phê và bánh ngọt', N'Quầy cà phê và bánh ngọt', N'Cafe & Bakery', N'咖啡和烘焙', N'カフェ＆ベーカリー', N'카페 & 베이커리');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (234, 163);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (235, 's_f3279dd5305c92c1', N'Quầy hành lý quá khổ', N'Quầy hành lý quá khổ', N'OOG', N'超大行李', N'大型手荷物', N'대형 수하물');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (235, 129);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (236, 's_1f44ff9349985ef4', N'Quầy thu đổi ngoại tệ', N'Quầy thu đổi ngoại tệ', N'Foreign Exchange', N'货币兑换', N'両替', N'환전');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (236, 89);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (237, 's_01e81dc1c34571df', N'Quầy bán món ăn địa phương', N'Quầy bán món ăn địa phương', N'Local food', N'当地美食', N'郷土料理', N'현지 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (237, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán món ăn địa phương.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Local food.\nConvenient location for passengers.', N'在 当地美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'郷土料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'현지 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (237, 160);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (238, 's_62a45153a58c8135', N'Quầy đồ ăn nhanh', N'Quầy đồ ăn nhanh', N'Fast food', N'快餐', N'ファストフード', N'패스트푸드');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (238, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy đồ ăn nhanh.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Fast food.\nConvenient location for passengers.', N'在 快餐 享用美味的餐点和饮料。\n方便旅客的位置。', N'ファストフード で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'패스트푸드 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (238, 184);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (239, 's_10c25922c3fe91fb', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (239, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (239, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (240, 's_01c95efed2c6ee6f', N'Phòng chăm sóc em bé', N'Phòng chăm sóc em bé', N'Nursing room', N'母婴室', N'授乳室', N'수유실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (240, 97);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (241, 's_69c3d6cbe47c9007', N'Văn phòng đăng ký sinh trắc học nhập cảnh', N'Văn phòng đăng ký sinh trắc học nhập cảnh', N'Biometrics Immigration Registration Office', N'办公室', N'オフィス', N'사무실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (241, 177);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (242, 's_24f1e4bcfc8d5bf5', N'Phòng chăm sóc em bé', N'Phòng chăm sóc em bé', N'Nursing room', N'母婴室', N'授乳室', N'수유실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (242, 97);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (243, 's_c08b91061e3abfa5', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (243, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (243, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (244, 's_099d60cc3b50aa38', N'Cửa hàng tiện lợi', N'Cửa hàng tiện lợi', N'convenience store', N'便利店', N'コンビニ', N'편의점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (244, N'Khám phá nhiều loại sản phẩm tại Cửa hàng tiện lợi.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at convenience store.\nAttractive offers await you.', N'在 便利店 发现各种产品。\n诱人的优惠等着您。', N'コンビニ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'편의점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (244, 109);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (245, 's_45a3be08e4f60e44', N'Quầy đồ ăn nhanh', N'Quầy đồ ăn nhanh', N'Fast food', N'快餐', N'ファストフード', N'패스트푸드');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (245, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy đồ ăn nhanh.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Fast food.\nConvenient location for passengers.', N'在 快餐 享用美味的餐点和饮料。\n方便旅客的位置。', N'ファストフード で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'패스트푸드 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (245, 184);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (246, 's_42a2ed975534d438', N'Quầy bán món ăn địa phương', N'Quầy bán món ăn địa phương', N'Local food', N'当地美食', N'郷土料理', N'현지 음식');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (246, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán món ăn địa phương.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Local food.\nConvenient location for passengers.', N'在 当地美食 享用美味的餐点和饮料。\n方便旅客的位置。', N'郷土料理 で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'현지 음식 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (246, 160);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (247, 's_6c0174734497c57d', N'Quầy thu đổi ngoại tệ', N'Quầy thu đổi ngoại tệ', N'Foreign Exchange', N'货币兑换', N'両替', N'환전');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (247, 89);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (248, 's_7a6970b0018311d1', N'Dịch vụ bưu điện', N'Dịch vụ bưu điện', N'Post Office', N'办公室', N'オフィス', N'사무실');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (248, 177);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (249, 's_f82579a05c419c56', N'Cửa hàng tiện lợi', N'Cửa hàng tiện lợi', N'convenience store', N'便利店', N'コンビニ', N'편의점');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (249, N'Khám phá nhiều loại sản phẩm tại Cửa hàng tiện lợi.\nNhiều ưu đãi hấp dẫn đang chờ bạn.', N'Discover a wide range of products at convenience store.\nAttractive offers await you.', N'在 便利店 发现各种产品。\n诱人的优惠等着您。', N'コンビニ で幅広い製品をご覧ください。\n魅力的なオファーがあなたを待っています。', N'편의점 에서 다양한 제품을 만나보세요.\n매력적인 혜택이 기다리고 있습니다.', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (249, 109);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (250, 's_13bcd0dd17458c7c', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (250, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (250, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (251, 's_e8046bcc797c2314', N'Phòng lưu trữ hành lý', N'Phòng lưu trữ hành lý', N'Luggage Storage Room', N'行李寄存', N'手荷物一時預かり', N'수하물 보관');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (251, 134);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (252, 's_761937179562c621', N'Quầy bán đồ ăn', N'Quầy bán đồ ăn', N'Food Court', N'美食广场', N'フードコート', N'푸드코트');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (252, N'Thưởng thức các món ăn ngon và đồ uống tại Quầy bán đồ ăn.\nVị trí thuận tiện cho hành khách.', N'Enjoy delicious meals and drinks at Food Court.\nConvenient location for passengers.', N'在 美食广场 享用美味的餐点和饮料。\n方便旅客的位置。', N'フードコート で美味しい食事と飲み物をお楽しみください。\n乗客に便利な場所。', N'푸드코트 에서 맛있는 식사와 음료를 즐기세요.\n승객에게 편리한 위치.', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (252, 81);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (253, 's_b43985cfbe951628', N'Phòng chờ hạng thương gia', N'Phòng chờ hạng thương gia', N'CIP', N'商务舱贵宾室', N'ビジネスクラスラウンジ', N'비즈니스 라운지');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (253, 118);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (254, 's_7514bacb73bae49d', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (254, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (254, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (255, 's_21f18fdd8b2e7b8b', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (255, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (255, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (256, 's_be092a3fe77b66f8', N'Phòng chờ hạng thương gia', N'Phòng chờ hạng thương gia', N'CIP', N'商务舱贵宾室', N'ビジネスクラスラウンジ', N'비즈니스 라운지');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (256, 118);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (257, 's_a4567f70b25b1535', N'Phòng chờ hạng thương gia', N'Phòng chờ hạng thương gia', N'CIP', N'商务舱贵宾室', N'ビジネスクラスラウンジ', N'비즈니스 라운지');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (257, 118);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (258, 's_af022a9c2e3e6eac', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (258, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (258, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (259, 'ar_79d95c2608967e12', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (259, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (259, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (260, 'ar_d93fdc7fce6bb5ec', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (260, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (260, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (261, 'ar_7e74987fa960432e', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (261, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (261, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (262, 'ar_c3a65a9b5f9b6ea0', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (262, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (262, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (263, 'ar_425f9a88b2e6fe33', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (263, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (263, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (264, 'ar_32e3b175c4064b0f', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (264, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (264, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (265, 'ar_eb810bf269eecae6', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (265, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (265, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (266, 'ar_d5b6ab6a8626d7a1', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (266, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (266, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (267, 'ar_65555eeeb2420dfa', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (267, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (267, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (268, 'ar_a6856f04b3553ad9', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (268, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (268, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (269, 'ar_531ef33fa877a3b1', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (269, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (269, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (270, 'ar_04dc7ec8e563cc1b', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (270, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (270, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (271, 'ar_9de28e508fad9574', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (271, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (271, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (272, 'ar_23f3bd852ed9cca5', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (272, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (272, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (273, 'ar_51e55cf3450fe6df', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (273, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (273, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (274, 'ar_b4bae57feeaea5a9', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (274, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (274, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (275, 'ar_6f6ab653ef52d73c', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (275, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (275, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (276, 'ar_8efb7d2ebfde32ad', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (276, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (276, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (277, 'ar_b79b0a2da29def82', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (277, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (277, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (278, 'ar_c380733e5c9f634f', N'Phòng chờ ga đi quốc nội', N'Phòng chờ ga đi quốc nội', N'Domestic Departure Lounge', N'国内出发贵宾室', N'国内線出発ラウンジ', N'국내선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (278, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc nội.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at Domestic Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国内出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国内線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국내선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (278, 119);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (279, 'ar_b603c0705bcbcf54', N'Phòng chờ ga đi quốc nội', N'Phòng chờ ga đi quốc nội', N'Domestic Departure Lounge', N'国内出发贵宾室', N'国内線出発ラウンジ', N'국내선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (279, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc nội.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at Domestic Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国内出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国内線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국내선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (279, 119);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (280, 'ar_94d47534dac8f29e', N'Khu ga đi nội địa', N'Khu ga đi nội địa', N'Domestic Departure Area', N'国内出发', N'国内線出発', N'국내선 출발');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (280, 172);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (281, 'ar_f7b316f41cac3eb7', N'Khu ga đi nội địa', N'Khu ga đi nội địa', N'Domestic Departure Area', N'国内出发', N'国内線出発', N'국내선 출발');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (281, 172);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (282, 'ar_609dfeae555b75ef', N'Khu ga đi nội địa', N'Khu ga đi nội địa', N'Domestic Departure Area', N'国内出发', N'国内線出発', N'국내선 출발');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (282, 172);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (283, 'ar_b6805ba02dd5abab', N'Khu ga đi nội địa', N'Khu ga đi nội địa', N'Domestic Departure Area', N'国内出发', N'国内線出発', N'국내선 출발');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (283, 172);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (284, 'ar_bdc2a78ba0ff5763', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (284, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (284, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (285, 'ar_abb132024dba2a8e', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (285, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (285, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (286, 'ar_4cc58aed139d3212', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (286, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (286, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (287, 'ar_3eb780e273bbdb2c', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (287, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (287, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (288, 'ar_a683d9f4cb58c89b', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (288, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (288, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (289, 'ar_2bdc39e0f1b44e86', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (289, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (289, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (290, 'ar_bd4c23e8fa46d6c0', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (290, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (290, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (291, 'ar_c13740eea220de96', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (291, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (291, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (292, 'ar_33c86bd0e5ca64f0', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (292, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (292, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (293, 'ar_04fefd8ffef573b2', N'Phòng chờ ga đi quốc tế', N'Phòng chờ ga đi quốc tế', N'International Departure Lounge', N'国际出发贵宾室', N'国際線出発ラウンジ', N'국제선 출발 라운지');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (293, N'Thư giãn thoải mái tại Phòng chờ ga đi quốc tế.\nTiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.', N'Relax in comfort at International Departure Lounge.\nAmenities include snacks, drinks, and Wi-Fi.', N'在 国际出发贵宾室 舒适放松。\n设施包括小吃、饮料和 Wi-Fi。', N'国際線出発ラウンジ で快適にリラックス。\nアメニティにはスナック、ドリンク、Wi-Fiが含まれます。', N'국제선 출발 라운지 에서 편안하게 휴식하세요.\n간식, 음료 및 Wi-Fi가 제공됩니다.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (293, 120);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (294, 'ar_2a51ee46891780fd', N'Khu vực xuất cảnh', N'Khu vực xuất cảnh', N'Emigration', N'出境', N'出国審査', N'출국 심사');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (294, 131);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (295, 'ar_91aa05a492a0714d', N'Kiểm tra an ninh/ Kiểm soát hải quan', N'Kiểm tra an ninh/ Kiểm soát hải quan', N'Security Check/ Custom Control', N'海关', N'税関', N'세관');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (295, 125);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (296, 's_6ffe2f452fd7a7c4', N'Điểm kiểm tra an ninh soi chiếu nội địa', N'Điểm kiểm tra an ninh soi chiếu nội địa', N'Security Checkpoint Dom', N'国内安检', N'国内線保安検査', N'국내선 보안 검색');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (296, 139);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (297, 's_3fd83e4a0232f46d', N'Điểm kiểm tra an ninh soi chiếu quốc tế', N'Điểm kiểm tra an ninh soi chiếu quốc tế', N'International Security Check', N'国际安检', N'国際線保安検査', N'국제선 보안 검색');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (297, 135);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (298, 'e_39744365a4936660', N'Cửa ra tàu bay - 32', N'Cửa ra tàu bay - 32', N'Gate 32', N'登机口 32', N'ゲート 32', N'게이트 32');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (298, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (299, 'e_a6a7b6af8c9ecf1f', N'Cửa ra tàu bay - 27B', N'Cửa ra tàu bay - 27B', N'Gate 27B', N'登机口 27B', N'ゲート 27B', N'게이트 27B');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (299, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (300, 'e_894f67b3a32032b9', N'Cửa ra tàu bay - 15', N'Cửa ra tàu bay - 15', N'Gate 15', N'登机口 15', N'ゲート 15', N'게이트 15');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (300, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (301, 'e_74ca31d4531c6d6a', N'Cửa ra tàu bay - 4B', N'Cửa ra tàu bay - 4B', N'Gate 4B', N'登机口 4B', N'ゲート 4B', N'게이트 4B');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (301, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (302, 'e_baf60159eee92b95', N'Nhà vệ sinh', N'Nhà vệ sinh', N'Restroom - Toilet', N'洗手间', N'トイレ', N'화장실');
INSERT INTO AreaInformation (AreaListID, InformationVI, InformationEN, InformationZH, InformationJA, InformationKO, ImageUrl) VALUES (302, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1595514020146-5217ae7a77e8?q=80&w=600&auto=format&fit=crop');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (302, 101);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (303, 'e_7d4f21dee2b4fe21', N'Quầy thu đổi ngoại tệ', N'Quầy thu đổi ngoại tệ', N'Foreign Exchange', N'货币兑换', N'両替', N'환전');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (303, 89);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (304, 'e_b670d38353d48c88', N'Khu ẩm thực cao cấp', N'Khu ẩm thực cao cấp', N'Dining room', N'高级餐饮', N'高級ダイニング', N'파인 다이닝');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (304, 168);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (305, 'e_49d89b9938ad1bfa', N'Cửa hàng bán lẻ', N'Cửa hàng bán lẻ', N'Retail', N'零售店', N'小売店', N'소매점');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (305, 169);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (306, 'e_e681da287ebe96a3', N'Cửa ra tàu bay - 6', N'Cửa ra tàu bay - 6', N'Gate 6', N'登机口 6', N'ゲート 6', N'게이트 6');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (306, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (307, 'e_f6528c75e2c48e0e', N'Cửa ra tàu bay - 7', N'Cửa ra tàu bay - 7', N'Gate 7', N'登机口 7', N'ゲート 7', N'게이트 7');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (307, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (308, 'e_e77d795c7f628af8', N'Cửa ra tàu bay - 8B', N'Cửa ra tàu bay - 8B', N'Gate 8B', N'登机口 8B', N'ゲート 8B', N'게이트 8B');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (308, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (309, 'e_e961428ffac2460d', N'Cửa ra tàu bay - 9', N'Cửa ra tàu bay - 9', N'Gate 9', N'登机口 9', N'ゲート 9', N'게이트 9');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (309, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (310, 'e_41b667de73ff5f68', N'Cửa ra tàu bay - 10', N'Cửa ra tàu bay - 10', N'Gate 10', N'登机口 10', N'ゲート 10', N'게이트 10');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (310, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (311, 'e_fd2266a8940436b3', N'Cửa ra tàu bay - 12', N'Cửa ra tàu bay - 12', N'Gate 12', N'登机口 12', N'ゲート 12', N'게이트 12');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (311, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (312, 'e_75bffd60111a7856', N'Cửa ra tàu bay - 13B', N'Cửa ra tàu bay - 13B', N'Gate 13B', N'登机口 13B', N'ゲート 13B', N'게이트 13B');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (312, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (313, 'e_5cfad2051c807706', N'Cửa ra tàu bay - 14', N'Cửa ra tàu bay - 14', N'Gate 14', N'登机口 14', N'ゲート 14', N'게이트 14');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (313, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (314, 'e_62e13fd6e65b0b4e', N'Cửa ra tàu bay - 17', N'Cửa ra tàu bay - 17', N'Gate 17', N'登机口 17', N'ゲート 17', N'게이트 17');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (314, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (315, 'e_569030868efdaba1', N'Cửa ra tàu bay - 18', N'Cửa ra tàu bay - 18', N'Gate 18', N'登机口 18', N'ゲート 18', N'게이트 18');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (315, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (316, 'e_a56ff4b0b5721dca', N'Cửa ra tàu bay - 19B', N'Cửa ra tàu bay - 19B', N'Gate 19B', N'登机口 19B', N'ゲート 19B', N'게이트 19B');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (316, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (317, 'e_c8994b95e6c7d155', N'Cửa ra tàu bay - 20', N'Cửa ra tàu bay - 20', N'Gate 20', N'登机口 20', N'ゲート 20', N'게이트 20');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (317, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (318, 'e_a2dcd3b27cce4abe', N'Cửa ra tàu bay - 22', N'Cửa ra tàu bay - 22', N'Gate 22', N'登机口 22', N'ゲート 22', N'게이트 22');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (318, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (319, 'e_ad2a2377ee6d8fcc', N'Cửa ra tàu bay - 23', N'Cửa ra tàu bay - 23', N'Gate 23', N'登机口 23', N'ゲート 23', N'게이트 23');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (319, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (320, 'e_3a70aa8cffba5caa', N'Cửa ra tàu bay - 24B', N'Cửa ra tàu bay - 24B', N'Gate 24B', N'登机口 24B', N'ゲート 24B', N'게이트 24B');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (320, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (321, 'e_cffa76b459e46155', N'Cửa ra tàu bay - 25', N'Cửa ra tàu bay - 25', N'Gate 25', N'登机口 25', N'ゲート 25', N'게이트 25');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (321, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (322, 'e_a361fddaf0bdc04f', N'Cửa ra tàu bay - 26', N'Cửa ra tàu bay - 26', N'Gate 26', N'登机口 26', N'ゲート 26', N'게이트 26');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (322, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (323, 'e_320595d43c403272', N'Cửa ra tàu bay - 29', N'Cửa ra tàu bay - 29', N'Gate 29', N'登机口 29', N'ゲート 29', N'게이트 29');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (323, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (324, 'e_a354f045df51b29b', N'Cửa ra tàu bay - 30', N'Cửa ra tàu bay - 30', N'Gate 30', N'登机口 30', N'ゲート 30', N'게이트 30');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (324, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (325, 'e_a3739fe057dc0511', N'Cửa ra tàu bay - 31B', N'Cửa ra tàu bay - 31B', N'Gate 31B', N'登机口 31B', N'ゲート 31B', N'게이트 31B');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (325, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (326, 'e_fb0e081301f71004', N'Cửa ra tàu bay - 1', N'Cửa ra tàu bay - 1', N'Gate 1', N'登机口 1', N'ゲート 1', N'게이트 1');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (326, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (327, 'e_31460eb86c4d84d9', N'Cửa ra tàu bay - 2B', N'Cửa ra tàu bay - 2B', N'Gate 2B', N'登机口 2B', N'ゲート 2B', N'게이트 2B');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (327, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (328, 'e_2117909396ec0190', N'Cửa ra tàu bay - 3', N'Cửa ra tàu bay - 3', N'Gate 3', N'登机口 3', N'ゲート 3', N'게이트 3');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (328, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (329, 'e_525e06d73d11d262', N'Cửa ra tàu bay - 4A', N'Cửa ra tàu bay - 4A', N'Gate 4A', N'登机口 4A', N'ゲート 4A', N'게이트 4A');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (329, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (330, 'e_2925f2597ff24f05', N'Cửa ra tàu bay - 2A', N'Cửa ra tàu bay - 2A', N'Gate 2A', N'登机口 2A', N'ゲート 2A', N'게이트 2A');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (330, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (331, 'e_796eab58fdaf1228', N'Cửa ra tàu bay - 8A', N'Cửa ra tàu bay - 8A', N'Gate 8A', N'登机口 8A', N'ゲート 8A', N'게이트 8A');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (331, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (332, 'e_ddb5e2820b329406', N'Cửa ra tàu bay - 13A', N'Cửa ra tàu bay - 13A', N'Gate 13A', N'登机口 13A', N'ゲート 13A', N'게이트 13A');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (332, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (333, 'e_aac022dd7dcec3de', N'Cửa ra tàu bay - 19A', N'Cửa ra tàu bay - 19A', N'Gate 19A', N'登机口 19A', N'ゲート 19A', N'게이트 19A');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (333, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (334, 'e_cacdcc070863603f', N'Cửa ra tàu bay - 24A', N'Cửa ra tàu bay - 24A', N'Gate 24A', N'登机口 24A', N'ゲート 24A', N'게이트 24A');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (334, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (335, 'e_5d06dca6b300b505', N'Cửa ra tàu bay - 27A', N'Cửa ra tàu bay - 27A', N'Gate 27A', N'登机口 27A', N'ゲート 27A', N'게이트 27A');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (335, 63);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (336, 'e_aa3d5bd0cea5dc25', N'Cửa ra tàu bay - 31A', N'Cửa ra tàu bay - 31A', N'Gate 31A', N'登机口 31A', N'ゲート 31A', N'게이트 31A');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (336, 63);
-- 7. Seed Manual Connections
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (337, 'c_d5fd1933055221a3', N'Thang máy 1', N'Thang máy 1', N'Elevator 1', N'电梯 1', N'エレベーター 1', N'엘리베이터 1');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (337, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (338, 'c_570f4565a7576a71', N'Thang máy 2', N'Thang máy 2', N'Elevator 2', N'电梯 2', N'エレベーター 2', N'엘리베이터 2');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (338, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (339, 'c_2a9cce244e495262', N'Thang máy 3', N'Thang máy 3', N'Elevator 3', N'电梯 3', N'エレベーター 3', N'엘리베이터 3');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (339, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (340, 'c_08093977b458cf9e', N'Thang máy 4', N'Thang máy 4', N'Elevator 4', N'电梯 4', N'エレベーター 4', N'엘리베이터 4');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (340, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (341, 'c_6140bc948c6dbeb9', N'Thang máy 5', N'Thang máy 5', N'Elevator 5', N'电梯 5', N'エレベーター 5', N'엘리베이터 5');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (341, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (342, 'c_dded2f7fbb748172', N'Thang máy 6', N'Thang máy 6', N'Elevator 6', N'电梯 6', N'エレベーター 6', N'엘리베이터 6');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (342, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (343, 'c_63ac35934627bb0c', N'Thang máy 7', N'Thang máy 7', N'Elevator 7', N'电梯 7', N'エレベーター 7', N'엘리베이터 7');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (343, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (344, 'c_ebd82b533c37ee9e', N'Thang máy 8', N'Thang máy 8', N'Elevator 8', N'电梯 8', N'エレベーター 8', N'엘리베이터 8');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (344, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (345, 'c_e5099e63c0a909ad', N'Thang máy 9', N'Thang máy 9', N'Elevator 9', N'电梯 9', N'エレベーター 9', N'엘리베이터 9');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (345, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (346, 'c_a3ef5d8834130b53', N'Thang máy 10', N'Thang máy 10', N'Elevator 10', N'电梯 10', N'エレベーター 10', N'엘리베이터 10');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (346, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (347, 'c_c9889df116ed99da', N'Thang máy 11', N'Thang máy 11', N'Elevator 11', N'电梯 11', N'エレベーター 11', N'엘리베이터 11');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (347, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (348, 'c_6187df59d3efaf7d', N'Thang máy 12', N'Thang máy 12', N'Elevator 12', N'电梯 12', N'エレベーター 12', N'엘리베이터 12');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (348, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (349, 'c_697daf8041c8c86c', N'Thang máy 13', N'Thang máy 13', N'Elevator 13', N'电梯 13', N'エレベーター 13', N'엘리베이터 13');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (349, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (350, 'c_1fc19515003677c3', N'Thang máy 14', N'Thang máy 14', N'Elevator 14', N'电梯 14', N'エレベーター 14', N'엘리베이터 14');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (350, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (351, 'c_84c71411f270f2b3', N'Thang máy 15', N'Thang máy 15', N'Elevator 15', N'电梯 15', N'エレベーター 15', N'엘리베이터 15');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (351, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (352, 'c_91e3f94690cbedf5', N'Thang máy 16', N'Thang máy 16', N'Elevator 16', N'电梯 16', N'エレベーター 16', N'엘리베이터 16');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (352, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (353, 'c_6d22ee1a5a30b8bb', N'Thang máy 17', N'Thang máy 17', N'Elevator 17', N'电梯 17', N'エレベーター 17', N'엘리베이터 17');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (353, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (354, 'c_64eb10ed6f558f66', N'Thang máy 18', N'Thang máy 18', N'Elevator 18', N'电梯 18', N'エレベーター 18', N'엘리베이터 18');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (354, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (355, 'c_aa132373bf0dc55a', N'Thang máy 19', N'Thang máy 19', N'Elevator 19', N'电梯 19', N'エレベーター 19', N'엘리베이터 19');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (355, 60);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (356, 'c_51224908ba95ba36', N'Thang cuốn 1', N'Thang cuốn 1', N'Escalator 1', N'扶梯 1', N'エスカレーター 1', N'에스컬레이터 1');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (356, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (357, 'c_50b6cb101302bf84', N'Thang cuốn 2', N'Thang cuốn 2', N'Escalator 2', N'扶梯 2', N'エスカレーター 2', N'에스컬레이터 2');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (357, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (358, 'c_b20badde3a47f382', N'Thang cuốn 3', N'Thang cuốn 3', N'Escalator 3', N'扶梯 3', N'エスカレーター 3', N'에스컬레이터 3');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (358, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (359, 'c_a96cd3db2aaaf681', N'Thang cuốn 4', N'Thang cuốn 4', N'Escalator 4', N'扶梯 4', N'エスカレーター 4', N'에스컬레이터 4');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (359, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (360, 'c_74f0284bbbcf1a8d', N'Thang cuốn 5', N'Thang cuốn 5', N'Escalator 5', N'扶梯 5', N'エスカレーター 5', N'에스컬레이터 5');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (360, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (361, 'c_4ad1bcb69153b6b7', N'Thang cuốn 6', N'Thang cuốn 6', N'Escalator 6', N'扶梯 6', N'エスカレーター 6', N'에스컬레이터 6');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (361, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (362, 'c_6e4effaed14574fe', N'Thang cuốn 7', N'Thang cuốn 7', N'Escalator 7', N'扶梯 7', N'エスカレーター 7', N'에스컬레이터 7');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (362, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (363, 'c_52ca150b96faf3ce', N'Thang cuốn 8', N'Thang cuốn 8', N'Escalator 8', N'扶梯 8', N'エスカレーター 8', N'에스컬레이터 8');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (363, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (364, 'c_520101982ed1c9fe', N'Thang cuốn 9', N'Thang cuốn 9', N'Escalator 9', N'扶梯 9', N'エスカレーター 9', N'에스컬레이터 9');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (364, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (365, 'c_2115b521103c313e', N'Thang cuốn 10', N'Thang cuốn 10', N'Escalator 10', N'扶梯 10', N'エスカレーター 10', N'에스컬레이터 10');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (365, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (366, 'c_b6414068035f4105', N'Thang cuốn 11', N'Thang cuốn 11', N'Escalator 11', N'扶梯 11', N'エスカレーター 11', N'에스컬레이터 11');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (366, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (367, 'c_38c3b5600948737d', N'Thang cuốn 12', N'Thang cuốn 12', N'Escalator 12', N'扶梯 12', N'エスカレーター 12', N'에스컬레이터 12');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (367, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (368, 'c_9c4a62c4b375845e', N'Thang cuốn 13', N'Thang cuốn 13', N'Escalator 13', N'扶梯 13', N'エスカレーター 13', N'에스컬레이터 13');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (368, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (369, 'c_ad2424a620731073', N'Thang cuốn 14', N'Thang cuốn 14', N'Escalator 14', N'扶梯 14', N'エスカレーター 14', N'에스컬레이터 14');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (369, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (370, 'c_8c53368e9d3a5bb5', N'Thang cuốn 15', N'Thang cuốn 15', N'Escalator 15', N'扶梯 15', N'エスカレーター 15', N'에스컬레이터 15');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (370, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (371, 'c_2f262858b5a0dd17', N'Thang cuốn 16', N'Thang cuốn 16', N'Escalator 16', N'扶梯 16', N'エスカレーター 16', N'에스컬레이터 16');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (371, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (372, 'c_990823fcc5faf7bb', N'Thang cuốn 17', N'Thang cuốn 17', N'Escalator 17', N'扶梯 17', N'エスカレーター 17', N'에스컬레이터 17');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (372, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (373, 'c_c6ba61eb4f997040', N'Thang cuốn 18', N'Thang cuốn 18', N'Escalator 18', N'扶梯 18', N'エスカレーター 18', N'에스컬레이터 18');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (373, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (374, 'c_57819d6aaf621c2c', N'Thang cuốn 19', N'Thang cuốn 19', N'Escalator 19', N'扶梯 19', N'エスカレーター 19', N'에스컬레이터 19');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (374, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (375, 'c_ebfa85831e348ae1', N'Thang cuốn 20', N'Thang cuốn 20', N'Escalator 20', N'扶梯 20', N'エスカレーター 20', N'에스컬레이터 20');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (375, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (376, 'c_483b0ace50cdbc95', N'Thang cuốn 21', N'Thang cuốn 21', N'Escalator 21', N'扶梯 21', N'エスカレーター 21', N'에스컬레이터 21');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (376, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (377, 'c_3a72f78130e142b6', N'Thang cuốn 22', N'Thang cuốn 22', N'Escalator 22', N'扶梯 22', N'エスカレーター 22', N'에스컬레이터 22');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (377, 62);
INSERT INTO AreaList (AreaListID, MappedinID, Name, VN, EN, ZH, JA, KO) VALUES (378, 'c_593fbf839613043a', N'Thang cuốn 23', N'Thang cuốn 23', N'Escalator 23', N'扶梯 23', N'エスカレーター 23', N'에스컬레이터 23');
INSERT INTO AreaCategory (AreaListID, SubCategoryID) VALUES (378, 62);
SET IDENTITY_INSERT AreaList OFF;
GO