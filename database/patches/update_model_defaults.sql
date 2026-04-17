USE [MappedIn3DModels];
GO

-- ============================================
-- BƯỚC 0: MỞ RỘNG ĐỘ CHÍNH XÁC CỘT SCALE
-- Decimal(10,4) chỉ lưu được 4 số thập phân (0.0001)
-- Cần decimal(18,6) để lưu giá trị nhỏ như 0.00012
-- ============================================

-- Bảng Models3D (model đã đặt trên bản đồ)
ALTER TABLE [dbo].[Models3D] ALTER COLUMN [ScaleX] DECIMAL(18, 6) NOT NULL;
ALTER TABLE [dbo].[Models3D] ALTER COLUMN [ScaleY] DECIMAL(18, 6) NOT NULL;
ALTER TABLE [dbo].[Models3D] ALTER COLUMN [ScaleZ] DECIMAL(18, 6) NOT NULL;

-- Bảng AvailableModels (danh sách model có sẵn)
ALTER TABLE [dbo].[AvailableModels] ALTER COLUMN [DefaultScaleX] DECIMAL(18, 6);
ALTER TABLE [dbo].[AvailableModels] ALTER COLUMN [DefaultScaleY] DECIMAL(18, 6);
ALTER TABLE [dbo].[AvailableModels] ALTER COLUMN [DefaultScaleZ] DECIMAL(18, 6);

GO

-- Cập nhật Stored Procedure SP_UpsertModel để dùng decimal(18,6) cho Scale
CREATE OR ALTER PROCEDURE [dbo].[SP_UpsertModel]
    @UUID NVARCHAR(50),
    @ModelName NVARCHAR(200),
    @Description NVARCHAR(500) = NULL,
    @ModelURL NVARCHAR(500),
    @Latitude DECIMAL(18, 10),
    @Longitude DECIMAL(18, 10),
    @FloorId NVARCHAR(100) = NULL,
    @FloorName NVARCHAR(100) = NULL,
    @RotationX DECIMAL(18, 4) = 0,
    @RotationY DECIMAL(18, 4) = 0,
    @RotationZ DECIMAL(18, 4) = 0,
    @ScaleX DECIMAL(18, 6) = 1,
    @ScaleY DECIMAL(18, 6) = 1,
    @ScaleZ DECIMAL(18, 6) = 1,
    @DisplayWebsite BIT = 0,
    @CreatedBy NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Models3D WHERE UUID = @UUID AND IsDeleted = 0)
    BEGIN
        UPDATE Models3D
        SET ModelName = @ModelName,
            Description = @Description,
            ModelURL = @ModelURL,
            Latitude = @Latitude,
            Longitude = @Longitude,
            FloorId = @FloorId,
            FloorName = @FloorName,
            RotationX = @RotationX,
            RotationY = @RotationY,
            RotationZ = @RotationZ,
            ScaleX = @ScaleX,
            ScaleY = @ScaleY,
            ScaleZ = @ScaleZ,
            DisplayWebsite = @DisplayWebsite,
            UpdatedAt = GETDATE()
        WHERE UUID = @UUID;
    END
    ELSE
    BEGIN
        INSERT INTO Models3D
            (UUID, ModelName, Description, ModelURL, Latitude, Longitude, FloorId, FloorName,
             RotationX, RotationY, RotationZ,
             ScaleX, ScaleY, ScaleZ, CreatedBy, IsActive, IsDeleted, DisplayWebsite)
        VALUES
            (@UUID, @ModelName, @Description, @ModelURL, @Latitude, @Longitude, @FloorId, @FloorName,
             @RotationX, @RotationY, @RotationZ,
             @ScaleX, @ScaleY, @ScaleZ, @CreatedBy, 1, 0, @DisplayWebsite);
    END
END
GO

BEGIN TRANSACTION;

-- ============================================
-- NHÓM 1: Model đơn vị = MÉT (bbox 0.5 - 10)
-- Scale trực tiếp, không cần chuyển đổi đơn vị
-- ============================================

-- airplane.glb: bbox ~2m Y-up → scale 1.5 → ~3m
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.5, DefaultScaleY = 1.5, DefaultScaleZ = 1.5, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'airplane.glb';

-- airport_atm.glb: bbox Z=1.75m (Z-up) → rotate X=-90, scale 1.7
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.7, DefaultScaleY = 1.7, DefaultScaleZ = 1.7, DefaultRotationX = -90, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'airport_atm.glb';

