# Complete Public Viewer Admin Auth Maintenance Log

Date: 2026-05-23

## User Request Summary

Implement the full public viewer/admin auth maintenance plan, keep the map in
public viewer mode by default, require admin login only for editing/admin
actions, avoid adding admin/user tables to `MappedIn3DModels`, improve
security/maintainability, and record all implementation changes in a log file.

## Files Changed

- `.gitignore`
- `.env.example`
- `backend/auth/index.ts`
- `backend/auth/auth.test.ts`
- `backend/auth/generate-password-hash.ts`
- `backend/db.ts`
- `backend/package.json`
- `backend/server.ts`
- `backend/tsconfig.json`
- `backend/uploads.ts`
- `backend/uploads.test.ts`
- `docs/database/sql-inline-classification.md`
- `docs/implementation-logs/2026-05-23-admin-auth-hardening.md`
- `docs/implementation-logs/2026-05-23-complete-public-viewer-admin-auth-maintenance.md`
- `docs/superpowers/plans/2026-05-23-ke-hoach-public-viewer-admin-auth-maintenance.md`
- `docs/superpowers/plans/2026-05-23-public-viewer-admin-auth-maintenance-plan.md`
- `index.ts`
- `tests/adminAuthUiSource.test.mjs`
- `tests/backendConfigSource.test.mjs`
- `tests/backendRouteStructureSource.test.mjs`
- `tests/backendSecuritySource.test.mjs`
- `tests/backendUploadSource.test.mjs`
- `tests/kioskPerformanceSource.test.mjs`

## Behavior Changed

- Public viewer is the default page mode.
- `?admin=true` opens admin login only; it does not grant permission.
- Admin tools are hidden until `/api/auth/me` confirms a valid admin cookie.
- Login/logout/me auth routes were added:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Admin logout UI was added; logout clears client admin state and stops admin
  polling.
- Admin polling no longer runs in public viewer mode. It starts only after admin
  auth succeeds.
- Write/admin APIs are protected by `requireAdmin`.
- Public read APIs remain public.
- Root repository static serving was removed. Only intended public assets are
  exposed.
- Upload handling now validates image data URLs, limits payload size, sanitizes
  filenames, and writes files asynchronously with exclusive create mode.
- Duplicate `/api/available-models` route was removed.
- Runtime debug logs for available-model database rows were removed.
- High-frequency camera debug logging and automatic large map dumps were removed
  from normal viewer runtime.
- Model streaming concurrent cap was reduced for kiosk safety.
- SQL inline usage was classified in documentation without changing database
  behavior.
- Backend TypeScript build now includes nested folders.

## Security Decisions

- JWT is stored in an `httpOnly` cookie.
- Production cookie mode uses `secure: true` and `sameSite: "strict"`.
- Local HTTP development uses `secure: false` and `sameSite: "lax"` so the login
  flow still works without HTTPS.
- No JWT is stored in `localStorage` or `sessionStorage`.
- No admin/user table was added to `MappedIn3DModels`.
- Admin credential configuration is environment based:
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH`
  - `JWT_ACCESS_SECRET`
- Password hashes use Node.js built-in `scrypt` through the
  `scrypt$N$r$p$salt$hash` format.
- Added `npm run hash:admin-password -- <password>` in `backend/` to generate an
  admin password hash for environment configuration.
- CORS supports credentials and can be restricted with `ALLOWED_ORIGINS`.
- `.env`, appsettings files, and local env files are ignored for future safety.

## Tests And Build Commands

- `node --test tests\backendRouteStructureSource.test.mjs tests\backendUploadSource.test.mjs tests\kioskPerformanceSource.test.mjs tests\adminAuthUiSource.test.mjs` -> pass, 10/10.
- `npx ts-node backend\auth\auth.test.ts` -> pass.
- `npx ts-node backend\uploads.test.ts` -> pass.
- `node --test tests\backendSecuritySource.test.mjs tests\backendConfigSource.test.mjs tests\flightDateRange.test.mjs tests\flightInfoTopIconSize.test.mjs tests\modelEditingPermissions.test.mjs` -> pass, 13/13.
- `npx ts-node backend\areaColors.test.ts` -> pass.
- `npx ts-node backend\overviewFloorSync.test.ts` -> pass.
- `npx ts-node backend\flights\checkInCounterSpec.test.ts` -> pass.
- `npx ts-node backend\flights\flightRepository.test.ts` -> pass.
- `npm run hash:admin-password -- test-password` in `backend/` -> pass.
- `npm run build` -> pass, with existing Vite warnings about large chunks.
- `npm run build` in `backend/` -> pass.
- `node --test tests\*.test.mjs` -> fails on existing non-auth tests including
  tutorial/layout/import-path assertions. Targeted auth/security/upload/kiosk
  tests pass.

## Known Remaining Risks

- Full source test suite still has failures outside this admin-auth batch:
  tutorial flow assertions, layout assertions, and a `categoryPanelData.js`
  import path issue under `tests/`.
- Frontend `main` bundle remains large, about 4.29 MB minified. The model
  streaming cap and debug cleanup reduce runtime pressure, but code splitting is
  still recommended before kiosk production rollout.
- Existing tracked secret/history risk may remain if real `appsettings` files
  were committed before this work. `.gitignore` prevents future accidental adds
  but does not rewrite git history.
- Several inline SQL business writes remain in `backend/server.ts` by design for
  this batch. They are documented in
  `docs/database/sql-inline-classification.md` and should be migrated to
  repository/stored procedure boundaries in a later database refactor.
- `server.ts` and `index.ts` are still large. Only auth/upload-related boundaries
  were split to avoid broad behavior changes.

## Intentionally Not Changed

- No database schema/table was added for admin login.
- No flight-data schema or stored procedure behavior was changed.
- Existing public viewer workflows were kept public.
- Existing tutorial/mobile/desktop UI behavior was not refactored in this auth
  maintenance batch.
- No production deployment files were generated.
