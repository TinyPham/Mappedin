# Flight Navigation Recovery Log

> Mục đích: lưu lại quyết định, phát hiện dữ liệu, thay đổi đã làm và bước tiếp theo cho luồng `Thông tin chuyến bay` để có thể khôi phục nhanh nếu chat/session bị mất.

## Phạm vi

- Nguồn dữ liệu chuyến bay: `LongThanhFlightBK`
- Nguồn dữ liệu không gian/map: `MappedIn3DModels`
- Luồng cần khôi phục và ổn định:
  - `Đến gate`
  - `Đến check-in`
  - `Tìm đường`
  - `Đến băng chuyền`

## Nguyên tắc đã chốt

1. Không thêm bất kỳ trường ngoại lai Mappedin nào vào `LongThanhFlightBK`.
2. Mapping điều hướng phải nằm ở DB `MappedIn3DModels`.
3. Frontend không được match text để suy ra gate/check-in/belt cho luồng flight.
4. Backend phải join:
   - dữ liệu flight từ `LongThanhFlightBK`
   - dữ liệu mapping từ `MappedIn3DModels`
5. Frontend chỉ điều hướng bằng ID backend trả về.

## Quyết định dữ liệu điều hướng

### Chuyến bay đi

- Dùng:
  - `Gate`
  - `CheckInIsland`
  - `CheckInCounterSpec`

### Chuyến bay đến

- Dùng:
  - `Belt`

## Rule enable/disable và thông báo

### Chỉ disable nút khi bị khóa do status

- `Disable` chỉ áp dụng khi lý do là trạng thái nghiệp vụ của chuyến bay.
- Ví dụ:
  - chuyến đi: `BOARDING`, `DEPARTED`, `CANCELLED`, `CLOSED`
  - chuyến đến: `CANCELLED`, `DELAYED`, `BAGGAGE_DONE`

### Không disable do thiếu mapping

- Nếu không map được:
  - gate
  - check-in
  - belt
- thì không được coi là disable vì status.
- Hệ thống phải báo rõ lên màn hình để biết là đang thiếu dữ liệu mapping điều hướng.

### Nguyên tắc hiển thị

- Khóa do status:
  - nút bị disable
  - hiện message theo trạng thái
- Thiếu mapping:
  - hiện thông báo lỗi/thiếu mapping trên màn hình
  - để người vận hành biết DB `NavigationMap` chưa đủ hoặc join chưa đúng

## Bảng mapping đã chốt trong `MappedIn3DModels`

- `dbo.FlightGateNavigationMap`
  - `GateNo`
  - `MappedinID`
  - `AreaListID`
  - `DisplayName`

- `dbo.FlightBeltNavigationMap`
  - `BeltNo`
  - `MappedinID`
  - `AreaListID`
  - `DisplayName`

- `dbo.FlightCheckInCounterNavigationMap`
  - `CheckInIsland`
  - `CounterNo`
  - `MappedinID`
  - `AreaListID`
  - `DisplayName`

## Phát hiện quan trọng từ `D:\E-Map-Website\Scripts-Mappedin-08-05-2026.sql`

### Gate

- Cần đọc từ `INSERT [dbo].[AreaList]`, không dùng `AreaInformation` để suy ra.
- Ví dụ đúng:
  - `Gate 1 -> AreaListID 113`
  - `Gate 18 -> AreaListID 110`
  - `Gate 49 -> AreaListID 298`
- Một nhầm lẫn trước đó:
  - `AreaListID 326` là `Gate 3`, không phải `Gate 1`

### Băng chuyền

- `Belt 1..16` map vào các object:
  - `AreaListID 1292..1307`

### Quầy check-in

- `AreaList` có object quầy riêng, không chỉ có object đảo.
- Ví dụ:
  - `Quầy thủ tục 01 - Đảo A -> AreaListID 1335`
  - `Quầy thủ tục 24 - Đảo H -> AreaListID 1533`
- Điều này cho phép route đúng tới từng quầy bằng ID thật.

## Những gì đã làm

### Database

- Tạo file script:
  - `database/mappedin_flight_navigation_mapping.sql`
- Tạo 3 bảng mapping ở `MappedIn3DModels`:
  - `dbo.FlightGateNavigationMap`
  - `dbo.FlightBeltNavigationMap`
  - `dbo.FlightCheckInCounterNavigationMap`

### Backend

- Đã thêm / chỉnh luồng đọc flight:
  - `backend/flights/flightRepository.ts`
  - `backend/flights/flightModels.ts`
  - `backend/server.ts`
- Hướng hiện tại:
  - flight lấy từ `LongThanhFlightBK`
  - mapping lấy từ `MappedIn3DModels`

### Frontend

