# Thiết Kế Chuẩn Hóa Hình Học Tuyến Đường Sân Bay

## 1. Mục Tiêu

Cải thiện tuyến dẫn đường trong nhà ga để:

- giảm các đoạn ngoằn ngoèo và node dư;
- tạo các đoạn đi dài, rõ và dễ đọc;
- giữ tuyến bám đúng lối đi do Mappedin tính toán;
- không vẽ xuyên tường, quầy, cửa hoặc vùng không thể đi;
- không làm sai mô tả từng bước;
- không tái diễn hiện tượng treo giao diện khi tính tuyến nhiều chặng;
- áp dụng thống nhất cho website mode và kiosk mode.

Thiết kế không ép mọi góc thành 90 độ. Chỉ các đoạn đã được Mappedin xác nhận có
line-of-sight mới được đơn giản hóa. Góc rẽ thực tế, cửa, điểm dừng và điểm chuyển
tầng phải được giữ.

## 2. Hiện Trạng

Frontend đang dùng `@mappedin/mappedin-js` phiên bản `6.9.1`.

Luồng hiện tại:

1. Tạo danh sách waypoint gồm điểm đi, các điểm dừng và điểm đến.
2. Chuyển mỗi cặp waypoint thành một route leg.
3. Gọi `mapData.getDirections()` cho từng leg.
4. Ghép tọa độ, instruction, distance và path thành một object thủ công.
5. Truyền object ghép vào `mapView.Navigation.draw()`.
6. Đơn giản hóa instruction bằng `navigationInstructionRules.js`.

Chính sách hiện tại:

- một leg dùng `dp-optimal`;
- từ hai leg trở lên dùng `greedy-los`;
- bán kính smoothing là `0.5m`.

Vấn đề:

- `greedy-los` ưu tiên tốc độ và có chất lượng thấp nhất trong ba thuật toán;
- cấu hình door buffer hiện tại chỉ phù hợp với `dp-optimal`;
- object ghép không phải instance `Directions` chính thức;
- `Navigation.draw()` đã hỗ trợ `Directions[]`, nhưng code không dùng khả năng này;
- instruction và hình học có nguy cơ đọc từ hai biểu diễn tuyến khác nhau.

## 3. Quyết Định Kiến Trúc

### 3.1. Giữ Directions Theo Từng Chặng

Mỗi kết quả của `mapData.getDirections()` phải được giữ nguyên trong:

```text
legDirections: Directions[]
```

Khi vẽ, dùng:

```text
mapView.Navigation.draw(legDirections, navigationOptions)
```

Không truyền object `combinedDirections` thủ công vào `Navigation.draw()`.

Object tổng hợp vẫn được phép tồn tại nhưng chỉ phục vụ:

- tổng quãng đường;
- danh sách instruction;
- route preview;
- URL state;
- mô phỏng Blue Dot;
- UI summary.

### 3.2. Chính Sách Smoothing

Một chặng:

```text
dp-optimal
radius = 0.75m
__EXPERIMENTAL_INCLUDE_DOOR_BUFFER_NODES = true
```

Nhiều chặng:

```text
rdp
radius = 0.75m
__EXPERIMENTAL_MUST_INCLUDE_DOOR_BUFFER_NODES = true
```

Lý do chọn `rdp` cho nhiều chặng:

- chất lượng cao hơn `greedy-los`;
- luôn có line-of-sight validation;
- nhẹ hơn `dp-optimal`;
- phù hợp tuyến có cửa và geometry phức tạp;
- tránh lặp lại trường hợp tuyến check-in đến gate làm treo giao diện.

Policy phải trả về một smoothing config hoàn chỉnh, tương thích trực tiếp với
`TGetDirectionsOptions["smoothing"]`, thay vì chỉ trả tên thuật toán.

Mỗi leg có đúng một lần tính chính. Chỉ leg bị lỗi mới được thử lại đúng một lần
bằng `greedy-los`. Việc retry chạy tuần tự, không tính lại leg đã thành công và
không chạy đồng thời nhiều thuật toán.

### 3.3. Không Tự Ép Manhattan Trong Giai Đoạn Này

Không tự đổi tọa độ thành các góc 90 độ trong giai đoạn đầu vì source hiện tại
không có API công khai để chứng minh đoạn tự tạo không xuyên vật cản.

Chỉ bổ sung bộ snap hình học riêng nếu kết quả RDP vẫn không đạt sau kiểm thử.
Bộ snap sau này phải có kiểm tra corridor/obstruction và fallback về tuyến SDK.

## 4. Đồng Bộ Với Instruction Rules

### 4.1. Một Nguồn Hình Học

Instruction simplification phải nhận `pathCoordinates` từ đúng các
`Directions.coordinates` đã được smoothing và đang được vẽ.

