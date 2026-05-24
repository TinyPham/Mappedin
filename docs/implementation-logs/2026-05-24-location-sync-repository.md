# Location Sync Repository Log

Date: 2026-05-24

## User Request Summary

Continue implementing the maintenance plan in small verified batches and keep
track of SQL that must be run manually in SSMS.

## Files Changed

- `backend/locationSyncRepository.ts`
- `backend/server.ts`
- `docs/database/sql-inline-classification.md`
- `docs/database/ssms-run-list.md`
- `docs/implementation-logs/2026-05-24-location-sync-repository.md`
- `tests/locationSyncRepositoryBoundarySource.test.mjs`

## Behavior Changed

- `POST /api/sync-locations` now delegates to `syncMappedinLocations`.
- The route remains admin-only through `requireAdmin`.
- The existing call to `SP_SyncMappedinLocation` is preserved.
- The route now returns `503` if the database connection is unavailable.

## SSMS Notes

- No new SQL script is required for this batch.
- The flow depends on the existing stored procedure `SP_SyncMappedinLocation`.
- The SSMS checklist was updated in:

```text
docs/database/ssms-run-list.md
```

## Security Decisions

- No public write path was added.
- SQL values remain parameterized before calling the stored procedure.
- No database schema change is executed automatically.

## Tests And Build Commands

- `node --test tests\locationSyncRepositoryBoundarySource.test.mjs` -> pass.

## Known Remaining Risks

- The repository still counts every successful stored procedure execution as
  `updated`, matching the previous route behavior even when the procedure may
  insert internally.
- Full source test suite still has unrelated existing failures in
  tutorial/layout/import-path tests.

## Intentionally Not Changed

- No stored procedure was created or modified.
- No public viewer behavior was changed.
