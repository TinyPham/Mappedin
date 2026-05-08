# Flight Map Overlay Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a TSN-style flight information modal overlay that reads flight data from `LongThanhFlightBK` via stored procedures, resolves map targets for gate/check-in/belt, and routes users through the existing map navigation flow.

**Architecture:** Backend exposes stable flight APIs backed only by stored procedures on `LongThanhFlightBK`. Frontend opens a new modal overlay from a map-level flight-info button, loads departure/arrival flights, and uses resolved navigation targets to trigger existing route behavior. Check-in routing expands `CheckInCounterSpec` and chooses one random valid counter target at click time.

**Tech Stack:** TypeScript, Express, SQL Server stored procedures, existing Mappedin map runtime, existing frontend translation system, existing Vite/browser app structure.

---

## File Structure

### Existing files to modify

- `backend/server.ts`
  - Add flight API routes.
  - Wire routes to stored procedure execution only.
- `index.ts`
  - Add flight modal state, data loading, rendering, and navigation button handlers.
  - Add map overlay button behavior to open the modal.
  - Reuse existing wayfinding/destination flow.
- `index.html`
  - Add modal overlay container markup if the current app pattern benefits from static markup hooks.
- `styles.css`
  - Add desktop modal overlay styles matching TSN layout.
- `responsive.css`
  - Add modal/mobile adjustments if needed.

### New backend files

- `backend/config/flight-source-mapping.json`
  - Keep future field mapping config even though current source is stable.
- `backend/flights/checkInCounterSpec.ts`
  - Parse and normalize `CheckInCounterSpec`.
- `backend/flights/checkInCounterSpec.test.ts`
  - Unit tests for parsing and expansion.
- `backend/flights/flightModels.ts`
  - Shared backend flight types.
- `backend/flights/flightRepository.ts`
  - Stored procedure execution wrapper for flight data access.
- `backend/flights/flightRepository.test.ts`
  - Repository-level tests or result-shape tests where practical.
- `backend/flights/flightNavigationResolver.ts`
  - Resolve gate/check-in/belt against current map area data.
- `backend/flights/flightNavigationResolver.test.ts`
  - Unit tests for resolver logic.
- `backend/flights/flightPresenter.ts`
  - Build UI-friendly status and button state from stored procedure data.
- `backend/flights/flightPresenter.test.ts`
  - Unit tests for status presentation rules.

### Optional new frontend helper files

- `types/flights.ts`
  - Shared frontend flight API types if keeping `index.ts` smaller helps.

## Stored Procedure Contract

These must exist in SQL Server and backend must only call them:

- `dbo.SP_GetFlights`
- `dbo.SP_GetFlightNavigationTargets`

Potential additions if needed after first backend pass:

- `dbo.SP_GetFlightStatusOptions`
- `dbo.SP_GetFlightCardDetail`

No inline SQL queries in application code.

## Task 1: Define backend flight types and counter-spec parser

**Files:**
- Create: `backend/flights/flightModels.ts`
- Create: `backend/flights/checkInCounterSpec.ts`
- Create: `backend/flights/checkInCounterSpec.test.ts`

- [ ] **Step 1: Write the failing tests for `CheckInCounterSpec` parsing**

Create tests covering:
- `12` -> `[12]`
- `5-8` -> `[5, 6, 7, 8]`
- `1,4-7` -> `[1, 4, 5, 6, 7]`
- duplicate suppression
- invalid token handling

- [ ] **Step 2: Run the parser tests to verify they fail**

Run: `node --test backend/flights/checkInCounterSpec.test.ts`
Expected: FAIL because parser module does not exist yet.

- [ ] **Step 3: Write minimal parser implementation**

Implement:
- type definitions
- parser
- expander
- random counter selector helper

- [ ] **Step 4: Run parser tests to verify they pass**

Run: `node --test backend/flights/checkInCounterSpec.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/flights/checkInCounterSpec.ts backend/flights/checkInCounterSpec.test.ts backend/flights/flightModels.ts
git commit -m "feat: add flight check-in counter parsing"
```

## Task 2: Add backend repository that executes flight stored procedures

**Files:**
- Create: `backend/flights/flightRepository.ts`
- Create: `backend/flights/flightRepository.test.ts`
- Modify: `backend/server.ts`

