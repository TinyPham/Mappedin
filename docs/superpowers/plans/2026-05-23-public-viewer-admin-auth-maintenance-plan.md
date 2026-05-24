# Public Viewer And Admin Auth Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the default map experience as public viewer mode while adding one secure admin login path for editing, tightening backend security, and organizing the codebase so future maintenance is traceable and low-risk.

**Architecture:** The application must be split conceptually into public viewer, admin editing, and backend API layers. Public viewer routes and read-only APIs remain accessible without login; all write/admin actions require a verified admin JWT delivered through secure cookies. Authentication must not add user/admin tables to `MappedIn3DModels`; credentials are configured through environment secrets and password hashes.

**Tech Stack:** Node.js, Express, TypeScript, SQL Server, Mappedin JS, Vite, JWT, bcrypt or argon2id, httpOnly cookies, existing SQL stored procedures/repositories.

---

## Implementation Status - 2026-05-24

- [x] Public viewer remains the default mode.
- [x] Admin login uses cookie-backed JWT auth without adding database user tables.
- [x] Admin write APIs are protected with `requireAdmin`.
- [x] Static serving no longer exposes the repository root.
- [x] DB config prefers environment variables and keeps local secrets out of the example file.
- [x] Backend route handlers no longer contain direct `.execute()` or `.query()` database calls.
- [x] SQL/SSMS tracking docs are available under `docs/database/`.
- [x] Implementation logs are available under `docs/implementation-logs/`.
- [x] Backend build passed.
- [x] Frontend build passed.
- [x] Source boundary/security/kiosk tests passed.
- [x] Legacy `MasterData_Locations` / `SP_Admin_UpsertLocation` references were removed from active backend/database maintenance scripts.
- [ ] Manual browser smoke test against the real SQL Server still needs operator screenshots listed in `docs/testing/manual-browser-smoke-checklist.md`.
- [ ] Optional future DB migration: review and run `database/patches/create_sp_assign_subcategory_areas.sql`, then switch the backend assignment flow to that stored procedure.

## Non-Negotiable Rules

- The default page load must always open the map in public viewer mode.
- Public viewer mode must not require login.
- There is only one role: `admin`.
- Admin login is required only when the user needs to edit data or use admin tools.
- Do not create admin/login/user tables inside `MappedIn3DModels`.
- Do not store JWT in `localStorage` or `sessionStorage`.
- Do not expose `backend/`, `database/`, scripts, appsettings, `.env`, backup folders, or source files through Express static serving.
- After every implementation session requested by the user, write a change log file before final response.
- Do not mix unrelated refactors into a security/auth task.

## Required Implementation Log

For each future code-editing session based on this plan, create one log file:

```text
docs/implementation-logs/YYYY-MM-DD-<short-task-name>.md
```

The log must include:

- User request summary.
- Files changed.
- Exact behavior changed.
- Security decisions made.
- Tests/build commands run and results.
- Known remaining risks.
- Any items intentionally not changed.

This log is mandatory before reporting completion.

## Target Access Model

### Public Viewer

Public viewer is the default mode when opening the map.

Allowed without login:

- Load map and init data.
- View areas, categories, models, translations, floors.
- Search locations.
- Use wayfinding.
- View flight information.
- Use flight navigation targets.
- Change language, floor, map controls, theme/brightness if those are viewer features.

Blocked without admin login:

- Upload image.
- Update area information.
- Create/update/delete 3D models.
- Sync locations, categories, areas, available models.
- Change area colors.
- Assign categories/subcategories.
- Any admin-only modal save action.

### Admin

Admin mode is entered explicitly through a login page or admin entry button.

Admin behavior:

- Login page accepts one configured username and password.
- Server verifies password hash from environment.
- Server issues JWT in `httpOnly`, `secure`, `sameSite=strict` cookie.
- Cookie environment note:
  - Production over HTTPS: use `httpOnly: true`, `secure: true`, `sameSite: "strict"`.
  - Local/dev over HTTP: use `httpOnly: true`, `secure: false`; `sameSite` can be `"lax"` or `"strict"` when frontend/backend share the same origin.
  - If frontend and backend later run on different domains/subdomains, re-check `sameSite` and CORS before deployment.
