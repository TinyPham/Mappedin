-- Update Food/Restaurant/Cafe
UPDATE AreaList 
SET Description = N'Thưởng thức các món ăn ngon và đồ uống tại ' + VN + N'. Vị trí thuận tiện cho hành khách.'
WHERE (LOWER(EN) LIKE '%food%' OR LOWER(EN) LIKE '%restaurant%' OR LOWER(EN) LIKE '%coffee%' OR LOWER(EN) LIKE '%burger%')
AND Description LIKE 'Enjoy delicious meals%';

-- Update Shop/Store/Duty Free
UPDATE AreaList 
SET Description = N'Khám phá nhiều loại sản phẩm tại ' + VN + N'. Nhiều ưu đãi hấp dẫn đang chờ bạn.'
WHERE (LOWER(EN) LIKE '%shop%' OR LOWER(EN) LIKE '%store%' OR LOWER(EN) LIKE '%duty free%')
AND Description LIKE 'Explore a wide range%';

-- Update Lounge
UPDATE AreaList 
SET Description = N'Thư giãn thoải mái tại ' + VN + N'. Tiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.'
WHERE (LOWER(EN) LIKE '%lounge%')
AND Description LIKE 'Relax in comfort%';

-- Invalidate TranslationManager cache (if implemented on server via timestamp)
-- This script just updates data.
PRINT 'Updated descriptions to Vietnamese.'
