# Area Info Repository Log

Date: 2026-05-24

## User Request Summary

Continue executing the maintenance plan in small safe batches and keep SSMS SQL
requirements documented.

## Files Changed

- `backend/areaInfoRepository.ts`
- `backend/server.ts`
- `docs/database/sql-inline-classification.md`
- `docs/database/ssms-run-list.md`
- `docs/implementation-logs/2026-05-24-area-info-repository.md`
- `tests/areaInfoRepositoryBoundarySource.test.mjs`

## Behavior Changed

- `POST /api/update-area-info` now delegates to `upsertAreaInformation`.
- The route remains admin-only through `requireAdmin`.
- The existing call to `SP_UpsertAreaInformation` is preserved.
- The route still validates that `id` is present and returns `503` if the
  database connection is unavailable.

## SSMS Notes

- No new SQL script is required for this batch.
- The flow depends on the existing stored procedure `SP_UpsertAreaInformation`.
- The SSMS checklist is tracked in:

```text
docs/database/ssms-run-list.md
```

## Security Decisions

- No public write route was added.
- No database schema change is executed automatically.
- The route keeps existing admin JWT protection.

## Tests And Build Commands

- `node --test tests\areaInfoRepositoryBoundarySource.test.mjs` -> pass.

## Known Remaining Risks

- Model routes still call stored procedures directly from `backend/server.ts`.
- Full source test suite still has unrelated existing failures in
  tutorial/layout/import-path tests.

## Intentionally Not Changed

- No stored procedure was created or modified.
- No public viewer behavior was changed.