- Đã có các lần chỉnh ở `index.ts` cho flight overlay.
- Tuy nhiên trạng thái cần coi là **chưa chốt ổn định** cho tới khi backend join đúng mapping ID và frontend bỏ hẳn text-match.

## Những gì sai / không nên lặp lại

1. Không auto-seed mapping bằng heuristic text khi chưa xác nhận object thật trong `AreaList`.
2. Không dùng `AreaInformation` để quyết định `GateNo`, `BeltNo`, `CounterNo`.
3. Không để frontend đoán object bằng tên nếu backend đã có thể trả ID.

## SQL đúng gần nhất đã chốt

- Hướng đúng:
  - xóa dữ liệu mapping sai hiện tại
  - nạp lại `Gate/Belt/CheckInCounter` bằng `AreaListID` thật từ `AreaList`
  - `MappedinID` lấy bằng join cùng dòng `AreaList`

## Việc cần làm tiếp

1. Chạy SQL nạp lại mapping theo `AreaListID` thật.
2. Kiểm tra số lượng record trong:
   - `dbo.FlightGateNavigationMap`
   - `dbo.FlightBeltNavigationMap`
   - `dbo.FlightCheckInCounterNavigationMap`
3. Sửa backend để `/api/flights/:id/navigation-targets` trả target theo mapping thật.
4. Sửa frontend để:
   - chỉ dùng ID
   - không còn fallback text-match cho luồng flight
5. Test lại 4 nút:
   - `Đến gate`
   - `Đến check-in`
   - `Tìm đường`
   - `Đến băng chuyền`

## Cách cập nhật file này từ bây giờ

Sau mỗi đợt sửa, append một block mới theo mẫu:

```md
## Update YYYY-MM-DD HH:mm

- Mục tiêu:
- File đã sửa:
- SQL/DB đã chạy:
- Kết quả:
- Rủi ro còn lại:
- Bước tiếp theo:
```

## Update 2026-05-08 17:45

- Mục tiêu:
  - chốt lại mô hình mapping đúng cho flight navigation
- File đã sửa:
  - `docs/superpowers/plans/2026-05-08-flight-navigation-recovery-log.md`
- SQL/DB đã chạy:
  - chưa chạy thêm trong bước này
- Kết quả:
  - đã có file log gốc để bám theo nếu cần khôi phục
- Rủi ro còn lại:
  - mapping trong DB có thể vẫn đang chứa dữ liệu seed sai từ đợt auto trước
- Bước tiếp theo:
  - nạp lại mapping Gate/Belt/CheckInCounter theo `AreaListID` thật

## Update 2026-05-08 18:10

- Mục tiêu:
  - áp rule UI mới:
    - chỉ disable khi bị khóa do status
    - thiếu mapping phải báo trên màn hình
- File đã sửa:
  - `backend/flights/flightModels.ts`
  - `backend/flights/flightRepository.ts`
  - `index.ts`
- SQL/DB đã chạy:
  - chưa chạy thêm trong bước này
- Kết quả:
  - backend có thêm cờ:
    - `HasGateNavigation`
    - `HasBeltNavigation`
    - `HasCheckInMapping`
  - frontend:
    - không disable nút vì thiếu mapping nữa
    - render message thiếu mapping ngay trên card khi status không chặn
    - khi bấm nút mà thiếu mapping/dữ liệu, lỗi được đẩy lên vùng lỗi trong modal thay vì `alert`
- Xác minh:
  - `npm run build` pass
- Rủi ro còn lại:
  - vẫn cần test runtime thật sau khi DB mapping đã được nạp đủ
  - vẫn cần rà backend response thực tế của `/api/flights/:id/navigation-targets`
- Bước tiếp theo:
  - test trực tiếp các chuyến:
    - đủ mapping
    - thiếu mapping
    - bị chặn do status

## Update 2026-05-08 18:35

- M?c ti�u:
  - kh�a frontend flight overlay theo strict-ID v� t�ch r�:
    - disable do status
    - thi?u mapping th� b�o tr�n card/modal
- File d� s?a:
  - `index.ts`
- SQL/DB d� ch?y:
  - chua ch?y th�m trong bu?c n�y
- K?t qu?:
  - b? fallback text-match cu trong lu?ng flight action
  - n�t `�?n bang chuy?n` gi? nguy�n nh�n action, kh�ng d?i sang nh�n unavailable khi ch? thi?u mapping
  - card hi?n th? `mappingMessage` ri�ng khi status kh�ng ch?n
- X�c minh:
  - `npm run build` pass
- R?i ro c�n l?i:
  - runtime v?n ph? thu?c vi?c 3 b?ng `NavigationMap` d� du?c n?p d? hay chua
- Bu?c ti?p theo:
  - test 4 case runtime theo mapping th?t
