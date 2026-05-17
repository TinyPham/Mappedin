# Map User Guide Tutorial Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available and explicitly authorized) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an information (`i`) button that opens a complete A-to-Z interactive guide for using the airport map, with device-specific flows for mobile and desktop/tablet.

**Architecture:** Add a focused tutorial engine driven by structured step data. The engine detects the current device profile, opens a modal/overlay with image, title, description, progress, Back/Next/Done buttons, and optionally highlights the relevant UI target. Tutorial content and image assets should be separated from UI logic so copy, screenshots, and device-specific steps can be updated without rewriting behavior.

**Tech Stack:** Existing vanilla TypeScript/HTML/CSS app, Mappedin map UI, local image assets under `public/` or a new tutorial asset folder, Node test runner for regression tests, optional Playwright for screenshot capture.

---

## Current System Context

The app already distinguishes device classes:

- `index.ts` has an `isMobile` boolean based on user-agent checks such as Android, iPhone, iPad, iPod, etc.
- CSS already uses responsive breakpoints:
  - Mobile: `@media (max-width: 768px)`
  - Narrow tablet/iPad: `@media (min-width: 769px) and (max-width: 900px)`
  - Tablet: `769px-992px`, `769px-1200px`

This is enough to show different tutorial content for smartphone and desktop/tablet. For tutorial purposes, prefer a more explicit helper:

```ts
type TutorialDevice = "mobile" | "tablet" | "desktop";

function getTutorialDevice(): TutorialDevice {
  const width = window.innerWidth;
  const mobileUserAgent = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const tabletUserAgent = /iPad|Tablet/i.test(navigator.userAgent);

  if (mobileUserAgent || width <= 768) return "mobile";
  if (tabletUserAgent || width <= 1200) return "tablet";
  return "desktop";
}
```

Recommended behavior:

- `mobile`: use touch-focused guide and mobile layout screenshots.
- `tablet`: use desktop-like content but with compact top controls and touch wording where needed.
- `desktop`: use mouse/keyboard/sidebar guide.

---

## Image Strategy

### Recommended Option: Generate Screenshots From The Real App

Use screenshots from the running app whenever possible. This keeps the guide visually accurate and avoids mismatch between documentation and UI.

Suggested asset path:

```text
public/tutorial/
  mobile/
    01-map-overview.png
    02-search.png
    03-category-toggle.png
    04-category-list.png
    05-floor-language.png
    06-theme-brightness.png
    07-wayfinding-entry.png
    08-wayfinding-route.png
    09-location-detail.png
    10-flight-info.png
    11-map-gestures.png
    12-finish.png
  desktop/
    01-layout-overview.png
    02-search-sidebar.png
    03-categories.png
    04-floor-language-theme.png
    05-brightness.png
    06-wayfinding.png
    07-route-detail.png
    08-location-detail.png
    09-flight-info.png
    10-map-controls.png
    11-finish.png
```

How to produce them:

- Preferred: Playwright screenshots using stable viewport sizes:
  - Mobile: iPhone SE or 390x844
  - iPad: 820x1180
  - Desktop: 1366x768
- If a flow depends on data that is not always available, use a stable local test URL and known map/floor/query.
- For flight info and complex route examples, either use seeded data or manually provide screenshots.

### Backup Option: User-Provided Screenshots

Use this when exact real-world data is required:

- Flight search results
- Real route with known origin/destination/stopover
- Production-only data

The implementation should not depend on image dimensions being identical. Use CSS `object-fit: contain`.

### Backup Option: UI Mock Images

Use only for generic actions such as gestures:

- Pinch to zoom
- Drag to move
- Tap marker
- Rotate/tilt map

These can be generated as simple illustrative images if real screenshots are hard to capture.

---

## Proposed File Structure

### Create

- `tutorialSteps.js`
  - Stores tutorial step data for `mobile`, `tablet`, and `desktop`.
  - Exports `getTutorialSteps(device, language)` or plain data consumed by `index.ts`.

- `tests/tutorialSteps.test.mjs`
  - Verifies required step fields exist.
  - Verifies mobile and desktop/tablet flows are distinct.
  - Verifies every referenced image path follows the agreed folder convention.