-- airport_check_in_desk.glb: bbox ~6m Y-up (quầy dài) → scale 0.5
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.5, DefaultScaleY = 0.5, DefaultScaleZ = 0.5, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'airport_check_in_desk.glb';

-- biometric.glb: bbox ~1.16m (khối vuông nhỏ) → scale 2.5
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 2.5, DefaultScaleY = 2.5, DefaultScaleZ = 2.5, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'biometric.glb';

-- boardinggate.glb: bbox Z=2.2m (Z-up) → rotate X=-90, scale 1.4
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.4, DefaultScaleY = 1.4, DefaultScaleZ = 1.4, DefaultRotationX = -90, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'boardinggate.glb';

-- bus.glb: bbox Y=10m (Y-up, xe buýt dài) → scale 0.3
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.3, DefaultScaleY = 0.3, DefaultScaleZ = 0.3, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'bus.glb';

-- checkincounter_double.glb: bbox X=3.46, Y=2.16m → scale 1.0
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.0, DefaultScaleY = 1.0, DefaultScaleZ = 1.0, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'checkincounter_double.glb';

-- checkincounter_left.glb: bbox Y=2.2m → scale 1.4
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.4, DefaultScaleY = 1.4, DefaultScaleZ = 1.4, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'checkincounter_left.glb';

-- checkincounter_right.glb: bbox Y=2.2m → scale 1.4
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.4, DefaultScaleY = 1.4, DefaultScaleZ = 1.4, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'checkincounter_right.glb';

-- computer_mouse.glb: bbox X=2m → scale 1.5
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.5, DefaultScaleY = 1.5, DefaultScaleZ = 1.5, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'computer_mouse.glb';

-- cpu.glb: bbox X=5.9m → scale 0.5
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.5, DefaultScaleY = 0.5, DefaultScaleZ = 0.5, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'cpu.glb';

-- cuakinh.glb: bbox X=3.94m (cửa kính rộng) → scale 0.8
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.8, DefaultScaleY = 0.8, DefaultScaleZ = 0.8, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'cuakinh.glb';

-- daohanhly.glb: bbox X=18m (đảo hành lý lớn) → scale 0.17
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.17, DefaultScaleY = 0.17, DefaultScaleZ = 0.17, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'daohanhly.glb';

-- doubleelevator.glb: bbox X=3.6, Z=2.8m → scale 0.8
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.8, DefaultScaleY = 0.8, DefaultScaleZ = 0.8, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'doubleelevator.glb';

-- electricbuggy.glb: bbox Y=4m → scale 0.75
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.75, DefaultScaleY = 0.75, DefaultScaleZ = 0.75, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'electricbuggy.glb';

-- elevator.glb: bbox Z=2.8m (Z-up) → rotate X=-90, scale 1.1
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.1, DefaultScaleY = 1.1, DefaultScaleZ = 1.1, DefaultRotationX = -90, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'elevator.glb';

-- freecharge.glb: bbox Z=1.3m (Z-up) → rotate X=-90, scale 2.3
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 2.3, DefaultScaleY = 2.3, DefaultScaleZ = 2.3, DefaultRotationX = -90, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'freecharge.glb';

-- gateboarding.glb: Z=2.24m (Z-up + OrientationFix) → rotate X=-90, scale 1.3
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.3, DefaultScaleY = 1.3, DefaultScaleZ = 1.3, DefaultRotationX = -90, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'gateboarding.glb';

-- informationdesk.glb: X=3.12m (OrientationFix applied) → scale 1.0
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.0, DefaultScaleY = 1.0, DefaultScaleZ = 1.0, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'informationdesk.glb';

-- keyboard.glb: bbox X=0.46m (rất nhỏ) → scale 6.5
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 6.5, DefaultScaleY = 6.5, DefaultScaleZ = 6.5, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'keyboard.glb';

-- luggagewrapping.glb: X=1.47m (OrientationFix) → scale 2.0
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 2.0, DefaultScaleY = 2.0, DefaultScaleZ = 2.0, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'luggagewrapping.glb';

-- metaldetectorscanner.glb: Z=3.08m (Z-up + OrientationFix) → rotate X=-90, scale 1.0
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.0, DefaultScaleY = 1.0, DefaultScaleZ = 1.0, DefaultRotationX = -90, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'metaldetectorscanner.glb';

-- selfkioskcheckin.glb: Z=1.86m (Z-up + OrientationFix) → rotate X=-90, scale 1.6
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.6, DefaultScaleY = 1.6, DefaultScaleZ = 1.6, DefaultRotationX = -90, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'selfkioskcheckin.glb';

