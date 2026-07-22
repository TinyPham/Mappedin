# Kiosk Default Origin Configuration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a configurable kiosk mode so the same map works on the public website with user-selected origins and on airport kiosks with a default origin tied to each physical kiosk.

**Architecture:** Keep one frontend and one backend. Website mode remains unchanged when the URL has no kiosk parameters. Kiosk mode is activated by `?mode=kiosk&kioskId=...`; the frontend loads a kiosk config from the backend, resolves it to either a Mappedin object or a virtual coordinate origin, and uses that origin for route creation. Admin-only APIs and UI allow configuring each kiosk without rebuilding the app.

**Tech Stack:** SQL Server, Node.js/Express, TypeScript, Vite, Mappedin JS, plain Node/assert tests.

---

## Current Findings

- The current SQL dump is `D:\E-Map-Website\Mappedin3DModels-07-07-2026.sql`.
- The dump creates database `MappedIn3DModels`.
- Existing map tables include `AreaList`, `AreaInformation`, `AreaCategory`, `Categories`, `SubCategories`, `Translation_Floors`, `Models3D`, `AvailableModels`, and flight mapping tables.
- Existing flight mapping tables map airport concepts to Mappedin targets:
  - `FlightGateNavigationMap`
  - `FlightBeltNavigationMap`
  - `FlightCheckInCounterNavigationMap`
- Existing `Models3D` rows include several kiosk 3D models, but these represent placed 3D objects only. They should not be used as the source of truth for physical kiosk device configuration.
- The database does not currently contain a `KioskDevices` or equivalent table.
- Frontend routing currently uses `wayfindingOrigin` and `wayfindingDestination` in `main/main-function/index.ts`.
- The current route drawing code can work with an object that has `coordinate`, so kiosk coordinate origins can be represented as virtual origin objects if needed.

## File Structure

- Create: `database/patches/2026-07-07-kiosk-devices.sql`
  - Adds the `dbo.KioskDevices` table and constraints.
- Create: `backend/kiosks/kioskTypes.ts`
  - Shared backend types for kiosk config rows and API payloads.
- Create: `backend/kiosks/kioskValidation.ts`
  - Validates `kioskId`, origin type, coordinates, floor, heading, and zoom.
- Create: `backend/kiosks/kioskRepository.ts`
  - Reads and writes kiosk configuration using parameterized SQL.
- Create: `backend/kiosks/kioskValidation.test.ts`
  - Unit tests for validation and payload normalization.
- Modify: `backend/server.ts`
  - Adds public read route and admin write/list routes.
- Create: `src/kiosk/kioskMode.js`
  - Pure frontend helpers for URL parsing and virtual origin creation.
- Create: `tests/kioskMode.test.mjs`
  - Unit tests for kiosk mode helpers.
- Modify: `main/main-function/index.ts`
  - Loads kiosk config in kiosk mode, resolves default origin, and uses it for navigation.
- Modify: `main/html/index.html`
  - Adds minimal admin modal/tab markup only if the existing admin UI requires static HTML.
- Optional Modify: `main/css/styles.css`
  - Adds restrained styles for kiosk admin controls if needed.
- Modify: `docs/database/ssms-run-list.md`
  - Documents the new DB patch.

---

### Task 1: Add Database Table For Physical Kiosks

**Files:**
- Create: `database/patches/2026-07-07-kiosk-devices.sql`

- [ ] **Step 1: Create SQL patch**

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

- [ ] **Step 2: Run patch in SSMS**

Run the patch against `MappedIn3DModels`.

Expected:
- Table `dbo.KioskDevices` exists.
- Primary key is `KioskId`.
- Bad coordinate values are rejected by constraints.

- [ ] **Step 3: Seed one test kiosk manually**