Không ưu tiên `path` hoặc `paths` raw nếu chúng không cùng hình học với tuyến hiển thị.

Simplification và validation chạy độc lập trên từng leg trước khi tổng hợp. Kết quả
trung gian có dạng:

```text
{
  legDirections,
  legInstructions,
  legCoordinates,
  legDistance,
  legIndex
}
```

Sau khi từng leg hợp lệ, frontend mới tạo:

```text
{
  legDirections,
  uiDirections,
  legSpans
}
```

`legSpans` lưu chỉ số coordinate và instruction bắt đầu/kết thúc của từng leg.
Nhờ đó các rule không được gộp xuyên qua stopover, kể cả khi hai leg có tọa độ
biên giống nhau hoặc route quay lại cùng một tầng.

Quy tắc ghép instruction tại ranh giới leg:

- `legDirections` không bị sửa;
- leg đầu tiên giữ instruction departure;
- arrival của mỗi leg trung gian được chuyển thành đúng một instruction stopover,
  mang tên waypoint thực tế tại ranh giới;
- departure ở đầu leg kế tiếp được bỏ khỏi danh sách UI để không lặp “khởi hành”
  ngay sau stopover;
- leg cuối cùng giữ instruction arrival;
- nếu simplification/validation của một leg thất bại, dùng instruction SDK gốc của
  leg đó rồi vẫn áp dụng cùng boundary adapter nói trên;
- `legSpans` được tính sau khi boundary adapter hoàn thành để phản ánh đúng danh
  sách UI cuối cùng.

### 4.2. Điểm Bắt Buộc Phải Giữ

Không được gộp hoặc xóa:

- departure;
- arrival;
- stopover;
- enter/take connection;
- exit connection;
- điểm đổi tầng;
- bước rẽ mạnh còn tồn tại trên tuyến đã smoothing.

### 4.3. Quy Tắc Gộp Bước

Các rule hiện tại vẫn được giữ nhưng phải chạy trên tọa độ đã smoothing:

- bỏ micro-turn dưới ngưỡng khi hình học thực sự gần thẳng;
- gộp các bước continue liên tiếp;
- chỉ gộp các turn cùng hướng khi đoạn giữa bám một trục hành lang;
- không gộp qua connection hoặc stopover;
- sau khi ra khỏi connection, giữ bước rẽ mạnh đầu tiên;
- không hiển thị bước đi bộ có khoảng cách bằng 0;
- luôn bảo đảm tối thiểu có bước khởi hành và kết thúc.

### 4.4. Kiểm Tra Tính Khớp

Thêm kiểm tra thuần logic:

- mỗi instruction phải map được tới một coordinate trên cùng tầng với sai số tối
  đa `1.5m`;
- thứ tự instruction phải có chỉ số coordinate không giảm trong phạm vi leg;
- turn instruction không được trỏ tới điểm đã bị loại khỏi hình học;
- stopover phải nằm ở ranh giới giữa hai leg;
- tổng khoảng cách instruction không sai lệch bất thường so với route distance;
- connection instruction không bị mất khi ghép nhiều leg.

Các ngưỡng và semantics:

- strong turn là góc đổi hướng từ `45 độ` trở lên, thống nhất với rule hiện tại;
- tổng display distance của một leg được chấp nhận nếu sai lệch không quá giá trị
  lớn hơn giữa `15%` route distance và `5m`;
- `takeconnection/enter` thuộc tầng đi bộ ngay trước connection;
- `exitconnection/exit` thuộc tầng đi bộ ngay sau connection;
- nếu coordinate của SDK đã nằm ở tầng đích, suy ra tầng đi từ instruction đi bộ
  gần nhất phía trước và tầng đến từ instruction đi bộ gần nhất phía sau;
- validation chỉ so khớp trong phạm vi leg hiện tại, không tìm coordinate ở leg khác.

Nếu kiểm tra thất bại, UI dùng instruction gốc của SDK cho leg liên quan thay vì
hiển thị danh sách đã gộp sai.

## 5. Thành Phần Cần Sửa

### `src/navigation/wayfindingRouteTargets.js`

- mở rộng route calculation policy;
- một leg trả về cấu hình `dp-optimal`;
- nhiều leg trả về cấu hình `rdp`;
- cấu hình phải phân biệt đúng tùy chọn door buffer theo từng thuật toán.

### `main/main-function/index.ts`

- lưu `legDirections`;
- gọi đúng một primary `getDirections()` cho mỗi leg nhiều chặng và tối đa một
  fallback call cho riêng leg primary bị lỗi;
- ghép dữ liệu UI riêng;
- vẽ bằng `Navigation.draw(legDirections, options)`;
- truyền đúng smoothed coordinates vào instruction rules;
- fallback có kiểm soát khi RDP lỗi hoặc không trả tuyến.