- `tests/tutorialUiStructure.test.mjs`
  - Verifies the `i` information button exists below the flight-info button.
  - Verifies modal skeleton ids/classes exist.
  - Verifies Back/Next/Done buttons are present.

- `tests/tutorialDeviceDetection.test.mjs`
  - Verifies device detection helper returns mobile/tablet/desktop from viewport and user-agent cases.

- `public/tutorial/mobile/*.png`
  - Mobile guide images.

- `public/tutorial/desktop/*.png`
  - Desktop/tablet guide images.

### Modify

- `index.html`
  - Add the `i` information button under the flight-info button.
  - Add tutorial modal shell.

- `index.ts`
  - Add tutorial open/close/next/back/done logic.
  - Add device detection for tutorial.
  - Add localStorage persistence.
  - Add optional target highlighting.

- `styles.css`
  - Add tutorial modal, image, progress, buttons, and highlight styles.
  - Add mobile-specific modal layout.

- `responsive.css`
  - Adjust the new `i` button inside the mobile camera stack if needed.

---

## UX Requirements

### Information Button

Placement:

- Right-side camera/action stack.
- Directly below the flight information button.
- Icon: lowercase or uppercase `i` inside a circle.
- Same size and visual style as the existing flight/fullscreen/zoom/home buttons.

Behavior:

- Click/tap opens tutorial at step 1.
- Button must remain available even after the user completes the guide.
- Tooltip/title:
  - Vietnamese: `Hướng dẫn sử dụng`
  - English fallback: `User guide`

### Tutorial Modal

Required UI:

- Image area.
- Step title.
- Step description.
- Progress text, for example `3/12`.
- Back button.
- Next button.
- Done button on final step.
- Close `x` button.

Mobile layout:

- Bottom sheet or centered modal using most of the viewport.
- Image on top.
- Text below image.
- Buttons fixed at bottom of modal.
- Safe-area aware padding.

Desktop/tablet layout:

- Centered modal, max width around `760px`.
- Image large enough to see UI details.
- Optional side-by-side image/text only if it remains readable.

Accessibility:

- Modal should have `role="dialog"`.
- Modal should have `aria-modal="true"`.
- Buttons should have readable labels.
- Escape key closes modal on desktop.
- Focus should move into modal when opened and return to `i` button when closed.

Persistence:

- Save completion in localStorage:

```ts
localStorage.setItem("mappedinUserGuideCompleted", "true");
```

- Do not auto-open unless explicitly requested later.
- The `i` button always opens the guide manually.

---

## Tutorial Data Model

Recommended shape:

```ts
type TutorialStep = {
  id: string;
  title: string;
  description: string;
  image: string;
  targetSelector?: string;
  placement?: "top" | "right" | "bottom" | "left" | "center";
};
```

Example:

```ts
export const tutorialSteps = {
  mobile: [
    {
      id: "mobile-map-overview",
      title: "Làm quen bản đồ",
      description: "Kéo một ngón để di chuyển bản đồ. Chụm hoặc mở hai ngón để thu phóng.",
      image: "/tutorial/mobile/01-map-overview.png",
      targetSelector: "#mappedin-map",
      placement: "center"
    }
  ],
  desktop: [
    {
      id: "desktop-layout-overview",
      title: "Tổng quan giao diện",
      description: "Sidebar bên trái dùng để tìm kiếm, chọn danh mục và dẫn đường. Bản đồ nằm ở bên phải.",
      image: "/tutorial/desktop/01-layout-overview.png",
      targetSelector: "#layout",
      placement: "center"
    }
  ]
};
```

For multilingual support, there are two options:

1. Store text in `tutorialSteps.js` per language.
2. Store translation keys in tutorial data and resolve text through `TranslationManager.t(...)`.

Recommended first phase: Vietnamese text only, because the request is internal and content is detailed. Phase two can add translation keys.

---

## Mobile Tutorial Script

### Step 1: Làm quen bản đồ

Image: `public/tutorial/mobile/01-map-overview.png`

Content:

- Đây là bản đồ 3D của sân bay.
- Kéo một ngón để di chuyển bản đồ.
- Chụm/mở hai ngón để thu phóng.
- Nếu thiết bị hỗ trợ, dùng hai ngón để xoay hoặc nghiêng góc nhìn.

Target: `#mappedin-map`

### Step 2: Tìm kiếm khu vực

