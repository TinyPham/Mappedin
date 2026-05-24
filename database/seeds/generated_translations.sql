-- Seed data generated from backend/translations.json
-- Targets current schema only: Translation_UI and AreaList.

MERGE dbo.Translation_UI AS target
USING (SELECT 'search_placeholder' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Tìm kiếm khu vực, điểm đến...',
    EN = N'Search areas, destinations...',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Tìm kiếm khu vực, điểm đến...', N'Search areas, destinations...', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'category_eat' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Ăn uống',
    EN = N'Dining',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Ăn uống', N'Dining', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'category_shop' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Cửa hàng',
    EN = N'Shopping',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Cửa hàng', N'Shopping', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'category_service' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Dịch vụ sân bay',
    EN = N'Airport Services',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Dịch vụ sân bay', N'Airport Services', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'category_lounge' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Phòng chờ',
    EN = N'Lounges',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Phòng chờ', N'Lounges', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'category_dep_procedure' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Thủ tục chuyến bay đi',
    EN = N'Departure Procedures',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Thủ tục chuyến bay đi', N'Departure Procedures', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'category_arr_procedure' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Thủ tục chuyến bay đến',
    EN = N'Arrival Procedures',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Thủ tục chuyến bay đến', N'Arrival Procedures', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'add_model' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Thêm model 3D',
    EN = N'Add 3D Model',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Thêm model 3D', N'Add 3D Model', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'classification_btn' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Phân loại khu vực',
    EN = N'Classify Area',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Phân loại khu vực', N'Classify Area', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'floor_selector_label' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Tầng',
    EN = N'Level',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Tầng', N'Level', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'directions_btn' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Dẫn đường',
    EN = N'Directions',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Dẫn đường', N'Directions', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'from' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Đi từ:',
    EN = N'From:',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Đi từ:', N'From:', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'to' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Đi đến:',
    EN = N'To:',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Đi đến:', N'To:', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'clear' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Xóa',
    EN = N'Clear',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Xóa', N'Clear', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'start_preview' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Bắt đầu',
    EN = N'Start',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Bắt đầu', N'Start', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'select_model_title' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Chọn mô hình 3D',
    EN = N'Select 3D Model',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Chọn mô hình 3D', N'Select 3D Model', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'classification_title' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Phân loại khu vực',
    EN = N'Area Classification',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Phân loại khu vực', N'Area Classification', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'main_categories' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Danh mục chính',
    EN = N'Main Categories',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Danh mục chính', N'Main Categories', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'sub_categories' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Danh mục con',
    EN = N'Sub Categories',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Danh mục con', N'Sub Categories', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'back' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Quay lại',
    EN = N'Back',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Quay lại', N'Back', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'elevator' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Thang máy',
    EN = N'Elevator',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Thang máy', N'Elevator', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'stairway' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Cầu thang bộ',
    EN = N'Stairs',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Cầu thang bộ', N'Stairs', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'unnamed_area' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Khu vực không tên',
    EN = N'Unnamed Area',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Khu vực không tên', N'Unnamed Area', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'no_desc' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Không có mô tả.',
    EN = N'No description.',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Không có mô tả.', N'No description.', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'no_data' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Không có dữ liệu cho tầng này',
    EN = N'No data for this floor',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Không có dữ liệu cho tầng này', N'No data for this floor', NULL, NULL, NULL);

MERGE dbo.Translation_UI AS target
USING (SELECT 'no_data_cat' AS KeyCode) AS source
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN UPDATE SET
    VN = N'Không có danh mục nào',
    EN = N'No categories',
    ZH = NULL,
    JA = NULL,
    KO = NULL
WHEN NOT MATCHED THEN
    INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
    VALUES (source.KeyCode, 'label', N'Không có danh mục nào', N'No categories', NULL, NULL, NULL);

