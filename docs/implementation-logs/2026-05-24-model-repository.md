# 2026-05-24 Model Repository Batch

## Scope

- Continued the public-viewer/admin-auth maintenance plan.
- Kept API behavior unchanged while moving model database access out of route
  handlers.

## Changes

- Added `backend/modelRepository.ts`.
- Moved the following stored procedure calls out of `backend/server.ts`:
  - `SP_GetAllModels`
  - `SP_UpdateOverviewModelFloorId`
  - `SP_GetModelByUUID`
  - `SP_UpsertModel`
  - `SP_DeleteModel`
  - `SP_GetAvailableModels`
- Updated model routes in `backend/server.ts` to delegate to repository
  functions.
- Kept admin protection on model write routes:
  - `POST /api/models`
  - `DELETE /api/models/:uuid`
  - `POST /api/models/batch`
- Added `tests/modelRepositoryBoundarySource.test.mjs` to prevent model stored
  procedure calls from drifting back into route handlers.
- Updated SQL tracking docs:
  - `docs/database/sql-inline-classification.md`
  - `docs/database/ssms-run-list.md`

## SQL / SSMS

- No new SQL script was introduced in this batch.
- The backend still depends on existing model stored procedures in the
  provisioned database. See `docs/database/ssms-run-list.md`.

## Verification

- `node --test tests\modelRepositoryBoundarySource.test.mjs` passed.
- `npm run build` in `backend/` passed.
