# Airport Route Geometry Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cải thiện hình học tuyến dẫn đường sân bay bằng smoothing an toàn của Mappedin, giữ hình học hiển thị và hướng dẫn từng bước đồng bộ, đồng thời không tái diễn lỗi treo ở tuyến nhiều chặng.

**Architecture:** Mỗi route leg giữ nguyên một `Directions` chính thức từ SDK và được vẽ bằng `Directions[]`. Instruction được đơn giản hóa, kiểm tra và fallback độc lập theo từng leg; dữ liệu tổng hợp chỉ phục vụ UI, Blue Dot và thống kê. Tuyến nhiều leg dùng RDP và chỉ retry riêng leg lỗi bằng greedy LOS.

**Tech Stack:** TypeScript, JavaScript ES modules, Node test runner, Vite, `@mappedin/mappedin-js` 6.9.1.

---

## Nguyên Tắc An Toàn Khi Thực Hiện

- Worktree đang có thay đổi kiosk và flight chưa commit trong các file liên quan.
- Trước khi sửa, lưu diff baseline của đúng các file sẽ chạm tới trong nhật ký triển khai.
- Không dùng `git reset`, `git checkout --` hoặc ghi đè toàn file.
- Không tự động commit file đang chứa thay đổi lẫn nhau. Chỉ commit khi có thể stage đúng hunk của tính năng mà không kéo theo thay đổi có sẵn.
- Không thêm thuật toán ép góc 90 độ hoặc router riêng.
- Mọi fallback chạy tuần tự; không chạy nhiều biến thể smoothing đồng thời.

### Task 1: Ghi Baseline Và Khóa Route Policy Bằng Test

**Files:**
- Modify: `tests/wayfindingRouteTargets.test.mjs`
- Modify: `src/navigation/wayfindingRouteTargets.js`
- Create: `docs/implementation-logs/2026-07-18-airport-route-geometry.md`

- [ ] **Step 1: Ghi baseline trước khi sửa**

Chạy:

```powershell
git diff -- src/navigation/wayfindingRouteTargets.js tests/wayfindingRouteTargets.test.mjs src/navigation/navigationInstructionRules.js tests/navigationInstructionRules.test.mjs main/main-function/index.ts
```

Ghi vào nhật ký:

- policy cũ: một leg `dp-optimal`, nhiều leg `greedy-los`;
- radius cũ `0.5`;
- flow cũ ghép `combinedDirections`;
- flow cũ gọi `Navigation.draw(directions, ...)`;
- danh sách thay đổi có sẵn không thuộc tính năng này.

- [ ] **Step 2: Viết test policy mới và xác nhận test fail**

Test một leg phải trả:

```js
{
  refineObjectTargets: true,
  compareAccessibleRoutes: true,
  primarySmoothing: {
    enabled: true,
    __EXPERIMENTAL_METHOD: 'dp-optimal',
    radius: 0.75,
    __EXPERIMENTAL_INCLUDE_DOOR_BUFFER_NODES: true
  },
  fallbackSmoothing: null
}
```

Test nhiều leg phải trả:

```js
{
  refineObjectTargets: false,
  compareAccessibleRoutes: false,
  primarySmoothing: {
    enabled: true,
    __EXPERIMENTAL_METHOD: 'rdp',
    radius: 0.75,
    __EXPERIMENTAL_MUST_INCLUDE_DOOR_BUFFER_NODES: true
  },
  fallbackSmoothing: {
    enabled: true,
    __EXPERIMENTAL_METHOD: 'greedy-los',
    radius: 0.75
  }
}
```

Chạy:

```powershell
node --test tests/wayfindingRouteTargets.test.mjs
```

Expected: fail vì implementation hiện tại chỉ trả `smoothingMethod`.

- [ ] **Step 3: Cập nhật policy tối thiểu để test pass**

Sửa `getWayfindingRouteCalculationPolicy()` để trả full smoothing config. Không thay đổi target refinement ngoài logic một leg/nhiều leg hiện có.

- [ ] **Step 4: Chạy lại test policy**

```powershell
node --test tests/wayfindingRouteTargets.test.mjs
```

