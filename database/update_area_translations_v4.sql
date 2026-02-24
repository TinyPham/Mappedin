-- 1. CLEANUP: Clear garbled patterns or redundant data (that matches VN/EN)
-- This allows the system to fallback to obj.name or correctly identify missing translations
UPDATE AreaList SET ZH = NULL WHERE ZH = VN OR ZH = EN OR ZH LIKE '%å%' OR ZH LIKE '%ã%' OR ZH LIKE '?' OR ZH LIKE '%?%';
UPDATE AreaList SET JA = NULL WHERE JA = VN OR JA = EN OR JA LIKE '%å%' OR JA LIKE '%ã%' OR JA LIKE '?' OR JA LIKE '%?%';
UPDATE AreaList SET KO = NULL WHERE KO = VN OR KO = EN OR KO LIKE '%å%' OR KO LIKE '%ã%' OR KO LIKE '?' OR KO LIKE '%?%';

-- 2. TRANSLATE: Update based on English (EN) names - More reliable for bulk
UPDATE AreaList SET ZH = N'洗手间', JA = N'トイレ', KO = N'화장실' WHERE EN LIKE '%Restroom%' OR EN LIKE '%Toilet%';
UPDATE AreaList SET ZH = N'值机岛', JA = N'チェックインアイランド', KO = N'체크인 아일랜드' WHERE EN LIKE '%Check-in%';
UPDATE AreaList SET ZH = N'登机口', JA = N'搭乗口', KO = N'탑승구' WHERE EN LIKE '%Gate%' OR EN LIKE '%Boarding%';
UPDATE AreaList SET ZH = N'行李提取', JA = N'手荷物受取所', KO = N'수하물 수취' WHERE EN LIKE '%Baggage claim%' OR EN LIKE '%Baggage%';
UPDATE AreaList SET ZH = N'到达', JA = N'到着', KO = N'도착' WHERE EN LIKE '%Arrival%';
UPDATE AreaList SET ZH = N'出发', JA = N'出発', KO = N'출발' WHERE EN LIKE '%Departure%';
UPDATE AreaList SET ZH = N'正门', JA = N'メインエントランス', KO = N'정문' WHERE EN LIKE '%Entrance%';
UPDATE AreaList SET ZH = N'咨询台', JA = N'案内所', KO = N'안내 데스크' WHERE EN LIKE '%Information%' OR EN LIKE '%Info%';
UPDATE AreaList SET ZH = N'电梯', JA = N'エレベーター', KO = N'엘리베이터' WHERE EN LIKE '%Elevator%';
UPDATE AreaList SET ZH = N'扶梯', JA = N'エスカレーター', KO = N'에스컬레이터' WHERE EN LIKE '%Escalator%';
UPDATE AreaList SET ZH = N'ATM', JA = N'ATM', KO = N'ATM' WHERE EN LIKE '%ATM%';
UPDATE AreaList SET ZH = N'商店', JA = N'ショップ', KO = N'상점' WHERE EN LIKE '%Store%' OR EN LIKE '%Shop%';
UPDATE AreaList SET ZH = N'咖啡', JA = N'コーヒー', KO = N'커피' WHERE EN LIKE '%Coffee%';
UPDATE AreaList SET ZH = N'大厅', JA = N'ホール', KO = N'홀' WHERE EN LIKE '%Hall%';

-- 3. ENSURE UI KEYS (Admin Modal tabs and labels)
IF NOT EXISTS (SELECT 1 FROM Translation_UI WHERE KeyCode = 'lang_zh')
    INSERT INTO Translation_UI (KeyCode, KeyType, VN, EN, ZH, JA, KO) VALUES ('lang_zh', 'tab', N'Tiếng Trung', N'Chinese', N'中文', N'中国語', N'중국어');
UPDATE Translation_UI SET ZH = N'中文', JA = N'日本語', KO = N'한국어' WHERE KeyCode IN ('lang_zh', 'lang_ja', 'lang_ko');

-- 4. Final check for NULL translations to ensure they don''t return garbled text
-- (Managed by the application fallback logic)
