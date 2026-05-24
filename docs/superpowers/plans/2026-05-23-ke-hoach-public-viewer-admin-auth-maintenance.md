# Káº¿ Hoáº¡ch Triá»ƒn Khai Public Viewer VÃ  Báº£o Máº­t Admin

## Trang Thai Trien Khai - 2026-05-24

- [x] Public viewer van la che do mac dinh khi mo trang.
- [x] Dang nhap admin dung JWT trong cookie, khong tao bang user/admin trong database.
- [x] Cac API ghi/chinh sua da duoc bao ve bang `requireAdmin`.
- [x] Static serving khong con expose repository root.
- [x] Cau hinh DB uu tien bien moi truong, `.env.example` chi chua placeholder.
- [x] `backend/server.ts` khong con goi truc tiep `.execute()` hoac `.query()`.
- [x] Tai lieu SQL/SSMS nam trong `docs/database/`.
- [x] Log trien khai nam trong `docs/implementation-logs/`.
- [x] Backend build da pass.
- [x] Frontend build da pass.
- [x] Cac test boundary/security/kiosk da pass.
- [x] Da loai bo tham chieu legacy `MasterData_Locations` / `SP_Admin_UpsertLocation` khoi cac script maintenance dang hoat dong.
- [ ] Can smoke test thu cong tren browser voi SQL Server that va chup bang chung theo `docs/testing/kiem-thu-thu-cong-browser.md`.
- [x] Da co bang chung public viewer khong can dang nhap, search, doi tang/mo chi tiet khu vuc, chi duong va thong tin chuyen bay hoat dong.
- [x] Da co bang chung admin login hoat dong va thao tac luu thong tin khu vuc ghi vao `dbo.AreaInformation`.
- [ ] Tuy chon sau nay: review va chay `database/patches/create_sp_assign_subcategory_areas.sql` tren SSMS, sau do moi doi backend assignment sang stored procedure nay.
> **DÃ nh cho agent triá»ƒn khai:** Báº®T BUá»˜C dÃ¹ng `superpowers:subagent-driven-development` náº¿u cÃ³ subagent, hoáº·c `superpowers:executing-plans` náº¿u triá»ƒn khai trong phiÃªn hiá»‡n táº¡i. CÃ¡c bÆ°á»›c dÃ¹ng checkbox (`- [ ]`) Ä‘á»ƒ theo dÃµi tiáº¿n Ä‘á»™.

**Má»¥c tiÃªu:** Giá»¯ tráº£i nghiá»‡m máº·c Ä‘á»‹nh khi má»Ÿ trang lÃ  báº£n Ä‘á»“ á»Ÿ cháº¿ Ä‘á»™ ngÆ°á»i xem public, Ä‘á»“ng thá»i bá»• sung má»™t luá»“ng Ä‘Äƒng nháº­p admin báº£o máº­t cho cÃ¡c thao tÃ¡c chá»‰nh sá»­a, siáº¿t láº¡i backend vÃ  tá»• chá»©c source code Ä‘á»ƒ dá»… báº£o trÃ¬ vá» sau.

**Kiáº¿n trÃºc:** Há»‡ thá»‘ng Ä‘Æ°á»£c chia rÃµ thÃ nh 3 vÃ¹ng: public viewer, admin editing vÃ  backend API. Public viewer vÃ  cÃ¡c API chá»‰ Ä‘á»c váº«n truy cáº­p Ä‘Æ°á»£c khÃ´ng cáº§n Ä‘Äƒng nháº­p; má»i API ghi/chá»‰nh sá»­a admin pháº£i cÃ³ JWT admin há»£p lá»‡ qua cookie báº£o máº­t. KhÃ´ng táº¡o báº£ng user/admin trong `MappedIn3DModels`; thÃ´ng tin admin láº¥y tá»« biáº¿n mÃ´i trÆ°á»ng vÃ  password hash.

**Tech Stack:** Node.js, Express, TypeScript, SQL Server, Mappedin JS, Vite, JWT, bcrypt hoáº·c argon2id, httpOnly cookies, stored procedure/repository SQL hiá»‡n cÃ³.

