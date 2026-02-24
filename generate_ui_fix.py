
import json

# Data Structure for UI Keys (KeyCode -> {VN, EN, ZH, JA, KO})
ui_data = [
    # Directions / Navigation
    ('directions_btn', 'label', 'Dẫn đường', 'Directions', '导航', 'ナビ', '길찾기'),
    ('from', 'label', 'Đi từ:', 'From:', '起点：', '出発地：', '출발:'),
    ('to', 'label', 'Đi đến:', 'To:', '终点：', '到着地：', '도착:'),
    ('clear', 'label', 'Xóa', 'Clear', '清除', 'クリア', '지우기'),
    ('start_preview', 'label', 'Bắt đầu', 'Start', '开始', 'スタート', '시작'),
    
    # 3D Model & Classification
    ('add_model', 'label', 'Thêm model 3D', 'Add 3D Model', '添加3D模型', '3Dモデル追加', '3D 모델 추가'),
    ('classification_btn', 'label', 'Phân loại khu vực', 'Area Classification', '区域分类', 'エリア分類', '구역 분류'),
    ('select_model_title', 'title', 'Chọn mô hình 3D', 'Select 3D Model', '选择3D模型', '3Dモデル選択', '3D 모델 선택'),
    ('classification_title', 'title', 'Phân loại khu vực', 'Area Classification', '区域分类', 'エリア分類', '구역 분류'),
    
    # Categories
    ('main_categories', 'title', 'Danh mục chính', 'Main Categories', '主分类', 'メインカテゴリ', '주요 카테고리'),
    ('sub_categories', 'title', 'Danh mục con', 'Subcategories', '子分类', 'サブカテゴリ', '하위 카테고리'),
    ('search_placeholder', 'placeholder', 'Tìm kiếm khu vực, điểm đến...', 'Search areas, destinations...', '搜索区域、目的地...', 'エリア・目的地を検索...', '구역, 목적지 검색...'),
    
    # Floors (UI Keys)
    ('floor_roof', 'floor', 'Tầng mái', 'Roof Level', '屋顶层', '屋上階', '옥상층'),
    ('floor_3f_checkin', 'floor', 'Tầng 3 - Tầng checkin', '3F - Check-in Floor', '3层 - 值机层', '3階 - チェックインフロア', '3층 - 체크인 층'),
    ('floor_2f_departure', 'floor', 'Tầng 2 - Tầng đi', '2F - Departure Floor', '2层 - 出发层', '2階 - 出発フロア', '2층 - 출발 층'),
    ('floor_1f_arrival', 'floor', 'Tầng 1 - Tầng đến', '1F - Arrival Floor', '1层 - 到达层', '1階 - 到着フロア', '1층 - 도착 층'),
    ('floor_gf_shuttle', 'floor', 'Tầng trệt - Xe đưa đón', 'GF - Shuttle Bus Floor', '底楼', '1階（地上階）', '지상층'),
]

sql_lines = []
sql_lines.append("-- ============================================")
sql_lines.append("-- UI & LANGUAGE FIX SCRIPT (SELF-HEALING)")
sql_lines.append("-- Includes CREATE TABLE if missing")
sql_lines.append("-- Target Database: MappedIn3DModels")
sql_lines.append("-- ============================================")
sql_lines.append("USE [MappedIn3DModels]")
sql_lines.append("GO")
sql_lines.append("")

# 1. Schema Creation: MasterData_Languages
sql_lines.append("-- 1. Ensure MasterData_Languages exists")
sql_lines.append("IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MasterData_Languages]') AND type in (N'U'))")
sql_lines.append("BEGIN")
sql_lines.append("CREATE TABLE [dbo].[MasterData_Languages](")
sql_lines.append("    [LanguageId] [varchar](5) NOT NULL,")
sql_lines.append("    [LanguageName] [nvarchar](50) NOT NULL,")
sql_lines.append("    [SortOrder] [int] NOT NULL,")
sql_lines.append("    [IsActive] [bit] NOT NULL,")
sql_lines.append(" CONSTRAINT [PK_MasterData_Languages] PRIMARY KEY CLUSTERED ([LanguageId] ASC)")
sql_lines.append(") ON [PRIMARY]")
sql_lines.append("END")
sql_lines.append("GO")
sql_lines.append("")

# 2. Schema Creation: Translation_UI
sql_lines.append("-- 2. Ensure Translation_UI exists")
sql_lines.append("IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Translation_UI]') AND type in (N'U'))")
sql_lines.append("BEGIN")
sql_lines.append("CREATE TABLE [dbo].[Translation_UI](")
sql_lines.append("    [UIKeyId] [int] IDENTITY(1,1) NOT NULL,")
sql_lines.append("    [KeyCode] [varchar](100) NOT NULL,")
sql_lines.append("    [KeyType] [varchar](50) NULL,")
sql_lines.append("    [VN] [nvarchar](500) NULL,")
sql_lines.append("    [EN] [nvarchar](500) NULL,")
sql_lines.append("    [ZH] [nvarchar](500) NULL,")
sql_lines.append("    [JA] [nvarchar](500) NULL,")
sql_lines.append("    [KO] [nvarchar](500) NULL,")
sql_lines.append(" CONSTRAINT [PK_Translation_UI] PRIMARY KEY CLUSTERED ([UIKeyId] ASC)")
sql_lines.append(") ON [PRIMARY]")
sql_lines.append("END")
sql_lines.append("GO")
sql_lines.append("")

# 3. Data Seeding: MasterData_Languages
sql_lines.append("-- 3. Seed Languages")
sql_lines.append("DELETE FROM MasterData_Languages;")
sql_lines.append("INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('vn', N'Tiếng Việt', 1, 1);")
sql_lines.append("INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('en', N'English', 2, 1);")
sql_lines.append("INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('zh', N'中文 (Chinese)', 3, 1);")
sql_lines.append("INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('ja', N'日本語 (Japanese)', 4, 1);")
sql_lines.append("INSERT INTO MasterData_Languages (LanguageId, LanguageName, SortOrder, IsActive) VALUES ('ko', N'한국어 (Korean)', 5, 1);")
sql_lines.append("")

# 4. Data Seeding: Translation_UI
sql_lines.append("-- 4. Seed UI Translations")
sql_lines.append("DELETE FROM Translation_UI;")
for item in ui_data:
    key, mode, vn, en, zh, ja, ko = item
    vn = f"N'{vn}'"
    en = f"N'{en}'"
    zh = f"N'{zh}'"
    ja = f"N'{ja}'"
    ko = f"N'{ko}'"
    sql = f"INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('{key}', '{mode}', {vn}, {en}, {zh}, {ja}, {ko});"
    sql_lines.append(sql)

with open('database/seed_ui_fix.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"Generated seed_ui_fix.sql with {len(sql_lines)} lines.")
