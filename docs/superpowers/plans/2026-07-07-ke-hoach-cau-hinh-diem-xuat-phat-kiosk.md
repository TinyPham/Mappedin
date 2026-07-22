# Kế Hoạch Cấu Hình Điểm Xuất Phát Mặc Định Cho Kiosk

> **Mục tiêu:** Thiết kế và triển khai cơ chế để cùng một hệ thống bản đồ có thể chạy linh hoạt trên website của Cảng và trên các kiosk cảm ứng trong sân bay. Khi chạy trên website, người dùng tự chọn điểm đi. Khi chạy trên kiosk, bản đồ tự hiểu điểm đi mặc định là vị trí thực tế của kiosk đó.

**Kiến trúc đề xuất:** Dùng chung một source code, một frontend, một backend và một database. Chế độ website là mặc định. Chế độ kiosk được kích hoạt bằng URL có `mode=kiosk` và `kioskId`. Backend đọc cấu hình kiosk từ bảng `dbo.KioskDevices`, frontend lấy cấu hình đó để set `wayfindingOrigin` tự động.

**Công nghệ liên quan:** SQL Server, Node.js/Express backend, TypeScript, Vite frontend, Mappedin JS, Microsoft Edge Kiosk/Windows Assigned Access.

---

## 1. Bối Cảnh Hiện Tại

Dự án bản đồ hiện tại có 2 mục tiêu sử dụng khác nhau:

```text
1. Chạy trên website của Cảng
2. Chạy trên kiosk cảm ứng đặt trong sân bay
```

Với website, người dùng có thể ở bất kỳ đâu. Vì vậy điểm đi cần linh hoạt:

```text
Người dùng chọn điểm đi
Người dùng chọn điểm đến
Bản đồ vẽ đường đi
```

Với kiosk, thiết bị được đặt cố định ở một vị trí vật lý trong sân bay. Vì vậy điểm đi phải luôn là vị trí của kiosk:

```text
Kiosk tự biết nó đang ở đâu
Hành khách chỉ chọn điểm đến
Bản đồ tự vẽ đường từ kiosk đến điểm đến
```

Do đó không nên hard-code tọa độ kiosk trong code. Nếu sau này kiosk đổi vị trí, thêm kiosk mới, hoặc thay đổi tầng đặt kiosk, admin cần chỉnh được trong hệ thống mà không phải build lại source code.

---

## 2. Ý Tưởng Tổng Thể

Mỗi kiosk vật lý sẽ có một mã định danh riêng:

```text
LT-KIOSK-01
LT-KIOSK-02
LT-KIOSK-03
LT-KIOSK-04
LT-KIOSK-05
```

Khi kiosk mở bản đồ, URL sẽ có dạng:

```text
https://map.your-domain.com/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-01
```

Frontend đọc `kioskId`, gọi backend:

```text
GET /api/kiosks/LT-KIOSK-01/config
```

Backend trả về cấu hình:

```json
{
  "kioskId": "LT-KIOSK-01",
  "displayName": "Kiosk cửa vào tầng 1",
  "originType": "coordinate",
  "floorId": "m_1523f7dcde647c40",
  "latitude": 10.773118,
  "longitude": 107.040354,
  "heading": 90,
  "defaultZoom": 19
}
```

Sau đó frontend tự set:

```text
wayfindingOrigin = vị trí kiosk
```

Từ thời điểm đó, khi hành khách chọn điểm đến, bản đồ tự vẽ đường:

```text
Vị trí kiosk -> Điểm đến
```

---

## 3. Vì Sao Cần Bảng dbo.KioskDevices

Trong database hiện tại đã có bảng `Models3D` và trong đó có một số model tên kiosk. Tuy nhiên các dòng đó chỉ là **model 3D hiển thị trên bản đồ**, không nên dùng làm cấu hình thiết bị kiosk thật.

Hai khái niệm này khác nhau:

```text
Models3D
Lưu vật thể 3D được đặt trên bản đồ.

KioskDevices
Lưu thiết bị kiosk vật lý đang chạy bản đồ ngoài sân bay.
```

Một kiosk thật có thể không cần model 3D hiển thị. Ngược lại, một model 3D kiosk trên bản đồ chưa chắc là một thiết bị kiosk thật đang hoạt động.

Vì vậy nên tạo bảng riêng:

```text
dbo.KioskDevices
```

Bảng này là nguồn dữ liệu chính để hệ thống biết:

```text
Kiosk nào đang đặt ở đâu
Điểm đi mặc định là gì
Tầng nào
Tọa độ nào
Kiosk còn hoạt động không
Ai cập nhật lần cuối
```