-- smallcar.glb: Z=2.48m (Z-up) → rotate X=-90, scale 1.2
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.2, DefaultScaleY = 1.2, DefaultScaleZ = 1.2, DefaultRotationX = -90, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'smallcar.glb';

-- waiting_chair.glb: X=2.3m → scale 1.3
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 1.3, DefaultScaleY = 1.3, DefaultScaleZ = 1.3, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'waiting_chair.glb';

-- ============================================
-- NHÓM 2: Model đơn vị = CENTIMÉT (bbox 10 - 1000)
-- Chia cho 100 để chuyển cm → m, rồi nhân scale
-- Scale = TARGET_SIZE / (maxDim_cm / 100)
-- ============================================

-- barcode_reader.glb: Z=65cm (Z-up) → rotate X=-90, scale = 3/(65/100) = 4.6 → NHƯNG quá to, dùng 0.05
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.05, DefaultScaleY = 0.05, DefaultScaleZ = 0.05, DefaultRotationX = -90, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'barcode_reader.glb';

-- car.glb: X=179cm → scale = 3/179*100 ≈ 0.017 (xe hơi)
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.02, DefaultScaleY = 0.02, DefaultScaleZ = 0.02, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'car.glb';

-- ticket_luggage_printer.glb: X=23.5cm → scale = 3/23.5 ≈ 0.13
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.13, DefaultScaleY = 0.13, DefaultScaleZ = 0.13, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'ticket_luggage_printer.glb';

-- screen.glb: Z=116cm (Z-up) → rotate X=-90, scale = 3/116 ≈ 0.026
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.026, DefaultScaleY = 0.026, DefaultScaleZ = 0.026, DefaultRotationX = -90, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'screen.glb';

-- optical_character_recognition.glb: X=0.065m (rất nhỏ) → đây thực ra là 6.5cm → scale 46
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 46, DefaultScaleY = 46, DefaultScaleZ = 46, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'optical_character_recognition.glb';

-- luggagecart.glb: X=185cm → scale = 3/185 ≈ 0.016
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.016, DefaultScaleY = 0.016, DefaultScaleZ = 0.016, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'luggagecart.glb';

-- waitingchair.glb: Y=261cm → scale = 3/261 ≈ 0.012
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.012, DefaultScaleY = 0.012, DefaultScaleZ = 0.012, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'waitingchair.glb';

-- ============================================
-- NHÓM 3: Model đơn vị = MILIMÉT (bbox > 1000)
-- Chia cho 1000 rồi tính scale
-- ============================================

-- ATM.glb: Z=1525mm (Z-up) → rotate X=-90, scale = 3/1525*1000 ≈ 0.002
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.002, DefaultScaleY = 0.002, DefaultScaleZ = 0.002, DefaultRotationX = -90, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'ATM.glb';

-- document_printer.glb: X=550mm → scale = 3/(550/1000) ≈ 0.005
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.005, DefaultScaleY = 0.005, DefaultScaleZ = 0.005, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'document_printer.glb';

-- duongbangchuyen.glb: X=5605mm → scale = 3/5605 ≈ 0.0005
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.0005, DefaultScaleY = 0.0005, DefaultScaleZ = 0.0005, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'duongbangchuyen.glb';

-- escalator.glb: X=1320mm → scale = 3/1320 ≈ 0.002
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.002, DefaultScaleY = 0.002, DefaultScaleZ = 0.002, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'escalator.glb';

-- scannerxray.glb: 25026 x 25026 x 25026 (mm, khối lập phương) → scale = 3/25026 ≈ 0.00012
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.00012, DefaultScaleY = 0.00012, DefaultScaleZ = 0.00012, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'scannerxray.glb';

-- xrayscanner.glb: (không phân tích được, dùng giá trị an toàn = 1.0)  
-- Nếu vẫn quá to, hãy giảm xuống 0.01 hoặc 0.001
UPDATE [dbo].[AvailableModels] SET DefaultScaleX = 0.001, DefaultScaleY = 0.001, DefaultScaleZ = 0.001, DefaultRotationX = 0, DefaultRotationY = 0, DefaultRotationZ = 0 WHERE FileName = 'xrayscanner.glb';

COMMIT TRANSACTION;
GO

-- ============================================
-- KIỂM TRA KẾT QUẢ
-- ============================================
SELECT AvailableModelsId, ModelName, FileName, Thumbnail,
       DefaultScaleX, DefaultScaleY, DefaultScaleZ, 
       DefaultRotationX, DefaultRotationY, DefaultRotationZ 
FROM [dbo].[AvailableModels] 
ORDER BY AvailableModelsId;