---

## NguyÃªn Táº¯c Báº¯t Buá»™c

- Máº·c Ä‘á»‹nh khi load trang pháº£i vÃ o báº£n Ä‘á»“ á»Ÿ cháº¿ Ä‘á»™ public viewer.
- Public viewer khÃ´ng Ä‘Æ°á»£c yÃªu cáº§u Ä‘Äƒng nháº­p.
- Chá»‰ cÃ³ má»™t quyá»n duy nháº¥t: `admin`.
- Chá»‰ cáº§n Ä‘Äƒng nháº­p admin khi ngÆ°á»i dÃ¹ng cáº§n chá»‰nh sá»­a hoáº·c dÃ¹ng cÃ´ng cá»¥ quáº£n trá»‹.
- KhÃ´ng táº¡o báº£ng admin/login/user trong `MappedIn3DModels`.
- KhÃ´ng lÆ°u JWT trong `localStorage` hoáº·c `sessionStorage`.
- KhÃ´ng expose `backend/`, `database/`, scripts, appsettings, `.env`, thÆ° má»¥c backup hoáº·c source file qua Express static.
- Sau má»—i phiÃªn sá»­a code theo yÃªu cáº§u cá»§a ngÆ°á»i dÃ¹ng, pháº£i viáº¿t file log thay Ä‘á»•i trÆ°á»›c khi tráº£ lá»i hoÃ n táº¥t.
- KhÃ´ng trá»™n refactor khÃ´ng liÃªn quan vÃ o task báº£o máº­t/auth.

## Log Triá»ƒn Khai Báº¯t Buá»™c

Má»—i phiÃªn sá»­a code dá»±a trÃªn káº¿ hoáº¡ch nÃ y pháº£i táº¡o má»™t file log:

```text
docs/implementation-logs/YYYY-MM-DD-<ten-task-ngan>.md
```

Log pháº£i cÃ³:

- TÃ³m táº¯t yÃªu cáº§u cá»§a ngÆ°á»i dÃ¹ng.
- Danh sÃ¡ch file Ä‘Ã£ thay Ä‘á»•i.
- HÃ nh vi Ä‘Ã£ thay Ä‘á»•i.
- Quyáº¿t Ä‘á»‹nh báº£o máº­t Ä‘Ã£ Ã¡p dá»¥ng.
- Lá»‡nh test/build Ä‘Ã£ cháº¡y vÃ  káº¿t quáº£.
- Rá»§i ro cÃ²n láº¡i.
- Nhá»¯ng pháº§n cá»‘ Ã½ khÃ´ng thay Ä‘á»•i.

ÄÃ¢y lÃ  yÃªu cáº§u báº¯t buá»™c trÆ°á»›c khi bÃ¡o hoÃ n táº¥t.

## MÃ´ HÃ¬nh Truy Cáº­p Má»¥c TiÃªu

### Public Viewer

Public viewer lÃ  cháº¿ Ä‘á»™ máº·c Ä‘á»‹nh khi má»Ÿ báº£n Ä‘á»“.

ÄÆ°á»£c phÃ©p khÃ´ng cáº§n Ä‘Äƒng nháº­p:

- Load báº£n Ä‘á»“ vÃ  dá»¯ liá»‡u init.
- Xem khu vá»±c, danh má»¥c, model, báº£n dá»‹ch, táº§ng.
- TÃ¬m kiáº¿m vá»‹ trÃ­.
- DÃ¹ng chá»‰ Ä‘Æ°á»ng.
- Xem thÃ´ng tin chuyáº¿n bay.
- DÃ¹ng Ä‘iá»ƒm Ä‘iá»u hÆ°á»›ng tá»« chuyáº¿n bay.
- Äá»•i ngÃ´n ngá»¯, táº§ng, Ä‘iá»u khiá»ƒn báº£n Ä‘á»“, theme/Ä‘á»™ sÃ¡ng náº¿u Ä‘Ã¢y lÃ  tÃ­nh nÄƒng ngÆ°á»i xem.