Expected: pass.

### Task 2: Xây Pipeline Instruction Theo Từng Leg

**Files:**
- Modify: `tests/navigationInstructionRules.test.mjs`
- Modify: `src/navigation/navigationInstructionRules.js`

- [ ] **Step 1: Viết test fail cho validator instruction theo geometry**

Bổ sung test cho các trường hợp:

- instruction map tới coordinate cùng tầng trong sai số `1.5m`;
- index coordinate không giảm trong cùng leg;
- instruction lệch khỏi route quá `1.5m` làm validation fail;
- tổng display distance lệch quá `max(15%, 5m)` làm validation fail;
- strong turn từ `45°` trở lên phải còn tồn tại;
- connection enter/exit giữ đúng floor trước/sau;
- route quay lại cùng coordinate nhưng vẫn chỉ map trong leg hiện tại.

Chạy:

```powershell
node --test tests/navigationInstructionRules.test.mjs
```

Expected: fail vì chưa có validator/public pipeline mới.

- [ ] **Step 2: Thêm validator thuần logic**

Trong `navigationInstructionRules.js`, thêm export có trách nhiệm hẹp:

```js
validateNavigationInstructionsAgainstPath(instructions, options)
```

Kết quả phải chứa ít nhất:

```js
{
  valid,
  reason,
  coordinateIndices
}
```

Validator:

- chỉ tìm coordinate trong `options.pathCoordinates` của leg;
- so sánh cùng `floorId`;
- dùng ngưỡng mặc định `1.5m`;
- kiểm tra progress không giảm;
- kiểm tra strong turn `45°`;
- kiểm tra distance tolerance `max(15%, 5m)`;
- không mutate instruction SDK.

- [ ] **Step 3: Viết test fail cho boundary adapter**

Bổ sung fixture ba waypoint:

```text
kiosk -> check-in -> gate
```

Kiểm tra:

- departure đầu tiên được giữ;
- arrival ở check-in trở thành đúng một stopover;
- departure đầu leg gate bị bỏ;
- arrival gate được giữ;
- không merge qua stopover;
- `legSpans` phản ánh đúng coordinate/instruction range sau adapter;
- một leg validation fail dùng raw SDK instructions của riêng leg đó.

- [ ] **Step 4: Thêm helper chuẩn bị và tổng hợp leg**

Thêm các export thuần logic:

```js
prepareNavigationLeg(legDirections, options)
aggregateNavigationLegs(preparedLegs, options)
```

`prepareNavigationLeg`:

1. lấy `legDirections.coordinates` làm nguồn geometry;
2. chạy `simplifyNavigationInstructions`;
3. chạy `ensureMinimumRouteInstructions`;
4. validate kết quả;
5. nếu fail thì dùng raw SDK instructions;
6. trả metadata cho leg mà không sửa `legDirections`.

`aggregateNavigationLegs`:

1. ghép coordinate, bỏ coordinate biên trùng;
2. áp boundary adapter;
3. tạo stopover từ tên waypoint thực tế;
4. tính `legSpans` sau adapter;
5. trả `uiDirections` độc lập với `legDirections`.

- [ ] **Step 5: Chạy toàn bộ test instruction**

```powershell
node --test tests/navigationInstructionRules.test.mjs
```

Expected: pass, bao gồm toàn bộ test formatter/rule cũ.

### Task 3: Tích Hợp Directions[] Và Fallback Theo Leg

**Files:**
- Modify: `tests/wayfindingRouteTargets.test.mjs`
- Modify: `tests/source/kioskRuntimeIntegrationSource.test.mjs`
- Modify: `main/main-function/index.ts`

- [ ] **Step 1: Viết source integration tests fail**

Kiểm tra source thể hiện:

- có `legDirections`;
- primary smoothing lấy trực tiếp từ policy;
- chỉ retry leg RDP lỗi bằng fallback smoothing;
- route không hợp lệ khi null/undefined/ít hơn hai coordinate;
- `Navigation.draw()` nhận `legDirections`, không nhận object tổng hợp;
- `wayfindingDirections` nhận `uiDirections`;
- instruction pipeline nhận `dir.coordinates` của chính leg;
- không còn `combinedDirections` được dùng để vẽ.