Image: `public/tutorial/mobile/02-search.png`

Content:

- Nhập tên khu vực, cửa hàng, dịch vụ hoặc điểm đến vào ô tìm kiếm.
- Khi kết quả xuất hiện, chạm vào một kết quả để bản đồ di chuyển tới vị trí đó.
- Chạm dấu `x` để xóa nội dung tìm kiếm.

Target: `#location-search`

### Step 3: Mở danh mục

Image: `public/tutorial/mobile/03-category-toggle.png`

Content:

- Chạm nút mũi tên trong ô tìm kiếm để mở hoặc đóng danh mục.
- Danh mục giúp tìm nhanh nhóm dịch vụ như Ăn uống, Cửa hàng, Nhà thuốc, Thư giãn.

Target: `#mobile-category-toggle`

### Step 4: Chọn danh mục

Image: `public/tutorial/mobile/04-category-list.png`

Content:

- Chạm vào một danh mục để xem các khu vực thuộc danh mục đó.
- Nếu danh mục có nhiều khu vực, chọn khu vực cụ thể để bản đồ đưa bạn tới vị trí đó.
- Danh mục có thể thay đổi theo tầng đang chọn.

Target: `#category-section`

### Step 5: Chọn tầng

Image: `public/tutorial/mobile/05-floor-language.png`

Content:

- Chạm nút chọn tầng ở cạnh dưới màn hình.
- Chọn Toàn cảnh hoặc tầng cụ thể như Tầng trệt, Tầng 1, Tầng 2, Tầng 3.
- Khi đổi tầng, bản đồ và danh mục sẽ cập nhật theo tầng đó.

Target: `#custom-floor-wrapper`

### Step 6: Chọn ngôn ngữ

Image: `public/tutorial/mobile/05-floor-language.png`

Content:

- Chạm nút ngôn ngữ ở cạnh dưới màn hình.
- Chọn Tiếng Việt, English, 中文, 日本語 hoặc 한국어.
- Giao diện, tên khu vực và một số hướng dẫn sẽ đổi theo ngôn ngữ đã chọn.

Target: `#custom-lang-wrapper`

### Step 7: Chọn theme bản đồ

Image: `public/tutorial/mobile/06-theme-brightness.png`

Content:

- Chạm nút chủ đề ở góc trên của bản đồ.
- Chọn kiểu hiển thị như Cổ điển, Rực rỡ, Xanh đêm, Biển xanh.
- Theme chỉ thay đổi cách hiển thị bản đồ, không làm thay đổi dữ liệu.

Target: `#theme-selector-wrapper`

### Step 8: Chỉnh độ sáng

Image: `public/tutorial/mobile/06-theme-brightness.png`

Content:

- Dùng thanh độ sáng để tăng hoặc giảm độ sáng bản đồ.
- Chạm `+` hoặc `-` để thay đổi từng đơn vị.
- Tính năng này hữu ích khi bản đồ quá sáng hoặc quá tối trên thiết bị của bạn.

Target: `#brightness-selector-wrapper`

### Step 9: Dẫn đường

Image: `public/tutorial/mobile/07-wayfinding-entry.png`

Content:

- Chạm tab `Chỉ đường` để chuyển sang chế độ dẫn đường.
- Tại đây bạn có thể chọn điểm đi, điểm đến và điểm dừng.

Target: `#tab-directions`

### Step 10: Chọn điểm đi, điểm đến, điểm dừng

Image: `public/tutorial/mobile/08-wayfinding-route.png`

Content:

- Nhập điểm đi vào ô đầu tiên.
- Nhập điểm đến vào ô tiếp theo.
- Nếu cần đi qua một vị trí trung gian, thêm điểm dừng.
- Có thể chọn điểm từ kết quả tìm kiếm hoặc từ khu vực trên bản đồ nếu UI hỗ trợ.

Target: `#wayfinding-header-target`

### Step 11: Xem lộ trình

Image: `public/tutorial/mobile/08-wayfinding-route.png`

Content:

- Sau khi chọn đủ điểm, tuyến đường sẽ hiển thị trên bản đồ.
- Danh sách chỉ dẫn sẽ cho biết cần đi thẳng, rẽ trái, rẽ phải hoặc lên/xuống tầng.
- Nếu lộ trình đi qua thang máy, thang cuốn hoặc cầu thang, hãy làm theo chỉ dẫn chuyển tầng.

