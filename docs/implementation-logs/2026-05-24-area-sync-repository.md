# Area Sync Repository Log

Date: 2026-05-24

## User Request Summary

Continue the public viewer/admin auth maintenance plan in small, verified
batches. This batch moves `/api/areas/sync` persistence SQL out of the route
handler while preserving current behavior.

## Files Changed

- `backend/areaSyncRepository.ts`
- `backend/server.ts`
- `docs/database/sql-inline-classification.md`
- `docs/implementation-logs/2026-05-24-area-sync-repository.md`
- `tests/areaSyncRepositoryBoundarySource.test.mjs`

## Behavior Changed

- `POST /api/areas/sync` now delegates persistence to `syncMappedinAreas`.
- The existing AreaList upsert SQL was preserved.
- Existing Mappedin generic name normalization for escalator/elevator was moved
  into the repository with the sync behavior.
- The route keeps admin protection through `requireAdmin`.
- The route now returns a clear `503` response if the database connection is not
  available.

## Security Decisions

- `/api/areas/sync` remains admin-only.
- SQL input values remain parameterized.
- No new public write path was added.
- No database credentials or auth behavior changed in this batch.

## Tests And Build Commands

- `node --test tests\areaSyncRepositoryBoundarySource.test.mjs` -> pass.

## Known Remaining Risks

- `syncMappedinAreas` still uses inline SQL inside the repository. This is a
  boundary improvement, not yet the final stored procedure design.
- The next recommended database step is `SP_SyncMappedinArea` or a batch
  table-valued parameter procedure.
- `/api/categories/subcategory/:id/assign` and `syncCategories` still contain
  business SQL in `backend/server.ts`.
- Full source test suite still has unrelated existing failures in
  tutorial/layout/import-path tests.

## Intentionally Not Changed

- No database schema or stored procedure was changed.
- No public viewer behavior was changed.
- No category assignment flow was changed.