Bá»‹ cháº·n náº¿u chÆ°a Ä‘Äƒng nháº­p admin:

- Upload áº£nh.
- Cáº­p nháº­t thÃ´ng tin khu vá»±c.
- Táº¡o/sá»­a/xÃ³a model 3D.
- Äá»“ng bá»™ location, category, area, available model.
- Äá»•i mÃ u khu vá»±c.
- GÃ¡n category/subcategory.
- Má»i thao tÃ¡c lÆ°u trong modal admin.

### Admin

Admin mode chá»‰ Ä‘Æ°á»£c vÃ o qua trang/nÃºt Ä‘Äƒng nháº­p admin rÃµ rÃ ng.

HÃ nh vi admin:

- Trang login nháº­n má»™t username vÃ  password Ä‘Ã£ cáº¥u hÃ¬nh.
- Server kiá»ƒm tra password hash tá»« biáº¿n mÃ´i trÆ°á»ng.
- Server cáº¥p JWT trong cookie `httpOnly`, `secure`, `sameSite=strict`.
- LÆ°u Ã½ mÃ´i trÆ°á»ng cookie:
  - Production cháº¡y HTTPS: dÃ¹ng `httpOnly: true`, `secure: true`, `sameSite: "strict"`.
  - Local/dev cháº¡y HTTP: dÃ¹ng `httpOnly: true`, `secure: false`; `sameSite` cÃ³ thá»ƒ lÃ  `"lax"` hoáº·c `"strict"` náº¿u frontend/backend cÃ¹ng origin.
  - Náº¿u sau nÃ y frontend vÃ  backend cháº¡y khÃ¡c domain/subdomain, cáº§n kiá»ƒm tra láº¡i `sameSite` vÃ  CORS trÆ°á»›c khi deploy.
- Frontend gá»i `/api/auth/me` Ä‘á»ƒ biáº¿t cÃ³ Ä‘Æ°á»£c hiá»ƒn thá»‹ cÃ´ng cá»¥ admin hay khÃ´ng.
- UI admin máº·c Ä‘á»‹nh pháº£i áº©n, chá»‰ hiá»ƒn thá»‹ sau khi `/api/auth/me` xÃ¡c thá»±c thÃ nh cÃ´ng.
- `?admin=true` chá»‰ Ä‘Æ°á»£c dÃ¹ng Ä‘á»ƒ má»Ÿ prompt Ä‘Äƒng nháº­p admin, khÃ´ng bao giá» tá»± cáº¥p quyá»n.

## Cáº¥u TrÃºc File Má»¥c TiÃªu

Backend nÃªn Ä‘Æ°á»£c tÃ¡ch dáº§n theo cáº¥u trÃºc:

```text
backend/
  src/
    app.ts
    server.ts
    config/
      env.ts
      paths.ts
      cors.ts
    middleware/
      requireAdmin.ts
      errorHandler.ts
      validateRequest.ts
    auth/
      auth.routes.ts
      auth.service.ts
      jwt.ts
      password.ts
    static/
      static.routes.ts
    modules/
      flights/
        flights.routes.ts
        flights.repository.ts
      models/
        models.routes.ts
        models.repository.ts
      areas/
        areas.routes.ts
        areas.repository.ts
      categories/
        categories.routes.ts
        categories.repository.ts
      uploads/
        uploads.routes.ts
        uploads.service.ts
```

Frontend nÃªn Ä‘Æ°á»£c tÃ¡ch dáº§n theo cáº¥u trÃºc:

```text
src/
  main.ts
  api/
    client.ts
    authApi.ts
  auth/
    loginPage.ts
    authState.ts
  kiosk/
    viewerShell.ts
  admin/
    adminShell.ts
    areaEditor.ts
    modelEditor.ts
  map/
    mapBootstrap.ts
    camera.ts
    modelStreaming.ts
    wayfinding.ts
  flights/
    flightModal.ts
    flightNavigation.ts
```