Target: `#instructions-list`

### Step 12: Xem thông tin khu vực

Image: `public/tutorial/mobile/09-location-detail.png`

Content:

- Chạm vào marker hoặc khu vực trên bản đồ để xem thông tin chi tiết.
- Thông tin có thể gồm tên khu vực, tầng, mô tả và các nút thao tác.
- Có thể chọn dẫn đường tới khu vực này nếu nút điều hướng xuất hiện.

Target: `#sidebar-info-panel`

### Step 13: Xem thông tin chuyến bay

Image: `public/tutorial/mobile/10-flight-info.png`

Content:

- Chạm nút máy bay ở cạnh phải để mở thông tin chuyến bay.
- Tìm chuyến bay theo mã hoặc thông tin liên quan.
- Nếu chuyến bay có khu vực liên kết, chọn điều hướng để bản đồ dẫn bạn tới vị trí đó.

Target: `#btn-open-flight-info`

### Step 14: Toàn màn hình và nút bản đồ

Image: `public/tutorial/mobile/11-map-gestures.png`

Content:

- Chạm nút toàn màn hình để xem bản đồ rộng hơn.
- Dùng các nút bên phải để phóng to, thu nhỏ, về vị trí ban đầu hoặc mở chế độ xem cần thiết.
- Khi ở toàn màn hình, các nút chính vẫn có thể dùng như bình thường.

Target: `#camera-controls`

### Step 15: Hoàn tất

Image: `public/tutorial/mobile/12-finish.png`

Content:

- Bạn đã hoàn tất hướng dẫn sử dụng bản đồ.
- Có thể mở lại hướng dẫn bất kỳ lúc nào bằng nút `i`.

Target: `#btn-user-guide`

---

## Desktop/Tablet Tutorial Script

### Step 1: Tổng quan giao diện

Image: `public/tutorial/desktop/01-layout-overview.png`

Content:

- Sidebar bên trái dùng để tìm kiếm, chọn danh mục và dẫn đường.
- Bản đồ 3D nằm ở bên phải.
- Các nút bản đồ nằm quanh vùng bản đồ để đổi tầng, ngôn ngữ, theme, độ sáng và điều khiển góc nhìn.

Target: `#layout`

### Step 2: Di chuyển và tương tác bản đồ

Image: `public/tutorial/desktop/10-map-controls.png`

Content:

- Kéo chuột để di chuyển bản đồ.
- Dùng con lăn chuột hoặc nút zoom để phóng to/thu nhỏ.
- Dùng các nút bên phải để về home, fullscreen hoặc điều chỉnh chế độ xem.
- Trên tablet, thao tác kéo/chạm tương tự mobile.

Target: `#camera-controls`

### Step 3: Tìm kiếm trong sidebar

Image: `public/tutorial/desktop/02-search-sidebar.png`

Content:

- Nhập tên khu vực, cửa hàng, dịch vụ hoặc điểm đến vào ô tìm kiếm.
- Click kết quả để bản đồ di chuyển tới vị trí đó.
- Dùng dấu `x` để xóa tìm kiếm.

Target: `#location-search`

### Step 4: Chọn danh mục

Image: `public/tutorial/desktop/03-categories.png`

Content:

- Click một danh mục để xem nhóm khu vực liên quan.
- Chọn khu vực cụ thể trong danh mục để bản đồ đưa bạn tới vị trí đó.
- Danh mục có thể thay đổi theo tầng hiện tại.

Target: `#category-section`

### Step 5: Chọn tầng

Image: `public/tutorial/desktop/04-floor-language-theme.png`

Content:

- Mở dropdown tầng để chọn Toàn cảnh hoặc một tầng cụ thể.
- Khi đổi tầng, bản đồ, danh mục và các vị trí hiển thị sẽ cập nhật.

Target: `#custom-floor-wrapper`

### Step 6: Chọn ngôn ngữ

Image: `public/tutorial/desktop/04-floor-language-theme.png`

Content:

- Mở dropdown ngôn ngữ để đổi ngôn ngữ giao diện.
- Tên khu vực, danh mục và một số chỉ dẫn sẽ cập nhật theo ngôn ngữ được chọn.

Target: `#custom-lang-wrapper`

