-- ============================================
-- UI & LANGUAGE FIX SCRIPT (SELF-HEALING)
-- Includes CREATE TABLE if missing
-- Target Database: MappedIn3DModels
-- ============================================
USE [MappedIn3DModels]
GO

-- 1. Ensure MasterData_Languages exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MasterData_Languages]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[MasterData_Languages](
    [LanguageId] [varchar](5) NOT NULL,
    [LanguageName] [nvarchar](50) NOT NULL,
    [SortOrder] [int] NOT NULL,
    [IsActive] [bit] NOT NULL,
 CONSTRAINT [PK_MasterData_Languages] PRIMARY KEY CLUSTERED ([LanguageId] ASC)
) ON [PRIMARY]
END
GO

-- 2. Ensure Translation_UI exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Translation_UI]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Translation_UI](
    [UIKeyId] [int] IDENTITY(1,1) NOT NULL,
    [KeyCode] [varchar](100) NOT NULL,
    [KeyType] [varchar](50) NULL,
    [VN] [nvarchar](500) NULL,
    [EN] [nvarchar](500) NULL,
    [ZH] [nvarchar](500) NULL,
    [JA] [nvarchar](500) NULL,
    [KO] [nvarchar](500) NULL,
 CONSTRAINT [PK_Translation_UI] PRIMARY KEY CLUSTERED ([UIKeyId] ASC)
) ON [PRIMARY]
END
GO

-- 3. Seed Languages
DELETE FROM MasterData_Languages;
INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('vn', N'Tiếng Việt', 1, 1);
INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('en', N'English', 2, 1);
INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('zh', N'中文 (Chinese)', 3, 1);
INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('ja', N'日本語 (Japanese)', 4, 1);
INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('ko', N'한국어 (Korean)', 5, 1);

-- 4. Seed UI Translations
DELETE FROM Translation_UI;
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('directions_btn', 'label', N'Dẫn đường', N'Directions', N'导航', N'ナビ', N'길찾기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('from', 'label', N'Đi từ:', N'From:', N'起点：', N'出発地：', N'출발:');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('to', 'label', N'Đi đến:', N'To:', N'终点：', N'到着地：', N'도착:');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('clear', 'label', N'Xóa', N'Clear', N'清除', N'クリア', N'지우기');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('start_preview', 'label', N'Bắt đầu', N'Start', N'开始', N'スタート', N'시작');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('add_model', 'label', N'Thêm model 3D', N'Add 3D Model', N'添加3D模型', N'3Dモデル追加', N'3D 모델 추가');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('classification_btn', 'label', N'Phân loại khu vực', N'Area Classification', N'区域分类', N'エリア分類', N'구역 분류');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('select_model_title', 'title', N'Chọn mô hình 3D', N'Select 3D Model', N'选择3D模型', N'3Dモデル選択', N'3D 모델 선택');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('classification_title', 'title', N'Phân loại khu vực', N'Area Classification', N'区域分类', N'エリア分類', N'구역 분류');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('main_categories', 'title', N'Danh mục chính', N'Main Categories', N'主分类', N'メインカテゴリ', N'주요 카테고리');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('sub_categories', 'title', N'Danh mục con', N'Subcategories', N'子分类', N'サブカテゴリ', N'하위 카테고리');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('search_placeholder', 'placeholder', N'Tìm kiếm khu vực, điểm đến...', N'Search areas, destinations...', N'搜索区域、目的地...', N'エリア・目的地を検索...', N'구역, 목적지 검색...');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('floor_roof', 'floor', N'Tầng mái', N'Roof Level', N'屋顶层', N'屋上階', N'옥상층');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('floor_3f_checkin', 'floor', N'Tầng 3 - Tầng checkin', N'3F - Check-in Floor', N'3层 - 值机层', N'3階 - チェックインフロア', N'3층 - 체크인 층');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('floor_2f_departure', 'floor', N'Tầng 2 - Tầng đi', N'2F - Departure Floor', N'2层 - 出发层', N'2階 - 出発フロア', N'2층 - 출발 층');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('floor_1f_arrival', 'floor', N'Tầng 1 - Tầng đến', N'1F - Arrival Floor', N'1层 - 到达层', N'1階 - 到着フロア', N'1층 - 도착 층');
INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('floor_gf_shuttle', 'floor', N'Tầng trệt - Xe đưa đón', N'GF - Shuttle Bus Floor', N'底楼', N'1階（地上階）', N'지상층');