KhÃ´ng tÃ¡ch toÃ n bá»™ `index.ts` trong má»™t láº§n. Chá»‰ tÃ¡ch module liÃªn quan Ä‘áº¿n task Ä‘ang sá»­a.

## Giai Äoáº¡n 1: Ná»n Táº£ng An ToÃ n

### Task 1: Chá»¥p Tráº¡ng ThÃ¡i Hiá»‡n Táº¡i

**Files:** khÃ´ng sá»­a code.

- [ ] Cháº¡y `git status --short`.
- [ ] Ghi nháº­n cÃ¡c file Ä‘ang modified/untracked trÆ°á»›c khi sá»­a.
- [ ] XÃ¡c nháº­n cÃ³ thay Ä‘á»•i cÅ© cá»§a ngÆ°á»i dÃ¹ng trong `index.ts`, tests hoáº·c backend khÃ´ng.
- [ ] KhÃ´ng revert thay Ä‘á»•i cá»§a ngÆ°á»i dÃ¹ng náº¿u khÃ´ng Ä‘Æ°á»£c yÃªu cáº§u rÃµ.

### Task 2: KhÃ³a Static Serving

**Files:**

- Sá»­a: `backend/server.ts`
- CÃ³ thá»ƒ táº¡o: `backend/src/static/static.routes.ts`

- [ ] Bá» root static serving tá»« `app.use('/', express.static(ROOT_DIR))`.
- [ ] Chá»‰ serve cÃ¡c thÆ° má»¥c public Ä‘Æ°á»£c phÃ©p:
  - `dist/`
  - `Model3D/`
  - `uploads/`
  - `icon-category/`
- [ ] Äáº£m báº£o `backend/`, `database/`, `scripts/`, `.env`, `appsettings.json`, `Model3D_backup/`, `debug.log`, `diff.txt` khÃ´ng thá»ƒ truy cáº­p qua URL.
- [ ] ThÃªm smoke check Ä‘á»ƒ `GET /backend/appsettings.json` tráº£ vá» 404.
- [ ] Giá»¯ public viewer load báº£n Ä‘á»“ bÃ¬nh thÆ°á»ng.

### Task 3: ÄÆ°a Secret Ra Khá»i Source

**Files:**

- Sá»­a: `backend/db.ts`
- Sá»­a: `.gitignore`
- Táº¡o: `.env.example`
- CÃ³ thá»ƒ sá»­a: `backend/appsettings.Production.json`

- [ ] KhÃ´ng phá»¥ thuá»™c vÃ o connection string tháº­t Ä‘Ã£ commit.
- [ ] Æ¯u tiÃªn Ä‘á»c DB connection tá»« biáº¿n mÃ´i trÆ°á»ng.
- [ ] Local fallback chá»‰ Ä‘Æ°á»£c chá»©a placeholder, khÃ´ng cÃ³ máº­t kháº©u tháº­t.
- [ ] ThÃªm `.env.example` chá»‰ cÃ³ key máº«u.
- [ ] KhÃ´ng in secret ra log.

## Giai Äoáº¡n 2: Admin Authentication

### Task 4: ThÃªm Dependency Auth

**Files:**

- Sá»­a: `backend/package.json`
- Sá»­a root `package.json` náº¿u backend váº«n cháº¡y qua script root.

- [ ] ThÃªm thÆ° viá»‡n JWT.
- [ ] ThÃªm cookie parser.
- [ ] ThÃªm thÆ° viá»‡n hash password, Æ°u tiÃªn `argon2`; fallback cháº¥p nháº­n `bcrypt`.
- [ ] Äá»“ng bá»™ version dependency náº¿u cáº£ root vÃ  backend Ä‘á»u dÃ¹ng runtime.

### Task 5: Validate Environment

**Files:**

- Táº¡o: `backend/src/config/env.ts`
- Sá»­a: `backend/server.ts` hoáº·c táº¡o `backend/src/app.ts`

Biáº¿n mÃ´i trÆ°á»ng báº¯t buá»™c:

```text
ADMIN_USERNAME
ADMIN_PASSWORD_HASH
JWT_ACCESS_SECRET
NODE_ENV
ALLOWED_ORIGINS
```

