-- 1. Update AreaList matching against EN column (more reliable than VN due to encoding issues)
UPDATE AreaList SET ZH = N'洗手间', JA = N'トイレ', KO = N'화장실' WHERE EN LIKE '%Restroom%' OR EN LIKE '%Toilet%' OR VN LIKE '%Nhà vệ sinh%';
UPDATE AreaList SET ZH = N'值机岛', JA = N'チェックインアイランド', KO = N'체크인 아일랜드' WHERE EN LIKE '%Check-in%';
UPDATE AreaList SET ZH = N'登机口', JA = N'搭乗口', KO = N'탑승구' WHERE EN LIKE '%Gate%' OR EN LIKE '%Boarding%';
UPDATE AreaList SET ZH = N'行李传送带', JA = N'手荷物コンベヤー', KO = N'수하물 컨베이어' WHERE EN LIKE '%Baggage%';
UPDATE AreaList SET ZH = N'到达大厅', JA = N'到着ロビー', KO = N'도착 로비' WHERE EN LIKE '%Arrival%';
UPDATE AreaList SET ZH = N'出发大厅', JA = N'出発ロビー', KO = N'출발 로비' WHERE EN LIKE '%Departure%';
UPDATE AreaList SET ZH = N'正门', JA = N'メインエントランス', KO = N'정문' WHERE EN LIKE '%Entrance%' OR EN LIKE '%Main Entrance%';
UPDATE AreaList SET ZH = N'电梯', JA = N'エレベーター', KO = N'엘리베이터' WHERE EN LIKE '%Elevator%';
UPDATE AreaList SET ZH = N'扶梯', JA = N'エスカレーター', KO = N'에스컬레이터' WHERE EN LIKE '%Escalator%';
UPDATE AreaList SET ZH = N'办公室', JA = N'オフィス', KO = N'사무실' WHERE EN LIKE '%Office%';
UPDATE AreaList SET ZH = N'ATM', JA = N'ATM', KO = N'ATM' WHERE EN LIKE '%ATM%';
UPDATE AreaList SET ZH = N'便利店', JA = N'コンビニ', KO = N'편의점' WHERE EN LIKE '%Store%' OR EN LIKE '%Shop%';
UPDATE AreaList SET ZH = N'医疗室', JA = N'医務室', KO = N'의무실' WHERE EN LIKE '%Medical%' OR EN LIKE '%Clinic%';
UPDATE AreaList SET ZH = N'祈祷室', JA = N'祈祷室', KO = N'기도실' WHERE EN LIKE '%Prayer%';
UPDATE AreaList SET ZH = N'咖啡店', JA = N'コーヒーショップ', KO = N'커피숍' WHERE EN LIKE '%Coffee%';

-- 2. Add specific numbered translations for common areas if desired
-- (The above updates already cover them by prefix, e.g. "Check-in 01" matches "Check-in")

-- 3. Verify consistency for common UI translations
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'refresh_btn')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('refresh_btn', 'btn', N'Làm mới', N'Refresh', N'刷新', N'リフレッシュ', N'새로고침');
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'sql_btn')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('sql_btn', 'btn', N'SQL', N'SQL', N'SQL', N'SQL', N'SQL');
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