Chạy:

```powershell
node --test tests/wayfindingRouteTargets.test.mjs tests/source/kioskRuntimeIntegrationSource.test.mjs
```

Expected: fail tại các assertion tích hợp mới.

- [ ] **Step 2: Tạo helper cục bộ kiểm tra Directions hợp lệ**

Trong `drawNavigation`, định nghĩa hoặc dùng helper nhỏ:

```ts
const isUsableDirections = (value: any) =>
  Array.isArray(value?.coordinates) && value.coordinates.length >= 2;
```

Không fallback bằng đường thẳng origin-destination.

- [ ] **Step 3: Thay route calculation loop**

Với mỗi leg:

1. gọi primary đúng một lần;
2. nếu kết quả hợp lệ, giữ nguyên trong `legDirections`;
3. nếu primary RDP throw/reject/invalid, gọi fallback greedy LOS đúng một lần cho leg đó;
4. nếu fallback fail, dừng toàn tuyến bằng flow “không tìm thấy đường” hiện tại;
5. không tính lại leg đã thành công;
6. không chạy fallback song song.

- [ ] **Step 4: Chuẩn bị instruction độc lập theo leg**

Với từng `Directions`:

```ts
prepareNavigationLeg(dir, {
  legIndex,
  routeDistance: dir.distance,
  pathCoordinates: dir.coordinates
})
```

Không dùng `path`/`paths` raw làm geometry ưu tiên.

- [ ] **Step 5: Tổng hợp dữ liệu UI**

Gọi `aggregateNavigationLegs()` với waypoint labels. Dùng kết quả để tạo:

- `uiDirections.coordinates`;
- `uiDirections.instructions`;
- `uiDirections.distance`;
- `legSpans`.

Giữ fields cần thiết cho Blue Dot, route preview và UI hiện tại.

- [ ] **Step 6: Vẽ bằng Directions[]**

Thay:

```ts
mapView.Navigation.draw(directions, navigationOptions)
```

bằng:

```ts
mapView.Navigation.draw(legDirections, navigationOptions)
```

Set:

```ts
wayfindingDirections = uiDirections;
```

Không mutate phần tử trong `legDirections`.

- [ ] **Step 7: Chạy focused integration tests**

```powershell
node --test tests/wayfindingRouteTargets.test.mjs tests/navigationInstructionRules.test.mjs tests/source/kioskRuntimeIntegrationSource.test.mjs
```

Expected: pass.

### Task 4: Khóa Regression Cho Luồng Chuyến Bay Và Kiosk

**Files:**
- Modify only if required: `tests/flightNavigationActions.test.mjs`
- Modify only if required: `src/navigation/flightNavigationActions.js`
- Test: `tests/kioskMode.test.mjs`
- Test: `tests/kioskRuntime.test.mjs`

- [ ] **Step 1: Chạy regression hiện có trước**

```powershell
node --test tests/flightNavigationActions.test.mjs tests/kioskMode.test.mjs tests/kioskRuntime.test.mjs
```

Expected: pass. Nếu fail, xác định đó là baseline hay regression mới trước khi sửa.

- [ ] **Step 2: Bổ sung test chỉ khi coverage còn thiếu**

Khóa các hành vi:

- chuyến bay đi, nút “Tìm đường”: kiosk là origin, check-in là stopover, gate là destination;
- nút “Đến check-in” và “Đến gate” vẫn là route một destination;
- chuyến bay đến dẫn tới belt;
- kiosk mode không cho thay origin mặc định;
- website mode vẫn cho chọn origin.

- [ ] **Step 3: Không sửa flight action nếu test đã chứng minh input waypoint đúng**

Phạm vi task này là geometry/instruction pipeline. Chỉ sửa `flightNavigationActions.js` nếu test chỉ ra regression thực tế do contract waypoint không tương thích.

- [ ] **Step 4: Chạy regression suite**