- [ ] Validate biáº¿n báº¯t buá»™c khi server start.
- [ ] Production pháº£i fail fast náº¿u thiáº¿u secret.
- [ ] KhÃ´ng log giÃ¡ trá»‹ secret.

### Task 6: Implement Auth Service

**Files:**

- Táº¡o: `backend/src/auth/password.ts`
- Táº¡o: `backend/src/auth/jwt.ts`
- Táº¡o: `backend/src/auth/auth.service.ts`
- Táº¡o: `backend/src/auth/auth.routes.ts`

Endpoints:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

- [ ] `POST /api/auth/login` validate username/password.
- [ ] ThÃ nh cÃ´ng thÃ¬ set JWT cookie cÃ³ role admin.
- [ ] Tháº¥t báº¡i thÃ¬ tráº£ response chung, khÃ´ng nÃ³i sai username hay password.
- [ ] `POST /api/auth/logout` xÃ³a cookie.
- [ ] `GET /api/auth/me` tráº£ `{ authenticated: true, role: "admin" }` khi token há»£p lá»‡.
- [ ] Token sai/háº¿t háº¡n tráº£ tráº¡ng thÃ¡i chÆ°a xÃ¡c thá»±c.

### Task 7: Báº£o Vá»‡ Admin APIs

**Files:**

- Táº¡o: `backend/src/middleware/requireAdmin.ts`
- Sá»­a: `backend/server.ts` hoáº·c route modules.

CÃ¡c endpoint pháº£i báº£o vá»‡:

```text
POST   /api/upload-image
POST   /api/update-area-info
POST   /api/area-colors
DELETE /api/area-colors
POST   /api/models/sync-overview-floor
POST   /api/models
DELETE /api/models/:uuid
POST   /api/models/batch
POST   /api/areas/sync
POST   /api/categories/subcategory/:id/assign
POST   /api/admin/locations
POST   /api/sync-locations
```

CÃ¡c endpoint váº«n public:

```text
GET /api/init-data
GET /api/flights
GET /api/flights/:id/navigation-targets
GET /api/models
GET /api/models/:uuid
GET /api/categories
GET /api/categories/active
GET /api/areas/assigned
GET /health
```

- [ ] Chá»‰ gáº¯n middleware vÃ o write/admin routes.
- [ ] Kiá»ƒm tra public viewer váº«n load khÃ´ng cáº§n login.
- [ ] Kiá»ƒm tra write routes tráº£ 401/403 náº¿u khÃ´ng cÃ³ admin cookie.

## Giai Äoáº¡n 3: UI ÄÄƒng Nháº­p Admin

### Task 8: ThÃªm Äiá»ƒm VÃ o Login KhÃ´ng PhÃ¡ Viewer

**Files:**

- Sá»­a: `index.html`
- Sá»­a: `index.ts`
- CÃ³ thá»ƒ táº¡o frontend auth files khi báº¯t Ä‘áº§u tÃ¡ch cáº¥u trÃºc.

- [ ] Máº·c Ä‘á»‹nh áº©n admin actions.
- [ ] ThÃªm Ä‘iá»ƒm vÃ o Ä‘Äƒng nháº­p admin á»Ÿ vá»‹ trÃ­ khÃ´ng gÃ¢y nhiá»…u tráº£i nghiá»‡m viewer.
- [ ] Má»Ÿ URL báº£n Ä‘á»“ bÃ¬nh thÆ°á»ng khÃ´ng Ä‘Æ°á»£c hiá»‡n login modal.
- [ ] `?admin=true` cÃ³ thá»ƒ má»Ÿ UI login, nhÆ°ng khÃ´ng lá»™ tool trÆ°á»›c khi auth.
- [ ] Login thÃ nh cÃ´ng thÃ¬ hiá»ƒn thá»‹ admin tools.
- [ ] Logout thÃ¬ áº©n admin tools vÃ  quay vá» viewer mode.

### Task 9: ThÃªm Auth API Client

**Files:**

