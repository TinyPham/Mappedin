# Kế Hoạch Hoàn Chỉnh Triển Khai Bản Đồ Website Và Kiosk

> **Mục tiêu:** Xây dựng một hệ thống bản đồ dùng chung cho website của Cảng và các kiosk cảm ứng trong sân bay. Website cho phép người dùng tự chọn điểm đi. Kiosk tự lấy điểm đi mặc định theo vị trí vật lý của từng thiết bị.

**Định hướng production:** Khi host thật, người dùng và kiosk sẽ truy cập domain gốc:

```text
https://map.lthairport.vn
```

Không nên bắt người dùng/kiosk mở đường dẫn kỹ thuật:

```text
https://map.lthairport.vn/main/html/index.html
```

Đường dẫn `/main/html/index.html` chỉ là cấu trúc source/dev hiện tại. Khi deploy production, server/backend/reverse proxy phải cấu hình để `/` tự trả về file `index.html` của bản đồ.

---

## 1. Mô Hình Sử Dụng

### 1.1. Website Mode

Dành cho người dùng truy cập bản đồ từ website của Cảng, điện thoại, laptop hoặc bên thứ ba nhúng bản đồ.

URL:

```text
https://map.lthairport.vn
```

Hoạt động:

```text
Người dùng tự chọn điểm đi
Người dùng chọn điểm đến
Bản đồ vẽ đường đi
```

Không có điểm đi cố định.

### 1.2. Kiosk Mode

Dành cho kiosk cảm ứng đặt tại sân bay.

Mỗi kiosk có URL riêng:

```text
https://map.lthairport.vn?mode=kiosk&kioskId=LT-KIOSK-01
https://map.lthairport.vn?mode=kiosk&kioskId=LT-KIOSK-02
https://map.lthairport.vn?mode=kiosk&kioskId=LT-KIOSK-03
```

Hoạt động:

```text
Kiosk mở URL có kioskId
Frontend đọc kioskId
Backend trả về vị trí đặt kiosk
Frontend set điểm đi mặc định
Hành khách chỉ chọn điểm đến
Bản đồ vẽ đường từ kiosk đến điểm đến
```

---

## 2. Nguyên Tắc Quan Trọng

### 2.1. Không Hard-Code Vị Trí Kiosk Trong Code

Không viết kiểu:

```ts
if (kioskId === 'LT-KIOSK-01') {
  latitude = ...
  longitude = ...
}
```

Lý do: sau này kiosk đổi vị trí hoặc thêm kiosk mới thì phải sửa code và build lại.

### 2.2. Dùng Database Làm Nguồn Cấu Hình

Tất cả vị trí kiosk được lưu trong:

```text
dbo.KioskDevices
```

Admin có thể chỉnh trong giao diện quản trị.

### 2.3. URL Kiosk Phải Luôn Giữ mode Và kioskId

Đây là vấn đề quan trọng bạn đã nêu.

Nếu kiosk đang mở:

```text
https://map.lthairport.vn?mode=kiosk&kioskId=LT-KIOSK-01
```

Sau khi người dùng click vị trí, đổi tầng, dẫn đường hoặc nhấn Home, URL có thể đổi thành:

```text
https://map.lthairport.vn/vn/MAP_ID/directions?floor=...&location=...
```

Nếu mất:

```text
mode=kiosk
kioskId=LT-KIOSK-01
```

thì khi reload hoặc Edge restart, kiosk sẽ không còn biết điểm đi mặc định.

Vì vậy mọi logic đổi URL phải bảo toàn:

```text
mode
kioskId
admin
debug
lang
```

---

## 3. Database Cần Có

### 3.1. Chạy SQL Patch Trên SSMS

Chạy file:

```text
database/patches/2026-07-07-kiosk-devices.sql
```

File này tạo bảng:

```text
dbo.KioskDevices
```

và các stored procedure:

```text
SP_GetKioskConfig
SP_GetKioskDeviceById
SP_GetAllKioskDevices
SP_UpsertKioskDevice
SP_SetKioskDeviceActive
```

### 3.2. Ý Nghĩa Stored Procedure

`SP_GetKioskConfig`