```sql
MERGE dbo.KioskDevices AS target
USING (
    SELECT
        N'LT-KIOSK-01' AS KioskId,
        N'Kiosk Test 01' AS DisplayName,
        N'coordinate' AS OriginType,
        N'm_1523f7dcde647c40' AS FloorId,
        CAST(10.7731180000 AS DECIMAL(18, 10)) AS Latitude,
        CAST(107.0403540000 AS DECIMAL(18, 10)) AS Longitude
) AS source
ON target.KioskId = source.KioskId
WHEN MATCHED THEN
    UPDATE SET
        DisplayName = source.DisplayName,
        OriginType = source.OriginType,
        FloorId = source.FloorId,
        Latitude = source.Latitude,
        Longitude = source.Longitude,
        UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT (KioskId, DisplayName, OriginType, FloorId, Latitude, Longitude)
    VALUES (source.KioskId, source.DisplayName, source.OriginType, source.FloorId, source.Latitude, source.Longitude);
```

- [ ] **Step 4: Commit**

```bash
git add database/patches/2026-07-07-kiosk-devices.sql docs/database/ssms-run-list.md
git commit -m "db: add kiosk device configuration table"
```

---

### Task 2: Add Backend Validation And Repository

**Files:**
- Create: `backend/kiosks/kioskTypes.ts`
- Create: `backend/kiosks/kioskValidation.ts`
- Create: `backend/kiosks/kioskRepository.ts`
- Create: `backend/kiosks/kioskValidation.test.ts`

- [ ] **Step 1: Write failing validation tests**

```ts
import assert from 'node:assert/strict';
import { parseKioskConfigPayload, normalizeKioskId } from './kioskValidation';

assert.equal(normalizeKioskId(' lt-kiosk-01 '), 'LT-KIOSK-01');

assert.deepEqual(parseKioskConfigPayload({
  kioskId: 'lt-kiosk-01',
  displayName: 'Main Entrance',
  originType: 'coordinate',
  floorId: 'm_1523f7dcde647c40',
  latitude: 10.773118,
  longitude: 107.040354
}).kioskId, 'LT-KIOSK-01');

assert.throws(() => parseKioskConfigPayload({
  kioskId: 'bad id with spaces',
  displayName: 'Invalid',
  originType: 'coordinate',
  floorId: 'f_1',
  latitude: 10,
  longitude: 106
}), /Invalid kioskId/);

assert.throws(() => parseKioskConfigPayload({
  kioskId: 'LT-KIOSK-01',
  displayName: 'Invalid',
  originType: 'coordinate',
  floorId: 'f_1',
  latitude: 200,
  longitude: 106
}), /latitude/i);

console.log('kioskValidation tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx ts-node backend/kiosks/kioskValidation.test.ts
```

Expected: FAIL because files/functions do not exist yet.

- [ ] **Step 3: Implement backend types**

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

- [ ] **Step 4: Implement validation**

Rules:
- `kioskId` is required and normalized to uppercase.
- Allowed ID characters: letters, numbers, underscore, dash.
- `originType` must be `mappedinObject` or `coordinate`.
- `mappedinObject` requires `originMappedinId`.
- `coordinate` requires `floorId`, `latitude`, `longitude`.
- Latitude range: `-90..90`.
- Longitude range: `-180..180`.

- [ ] **Step 5: Implement repository**

Functions:
- `getKioskConfig(db, kioskId)`
- `listKioskConfigs(db)`
- `upsertKioskConfig(db, sql, payload, updatedBy)`

Use parameterized SQL. Do not concatenate user values.

- [ ] **Step 6: Run validation test**

```bash
npx ts-node backend/kiosks/kioskValidation.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/kiosks
git commit -m "feat: add kiosk config backend repository"
```

---

### Task 3: Add Backend API Routes

**Files:**
- Modify: `backend/server.ts`

- [ ] **Step 1: Write route contract manually**

Public route:

```text
GET /api/kiosks/:kioskId/config
```

Admin routes:

```text
GET /api/admin/kiosks
PUT /api/admin/kiosks/:kioskId
```

- [ ] **Step 2: Add imports**