- Táº¡o/sá»­a: `src/api/authApi.ts` hoáº·c táº¡m thá»i trong `index.ts` cho Ä‘áº¿n khi tÃ¡ch frontend.

- [ ] DÃ¹ng `fetch(..., { credentials: "include" })`.
- [ ] Gá»i `/api/auth/me` khi startup.
- [ ] KhÃ´ng tá»± lÆ°u token á»Ÿ frontend.
- [ ] Gáº·p 401 thÃ¬ áº©n admin tools.

## Giai Äoáº¡n 4: Ká»· Luáº­t SQL VÃ  Database

### Task 10: PhÃ¢n Loáº¡i SQL

**Files:**

- Review: `backend/server.ts`
- Review: `backend/flights/flightRepository.ts`
- Review: `D:\E-Map-Website\Scripts-Mappedin-23-05-2026-V2.sql`

- [ ] Liá»‡t kÃª cÃ¡c block inline SQL.
- [ ] PhÃ¢n loáº¡i tá»«ng block:
  - query Ä‘á»c Ä‘Æ¡n giáº£n,
  - business query cáº§n Ä‘Æ°a vÃ o repository,
  - á»©ng viÃªn stored procedure,
  - script nguy hiá»ƒm/dev-only.
- [ ] KhÃ´ng Ä‘á»•i behavior SQL trong cÃ¹ng task auth náº¿u khÃ´ng báº¯t buá»™c.

### Task 11: Thiáº¿t Láº­p Ranh Giá»›i Repository

**Files:**

- Táº¡o/sá»­a repository module theo tá»«ng pháº§n.

- [ ] Route chá»‰ parse request vÃ  tráº£ response.
- [ ] Repository chá»‹u trÃ¡ch nhiá»‡m gá»i SQL.
- [ ] Service chá»©a business rules.
- [ ] Stored procedure chá»©a thao tÃ¡c DB á»•n Ä‘á»‹nh.
- [ ] Script cháº¡y Ä‘Æ°á»£c trÃªn SSMS Ä‘áº·t trong `database/`.

## Giai Äoáº¡n 5: Tá»‘i Æ¯u Kiosk

### Task 12: Bá» Runtime Debug Noise

**Files:**

- Sá»­a: `index.ts`

- [ ] Bá» hoáº·c gate log trong `camera-change`.
- [ ] Bá» debug dump lá»›n tá»± Ä‘á»™ng.
- [ ] Chá»‰ giá»¯ diagnostics sau flag debug rÃµ rÃ ng.

### Task 13: Giá»›i Háº¡n Model Streaming

**Files:**

- Sá»­a: `index.ts` hoáº·c module tÆ°Æ¡ng lai `src/map/modelStreaming.ts`

- [ ] Review `MAX_CONCURRENT_MODELS`.
- [ ] Chá»‰ load model liÃªn quan Ä‘áº¿n táº§ng vÃ  viewport hiá»‡n táº¡i.
- [ ] KhÃ´ng load asset backup.
- [ ] Äáº£m báº£o unload model khi Ä‘i xa hoáº·c Ä‘á»•i táº§ng.
- [ ] ThÃªm checklist smoke test thá»§ cÃ´ng cho Ä‘á»™ mÆ°á»£t kiosk.

### Task 14: TÃ¡ch Admin Polling Khá»i Viewer

**Files:**

- Sá»­a: `index.ts`

- [ ] Äáº£m báº£o public viewer khÃ´ng cháº¡y admin polling.
- [ ] Chá»‰ start admin polling sau khi Ä‘Ã£ auth admin.
- [ ] Logout thÃ¬ dá»«ng polling.

## Giai Äoáº¡n 6: Build VÃ  Test

### Task 15: Sá»­a Ranh Giá»›i Build Backend

**Files:**

- Sá»­a: `backend/tsconfig.json`

- [ ] Äáº£m báº£o subfolder nhÆ° `backend/flights/*.ts` hoáº·c tÆ°Æ¡ng lai `backend/src/**/*.ts` Ä‘Æ°á»£c compile.
- [ ] KhÃ´ng chá»‰ dá»±a vÃ o `transpile-only`.
- [ ] Cháº¡y backend build sau khi sá»­a.