### `src/navigation/navigationInstructionRules.js`

- bổ sung validator kiểm tra instruction với tuyến hiển thị;
- bảo vệ stopover, connection, floor transition và strong turn;
- không thay đổi formatter ngôn ngữ nếu không cần thiết.

### Tests

- cập nhật `tests/wayfindingRouteTargets.test.mjs`;
- cập nhật `tests/navigationInstructionRules.test.mjs`;
- bổ sung fixture tuyến nhiều chặng kiosk -> check-in -> gate;
- kiểm tra source integration chỉ dùng `Directions[]` để vẽ.

## 6. Fallback Và Xử Lý Lỗi

Thứ tự fallback:

1. Tính leg bằng chính sách đã chọn.
2. Một leg được coi là lỗi nếu Promise reject/throw, kết quả là `null`/`undefined`,
   không có `coordinates`, hoặc có ít hơn hai coordinate.
3. Nếu leg dùng `rdp` bị lỗi, thử lại đúng leg đó một lần bằng `greedy-los`.
   Fallback giữ `radius = 0.75m` và không truyền option door-buffer riêng của
   `rdp` hoặc `dp-optimal`.
4. Không tính lại các leg đã thành công và không chạy primary/fallback song song.
5. Nếu retry vẫn lỗi, hiển thị trạng thái không tìm thấy tuyến.
6. Validation instruction thất bại không tính lại route; chỉ dùng instruction SDK
   gốc của leg đó.
7. Không tự tạo đường thẳng nối origin-destination.
8. Không giữ lại một phần tuyến khi thiếu leg giữa.

Fallback không được chạy đồng thời nhiều biến thể vì có thể làm treo main thread.

## 7. Đo Chất Lượng

Với mỗi route test, ghi nhận:

- số leg;
- số coordinate trước và sau smoothing;
- số instruction trước và sau simplification;
- thời gian tính từng leg;
- tổng thời gian;
- số turn hiển thị;
- có/không connection;
- có/không stopover;
- kết quả tương tác zoom/pan sau khi vẽ.

Tiêu chí đạt:

- không còn micro-zigzag nhìn thấy rõ;
- không mất điểm dừng check-in;
- không mất chỉ dẫn gate;
- không mất bước thang máy/thang cuốn;
- tuyến một và nhiều tầng đều hoạt động;
- giao diện vẫn tương tác được ngay sau khi vẽ;
- website mode không bị thay đổi hành vi chọn điểm;
- kiosk mode vẫn giữ origin mặc định.

## 8. Kiểm Thử

### Unit Test

- policy một leg và nhiều leg;
- cấu hình door buffer đúng tên;
- preserve stopover;
- preserve connection/floor transition;
- merge micro-turn chỉ khi geometry gần thẳng;
- fallback instruction khi validation thất bại.
- không gộp instruction qua ranh giới leg;
- route lặp lại cùng tầng hoặc cùng coordinate vẫn map đúng instruction vào leg;

### Integration Test

- `Navigation.draw()` nhận `Directions[]`;
- UI summary nhận dữ liệu tổng hợp;
- `wayfindingDirections` dùng cùng smoothed coordinates;
- route chuyến bay đi có check-in là stopover và gate là destination;
- chuyến bay đến vẫn dẫn tới belt.

### Browser Test

- website route một chặng;
- kiosk route một chặng;
- kiosk flight route hai chặng;
- route qua thang máy/thang cuốn;
- đóng route và quay Home;
- zoom, pan và chọn điểm sau khi route hoàn thành.

## 9. Nhật Ký Và Hoàn Tác

Trước khi sửa source:

- ghi `git diff` của các file sẽ chạm tới;
- không ghi đè thay đổi không liên quan;
- liệt kê chính xác baseline của policy và draw flow.

Tạo nhật ký:

```text
docs/implementation-logs/2026-07-18-airport-route-geometry.md
```

Nhật ký phải chứa:

- yêu cầu người dùng;
- file đã tạo/sửa;
- hành vi cũ;
- hành vi mới;
- test đã chạy và kết quả;
- các hunk/exports mới;
- hướng dẫn hoàn tác thủ công theo từng file;
- phần nào là thay đổi có sẵn trước tác vụ và không được hoàn tác.

Không dùng `git reset --hard` hoặc `git checkout --` để hoàn tác vì worktree đang có
nhiều thay đổi khác. Hoàn tác phải dùng patch đảo ngược đúng các hunk của tính năng.

## 10. Ngoài Phạm Vi

- chỉnh warning trong Mappedin Editor;
- chỉnh path network trong Mappedin CMS;
- tự viết router A* hoặc Manhattan;
- thay đổi database kiosk;
- thay đổi API chuyến bay;
- thay đổi nội dung dịch không liên quan đến instruction geometry.
