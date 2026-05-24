# 2026-05-24 Final Server DB Boundary Repositories

## Scope

- Continued the public-viewer/admin-auth maintenance plan.
- Removed the remaining direct stored procedure calls from `backend/server.ts`.
- Kept route contracts and public/admin access rules unchanged.

## Changes

- Added `backend/categoryTreeRepository.ts`.
- Added `backend/availableModelSyncRepository.ts`.
- Added `backend/initDataRepository.ts`.
- Updated `backend/server.ts` so route/helper code delegates to repositories for:
  - `GET /api/categories`
  - available model library sync during startup
  - `GET /api/init-data`
- Added boundary tests:
  - `tests/categoryTreeRepositoryBoundarySource.test.mjs`
  - `tests/availableModelSyncRepositoryBoundarySource.test.mjs`
  - `tests/initDataRepositoryBoundarySource.test.mjs`
- Updated SQL tracking docs:
  - `docs/database/sql-inline-classification.md`
  - `docs/database/ssms-run-list.md`

## SQL / SSMS

- No new SQL script was introduced in this batch.
- The backend depends on existing stored procedures:
  - `SP_GetCategoryTree`
  - `SP_SyncAvailableModel`
  - `SP_GetInitialData`
- If any of these is missing on a target SQL Server, restore it from the main
  database provisioning script before testing related screens.

## Verification

- `node --test tests\categoryTreeRepositoryBoundarySource.test.mjs` passed.
- `node --test tests\availableModelSyncRepositoryBoundarySource.test.mjs`
  passed.
- `node --test tests\initDataRepositoryBoundarySource.test.mjs` passed.
- Repository boundary aggregate test passed: 23 tests passed.
- Source/security/kiosk aggregate test passed: 16 tests passed.
- `npx ts-node backend\auth\auth.test.ts` passed.
- `npx ts-node backend\uploads.test.ts` passed.
- `npm run build` in `backend/` passed.
- Root `npm run build` passed. Vite still reports the existing large chunk
  warning for the main frontend bundle.

## Notes

- Running `backend/auth/auth.test.ts` and `backend/uploads.test.ts` directly with
  `node --test` fails because Node cannot resolve TypeScript extensionless
  imports in those files. Running them through `ts-node` passes.