```powershell
node --test tests/flightNavigationActions.test.mjs tests/kioskMode.test.mjs tests/kioskRuntime.test.mjs tests/wayfindingRouteTargets.test.mjs tests/navigationInstructionRules.test.mjs tests/source/kioskRuntimeIntegrationSource.test.mjs
```

Expected: pass.

### Task 5: Build, Browser Verification Và Nhật Ký Hoàn Tác

**Files:**
- Modify: `docs/implementation-logs/2026-07-18-airport-route-geometry.md`

- [ ] **Step 1: Build frontend**

```powershell
npm run build
```

Expected: Vite build hoàn tất, không có TypeScript/import error mới.

- [ ] **Step 2: Chạy toàn bộ test JavaScript liên quan**

```powershell
node --test tests/*.test.mjs tests/source/*.test.mjs
```

Expected: pass; nếu có test baseline không liên quan fail, ghi rõ tên và bằng chứng.

- [ ] **Step 3: Kiểm tra browser ở website mode**

URL:

```text
http://localhost:3000/
```

Kiểm tra:

- route một chặng;
- tuyến hiển thị ít micro-zigzag hơn;
- instruction khớp các turn còn nhìn thấy;
- zoom/pan/click vẫn hoạt động;
- đóng route và Home hoạt động.

- [ ] **Step 4: Kiểm tra browser ở kiosk mode**

URL:

```text
http://localhost:3000/?mode=kiosk&kioskId=LT-KIOSK-01
```

Kiểm tra:

- origin vẫn là kiosk;
- route một chặng hoạt động;
- nút “Đi từ đây” vẫn bị ẩn;
- đóng route không làm mất kiosk mode.

- [ ] **Step 5: Kiểm tra route chuyến bay nhiều chặng**

Kiểm tra chuyến bay đi:

```text
kiosk -> check-in stopover -> gate
```

Xác nhận:

- không treo UI;
- check-in xuất hiện đúng một điểm dừng;
- gate là kết thúc;
- connection/floor transition không mất;
- route được vẽ liên tục theo từng `Directions`;
- pan/zoom hoạt động ngay sau khi vẽ.

Kiểm tra chuyến bay đến:

```text
kiosk -> belt
```

- [ ] **Step 6: Ghi số liệu chất lượng**

Trong nhật ký, ghi cho từng route test:

- số leg;
- số coordinate/instruction;
- thời gian từng leg và tổng thời gian nếu có;
- số turn hiển thị;
- có connection/stopover hay không;
- trạng thái tương tác sau draw.

- [ ] **Step 7: Hoàn thiện hướng dẫn hoàn tác thủ công**

Nhật ký phải liệt kê theo từng file:

- export/hunk đã thêm;
- đoạn cũ được thay;
- patch đảo ngược chính xác;
- thay đổi baseline nào không thuộc tính năng và tuyệt đối không được xóa.

- [ ] **Step 8: Kiểm tra diff cuối**

```powershell
git diff --check
git diff -- src/navigation/wayfindingRouteTargets.js tests/wayfindingRouteTargets.test.mjs src/navigation/navigationInstructionRules.js tests/navigationInstructionRules.test.mjs main/main-function/index.ts docs/implementation-logs/2026-07-18-airport-route-geometry.md
```

Expected: không có whitespace error; diff chỉ gồm các hunk đã mô tả trong nhật ký.

## Tiêu Chí Hoàn Thành

- `Navigation.draw()` nhận `Directions[]` chính thức.
- Một leg dùng DP optimal 0.75m; nhiều leg dùng RDP 0.75m.
- Chỉ leg RDP lỗi mới retry một lần bằng greedy LOS.
- Instruction simplification và validation dùng chính coordinates đang vẽ.
- Không merge instruction qua stopover.
- Connection, đổi tầng, strong turn, departure và arrival được bảo vệ.
- Validation fail chỉ fallback instruction của leg, không tính lại route.
- Kiosk origin và flight waypoint contract không đổi.
- Focused tests, regression tests và Vite build pass.
- Có nhật ký đủ chi tiết để hoàn tác đúng tính năng mà không ảnh hưởng thay đổi có sẵn.
