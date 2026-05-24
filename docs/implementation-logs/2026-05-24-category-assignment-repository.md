# Category Assignment Repository Log

Date: 2026-05-24

## User Request Summary

Continue the public viewer/admin auth maintenance plan in small, safe batches.
The user also requested that SQL needing SSMS review be written out clearly.

## Files Changed

- `backend/categoryAssignmentRepository.ts`
- `backend/server.ts`
- `database/patches/create_sp_assign_subcategory_areas.sql`
- `docs/database/sql-inline-classification.md`
- `docs/implementation-logs/2026-05-24-category-assignment-repository.md`
- `tests/categoryAssignmentRepositoryBoundarySource.test.mjs`

## Behavior Changed

- `POST /api/categories/subcategory/:id/assign` now delegates its transaction to
  `assignSubCategoryAreas`.
- The existing transaction behavior is preserved:
  - remove existing assignments for the selected subcategory,
  - auto-create missing `AreaList` rows,
  - remove assigned areas from other subcategories,
  - insert the new assignments.
- The route remains admin-only through `requireAdmin`.
- The route now returns a clear `503` if the database connection is unavailable.

## SSMS Script Provided

The stored procedure candidate is here:

```text
database/patches/create_sp_assign_subcategory_areas.sql
```

This script creates:

- `dbo.MappedinIDList` table type, if missing.
- `dbo.SP_AssignSubCategoryAreas`.

The backend does not call this stored procedure yet. It is provided for manual
SSMS review and future migration.

## Security Decisions

- No public write path was added.
- Query inputs remain parameterized in the repository.
- No schema change is executed automatically by the app.
- The SSMS script uses `SET XACT_ABORT ON`, explicit transaction handling, and
  `THROW` for error propagation.

## Tests And Build Commands

- `node --test tests\categoryAssignmentRepositoryBoundarySource.test.mjs` -> pass.

## Known Remaining Risks

- Backend still uses inline SQL in `categoryAssignmentRepository.ts`; the stored
  procedure script is prepared but not wired in.
- The stored procedure script must be reviewed and run manually in SSMS before
  the backend can safely switch to it.
- `syncCategories` still contains business SQL in `backend/server.ts`.
- Full source test suite still has unrelated existing failures in
  tutorial/layout/import-path tests.

## Intentionally Not Changed

- No stored procedure was executed.
- No database schema was changed by the application.
- No public viewer behavior was changed.