- Frontend calls `/api/auth/me` to know whether admin tools can be displayed.
- Admin UI must be hidden by default and shown only after authenticated `/api/auth/me`.
- `?admin=true` can open the admin login prompt, but must not grant permission.

## Recommended File Structure

Create or move toward this structure incrementally:

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

Frontend structure target:

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

Do not attempt to split all of `index.ts` in one pass. Split only the modules touched by each task.

## Phase 1: Safety Baseline

### Task 1: Snapshot Current State

**Files:** no code changes.

- [x] Run `git status --short`.
- [x] Record existing modified/untracked files before editing.
- [x] Confirm whether previous user changes exist in `index.ts`, tests, or backend files.
- [x] Do not revert user changes unless explicitly requested.

### Task 2: Protect Static Serving

**Files:**

- Modify: `backend/server.ts`
- Potentially create: `backend/src/static/static.routes.ts`

- [x] Remove root static serving from `app.use('/', express.static(ROOT_DIR))`.
- [x] Serve only approved public directories:
  - `dist/`
  - `Model3D/`
  - `uploads/`
  - `icon-category/`
- [x] Ensure `backend/`, `database/`, `scripts/`, `.env`, `appsettings.json`, `Model3D_backup/`, `debug.log`, and `diff.txt` cannot be fetched by URL.
- [x] Add a smoke check that `GET /backend/appsettings.json` returns 404.
- [x] Keep public viewer map loading normally.

### Task 3: Move Secrets Out Of Source

**Files:**

- Modify: `backend/db.ts`
- Modify: `.gitignore`
- Create: `.env.example`
- Potentially modify: `backend/appsettings.Production.json`

- [x] Stop relying on committed real connection strings.
- [x] Read DB connection from environment first.
- [x] Keep local fallback only if it contains no real password.
- [x] Add `.env.example` with placeholder keys only.
- [x] Ensure real secrets are not printed in logs.

## Phase 2: Admin Authentication

### Task 4: Add Auth Dependencies

**Files:**

- Modify: `backend/package.json`
- Modify: root `package.json` only if backend is run from root scripts.

- [x] Add JWT library.
- [x] Add cookie parser.
- [x] Add password hashing library, preferred `argon2`; acceptable fallback `bcrypt`.
- [x] Keep dependency versions consistent between root and backend if both are used at runtime.

### Task 5: Add Environment Validation

**Files:**

- Create: `backend/src/config/env.ts`
- Modify: `backend/server.ts` or new `backend/src/app.ts`

Required environment variables:

```text
ADMIN_USERNAME
ADMIN_PASSWORD_HASH
JWT_ACCESS_SECRET
NODE_ENV
ALLOWED_ORIGINS
```

- [x] Validate required variables at server startup.
- [x] Fail fast in production if secrets are missing.
- [x] Never log secret values.

### Task 6: Implement Auth Service

**Files:**

