# Final Plan Cleanup And Smoke Evidence

## User Request Summary

- Continue executing the public viewer/admin auth maintenance plan until it is
  complete.
- List any remaining work that needs operator-provided proof from the real
  browser/SQL Server environment.

## Files Changed

- `backend/scripts/generate_seed.js`
- `database/optimized_procedures.sql`
- `database/seeds/generated_translations.sql`
- `scripts/extract_schema.py`
- `scripts/search_tables.py`
- `tests/legacyLocationArtifactsSource.test.mjs`
- `docs/testing/manual-browser-smoke-checklist.md`
- `docs/testing/kiem-thu-thu-cong-browser.md`
- `docs/superpowers/plans/2026-05-23-public-viewer-admin-auth-maintenance-plan.md`
- `docs/superpowers/plans/2026-05-23-ke-hoach-public-viewer-admin-auth-maintenance.md`
- `index.ts`
- `tests/kioskPerformanceSource.test.mjs`

## Exact Behavior Changed

- Active maintenance scripts no longer recreate or depend on the dropped
  `MasterData_Locations` table or `SP_Admin_UpsertLocation` procedure.
- `backend/scripts/generate_seed.js` now generates SQL for the current
  `Translation_UI` and `AreaList` schema only.
- `database/optimized_procedures.sql` no longer contains the removed admin
  location procedure.
- Schema helper scripts now inspect `AreaList` / `AreaInformation` instead of
  legacy location metadata.
- Manual browser smoke evidence checklists were added in English and
  Vietnamese.
- Kiosk diagnostic logs for connection overlays, model streaming, floor
  switching, and category debug are no longer enabled by localhost alone.
  They require an explicit debug flag.
- The attempted wayfinding `updateState` warning guard was reverted because it
  changed map coloring. The original broad highlight/color refresh behavior is
  restored; the remaining SDK console warning is accepted as non-blocking unless
  it is proven to affect rendering or performance.
- Remaining floor-switch completion logs are now routed through the same
  explicit debug flag instead of printing during normal kiosk use.

## Security And Data Decisions

- The current source of truth for editable area information remains
  `AreaInformation`, joined through `AreaList`.
- No admin/login/user tables were added.
- No SQL was added that requires recreating the dropped legacy location table or
  procedure.

## Tests And Build Commands

- `node --test tests\legacyLocationArtifactsSource.test.mjs` -> pass.
- `node backend\scripts\generate_seed.js` -> generated
  `database/seeds/generated_translations.sql`.
- `node --test tests\legacyLocationArtifactsSource.test.mjs tests\adminLocationRepositoryBoundarySource.test.mjs tests\areaInfoRepositoryBoundarySource.test.mjs tests\backendSecuritySource.test.mjs tests\kioskPerformanceSource.test.mjs tests\adminAuthUiSource.test.mjs` -> pass, 16/16.
- `npm run build` in `backend/` -> pass.
- `npm run build` at repo root -> pass; Vite reported the existing large chunk warning.
- `node --test tests\kioskPerformanceSource.test.mjs` -> pass, 5/5.
- `node --test tests\kioskPerformanceSource.test.mjs tests\adminAuthUiSource.test.mjs tests\backendSecuritySource.test.mjs tests\legacyLocationArtifactsSource.test.mjs` -> pass, 13/13.
- `npm run build` at repo root after diagnostic log gating -> pass; Vite reported the existing large chunk warning.
- `npm run build` in `backend/` after diagnostic log gating -> pass.
- `node --test tests\kioskPerformanceSource.test.mjs` after SDK update-state guard -> pass, 6/6.
- `node --test tests\kioskPerformanceSource.test.mjs tests\adminAuthUiSource.test.mjs tests\backendSecuritySource.test.mjs tests\legacyLocationArtifactsSource.test.mjs` after SDK update-state guard -> pass, 14/14.
- `npm run build` at repo root after SDK update-state guard -> pass; Vite reported the existing large chunk warning.
- `npm run build` in `backend/` after SDK update-state guard -> pass.
- `node --test tests\kioskPerformanceSource.test.mjs` after excluding `s_`
  objects and gating remaining logs -> pass, 6/6.
- `node --test tests\kioskPerformanceSource.test.mjs tests\adminAuthUiSource.test.mjs tests\backendSecuritySource.test.mjs tests\legacyLocationArtifactsSource.test.mjs` -> pass, 14/14.
- `npm run build` at repo root -> pass; Vite reported the existing large
  chunk warning.
- `npm run build` in `backend/` -> pass.
- `node --test tests\kioskPerformanceSource.test.mjs` after restoring `s_`
  to area coloring and limiting the skip to highlight reset -> pass, 6/6.
- `node --test tests\kioskPerformanceSource.test.mjs tests\adminAuthUiSource.test.mjs tests\backendSecuritySource.test.mjs tests\legacyLocationArtifactsSource.test.mjs` -> pass, 14/14.
- `npm run build` at repo root -> pass; Vite reported the existing large
  chunk warning.
- `npm run build` in `backend/` -> pass.
- `node --test tests\kioskPerformanceSource.test.mjs` after reverting the
  highlight warning guard to preserve map colors -> pass, 6/6.
- `node --test tests\kioskPerformanceSource.test.mjs tests\adminAuthUiSource.test.mjs tests\backendSecuritySource.test.mjs tests\legacyLocationArtifactsSource.test.mjs` -> pass, 14/14.
- `npm run build` at repo root -> pass; Vite reported the existing large
  chunk warning.
- `npm run build` in `backend/` -> pass.

## Known Remaining Risks

- Manual browser/SSMS smoke testing still requires operator screenshots from
  the real running system.
- The optional category assignment stored procedure migration remains a future
  enhancement unless explicitly approved and run in SSMS.

## Operator Evidence Received

- Public viewer opened without admin login.
- Search, area detail, wayfinding, and flight information worked in public mode.
- Admin mode opened through `?admin=true`.
- Admin area information save succeeded.
- SSMS evidence showed `dbo.AreaInformation.OpeningHours` for the tested row
  changed from `9:00 am` to `7:00 am`.
- Logout returned the UI to public viewer mode and hid admin action buttons.
- SSMS evidence showed `OBJECT_ID('dbo.MasterData_Locations', 'U')` and
  `OBJECT_ID('dbo.SP_Admin_UpsertLocation', 'P')` both returned `NULL`.
- Operator console screenshot showed diagnostic logs were still visible on
  localhost. The code was updated so these logs require `?debug=true`,
  `window.__MAP_DEBUG__ = true`, or `localStorage.mapDebug = "1"`.
- Operator console text then showed repeated Mappedin SDK warnings from
  `updateState` calls against non-colorable point-of-interest/connection
  objects. The wayfinding highlight reset now skips non-colorable objects
  before calling `mapView.updateState`.
- Operator follow-up console text showed the remaining warning IDs started
  with `s_`; `isColorableMapObject` now rejects those IDs as non-updateable
  SDK objects before highlight reset.
- Operator reported that globally rejecting `s_` changed the map colors. The
  warning guard was then fully reverted from the highlight reset path to restore
  the previous color behavior.

## Intentionally Not Changed

- Archive SQL files under `database/archive/` were not rewritten because they
  are historical snapshots.
- The optional stored procedure patch
  `database/patches/create_sp_assign_subcategory_areas.sql` was not applied to
  the production database.
