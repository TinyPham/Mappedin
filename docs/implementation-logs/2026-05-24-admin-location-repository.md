# Admin Location Repository Log

Date: 2026-05-24

## Superseded Note

This batch was superseded by
`docs/implementation-logs/2026-05-24-area-information-source-of-truth.md`.
`POST /api/admin/locations` no longer depends on `SP_Admin_UpsertLocation`;
current area information saves use `AreaList` + `AreaInformation` through
`SP_UpsertAreaInformation`.

## User Request Summary

Continue implementing the maintenance plan until completion, in small safe
batches, and keep track of SQL scripts needed for SSMS.

## Files Changed

- `backend/adminLocationRepository.ts`
- `backend/server.ts`
- `docs/database/sql-inline-classification.md`
- `docs/database/ssms-run-list.md`
- `docs/implementation-logs/2026-05-24-admin-location-repository.md`
- `tests/adminLocationRepositoryBoundarySource.test.mjs`

## Behavior Changed

- `POST /api/admin/locations` now delegates to `upsertAdminLocation`.
- The route remains admin-only through `requireAdmin`.
- The existing call to `SP_Admin_UpsertLocation` is preserved.
- The route now returns `503` if the database connection is unavailable.

## SSMS Notes

- No new SQL script is required for this batch.
- The flow depends on the existing stored procedure `SP_Admin_UpsertLocation`.
- The SSMS checklist is tracked in:

```text
docs/database/ssms-run-list.md
```

## Security Decisions

- No public write route was added.
- No database schema change is executed automatically.
- The route keeps the existing admin JWT protection.

## Tests And Build Commands

- `node --test tests\adminLocationRepositoryBoundarySource.test.mjs` -> pass.

## Known Remaining Risks

- Model routes still call stored procedures directly from `backend/server.ts`.
- Full source test suite still has unrelated existing failures in
  tutorial/layout/import-path tests.

## Intentionally Not Changed

- No stored procedure was created or modified.
- No public viewer behavior was changed.