### Step 7: Chọn theme và chỉnh độ sáng

Image: `public/tutorial/desktop/05-brightness.png`

Content:

- Chọn theme để đổi phong cách hiển thị bản đồ.
- Dùng thanh độ sáng hoặc nút `+/-` để điều chỉnh độ sáng.
- Các thay đổi này giúp bản đồ dễ nhìn hơn trong từng môi trường sử dụng.

Target: `#brightness-selector-wrapper`

### Step 8: Dẫn đường

Image: `public/tutorial/desktop/06-wayfinding.png`

Content:

- Chọn tab `Chỉ đường`.
- Nhập điểm đi và điểm đến.
- Có thể thêm điểm dừng nếu cần đi qua một vị trí trung gian.

Target: `#tab-directions`

### Step 9: Xem chi tiết lộ trình

Image: `public/tutorial/desktop/07-route-detail.png`

Content:

- Sau khi chọn đủ điểm, bản đồ hiển thị tuyến đường.
- Danh sách chỉ dẫn cho biết từng bước di chuyển.
- Nếu cần chuyển tầng, hệ thống sẽ hiển thị chỉ dẫn lên/xuống phù hợp.

Target: `#instructions-list`

### Step 10: Xem thông tin khu vực

Image: `public/tutorial/desktop/08-location-detail.png`

Content:

- Click vào khu vực hoặc marker trên bản đồ để xem chi tiết.
- Có thể xem tên, tầng, mô tả và các thao tác liên quan.
- Nếu có nút dẫn đường, click để dùng vị trí đó làm điểm đến.

Target: `#sidebar-info-panel`

### Step 11: Thông tin chuyến bay

Image: `public/tutorial/desktop/09-flight-info.png`

Content:

- Click nút máy bay để mở thông tin chuyến bay.
- Tìm chuyến bay và xem khu vực liên quan.
- Nếu chuyến bay có điểm đến trong sân bay, chọn điều hướng để tạo lộ trình.

Target: `#btn-open-flight-info`

### Step 12: Hoàn tất

Image: `public/tutorial/desktop/11-finish.png`

Content:

- Bạn đã hoàn tất hướng dẫn sử dụng bản đồ.
- Có thể mở lại hướng dẫn bất kỳ lúc nào bằng nút `i`.

Target: `#btn-user-guide`

---

## Implementation Tasks

### Task 1: Add Tutorial Step Data

**Files:**

- Create: `tutorialSteps.js`
- Create: `tests/tutorialSteps.test.mjs`

- [ ] **Step 1: Write failing tests for required step data**

Test requirements:

- `tutorialSteps.mobile` exists and has at least 12 steps.
- `tutorialSteps.desktop` exists and has at least 10 steps.
- Every step has `id`, `title`, `description`, and `image`.
- Every image path starts with `/tutorial/mobile/` or `/tutorial/desktop/`.
- Mobile and desktop first steps are different.

Run:

```powershell
node --test tests/tutorialSteps.test.mjs
```

Expected: fail because `tutorialSteps.js` does not exist.

- [ ] **Step 2: Implement `tutorialSteps.js`**

Add the mobile and desktop scripts from this plan.

- [ ] **Step 3: Run tests**

Run:

```powershell
node --test tests/tutorialSteps.test.mjs
```

Expected: pass.

### Task 2: Add Device Detection Helper

**Files:**

- Modify: `index.ts`
- Create: `tests/tutorialDeviceDetection.test.mjs`

- [ ] **Step 1: Write failing tests**

Test:

- Width <= 768 returns `mobile`.
- iPhone/Android user agent returns `mobile`.
- Width 820 returns `tablet`.
- Width 1366 returns `desktop`.

- [ ] **Step 2: Implement helper**

Recommended helper:

```ts
function getTutorialDevice(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;
  const mobileUserAgent = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const tabletUserAgent = /iPad|Tablet/i.test(navigator.userAgent);
  if (mobileUserAgent || width <= 768) return "mobile";
  if (tabletUserAgent || width <= 1200) return "tablet";
  return "desktop";
}
```

For `tablet`, use desktop tutorial steps but adjust text if desired:

```ts
const stepKey = device === "mobile" ? "mobile" : "desktop";
```

### Task 3: Add Information Button

**Files:**