---

## 4. Thiết Kế Bảng dbo.KioskDevices

### 4.1. Danh Sách Trường Dữ Liệu

```sql
KioskId
DisplayName
Description
OriginType
OriginMappedinID
FloorId
Latitude
Longitude
Heading
DefaultZoom
IsActive
CreatedAt
UpdatedAt
UpdatedBy
```

### 4.2. Giải Thích Từng Trường

`KioskId`

Mã định danh duy nhất của kiosk.

Ví dụ:

```text
LT-KIOSK-01
LT-KIOSK-02
```

Lý do cần có: URL kiosk sẽ dùng mã này để backend biết kiosk nào đang mở bản đồ.

```text
...?mode=kiosk&kioskId=LT-KIOSK-01
```

`DisplayName`

Tên dễ đọc cho admin.

Ví dụ:

```text
Kiosk cửa vào tầng 1
Kiosk khu check-in A
Kiosk gần băng chuyền hành lý
```

Lý do cần có: khi có nhiều kiosk, admin không cần nhớ mã kỹ thuật.

`Description`

Ghi chú mô tả vị trí thực tế.

Ví dụ:

```text
Đặt cạnh cột A12, đối diện quầy thông tin.
```

Lý do cần có: hữu ích khi bảo trì, di dời hoặc kiểm kê kiosk.

`OriginType`

Kiểu điểm bắt đầu mặc định.

Có 2 giá trị:

```text
mappedinObject
coordinate
```

Lý do cần có: hệ thống cần biết điểm bắt đầu được lưu theo object có sẵn hay theo tọa độ tự do.

`OriginMappedinID`

Mappedin ID của object/location/space được chọn làm điểm đi.

Ví dụ:

```text
o_abc123
```

Lý do cần có: đây là cách ổn định nhất nếu admin chọn một object có sẵn trên bản đồ, ví dụ "You are here", "Entrance A", "Kiosk 01 marker".

`FloorId`

ID tầng nơi đặt kiosk.

Lý do cần có: bản đồ indoor có nhiều tầng. Cùng một cặp latitude/longitude có thể không đủ để xác định vị trí nếu thiếu tầng.

`Latitude`

Vĩ độ của kiosk.

Lý do cần có: dùng khi admin click trực tiếp lên bản đồ hoặc nhập tọa độ thủ công.

`Longitude`

Kinh độ của kiosk.

Lý do cần có: đi cùng `Latitude` để xác định vị trí trên bản đồ.

`Heading`

Hướng nhìn mặc định của kiosk hoặc camera.

Ví dụ:

```text
0
90
180
270
```

Lý do cần có: mỗi kiosk có thể quay mặt theo một hướng khác nhau ngoài thực tế. Khi reset, bản đồ có thể xoay đúng hướng để hành khách dễ định hướng.

`DefaultZoom`

Mức zoom mặc định khi kiosk mở bản đồ hoặc reset.

Lý do cần có: tùy vị trí kiosk, cần zoom gần hoặc xa để trải nghiệm tốt hơn.

`IsActive`

Trạng thái hoạt động của kiosk.

```text
1 = đang hoạt động
0 = tạm ngưng hoặc chưa dùng
```

Lý do cần có: không nên xóa cấu hình kiosk khi thiết bị tạm bảo trì.

`CreatedAt`

Thời điểm tạo cấu hình.

Lý do cần có: phục vụ audit cơ bản.

`UpdatedAt`

Thời điểm cập nhật gần nhất.

Lý do cần có: biết cấu hình kiosk được chỉnh lần cuối khi nào.

`UpdatedBy`

Người cập nhật.

Ví dụ:

```text
admin
airport-it
```

Lý do cần có: nếu cấu hình sai, có thể truy lại ai là người cập nhật cuối.

---

## 5. SQL Đề Xuất

Tạo file patch:

```text
database/patches/2026-07-07-kiosk-devices.sql
```

Nội dung:

```sql
USE [MappedIn3DModels];
GO

IF OBJECT_ID(N'dbo.KioskDevices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.KioskDevices (
        KioskId NVARCHAR(100) NOT NULL,
        DisplayName NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        OriginType NVARCHAR(30) NOT NULL,
        OriginMappedinID NVARCHAR(100) NULL,
        FloorId NVARCHAR(100) NULL,
        Latitude DECIMAL(18, 10) NULL,
        Longitude DECIMAL(18, 10) NULL,
        Heading DECIMAL(10, 4) NULL,
        DefaultZoom DECIMAL(10, 4) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_KioskDevices_IsActive DEFAULT (1),
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_KioskDevices_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_KioskDevices_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedBy NVARCHAR(100) NULL,
        CONSTRAINT PK_KioskDevices PRIMARY KEY CLUSTERED (KioskId),
        CONSTRAINT CK_KioskDevices_OriginType CHECK (OriginType IN (N'mappedinObject', N'coordinate')),
        CONSTRAINT CK_KioskDevices_CoordinateRange CHECK (
            (Latitude IS NULL OR (Latitude >= -90 AND Latitude <= 90))
            AND
            (Longitude IS NULL OR (Longitude >= -180 AND Longitude <= 180))
        ),
        CONSTRAINT CK_KioskDevices_OriginFields CHECK (
            (OriginType = N'mappedinObject' AND OriginMappedinID IS NOT NULL)
            OR
            (OriginType = N'coordinate' AND Latitude IS NOT NULL AND Longitude IS NOT NULL AND FloorId IS NOT NULL)
        )
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_KioskDevices_IsActive'
      AND object_id = OBJECT_ID(N'dbo.KioskDevices')
)
BEGIN
    CREATE INDEX IX_KioskDevices_IsActive ON dbo.KioskDevices(IsActive);
END
GO
```

---

## 6. Cách Hoạt Động Theo Chế Độ

### 6.1. Website Mode

URL:

```text
https://map.your-domain.com/main/html/index.html
```

Hoạt động:

```text
Người dùng chọn điểm đi
Người dùng chọn điểm đến
Bản đồ vẽ đường đi
```

Trong chế độ này, hệ thống không ép điểm xuất phát.

### 6.2. Kiosk Mode

URL:

```text
https://map.your-domain.com/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-01
```

Hoạt động:

```text
Frontend đọc kioskId
Frontend gọi backend lấy cấu hình kiosk
Backend trả về vị trí kiosk
Frontend set điểm đi mặc định
Hành khách chọn điểm đến
Bản đồ vẽ đường từ kiosk đến điểm đến
```

---

## 7. API Backend Cần Thêm

### 7.1. API Public Cho Kiosk

```text
GET /api/kiosks/:kioskId/config
```

Mục đích: kiosk public có thể lấy cấu hình của chính nó.

Ví dụ:

```text
GET /api/kiosks/LT-KIOSK-01/config
```

Response:

```json
{
  "kioskId": "LT-KIOSK-01",
  "displayName": "Kiosk cửa vào tầng 1",
  "originType": "coordinate",
  "originMappedinId": null,
  "floorId": "m_1523f7dcde647c40",
  "latitude": 10.773118,
  "longitude": 107.040354,
  "heading": 90,
  "defaultZoom": 19,
  "isActive": true
}
```

### 7.2. API Admin Danh Sách Kiosk

```text
GET /api/admin/kiosks
```

Yêu cầu đăng nhập admin.

Mục đích: trang quản trị hiển thị danh sách kiosk.

### 7.3. API Admin Tạo/Sửa Kiosk

```text
PUT /api/admin/kiosks/:kioskId
```

Yêu cầu đăng nhập admin.

Payload ví dụ:

```json
{
  "displayName": "Kiosk khu check-in A",
  "description": "Đặt gần cột A12",
  "originType": "coordinate",
  "floorId": "m_1523f7dcde647c40",
  "latitude": 10.773118,
  "longitude": 107.040354,
  "heading": 90,
  "defaultZoom": 19,
  "isActive": true
}
```

---

## 8. File Backend Cần Thêm/Sửa

### 8.1. Tạo thư mục

```text
backend/kiosks/
```

### 8.2. Tạo file type

```text
backend/kiosks/kioskTypes.ts
```

Chức năng:

```text
Định nghĩa kiểu dữ liệu KioskConfig, KioskOriginType.
```

### 8.3. Tạo file validate

```text
backend/kiosks/kioskValidation.ts
```

Chức năng:

```text
Validate kioskId
Validate originType
Validate latitude/longitude
Validate floorId
Normalize kioskId thành chữ hoa
```

### 8.4. Tạo file repository

```text
backend/kiosks/kioskRepository.ts
```

Chức năng:

```text
Đọc cấu hình kiosk
Liệt kê kiosk
Tạo/sửa kiosk
```

### 8.5. Sửa server.ts

File:

```text
backend/server.ts
```

Thêm routes:

```text
GET /api/kiosks/:kioskId/config
GET /api/admin/kiosks
PUT /api/admin/kiosks/:kioskId
```

Các route admin phải dùng:

```ts
requireAdmin
```

---

## 9. File Frontend Cần Thêm/Sửa