- [ ] **Step 1: Write the failing repository tests**

Test behaviors:
- requests call `SP_GetFlights`
- requests call `SP_GetFlightNavigationTargets`
- no inline query text appears in repository execution path

- [ ] **Step 2: Run repository tests to verify they fail**

Run: `node --test backend/flights/flightRepository.test.ts`
Expected: FAIL because repository does not exist yet.

- [ ] **Step 3: Implement minimal stored-procedure-only repository**

Repository methods:
- `getFlights(params)`
- `getFlightNavigationTargets(flightId)`

Use existing DB connection helper in backend.

- [ ] **Step 4: Run repository tests to verify they pass**

Run: `node --test backend/flights/flightRepository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/flights/flightRepository.ts backend/flights/flightRepository.test.ts backend/server.ts
git commit -m "feat: add stored procedure flight repository"
```

## Task 3: Resolve flight navigation targets against map area data

**Files:**
- Create: `backend/flights/flightNavigationResolver.ts`
- Create: `backend/flights/flightNavigationResolver.test.ts`

- [ ] **Step 1: Write the failing resolver tests**

Cover:
- gate resolution by gate number
- belt resolution by belt number
- check-in resolution by island plus expanded counter numbers
- random check-in target selection from multiple counters
- missing target handling

- [ ] **Step 2: Run resolver tests to verify they fail**

Run: `node --test backend/flights/flightNavigationResolver.test.ts`
Expected: FAIL because resolver does not exist yet.

- [ ] **Step 3: Implement minimal resolver**

Resolver inputs:
- canonical flight data
- area metadata already available to backend or a sourced map metadata payload

Resolver outputs:
- `gateTarget`
- `checkInTargets`
- `randomCheckInTarget`
- `beltTarget`
- availability booleans

- [ ] **Step 4: Run resolver tests to verify they pass**

Run: `node --test backend/flights/flightNavigationResolver.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/flights/flightNavigationResolver.ts backend/flights/flightNavigationResolver.test.ts
git commit -m "feat: resolve flight navigation targets"
```

## Task 4: Add backend presenter for TSN-style flight card state

**Files:**
- Create: `backend/flights/flightPresenter.ts`
- Create: `backend/flights/flightPresenter.test.ts`

- [ ] **Step 1: Write the failing presenter tests**

Cover:
- departure card with gate and check-in enabled
- arrival card with belt enabled
- disabled buttons when no target exists
- status chip and message derivation from current fields

- [ ] **Step 2: Run presenter tests to verify they fail**

Run: `node --test backend/flights/flightPresenter.test.ts`
Expected: FAIL because presenter does not exist yet.

- [ ] **Step 3: Implement minimal presenter**

Return UI-facing fields:
- status badge label
- status tone
- summary message
- button enabled flags

- [ ] **Step 4: Run presenter tests to verify they pass**

Run: `node --test backend/flights/flightPresenter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/flights/flightPresenter.ts backend/flights/flightPresenter.test.ts
git commit -m "feat: add flight card presentation rules"
```

## Task 5: Expose flight API routes in backend

**Files:**
- Modify: `backend/server.ts`
- Modify: `backend/flights/flightRepository.ts`
- Modify: `backend/flights/flightNavigationResolver.ts`
- Modify: `backend/flights/flightPresenter.ts`

- [ ] **Step 1: Write failing endpoint tests**

Cover:
- `GET /api/flights`
- `GET /api/flights/:id/navigation-targets`
- response shape required by frontend

- [ ] **Step 2: Run endpoint tests to verify they fail**

Run: `node --test backend/flights/flightRepository.test.ts backend/flights/flightNavigationResolver.test.ts backend/flights/flightPresenter.test.ts`
Expected: FAIL or incomplete coverage before route implementation.

- [ ] **Step 3: Implement backend routes**

Requirements:
- use stored procedures only
- validate params
- call repository
- pass results through presenter/resolver
- return JSON contract for frontend

- [ ] **Step 4: Run backend tests to verify they pass**

Run: `node --test backend/flights/checkInCounterSpec.test.ts backend/flights/flightRepository.test.ts backend/flights/flightNavigationResolver.test.ts backend/flights/flightPresenter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/server.ts backend/flights
git commit -m "feat: add flight API endpoints"
```