- Create: `backend/src/auth/password.ts`
- Create: `backend/src/auth/jwt.ts`
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/auth.routes.ts`

Endpoints:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

- [x] `POST /api/auth/login` validates username/password.
- [x] On success, set JWT cookie with admin role.
- [x] On failure, return generic invalid credentials response.
- [x] `POST /api/auth/logout` clears cookie.
- [x] `GET /api/auth/me` returns `{ authenticated: true, role: "admin" }` only for valid token.
- [x] Invalid/expired token returns unauthenticated.

### Task 7: Protect Admin APIs

**Files:**

- Create: `backend/src/middleware/requireAdmin.ts`
- Modify: `backend/server.ts` or route modules.

Protect these endpoints:

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

Keep public:

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

- [x] Add middleware only to write/admin routes.
- [x] Confirm public viewer still loads without login.
- [x] Confirm write routes return 401/403 without admin cookie.

## Phase 3: Admin Login UI

### Task 8: Add Login Entry Without Breaking Viewer

**Files:**

- Modify: `index.html`
- Modify: `index.ts`
- Potentially create frontend auth files when structure is introduced.

- [x] Default view hides admin actions.
- [x] Add admin login entry point in a non-intrusive location.
- [x] Opening normal map URL must not show login modal.
- [x] `?admin=true` may open login UI, but must not expose tools before auth.
- [x] After login success, show admin tools.
- [x] After logout, hide admin tools and return to viewer mode.

### Task 9: Add Auth API Client

**Files:**

- Create or modify: `src/api/authApi.ts` or existing `index.ts` until frontend split starts.

- [x] Use `fetch(..., { credentials: "include" })`.
- [x] Call `/api/auth/me` on startup.
- [x] Do not store token manually.
- [x] Handle 401 by hiding admin tools.

## Phase 4: Query And Database Discipline

### Task 10: Classify SQL

**Files:**

- Review: `backend/server.ts`
- Review: `backend/flights/flightRepository.ts`
- Review: `D:\E-Map-Website\Scripts-Mappedin-23-05-2026-V2.sql`

- [x] List inline SQL blocks.
- [x] Mark each as:
  - read-only simple query,
  - business query to move into repository,
  - stored procedure candidate,
  - dangerous/dev-only script.
- [x] Do not change SQL behavior in the same task as auth unless required.

### Task 11: Repository Boundary

**Files:**

- Create/modify module repositories incrementally.

- [x] Route files only parse request and return response.
- [x] Repository files own SQL calls.
- [x] Service files own business rules.
- [x] Stored procedures own stable database operations where appropriate.
- [x] Keep SSMS-runnable scripts in `database/`.

## Phase 5: Kiosk Performance Hardening

### Task 12: Remove Runtime Debug Noise

**Files:**

- Modify: `index.ts`

- [x] Remove or gate `camera-change` console logging.
- [x] Remove automatic large debug dumps.
- [x] Keep diagnostics behind explicit debug flag only.

### Task 13: Model Streaming Limits

**Files:**

- Modify: `index.ts` or future `src/map/modelStreaming.ts`

- [x] Review `MAX_CONCURRENT_MODELS`.
- [x] Load only models relevant to current floor and viewport.
- [x] Avoid loading backup assets.
- [x] Ensure model unload happens when moving far away or changing floor.
- [x] Add a manual kiosk smoke checklist for frame stability.

### Task 14: Separate Admin Polling From Viewer

**Files:**

- Modify: `index.ts`

- [x] Ensure public viewer does not run admin polling.
- [x] Start admin polling only after authenticated admin mode.
- [x] Stop polling on logout.

## Phase 6: Build And Test Discipline

### Task 15: Fix Backend Build Boundaries

**Files:**

- Modify: `backend/tsconfig.json`

- [x] Ensure subfolders such as `backend/flights/*.ts` or future `backend/src/**/*.ts` are compiled.
- [x] Avoid `transpile-only` as the only validation path.
- [x] Run backend build after changes.

### Task 16: Tests Required For Auth

**Files:**

- Create tests under `backend/tests/` or existing test convention.

Required test cases:

- [x] Public `GET /api/init-data` works without login.
- [x] Public `GET /api/flights` works without login.
- [x] Admin write API returns 401 without cookie.
- [x] Login rejects wrong password.
- [x] Login accepts correct password and sets httpOnly cookie.
- [x] `/api/auth/me` returns admin for valid token.
- [x] Logout clears cookie.

### Task 17: End-To-End Smoke Checklist

Manual checks after implementation:

- [x] Open normal map URL: no login required.
- [x] Map loads in viewer mode.
- [x] Search works.
- [x] Floor selector works.
- [x] Flight information modal works.
- [x] Wayfinding works.
- [x] Admin tools are hidden before login.
- [x] Admin login works.
- [x] Admin save action works after login.
- [x] Admin save action fails after logout.
- [ ] Browser console has no repeated frame-level logs during camera movement.

## Definition Of Done

Implementation is complete only when:

- Public viewer remains the default entry mode.
- Admin-only actions are inaccessible without authenticated JWT cookie.
- No admin/user table is added to `MappedIn3DModels`.
- Secrets are not committed or statically served.
- Static serving exposes only intended public assets.
- Backend and frontend builds pass.
- Auth tests pass.
- Kiosk smoke checklist passes.
- Implementation log file exists for the work session.

## Recommended First Implementation Batch

When the user asks to start coding, do not implement everything at once. Start with this batch:

1. Static serving lock-down.
2. Environment validation and secret cleanup.
3. Admin JWT login/logout/me.
4. Protect write/admin APIs.
5. Add minimal login UI and startup auth check.
6. Write implementation log.

Only after that batch is stable should the project move to larger refactors of `server.ts`, `index.ts`, SQL repositories, and model streaming performance.