```ts
import {
  getKioskConfig,
  listKioskConfigs,
  upsertKioskConfig
} from './kiosks/kioskRepository';
import { parseKioskConfigPayload, normalizeKioskId } from './kiosks/kioskValidation';
```

- [ ] **Step 3: Add public read route**

Behavior:
- Return `400` for invalid kiosk ID.
- Return `404` if not found or inactive.
- Return config JSON if found.

- [ ] **Step 4: Add admin list route**

Behavior:
- Protected by `requireAdmin`.
- Returns all kiosk configs, active and inactive.

- [ ] **Step 5: Add admin upsert route**

Behavior:
- Protected by `requireAdmin`.
- Path `kioskId` wins over body `kioskId`.
- Validates payload.
- Saves config.
- Returns saved config.

- [ ] **Step 6: Run backend build**

```bash
cd backend
npm run build
```

Expected: TypeScript build passes.

- [ ] **Step 7: Manual API smoke**

Run backend, then:

```bash
curl http://localhost:3002/api/kiosks/LT-KIOSK-01/config
```

Expected: JSON config for `LT-KIOSK-01`.

- [ ] **Step 8: Commit**

```bash
git add backend/server.ts backend/kiosks
git commit -m "feat: expose kiosk configuration APIs"
```

---

### Task 4: Add Frontend Kiosk Mode Helpers

**Files:**
- Create: `src/kiosk/kioskMode.js`
- Create: `tests/kioskMode.test.mjs`

- [ ] **Step 1: Write failing tests**

```js
import assert from 'node:assert/strict';
import {
  parseKioskModeFromUrl,
  createKioskCoordinateOrigin
} from '../src/kiosk/kioskMode.js';

assert.deepEqual(
  parseKioskModeFromUrl('https://example.com/map?mode=kiosk&kioskId=lt-kiosk-01'),
  { isKioskMode: true, kioskId: 'LT-KIOSK-01' }
);

assert.equal(
  parseKioskModeFromUrl('https://example.com/map').isKioskMode,
  false
);

const origin = createKioskCoordinateOrigin({
  kioskId: 'LT-KIOSK-01',
  displayName: 'Main Entrance',
  floorId: 'f_1',
  latitude: 10.1,
  longitude: 106.1
});

assert.equal(origin.id, 'kiosk:LT-KIOSK-01');
assert.equal(origin.coordinate.floorId, 'f_1');

console.log('kioskMode tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node tests/kioskMode.test.mjs
```

Expected: FAIL because helper file does not exist yet.

- [ ] **Step 3: Implement helpers**

Functions:
- `parseKioskModeFromUrl(url)`
- `createKioskCoordinateOrigin(config)`
- `isKioskConfigActive(config)`

- [ ] **Step 4: Run tests**

```bash
node tests/kioskMode.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/kiosk/kioskMode.js tests/kioskMode.test.mjs
git commit -m "feat: add kiosk mode frontend helpers"
```

---

### Task 5: Load Kiosk Origin In Map Runtime

**Files:**
- Modify: `main/main-function/index.ts`

- [ ] **Step 1: Add imports**

```ts
import {
  parseKioskModeFromUrl,
  createKioskCoordinateOrigin
} from "../../src/kiosk/kioskMode.js";
```

- [ ] **Step 2: Add runtime state near wayfinding variables**

Current area:

```ts
let wayfindingOrigin: any = null;
let wayfindingDestination: any = null;
```

Add:

```ts
let kioskModeState: {
  isKioskMode: boolean;
  kioskId: string | null;
  config: any | null;
  origin: any | null;
} = {
  isKioskMode: false,
  kioskId: null,
  config: null,
  origin: null
};
```

- [ ] **Step 3: Add loader**

Behavior:
- Parse current URL.
- If not kiosk mode, do nothing.
- Fetch `/api/kiosks/:kioskId/config`.
- If `originType === 'mappedinObject'`, resolve with existing `findObjectByMappedinId`.
- If `originType === 'coordinate'`, create virtual origin.
- Set `wayfindingOrigin` to the resolved origin.
- Update wayfinding UI.
- Show a non-blocking error if config cannot be loaded.