- Modify: `index.html`
- Modify: `responsive.css`
- Create: `tests/tutorialUiStructure.test.mjs`

- [ ] **Step 1: Write failing test**

Test that:

- `#btn-user-guide` exists.
- It is near `#btn-open-flight-info` in the camera stack.
- It has title `Hướng dẫn sử dụng`.

- [ ] **Step 2: Add button markup**

Place below flight-info button in the right camera/action stack:

```html
<button class="camera-btn" id="btn-user-guide" title="Hướng dẫn sử dụng" aria-label="Hướng dẫn sử dụng">
  <span class="user-guide-icon">i</span>
</button>
```

- [ ] **Step 3: Style icon**

Match existing camera buttons:

```css
#btn-user-guide .user-guide-icon {
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
  font-family: Arial, sans-serif;
}
```

### Task 4: Add Tutorial Modal Skeleton

**Files:**

- Modify: `index.html`
- Modify: `styles.css`
- Test: `tests/tutorialUiStructure.test.mjs`

- [ ] **Step 1: Write failing test for modal ids**

Required ids:

- `#user-guide-modal`
- `#user-guide-image`
- `#user-guide-title`
- `#user-guide-description`
- `#user-guide-progress`
- `#user-guide-back`
- `#user-guide-next`
- `#user-guide-done`
- `#user-guide-close`

- [ ] **Step 2: Add modal markup**

Suggested structure:

```html
<div id="user-guide-modal" class="user-guide-modal hidden" role="dialog" aria-modal="true">
  <div class="user-guide-panel">
    <button id="user-guide-close" class="user-guide-close" aria-label="Đóng">×</button>
    <img id="user-guide-image" class="user-guide-image" alt="">
    <div class="user-guide-body">
      <div id="user-guide-progress" class="user-guide-progress"></div>
      <h2 id="user-guide-title"></h2>
      <p id="user-guide-description"></p>
    </div>
    <div class="user-guide-actions">
      <button id="user-guide-back" type="button">Lùi</button>
      <button id="user-guide-next" type="button">Tiếp</button>
      <button id="user-guide-done" type="button">Đã xong</button>
    </div>
  </div>
</div>
```

### Task 5: Implement Tutorial Engine

**Files:**

- Modify: `index.ts`
- Test: `tests/tutorialUiStructure.test.mjs` or a dedicated DOM test if current test setup supports it.

- [ ] **Step 1: Add state**

```ts
let currentGuideStep = 0;
let activeGuideSteps: TutorialStep[] = [];
```

- [ ] **Step 2: Add open function**

Behavior:

- Detect device.
- Select `tutorialSteps.mobile` or `tutorialSteps.desktop`.
- Reset step to 0.
- Render first step.
- Remove `.hidden`.

- [ ] **Step 3: Add render function**

Render:

- image `src`
- title
- description
- progress
- Back disabled on first step
- Next hidden on final step
- Done visible only on final step

- [ ] **Step 4: Add navigation handlers**

Buttons:

- Back: decrement step.
- Next: increment step.
- Done: save localStorage and close.
- Close: close without marking completed unless desired.

- [ ] **Step 5: Add keyboard behavior**

Desktop:

- `Escape` closes.
- ArrowRight moves next.
- ArrowLeft moves back.

### Task 6: Add Highlight Layer

**Files:**

- Modify: `index.ts`
- Modify: `styles.css`

- [ ] **Step 1: Add overlay element**

Add:

```html
<div id="user-guide-highlight" class="user-guide-highlight hidden"></div>
```

- [ ] **Step 2: Position highlight by target selector**

On each step:

- Query `step.targetSelector`.
- If found, use `getBoundingClientRect()`.
- Position highlight around it.
- If not found, hide highlight.

- [ ] **Step 3: Recalculate on resize and scroll**

Listen while modal is open:

- `resize`
- `scroll`

### Task 7: Add Assets

**Files:**

- Create: `public/tutorial/mobile/*.png`
- Create: `public/tutorial/desktop/*.png`

- [ ] **Step 1: Create placeholder images first**

Use placeholder images only to make implementation testable.

- [ ] **Step 2: Replace with real screenshots**

Capture screenshots from app:

```powershell
npx playwright test tests/tutorialScreenshots.spec.mjs
```

