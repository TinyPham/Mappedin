# Category Sync Repository Log

Date: 2026-05-24

## User Request Summary

Continue the public viewer/admin auth maintenance plan in small verified steps.
The user also requested that any inline SQL needing SSMS execution be listed
clearly.

## Files Changed

- `backend/categorySyncRepository.ts`
- `backend/server.ts`
- `docs/database/sql-inline-classification.md`
- `docs/database/ssms-run-list.md`
- `docs/implementation-logs/2026-05-24-category-sync-repository.md`
- `tests/categorySyncRepositoryBoundarySource.test.mjs`

## Behavior Changed

- `syncCategories` in `backend/server.ts` now delegates to
  `syncCategoryDirectory`.
- The category/subcategory sync SQL was moved into
  `backend/categorySyncRepository.ts`.
- Startup still calls `await syncCategories()`.
- The existing behavior of scanning `icon-category` and syncing category rows is
  preserved.

## SSMS Notes

- No new SSMS script is required for this batch.
- Category sync depends on filesystem input from `icon-category`, so it is not a
  static SQL script yet.
- The current SSMS checklist is tracked in:

```text
docs/database/ssms-run-list.md
```

## Security Decisions

- No public write endpoint was added.
- No database schema change is executed automatically by the app.
- Existing SQL values remain parameterized inside the repository.

## Tests And Build Commands

- `node --test tests\categorySyncRepositoryBoundarySource.test.mjs` -> pass.

## Known Remaining Risks

- `backend/categorySyncRepository.ts` still contains inline SQL; this batch only
  moved it out of the route/server file.
- A future stored-procedure design for category sync needs structured input,
  likely table-valued parameters, because the current input is the filesystem.
- Full source test suite still has unrelated existing failures in
  tutorial/layout/import-path tests.

## Intentionally Not Changed

- No stored procedure was created for category sync.
- No `icon-category` folder structure was changed.
- No public viewer behavior was changed.