### 9.1. Tạo helper kiosk mode

```text
src/kiosk/kioskMode.js
```

Chức năng:

```text
Đọc mode/kioskId từ URL
Tạo object điểm đi ảo từ tọa độ kiosk
Kiểm tra cấu hình kiosk hợp lệ
```

### 9.2. Sửa runtime bản đồ

File:

```text
main/main-function/index.ts
```

Hiện tại code đã có:

```ts
let wayfindingOrigin: any = null;
let wayfindingDestination: any = null;
```

Cần thêm logic:

```text
Nếu URL không có mode=kiosk:
  Không làm gì, website mode chạy như cũ.

Nếu URL có mode=kiosk:
  Đọc kioskId
  Gọi API lấy kiosk config
  Resolve điểm đi
  Set wayfindingOrigin = điểm kiosk
```

### 9.3. Sửa luồng navigation

Khi kiosk mode đang bật:

```text
Không yêu cầu hành khách chọn điểm đi.
Luôn dùng vị trí kiosk làm điểm đi.
Hành khách chỉ chọn điểm đến.
```

Khi website mode:

```text
Giữ nguyên như hiện tại.
```

---

## 10. UI Admin Đề Xuất

Trong trang quản trị nên có mục:

```text
Quản lý Kiosk
```

Các chức năng:

```text
1. Danh sách kiosk
2. Tạo kiosk mới
3. Sửa tên kiosk
4. Bật/tắt kiosk
5. Chọn kiểu điểm đi: mappedinObject hoặc coordinate
6. Chọn một object trên bản đồ làm điểm đi
7. Click lên bản đồ để lấy tọa độ
8. Nhập tọa độ thủ công
9. Lưu cấu hình
10. Xem thử đường đi từ kiosk đến một điểm đích
```

Khuyến nghị:

```text
Ưu tiên chọn object/location có sẵn trên bản đồ.
Chỉ dùng tọa độ thủ công khi không có object phù hợp.
```

Lý do: object/location có sẵn thường ổn định hơn cho wayfinding. Tọa độ tự do có thể nằm lệch khỏi đường đi, dẫn đến không tìm được route.

---

## 11. Trình Tự Triển Khai Chi Tiết

### Bước 1: Backup database

Trước khi chạy patch:

```text
Backup database MappedIn3DModels trong SSMS.
```

Lý do: tránh rủi ro khi thêm bảng mới.

### Bước 2: Tạo file SQL patch

Tạo:

```text
database/patches/2026-07-07-kiosk-devices.sql
```

Sau đó chạy trong SSMS.

### Bước 3: Seed thử 1 kiosk

Tạo dữ liệu test:

```text
LT-KIOSK-01
```

Dùng tọa độ mẫu từ một vị trí trên bản đồ hiện tại.

### Bước 4: Thêm backend validation

Tạo:

```text
backend/kiosks/kioskValidation.ts
backend/kiosks/kioskValidation.test.ts
```

Test các trường hợp:

```text
kioskId hợp lệ
kioskId sai
latitude sai
longitude sai
originType sai
coordinate thiếu floorId
mappedinObject thiếu OriginMappedinID
```

### Bước 5: Thêm backend repository

Tạo:

```text
backend/kiosks/kioskRepository.ts
```

Các hàm:

```text
getKioskConfig
listKioskConfigs
upsertKioskConfig
```

### Bước 6: Thêm backend routes

Sửa:

```text
backend/server.ts
```

Thêm:

```text
GET /api/kiosks/:kioskId/config
GET /api/admin/kiosks
PUT /api/admin/kiosks/:kioskId
```

### Bước 7: Test backend

Chạy:

```bash
cd backend
npm run build
```

Test API:

```bash
curl http://localhost:3002/api/kiosks/LT-KIOSK-01/config
```

### Bước 8: Thêm frontend helper

Tạo:

```text
src/kiosk/kioskMode.js
tests/kioskMode.test.mjs
```

Test:

```bash
node tests/kioskMode.test.mjs
```

### Bước 9: Sửa index.ts để load kiosk config

Sửa:

```text
main/main-function/index.ts
```

Thêm logic:

```text
parse URL
nếu mode=kiosk thì load config
resolve origin
set wayfindingOrigin
update UI
```

### Bước 10: Giữ website mode không đổi

Kiểm tra URL thường:

```text
http://localhost:3001/main/html/index.html
```

Kết quả mong muốn:

```text
Người dùng vẫn tự chọn điểm đi và điểm đến như hiện tại.
```

### Bước 11: Kiểm tra kiosk mode