## Task 6: Add flight-info entry button and modal state in frontend

**Files:**
- Modify: `index.ts`
- Modify: `index.html`

- [ ] **Step 1: Write the failing frontend interaction test or smoke spec**

Define expected behavior:
- flight-info button appears on map
- click opens overlay
- close action hides overlay

- [ ] **Step 2: Run the interaction check to verify it fails**

Run the existing smoke or a new targeted frontend test harness once created.
Expected: FAIL because overlay/button behavior does not exist yet.

- [ ] **Step 3: Implement minimal overlay state and trigger**

Add:
- map overlay button/icon
- modal open/close state
- basic loading state inside modal

- [ ] **Step 4: Run the interaction check to verify it passes**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add index.ts index.html
git commit -m "feat: add flight overlay entry point"
```

## Task 7: Render TSN-style modal layout and flight list UI

**Files:**
- Modify: `index.ts`
- Modify: `styles.css`
- Modify: `responsive.css`
- Optional create: `types/flights.ts`

- [ ] **Step 1: Write the failing UI-state test or render assertions**

Cover:
- departure/arrival tabs
- date filter
- search box
- status filter
- flight cards render returned API data

- [ ] **Step 2: Run UI tests/checks to verify they fail**

Expected: FAIL because modal body is not implemented yet.

- [ ] **Step 3: Implement modal layout**

Requirements:
- TSN-like left filter column
- right scrollable results column
- card badges for gate/check-in/belt
- status badge and message area

- [ ] **Step 4: Run UI tests/checks to verify they pass**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add index.ts styles.css responsive.css types/flights.ts
git commit -m "feat: add flight modal layout"
```

## Task 8: Hook buttons into existing map navigation flow

**Files:**
- Modify: `index.ts`
- Modify: `backend/server.ts` only if response shape needs a small adjustment

- [ ] **Step 1: Write the failing navigation interaction test**

Cover:
- `Đến gate` triggers route to gate target
- `Đến check-in` picks one random counter from `CheckInCounterSpec`
- `Đến băng chuyền` triggers route to belt
- disabled button does nothing

- [ ] **Step 2: Run the navigation interaction check to verify it fails**

Expected: FAIL because buttons are not wired yet.

- [ ] **Step 3: Implement minimal navigation integration**

Use existing wayfinding logic in `index.ts`:
- fetch navigation target payload
- choose the proper target
- call current destination/route handlers

- [ ] **Step 4: Run the navigation interaction check to verify it passes**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add index.ts backend/server.ts
git commit -m "feat: connect flight buttons to map routing"
```

## Task 9: Add localization wiring for modal UI

**Files:**
- Modify: `index.ts`
- Modify: translation source files if this app stores UI copy centrally

- [ ] **Step 1: Write failing checks for translated modal UI**

Cover:
- modal title
- tabs
- date/search labels
- action button labels
- status filter label

- [ ] **Step 2: Run localization checks to verify they fail**

Expected: FAIL because new keys do not exist yet.

- [ ] **Step 3: Implement translation wiring**

Rules:
- UI text from existing translation system
- gate/check-in/belt labels from resolved map area data, not from flight DB

- [ ] **Step 4: Run localization checks to verify they pass**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add index.ts
git commit -m "feat: localize flight overlay UI"
```

## Task 10: Full verification

**Files:**
- Modify as needed from prior tasks

- [ ] **Step 1: Run backend tests**

Run:
`node --test backend/flights/checkInCounterSpec.test.ts backend/flights/flightRepository.test.ts backend/flights/flightNavigationResolver.test.ts backend/flights/flightPresenter.test.ts`

Expected: PASS

- [ ] **Step 2: Run project build**

Run:
`npm run build`

Expected: PASS

- [ ] **Step 3: Run backend build if applicable**

Run backend build command already used in this repo if present.
Expected: PASS

- [ ] **Step 4: Manually verify**

Check:
- flight button opens modal
- departure list loads from `LongThanhFlightBK`
- arrival list loads
- date/search/status interactions work
- route buttons behave correctly
- random check-in route chooses one counter from expanded spec

- [ ] **Step 5: Commit final integration**

```bash
git add .
git commit -m "feat: add flight map overlay"
```