Public API dùng procedure này để lấy cấu hình kiosk đang active.

`SP_GetKioskDeviceById`

Admin lấy chi tiết một kiosk, kể cả kiosk inactive.

`SP_GetAllKioskDevices`

Admin lấy danh sách toàn bộ kiosk.

`SP_UpsertKioskDevice`

Admin tạo hoặc cập nhật kiosk.

`SP_SetKioskDeviceActive`

Admin bật/tắt kiosk.

### 3.3. Kiểm Tra Sau Khi Chạy SQL

Trong SSMS:

```sql
EXEC dbo.SP_GetAllKioskDevices;
```

Tạo thử một kiosk:

```sql
EXEC dbo.SP_UpsertKioskDevice
    @KioskId = N'LT-KIOSK-01',
    @DisplayName = N'Kiosk cửa vào tầng 1',
    @Description = N'Kiosk test',
    @OriginType = N'coordinate',
    @FloorId = N'm_1523f7dcde647c40',
    @Latitude = 10.7731180000,
    @Longitude = 107.0403540000,
    @Heading = 90,
    @DefaultZoom = 19,
    @IsActive = 1,
    @UpdatedBy = N'admin';
```

Kiểm tra lại:

```sql
EXEC dbo.SP_GetKioskConfig @KioskId = N'LT-KIOSK-01';
```

---

## 4. Backend Cần Sửa

### 4.1. Tạo Module Kiosk

Tạo thư mục:

```text
backend/kiosks/
```

Tạo các file:

```text
backend/kiosks/kioskTypes.ts
backend/kiosks/kioskValidation.ts
backend/kiosks/kioskRepository.ts
backend/kiosks/kioskValidation.test.ts
```

### 4.2. kioskTypes.ts

Định nghĩa:

```ts
export type KioskOriginType = 'mappedinObject' | 'coordinate';

export type KioskConfig = {
  kioskId: string;
  displayName: string;
  description: string | null;
  originType: KioskOriginType;
  originMappedinId: string | null;
  floorId: string | null;
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  defaultZoom: number | null;
  isActive: boolean;
};
```

### 4.3. kioskValidation.ts

Validate:

```text
kioskId bắt buộc
kioskId chỉ gồm A-Z, 0-9, _, -
originType chỉ là mappedinObject hoặc coordinate
coordinate cần floorId, latitude, longitude
mappedinObject cần originMappedinId
latitude trong khoảng -90 đến 90
longitude trong khoảng -180 đến 180
heading trong khoảng 0 đến dưới 360
defaultZoom trong khoảng hợp lý
```

### 4.4. kioskRepository.ts

Gọi các stored procedure:

```text
getKioskConfig -> SP_GetKioskConfig
getKioskDeviceById -> SP_GetKioskDeviceById
listKioskDevices -> SP_GetAllKioskDevices
upsertKioskDevice -> SP_UpsertKioskDevice
setKioskDeviceActive -> SP_SetKioskDeviceActive
```

### 4.5. Thêm API Trong server.ts

Sửa:

```text
backend/server.ts
```

Thêm public API:

```text
GET /api/kiosks/:kioskId/config
```

Thêm admin API:

```text
GET /api/admin/kiosks
GET /api/admin/kiosks/:kioskId
PUT /api/admin/kiosks/:kioskId
PATCH /api/admin/kiosks/:kioskId/active
```

Quy tắc bảo mật:

```text
Public chỉ được đọc config kiosk active.
Admin API phải dùng requireAdmin.
Không expose appsettings.json, .env, connection string.
```

---

## 5. Frontend Cần Sửa

### 5.1. Tạo Helper Kiosk Mode

Tạo:

```text
src/kiosk/kioskMode.js
tests/kioskMode.test.mjs
```

Helper cần có:

```text
parseKioskModeFromUrl
createKioskCoordinateOrigin
preserveKioskUrlParams
isKioskConfigValid
```

### 5.2. Đọc Kiosk Mode Khi App Khởi Động

Sửa:

```text
main/main-function/index.ts
```

Khi app khởi động:

```text
Nếu URL không có mode=kiosk:
  chạy website mode như hiện tại

Nếu URL có mode=kiosk&kioskId=...:
  gọi /api/kiosks/:kioskId/config
  resolve điểm đi
  set wayfindingOrigin = điểm kiosk
```

### 5.3. Resolve Điểm Đi Kiosk

Nếu:

```text
originType = mappedinObject
```

thì tìm object bằng:

```text
OriginMappedinID
```

Nếu:

```text
originType = coordinate
```

thì tạo virtual object:

```ts
{
  id: `kiosk:${kioskId}`,
  name: displayName,
  coordinate: {
    latitude,
    longitude,
    floorId
  },
  floorId
}
```

---

## 6. Sửa Vấn Đề URL Bị Mất kioskId

### 6.1. Vấn Đề Hiện Tại

Trong `main/main-function/index.ts`, hàm `syncURL` hiện đang tạo query mới từ rỗng:

```ts
const params = new URLSearchParams();
```

Điều này làm mất các param cũ như:

```text
mode
kioskId
admin
debug
lang
```

### 6.2. Các Chỗ Đang Gọi syncURL

Những hành động có thể làm URL thay đổi:

```text
Đổi ngôn ngữ
Đổi tầng
Bắt đầu dẫn đường
Clear/reset wayfinding
Click mở info khu vực/vị trí
Home/reset về trạng thái map
```

### 6.3. Cách Sửa syncURL

Trong `syncURL`, trước khi thêm `floor`, `location`, `departure`, phải preserve param quan trọng:

```ts
const currentParams = new URLSearchParams(window.location.search);
const params = new URLSearchParams();

for (const key of ['mode', 'kioskId', 'admin', 'debug', 'lang']) {
  const value = currentParams.get(key);
  if (value) params.set(key, value);
}
```

Sau đó mới thêm state bản đồ:

```ts
if (floorId) params.set('floor', floorId);
if (locationId) params.set('location', locationId);
if (departureId) params.set('departure', departureId);
```

Kết quả đúng:

```text
https://map.lthairport.vn/vn/MAP_ID/directions?mode=kiosk&kioskId=LT-KIOSK-01&floor=...&location=...
```

Kết quả sai cần tránh:

```text
https://map.lthairport.vn/vn/MAP_ID/directions?floor=...&location=...
```

### 6.4. Không Dựa Vào RAM

Nếu URL mất `kioskId`, app có thể vẫn hoạt động tạm thời vì state còn trong RAM. Nhưng khi:

```text
reload
Edge restart
kiosk auto refresh
app crash rồi reload
```

thì kiosk mất cấu hình điểm đi.

Vì vậy `kioskId` phải luôn nằm trên URL.

---

## 7. Sửa Home Và Reset Trong Kiosk Mode

### 7.1. Website Mode

Home/reset có thể:

```text
xóa điểm đi
xóa điểm đến
xóa route
về trạng thái bản đồ ban đầu
```

### 7.2. Kiosk Mode

Home/reset không được xóa điểm đi kiosk.

Phải làm:

```text
xóa điểm đến
xóa route
xóa search
đóng modal
camera quay về vị trí kiosk hoặc overview phù hợp
giữ wayfindingOrigin = kiosk origin
giữ mode=kiosk
giữ kioskId
```

Logic cần sửa:

```text
Nếu website mode:
  wayfindingOrigin = null

Nếu kiosk mode:
  wayfindingOrigin = kioskModeState.origin
```

---

## 8. Sửa Luồng Chọn Điểm Đi

### 8.1. Website Mode

Giữ nguyên:

```text
Người dùng chọn điểm đi
Người dùng chọn điểm đến
```

### 8.2. Kiosk Mode

Không cho hành khách đổi điểm đi.

Nếu người dùng bấm chọn điểm đi:

```text
hoặc bỏ qua
hoặc hiện thông báo: "Điểm xuất phát là vị trí kiosk hiện tại."
```

Mục tiêu:

```text
Kiosk = chỉ chọn điểm đến
```

---

## 9. Sửa Flight Navigation Cho Kiosk

Hiện tại flight có các hành động:

```text
Đi tới gate
Đi tới check-in
Đi tới baggage belt
```

Trong kiosk mode, khi hành khách bấm các nút này:

```text
Điểm đi = vị trí kiosk
Điểm đến = gate/check-in/belt
```

Không yêu cầu người dùng chọn điểm đi.

---

## 10. Xây UI Admin Quản Lý Kiosk

### 10.1. Vị Trí UI

Trong admin thêm mục:

```text
Quản lý Kiosk
```

### 10.2. Chức Năng

UI cần có:

```text
Danh sách kiosk
Tạo kiosk mới
Sửa tên/mô tả
Bật/tắt kiosk
Chọn originType
Chọn object trên bản đồ
Click bản đồ để lấy tọa độ
Nhập tọa độ thủ công
Lưu cấu hình
Preview route
```

### 10.3. Luồng Chọn Object

```text
Admin chọn LT-KIOSK-01
Bấm "Chọn object làm điểm đi"
Click một object/location trên bản đồ
Hệ thống lấy OriginMappedinID
Admin bấm Lưu
```

### 10.4. Luồng Chọn Tọa Độ

```text
Admin chọn LT-KIOSK-01
Bấm "Chọn tọa độ trên bản đồ"
Click đúng vị trí đặt kiosk
Hệ thống lấy floorId, latitude, longitude
Admin bấm Lưu
```

### 10.5. Preview Route

Trước khi lưu hoặc sau khi lưu, admin nên test:

```text
Kiosk origin -> một điểm đến bất kỳ
```

Nếu route không tìm được, cảnh báo admin chọn lại điểm.

---

## 11. Cấu Hình Production Domain

### 11.1. Domain Mong Muốn

```text
https://map.lthairport.vn
```

### 11.2. Yêu Cầu Hosting

Khi truy cập:

```text
https://map.lthairport.vn
```

server phải trả về:

```text
dist/main/html/index.html
```

hoặc backend fallback trả về file index.

### 11.3. Kiosk URL Production

```text
https://map.lthairport.vn?mode=kiosk&kioskId=LT-KIOSK-01
```

### 11.4. Admin URL Production

```text
https://map.lthairport.vn?admin=true
```

### 11.5. Deep Link URL Production

Ví dụ:

```text
https://map.lthairport.vn?location=o_abc123&floor=f_1
```

hoặc nếu vẫn dùng path language/map:

```text
https://map.lthairport.vn/vn/MAP_ID?location=o_abc123&floor=f_1
```

Điểm quan trọng: mọi path deep link đều phải fallback về app index.

---

## 12. Triển Khai Trên Máy Kiosk

### 12.1. Chuẩn Bị Máy

Mỗi kiosk cần:

```text
Windows 10/11 Pro, Enterprise, Education hoặc IoT Enterprise
Microsoft Edge
Màn hình cảm ứng
Kết nối mạng ổn định
User kiosk riêng
```

### 12.2. Đặt Tên Máy

Ví dụ:

```text
LT-KIOSK-01-PC
LT-KIOSK-02-PC
```

### 12.3. Cấu Hình Windows Assigned Access

Trên từng máy:

```text
Settings
Set up a kiosk
Get started
Tạo user kiosk
Chọn Microsoft Edge
Chọn fullscreen/digital signage
Nhập URL kiosk
```

Ví dụ URL:

```text
https://map.lthairport.vn?mode=kiosk&kioskId=LT-KIOSK-01
```

### 12.4. Test Tại Chỗ

Kiểm tra:

```text
Máy bật lên có mở đúng URL không
URL có đúng kioskId không
Bản đồ tự lấy đúng điểm đi không
Touch hoạt động tốt không
Chọn điểm đến có vẽ đường đúng không
Nhấn Home có giữ kioskId không
Reload có vẫn đúng kiosk không
```

---

## 13. Test Bắt Buộc

### 13.1. Test Website Mode

URL:

```text
https://map.lthairport.vn
```

Kiểm tra:

```text
Người dùng tự chọn điểm đi
Người dùng tự chọn điểm đến
URL không cần mode/kioskId
```

### 13.2. Test Kiosk Mode

URL:

```text
https://map.lthairport.vn?mode=kiosk&kioskId=LT-KIOSK-01
```

Kiểm tra:

```text
Tự load kiosk config
Tự set điểm đi
Click location không mất kioskId
Dẫn đường không mất kioskId
Đổi tầng không mất kioskId
Home không mất kioskId
Reload vẫn đúng kiosk
```

### 13.3. Test Admin

URL:

```text
https://map.lthairport.vn?admin=true
```

Kiểm tra:

```text
Login admin
Tạo kiosk
Sửa kiosk
Bật/tắt kiosk
Chọn tọa độ trên bản đồ
Lưu
Kiosk reload lấy cấu hình mới
```

### 13.4. Test Backend

Chạy:

```bash
cd backend
npm run build
```

Test API:

```text
GET /api/kiosks/LT-KIOSK-01/config
GET /api/admin/kiosks
PUT /api/admin/kiosks/LT-KIOSK-01
```

### 13.5. Test Frontend Build

Chạy:

```bash
npm run build
```

---

## 14. Quy Trình Vận Hành Lâu Dài

### 14.1. Thêm Kiosk Mới

```text
Tạo kiosk mới trong admin
Chọn vị trí bắt đầu
Lưu
Cấu hình máy kiosk mở URL mới
```

Ví dụ:

```text
https://map.lthairport.vn?mode=kiosk&kioskId=LT-KIOSK-06
```

### 14.2. Di Dời Kiosk

Không sửa code.

```text
Admin đăng nhập
Vào Quản lý Kiosk
Chọn kiosk
Chọn lại vị trí
Lưu
Reload kiosk
```

### 14.3. Tạm Dừng Kiosk

```text
Admin vào Quản lý Kiosk
Set IsActive = false
```

Public API sẽ không trả config active cho kiosk đó.

### 14.4. Quản Lý Nhiều Kiosk

Nếu ít kiosk:

```text
Cấu hình thủ công bằng Windows Assigned Access
```

Nếu nhiều kiosk:

```text
Dùng Microsoft Intune/MDM để quản lý tập trung
```

---

## 15. Checklist Triển Khai Theo Thứ Tự

```text
1. Backup database MappedIn3DModels
2. Chạy SQL patch KioskDevices trong SSMS
3. Test stored procedure trong SSMS
4. Tạo backend kiosk module
5. Thêm backend API
6. Tạo frontend kiosk helper
7. Sửa index.ts để load kiosk config
8. Sửa syncURL để preserve mode/kioskId
9. Sửa Home/reset để giữ kiosk origin
10. Sửa luồng chọn điểm đi trong kiosk mode
11. Sửa flight navigation để route từ kiosk
12. Xây UI admin quản lý kiosk
13. Test 5 kiosk giả lập
14. Cấu hình production domain map.lthairport.vn
15. Cấu hình Windows Assigned Access trên từng kiosk
16. Test thực tế tại vị trí đặt kiosk
```

---

## 16. Tiêu Chí Hoàn Thành

Tính năng hoàn thành khi:

```text
Website truy cập bằng https://map.lthairport.vn
Kiosk truy cập bằng https://map.lthairport.vn?mode=kiosk&kioskId=...
Website mode vẫn tự chọn điểm đi
Kiosk mode tự set điểm đi
URL không mất kioskId khi thao tác
Home không làm mất kioskId
Reload kiosk vẫn đúng điểm đi
Admin chỉnh được vị trí kiosk
Không cần sửa code khi thêm/di dời kiosk
Backend/frontend build pass
```

---

## 17. Kết Luận

Kiến trúc đúng cho dự án là:

```text
Một source code
Một domain map.lthairport.vn
Hai chế độ chạy: website và kiosk
Một bảng KioskDevices để cấu hình thiết bị thật
Admin UI để chỉnh vị trí kiosk
syncURL luôn giữ mode/kioskId
```

URL chuẩn sau này:

```text
Website:
https://map.lthairport.vn

Kiosk:
https://map.lthairport.vn?mode=kiosk&kioskId=LT-KIOSK-01

Admin:
https://map.lthairport.vn?admin=true
```

Đây là hướng dễ triển khai, dễ vận hành và phù hợp với môi trường sân bay có nhiều kiosk đặt ở nhiều vị trí khác nhau.