Kiểm tra URL:

```text
http://localhost:3001/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-01
```

Kết quả mong muốn:

```text
App tự load điểm xuất phát của LT-KIOSK-01.
Hành khách chỉ cần chọn điểm đến.
```

### Bước 12: Thêm UI admin quản lý kiosk

Thêm vào admin:

```text
Quản lý Kiosk
```

Các thao tác cần có:

```text
Chọn kiosk
Sửa tên
Chọn điểm trên bản đồ
Nhập tọa độ
Lưu
Preview route
```

### Bước 13: Test thực tế với 5 kiosk giả lập

Tạo 5 dòng:

```text
LT-KIOSK-01
LT-KIOSK-02
LT-KIOSK-03
LT-KIOSK-04
LT-KIOSK-05
```

Mở 5 URL khác nhau:

```text
...?mode=kiosk&kioskId=LT-KIOSK-01
...?mode=kiosk&kioskId=LT-KIOSK-02
...?mode=kiosk&kioskId=LT-KIOSK-03
...?mode=kiosk&kioskId=LT-KIOSK-04
...?mode=kiosk&kioskId=LT-KIOSK-05
```

Kết quả mong muốn:

```text
Mỗi kiosk có điểm đi mặc định khác nhau.
```

---

## 12. Luồng Triển Khai Thật Ở Sân Bay

Sau khi host domain:

```text
https://map.your-domain.com/main/html/index.html
```

Mỗi kiosk dùng một URL riêng:

```text
https://map.your-domain.com/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-01
https://map.your-domain.com/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-02
https://map.your-domain.com/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-03
```

Cấu hình Windows Assigned Access hoặc Edge kiosk mode để mở đúng URL đó.

Ví dụ:

```bat
start msedge --kiosk "https://map.your-domain.com/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-01" --edge-kiosk-type=fullscreen --no-first-run
```

Trong triển khai thật, nên dùng:

```text
Windows Assigned Access
Microsoft Edge fullscreen kiosk
Domain HTTPS
```

---

## 13. Rủi Ro Và Cách Kiểm Soát

### Rủi ro 1: Tọa độ không nằm trên đường đi

Nếu admin chọn tọa độ tự do quá lệch khỏi mạng đường đi, route có thể không tìm được.

Cách kiểm soát:

```text
Ưu tiên chọn mappedinObject.
Thêm nút Preview route trước khi lưu.
```

### Rủi ro 2: Nhập sai kioskId trên URL

Ví dụ:

```text
...?kioskId=LT-KIOSK-999
```

Cách kiểm soát:

```text
Hiển thị thông báo kiosk chưa được cấu hình.
Cho admin đăng nhập để tạo cấu hình.
```

### Rủi ro 3: Website mode bị ảnh hưởng

Cách kiểm soát:

```text
Chỉ chạy kiosk logic khi có mode=kiosk và kioskId.
Nếu không có, giữ nguyên luồng hiện tại.
```

### Rủi ro 4: Kiosk bị di chuyển ngoài thực tế

Cách kiểm soát:

```text
Admin vào trang quản trị chỉnh lại điểm đi.
Không cần sửa code.
Không cần build lại.
```

### Rủi ro 5: Lộ API admin

Cách kiểm soát:

```text
Chỉ API đọc config kiosk là public.
API tạo/sửa/list kiosk phải dùng requireAdmin.
```

---

## 14. Tiêu Chí Hoàn Thành

Tính năng được coi là hoàn thành khi:

```text
1. Website mode vẫn cho người dùng tự chọn điểm đi.
2. Kiosk mode tự set điểm đi theo kioskId.
3. Mỗi kiosk có thể có điểm đi khác nhau.
4. Admin có thể chỉnh điểm đi kiosk mà không sửa code.
5. Có thể chọn điểm đi bằng object có sẵn hoặc tọa độ.
6. Backend validate dữ liệu kiosk chặt chẽ.
7. API admin được bảo vệ bằng requireAdmin.
8. Build frontend/backend pass.
9. Test với ít nhất 5 kiosk giả lập thành công.
```

---

## 15. Kết Luận

Hướng triển khai tốt nhất là:

```text
Một source code
Một domain
Hai chế độ chạy
Một bảng cấu hình kiosk riêng
```

Website dùng URL bình thường:

```text
https://map.your-domain.com/main/html/index.html
```

Kiosk dùng URL có định danh:

```text
https://map.your-domain.com/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-01
```

Cách này giúp hệ thống chuyên nghiệp hơn, dễ mở rộng, dễ bảo trì và phù hợp với triển khai thực tế ở sân bay.
