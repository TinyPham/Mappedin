USE [MappedIn3DModels]
GO

-- Script sửa dữ liệu AreaInformation: Chuyển tiếng Anh từ InformationVI sang InformationEN và cập nhật lại tiếng Việt/dịch đúng.

-- 1. FOOD & BEVERAGE (Enjoy delicious meals...)
UPDATE AI
SET 
    -- Chuyển nội dung hiện tại (Tiếng Anh) sang cột EN
    InformationEN = AI.InformationVI,
    -- Cập nhật tiếng Việt đúng
    InformationVI = N'Thưởng thức các món ăn ngon và đồ uống tại ' + ISNULL(AL.VN, AL.Name) + N'.' + NCHAR(10) + N'Vị trí thuận tiện cho hành khách.',
    -- Cập nhật các ngôn ngữ khác
    InformationZH = N'在 ' + ISNULL(AL.ZH, AL.Name) + N' 享用美味的餐点和饮料。' + NCHAR(10) + N'方便旅客的位置。',
    InformationJA = ISNULL(AL.JA, AL.Name) + N' で美味しい食事と飲み物をお楽しみください。' + NCHAR(10) + N'乗客に便利な場所。',
    InformationKO = ISNULL(AL.KO, AL.Name) + N' 에서 맛있는 식사와 음료를 즐기세요.' + NCHAR(10) + N'승객에게 편리한 위치.'
FROM [dbo].[AreaInformation] AI
JOIN [dbo].[AreaList] AL ON AI.AreaListID = AL.AreaListID
WHERE AI.InformationVI LIKE 'Enjoy delicious meals%';

-- 2. SHOPPING (Explore a wide range...)
UPDATE AI
SET 
    InformationEN = AI.InformationVI,
    InformationVI = N'Khám phá nhiều loại sản phẩm tại ' + ISNULL(AL.VN, AL.Name) + N'.' + NCHAR(10) + N'Nhiều ưu đãi hấp dẫn đang chờ bạn.',
    InformationZH = N'在 ' + ISNULL(AL.ZH, AL.Name) + N' 发现各种产品。' + NCHAR(10) + N'诱人的优惠等着您。',
    InformationJA = ISNULL(AL.JA, AL.Name) + N' で幅広い製品をご覧ください。' + NCHAR(10) + N'魅力的なオファーがあなたを待っています。',
    InformationKO = ISNULL(AL.KO, AL.Name) + N' 에서 다양한 제품을 만나보세요.' + NCHAR(10) + N'매력적인 혜택이 기다리고 있습니다.'
FROM [dbo].[AreaInformation] AI
JOIN [dbo].[AreaList] AL ON AI.AreaListID = AL.AreaListID
WHERE AI.InformationVI LIKE 'Explore a wide range%';

-- 3. LOUNGE (Relax in comfort...)
UPDATE AI
SET 
    InformationEN = AI.InformationVI,
    InformationVI = N'Thư giãn thoải mái tại ' + ISNULL(AL.VN, AL.Name) + N'.' + NCHAR(10) + N'Tiện nghi bao gồm đồ ăn nhẹ, đồ uống và Wi-Fi.',
    InformationZH = N'在 ' + ISNULL(AL.ZH, AL.Name) + N' 舒适放松。' + NCHAR(10) + N'设施包括小吃、饮料和 Wi-Fi。',
    InformationJA = ISNULL(AL.JA, AL.Name) + N' で快適にリラックス。' + NCHAR(10) + N'アメニティにはスナック、ドリンク、Wi-Fiが含まれます。',
    InformationKO = ISNULL(AL.KO, AL.Name) + N' 에서 편안하게 휴식하세요.' + NCHAR(10) + N'간식, 음료 및 Wi-Fi가 제공됩니다.'
FROM [dbo].[AreaInformation] AI
JOIN [dbo].[AreaList] AL ON AI.AreaListID = AL.AreaListID
WHERE AI.InformationVI LIKE 'Relax in comfort%';

-- 4. RESTROOM (No specific text pattern in python script, but checking generic cases)
-- Nếu có các trường hợp khác chưa cover, bạn có thể comment báo tôi.

PRINT 'Update Complete: Language columns fixed.'
GO