- [ ] **Step 4: Preserve website mode**

Ensure:
- No `mode=kiosk`: `wayfindingOrigin` remains user-controlled.
- User can still choose both origin and destination.

- [ ] **Step 5: Lock kiosk origin**

In kiosk mode:
- Do not clear `wayfindingOrigin` during normal reset.
- If user presses swap, either disable swap or keep kiosk origin as origin.
- If user clicks "set origin", ignore it or show a short message.
- Destination selection remains normal.

- [ ] **Step 6: Adapt flight navigation**

Existing flight logic has `routeBetweenObjects(originObj, destinationObj)`.

Add:

```ts
const routeFromKioskOrCurrentOriginTo = async (destinationObj: any) => {
  if (kioskModeState.isKioskMode && kioskModeState.origin) {
    return routeBetweenObjects(kioskModeState.origin, destinationObj);
  }
  return navigateToDestinationFromCurrentContext(destinationObj);
};
```

Use this for gate, belt, and check-in navigation when the action starts from a kiosk.

- [ ] **Step 7: Manual smoke**

Run:

```bash
npx vite --host 0.0.0.0 --port 3001
```

Open:

```text
http://localhost:3001/main/html/index.html
http://localhost:3001/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-01
```

Expected:
- Normal URL: origin is not forced.
- Kiosk URL: origin is loaded automatically.

- [ ] **Step 8: Commit**

```bash
git add main/main-function/index.ts
git commit -m "feat: apply kiosk default origin in map runtime"
```

---

### Task 6: Add Admin Configuration UI

**Files:**
- Modify: `main/main-function/index.ts`
- Modify if needed: `main/html/index.html`
- Modify if needed: `main/css/styles.css`

- [ ] **Step 1: Define admin controls**

Admin UI must allow:
- Select/create kiosk ID.
- Set display name.
- Toggle active.
- Choose origin type:
  - `mappedinObject`
  - `coordinate`
- Use selected map object as origin.
- Click map to capture coordinate origin.
- Enter/edit floor ID, latitude, longitude manually.
- Save.
- Preview route from kiosk to selected destination.

- [ ] **Step 2: Add API calls**

Use existing `getApiBaseUrl()`.

```ts
GET `${apiBase}/admin/kiosks`
PUT `${apiBase}/admin/kiosks/${kioskId}`
```

Credentials must be included because admin auth uses cookies:

```ts
fetch(url, {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

- [ ] **Step 3: Add map-pick mode**

Behavior:
- Admin clicks "Pick coordinate on map".
- Next map click captures `event.coordinate`.
- Fill `latitude`, `longitude`, `floorId`.
- Do not save until admin clicks Save.

- [ ] **Step 4: Add object-pick mode**

Behavior:
- Admin selects/clicks an existing object.
- UI fills `OriginMappedinID`.
- This is preferred over raw coordinate if available.

- [ ] **Step 5: Save and reload config**

After saving:
- Show success state.
- Refresh kiosk list.
- If current URL kiosk ID matches saved kiosk, reload active kiosk origin.

- [ ] **Step 6: Manual admin smoke**

Open:

```text
http://localhost:3001/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-01
```

Login admin.

Expected:
- Admin can update kiosk origin.
- Public kiosk mode uses updated origin after refresh.

- [ ] **Step 7: Commit**

```bash
git add main/main-function/index.ts main/html/index.html main/css/styles.css
git commit -m "feat: add kiosk origin admin controls"
```

---

### Task 7: Add Kiosk UX Rules

**Files:**
- Modify: `main/main-function/index.ts`
- Modify if needed: `main/css/styles.css`

- [ ] **Step 1: Add kiosk UI behavior**

In kiosk mode:
- Hide or de-emphasize manual origin field.
- Label origin as "You are here" or "Kiosk location".
- Keep destination search prominent.
- Reset destination after inactivity timeout.
- Preserve kiosk origin after reset.

- [ ] **Step 2: Add error state**

If kiosk config is missing:
- Show clear admin-facing message:

```text
Kiosk LT-KIOSK-01 is not configured. Please sign in as admin and set its default origin.
```

- Public users should still be able to use website mode if URL is corrected.

- [ ] **Step 3: Add reload behavior**

If API/network fails:
- Show temporary connection error.
- Retry kiosk config load after a short delay.
- Do not crash the map.

- [ ] **Step 4: Manual kiosk smoke**

Expected:
- Opening kiosk URL loads origin.
- Searching a destination draws route from kiosk origin.
- Reset returns to kiosk home state.
- Website URL is unaffected.

- [ ] **Step 5: Commit**

```bash
git add main/main-function/index.ts main/css/styles.css
git commit -m "feat: harden kiosk runtime behavior"
```

---

### Task 8: Verification And Documentation

**Files:**
- Modify: `docs/database/ssms-run-list.md`
- Create or Modify: `docs/testing/manual-browser-smoke-checklist.md`

- [ ] **Step 1: Run backend tests**

```bash
npx ts-node backend/kiosks/kioskValidation.test.ts
npx ts-node backend/flights/flightRepository.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run frontend helper tests**

```bash
node tests/kioskMode.test.mjs
```

Expected: PASS.

- [ ] **Step 3: Run backend build**

```bash
cd backend
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run frontend build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Run manual browser checks**

Check these URLs:

```text
http://localhost:3001/main/html/index.html
http://localhost:3001/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-01
http://localhost:3001/main/html/index.html?mode=kiosk&kioskId=UNKNOWN
```

Expected:
- Website mode: user controls origin.
- Valid kiosk mode: default origin is applied.
- Unknown kiosk: clear config error, no crash.

- [ ] **Step 6: Document deployment URLs**

Recommended production URLs:

```text
Website:
https://map.your-domain.com/main/html/index.html

Kiosk 01:
https://map.your-domain.com/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-01

Kiosk 02:
https://map.your-domain.com/main/html/index.html?mode=kiosk&kioskId=LT-KIOSK-02
```

- [ ] **Step 7: Commit**

```bash
git add docs/database/ssms-run-list.md docs/testing/manual-browser-smoke-checklist.md
git commit -m "docs: document kiosk configuration rollout"
```

---

## Rollout Order

1. Apply database patch in local SQL Server.
2. Add backend validation/repository.
3. Add backend routes.
4. Add frontend helper tests.
5. Add runtime kiosk config loading.
6. Add admin configuration UI.
7. Add kiosk UX hardening.
8. Run full verification.
9. Configure real kiosk URLs in Windows Assigned Access.

## Risks And Controls

- **Risk:** A raw coordinate is not connected to the Mappedin wayfinding graph.
  - **Control:** Prefer `mappedinObject` origin when possible and add preview route validation before saving.
- **Risk:** Kiosk URL has unknown `kioskId`.
  - **Control:** Show a clear configuration error and admin login option.
- **Risk:** Website mode accidentally changes.
  - **Control:** Kiosk logic runs only when `mode=kiosk` and `kioskId` are present.
- **Risk:** Admin accidentally moves a kiosk origin to the wrong floor.
  - **Control:** Save `floorId`, show floor name if available, and require preview route test.
- **Risk:** Public users access admin write APIs.
  - **Control:** All write/list admin APIs use existing `requireAdmin`; only read config by kiosk ID is public.

## Acceptance Criteria

- Website URL still allows users to choose origin and destination manually.
- Kiosk URL automatically sets origin from `KioskDevices`.
- Each physical kiosk can have a different origin without code changes.
- Admin can update a kiosk origin from the map UI.
- Backend rejects invalid kiosk configs.
- Builds and targeted tests pass.