Only add this automation if the dev environment can reliably start the app.

- [ ] **Step 3: Validate paths**

Run:

```powershell
node --test tests/tutorialSteps.test.mjs
```

Expected: pass.

### Task 8: Add LocalStorage Completion Behavior

**Files:**

- Modify: `index.ts`

- [ ] **Step 1: Define storage key**

```ts
const USER_GUIDE_COMPLETED_KEY = "mappedinUserGuideCompleted";
```

- [ ] **Step 2: Mark completed on Done**

```ts
localStorage.setItem(USER_GUIDE_COMPLETED_KEY, "true");
```

- [ ] **Step 3: Keep manual reopen available**

The `i` button must always open the guide regardless of localStorage.

### Task 9: Manual QA

Run app locally and verify:

- [ ] Mobile viewport: `375x667`
- [ ] Mobile viewport: `390x844`
- [ ] iPad Air viewport: `820x1180`
- [ ] Desktop viewport: `1366x768`

Checklist:

- [ ] `i` button appears below flight-info button.
- [ ] Tutorial opens.
- [ ] Mobile receives mobile steps.
- [ ] Desktop/tablet receives desktop/tablet steps.
- [ ] Images fit modal and do not overflow.
- [ ] Back/Next/Done work.
- [ ] Close works.
- [ ] Final step stores completion.
- [ ] Reopening with `i` still works after completion.
- [ ] Highlight does not block clicking modal buttons.
- [ ] Fullscreen mode does not hide tutorial modal.
- [ ] Mobile bottom controls are not covered by tutorial buttons.

### Task 10: Automated Verification

Run:

```powershell
node --test tests/tutorialSteps.test.mjs tests/tutorialUiStructure.test.mjs tests/tutorialDeviceDetection.test.mjs
```

Run existing UI regression tests:

```powershell
node --test tests/tabletTopControlsCss.test.mjs tests/themeSelectorMobileCss.test.mjs tests/mobileControlPositionCss.test.mjs tests/mobileSearchClearButtonCss.test.mjs tests/fullscreenMobileTopControlsCss.test.mjs
```

Run build:

```powershell
npm run build
```

Expected:

- Tests pass.
- Build passes.
- Existing Vite CJS/chunk-size warnings may remain unless addressed separately.

---

## Risks And Mitigations

### Risk: Screenshots become outdated

Mitigation:

- Keep screenshots in a clearly named folder.
- Prefer Playwright-generated screenshots from the current app.
- Keep tutorial text generic enough that small UI shifts do not invalidate the guide.

### Risk: Mobile and tablet detection conflict

Mitigation:

- Use viewport width as primary fallback.
- Treat iPad/tablet as desktop-like unless specific tablet content is added.
- Test viewport `820x1180`.

### Risk: Modal blocks important controls

Mitigation:

- Tutorial is modal by design, so it can block the app while active.
- Highlight overlay should use `pointer-events: none`.
- Modal buttons must remain above highlight.

### Risk: Too many steps overwhelm users

Mitigation:

- Keep each step short.
- Use progress indicator.
- Allow closing at any time.
- Consider grouping advanced steps after basic steps.

### Risk: Multilingual content is large

Mitigation:

- First phase in Vietnamese.
- Add translation keys later after the guide content stabilizes.

---

## Suggested Phase Breakdown

### Phase 1: Functional Tutorial Without Real Screenshots

Deliver:

- `i` button.
- Modal.
- Mobile/desktop step data.
- Placeholder images.
- Navigation.
- Tests.

### Phase 2: Real Screenshots

Deliver:

- Real mobile screenshots.
- Real desktop/tablet screenshots.
- Optional Playwright screenshot generator.

### Phase 3: Highlight And Polish

Deliver:

- Target highlight.
- Better animation.
- Keyboard support.
- Focus management.

### Phase 4: Localization

Deliver:

- Translation keys.
- Vietnamese/English/Chinese/Japanese/Korean tutorial copy.

---

## Definition Of Done

- The app has an `i` information button under flight info.
- The guide opens on mobile and desktop/tablet.
- Mobile and desktop/tablet show different scripts.
- Users can go Next, Back, Close, and Done.
- Done persists completion in localStorage.
- Images render correctly.
- The guide remains usable in fullscreen.
- Tests and build pass.
