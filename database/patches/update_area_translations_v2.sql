-- 1. Update AreaList for common terms in ZH, JA, KO
UPDATE AreaList SET ZH = N'洗手间', JA = N'トイレ', KO = N'화장실' WHERE VN LIKE N'%Nhà vệ sinh%';
UPDATE AreaList SET ZH = N'值机岛', JA = N'チェックインアイランド', KO = N'체크인 아일랜드' WHERE VN LIKE N'%Đảo check-in%';
UPDATE AreaList SET ZH = N'登机口', JA = N'搭乗口', KO = N'탑승구' WHERE VN LIKE N'%Cửa ra tàu bay%';
UPDATE AreaList SET ZH = N'行李传送带', JA = N'手荷物コンベヤー', KO = N'수하물 컨베이어' WHERE VN LIKE N'%Băng chuyền hành lý%';
UPDATE AreaList SET ZH = N'到达大厅', JA = N'到着ロビー', KO = N'도착 로비' WHERE VN LIKE N'%Sảnh đến%';
UPDATE AreaList SET ZH = N'出发大厅', JA = N'出発ロビー', KO = N'출발 로비' WHERE VN LIKE N'%Sảnh đi%';
UPDATE AreaList SET ZH = N'正门', JA = N'メインエントランス', KO = N'정문' WHERE VN LIKE N'%Cổng chính%';
UPDATE AreaList SET ZH = N'电梯', JA = N'エレベーター', KO = N'엘리베이터' WHERE VN LIKE N'%Thang máy%';
UPDATE AreaList SET ZH = N'扶梯', JA = N'エスカレーター', KO = N'에스컬레이터' WHERE VN LIKE N'%Thang cuốn%';
UPDATE AreaList SET ZH = N'办公室', JA = N'オフィス', KO = N'사무실' WHERE VN LIKE N'%Văn phòng%';
UPDATE AreaList SET ZH = N'ATM', JA = N'ATM', KO = N'ATM' WHERE VN LIKE N'%ATM%';
UPDATE AreaList SET ZH = N'便利店', JA = N'コンビニ', KO = N'편의점' WHERE VN LIKE N'%Cửa hàng tiện lợi%';
UPDATE AreaList SET ZH = N'当地美食', JA = N'郷土料理', KO = N'현지 음식' WHERE VN LIKE N'%Quầy bán món ăn địa phương%';
UPDATE AreaList SET ZH = N'医疗室', JA = N'医務室', KO = N'의무실' WHERE VN LIKE N'%Phòng y tế%';
UPDATE AreaList SET ZH = N'祈祷室', JA = N'祈祷室', KO = N'기도실' WHERE VN LIKE N'%Phòng cầu nguyện%';
UPDATE AreaList SET ZH = N'咖啡店', JA = N'コーヒーショップ', KO = N'커피숍' WHERE VN LIKE N'%Quầy cà phê%';

-- 2. Add missing UI translations for Admin Modal
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'refresh_btn')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('refresh_btn', 'btn', N'Làm mới', N'Refresh', N'刷新', N'リフレッシュ', N'새로고침');
ELSE
    UPDATE Translation_UI SET VN=N'Làm mới', EN=N'Refresh', ZH=N'刷新', JA=N'リフレッシュ', KO=N'새로고침' WHERE KeyCode='refresh_btn';

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'export_sql_btn')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('export_sql_btn', 'btn', N'Xuất SQL Data', N'Export SQL Data', N'导出 SQL 数据', N'SQLデータをエクスポート', N'SQL 데이터 내보내기');
ELSE
    UPDATE Translation_UI SET VN=N'Xuất SQL Data', EN=N'Export SQL Data', ZH=N'导出 SQL 数据', JA=N'SQLデータをエクスポート', KO=N'SQL 데이터 내보내기' WHERE KeyCode='export_sql_btn';

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'sql_btn')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('sql_btn', 'btn', N'SQL', N'SQL', N'SQL', N'SQL', N'SQL');
ELSE
    UPDATE Translation_UI SET VN=N'SQL', EN=N'SQL', ZH=N'SQL', JA=N'SQL', KO=N'SQL' WHERE KeyCode='sql_btn';

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'lang_vi')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('lang_vi', 'tab', N'Tiếng Việt', N'Vietnamese', N'越南语', N'ベトナム語', N'베트남어');
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'lang_en')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('lang_en', 'tab', N'English', N'English', N'英语', N'英語', N'영어');
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'lang_zh')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('lang_zh', 'tab', N'Tiếng Trung', N'Chinese', N'中文', N'中国語', N'중국어');
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'lang_ja')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('lang_ja', 'tab', N'Tiếng Nhật', N'Japanese', N'日语', N'日本語', N'일본어');
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'lang_ko')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('lang_ko', 'tab', N'Tiếng Hàn', N'Korean', N'韩语', N'韓国語', N'한국어');

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'desc_placeholder_vi')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('desc_placeholder_vi', 'placeholder', N'Nhập thông tin mô tả tiếng Việt...', N'Enter Vietnamese description...', N'输入越南语描述...', N'ベトナム語の説明を入力してください...', N'베트남어 설명을 입력하세요...');
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'desc_placeholder_en')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('desc_placeholder_en', 'placeholder', N'Nhập thông tin mô tả tiếng Anh...', N'Enter English description...', N'输入英语描述...', N'英語の説明を入力してください...', N'영어 설명을 입력하세요...');
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'desc_placeholder_zh')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('desc_placeholder_zh', 'placeholder', N'Nhập thông tin mô tả tiếng Trung...', N'Enter Chinese description...', N'输入中文描述...', N'中国語の説明を入力してください...', N'중국어 설명을 입력하세요...');
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'desc_placeholder_ja')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('desc_placeholder_ja', 'placeholder', N'Nhập thông tin mô tả tiếng Nhật...', N'Enter Japanese description...', N'输入日语描述...', N'日本語の説明を入力してください...', N'일본어 설명을 입력하세요...');
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'desc_placeholder_ko')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('desc_placeholder_ko', 'placeholder', N'Nhập thông tin mô tả tiếng Hàn...', N'Enter Korean description...', N'输入韩语描述...', N'韓国語の説明を入力してください...', N'한국어 설명을 입력하세요...');

IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'saving_status')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('saving_status', 'status', N'Đang lưu...', N'Saving...', N'保存中...', N'保存中...', N'저장 중...');