### Task 16: Test Báº¯t Buá»™c Cho Auth

**Files:**

- Táº¡o test trong `backend/tests/` hoáº·c theo convention hiá»‡n cÃ³.

Test case báº¯t buá»™c:

- [ ] Public `GET /api/init-data` cháº¡y khÃ´ng cáº§n login.
- [ ] Public `GET /api/flights` cháº¡y khÃ´ng cáº§n login.
- [ ] Admin write API tráº£ 401 náº¿u khÃ´ng cÃ³ cookie.
- [ ] Login reject password sai.
- [ ] Login accept password Ä‘Ãºng vÃ  set httpOnly cookie.
- [ ] `/api/auth/me` tráº£ admin khi token há»£p lá»‡.
- [ ] Logout clear cookie.

### Task 17: Checklist Smoke Test End-To-End

Kiá»ƒm tra thá»§ cÃ´ng sau triá»ƒn khai:

- [ ] Má»Ÿ URL báº£n Ä‘á»“ bÃ¬nh thÆ°á»ng: khÃ´ng yÃªu cáº§u login.
- [ ] Báº£n Ä‘á»“ load á»Ÿ viewer mode.
- [ ] Search hoáº¡t Ä‘á»™ng.
- [ ] Chá»n táº§ng hoáº¡t Ä‘á»™ng.
- [ ] Modal thÃ´ng tin chuyáº¿n bay hoáº¡t Ä‘á»™ng.
- [ ] Chá»‰ Ä‘Æ°á»ng hoáº¡t Ä‘á»™ng.
- [ ] Admin tools áº©n trÆ°á»›c khi login.
- [ ] Admin login hoáº¡t Ä‘á»™ng.
- [ ] Admin save action hoáº¡t Ä‘á»™ng sau login.
- [ ] Admin save action fail sau logout.
- [ ] Browser console khÃ´ng spam log liÃªn tá»¥c khi xoay/zoom báº£n Ä‘á»“.

## Äiá»u Kiá»‡n HoÃ n ThÃ nh

Chá»‰ xem lÃ  hoÃ n thÃ nh khi:

- Public viewer váº«n lÃ  cháº¿ Ä‘á»™ máº·c Ä‘á»‹nh.
- Admin-only actions khÃ´ng truy cáº­p Ä‘Æ°á»£c náº¿u khÃ´ng cÃ³ JWT cookie há»£p lá»‡.
- KhÃ´ng thÃªm báº£ng admin/user vÃ o `MappedIn3DModels`.
- Secret khÃ´ng bá»‹ commit hoáº·c serve static.
- Static serving chá»‰ expose asset public Ä‘Æ°á»£c phÃ©p.
- Backend vÃ  frontend build pass.
- Auth tests pass.
- Kiosk smoke checklist pass.
- CÃ³ file implementation log cho phiÃªn sá»­a code.

## Batch Triá»ƒn Khai Äáº§u TiÃªn ÄÆ°á»£c Khuyáº¿n Nghá»‹

Khi ngÆ°á»i dÃ¹ng yÃªu cáº§u báº¯t Ä‘áº§u sá»­a code, khÃ´ng triá»ƒn khai táº¥t cáº£ trong má»™t láº§n. Batch Ä‘áº§u nÃªn gá»“m:

1. KhÃ³a static serving.
2. Validate environment vÃ  cleanup secret.
3. ThÃªm admin JWT login/logout/me.
4. Báº£o vá»‡ write/admin APIs.
5. ThÃªm UI login tá»‘i thiá»ƒu vÃ  startup auth check.
6. Viáº¿t implementation log.

Chá»‰ sau khi batch nÃ y á»•n Ä‘á»‹nh má»›i chuyá»ƒn sang refactor lá»›n hÆ¡n cho `server.ts`, `index.ts`, SQL repositories vÃ  tá»‘i Æ°u model streaming.

