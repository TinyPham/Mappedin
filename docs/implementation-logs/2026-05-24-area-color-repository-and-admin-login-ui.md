# Area Color Repository And Admin Login UI Log

Date: 2026-05-24

## User Request Summary

Continue the public viewer/admin auth maintenance plan, explain remaining work,
fix admin login usability by adding password visibility, and continue moving
route-level SQL toward maintainable repository boundaries.

## Files Changed

- `backend/areaColorRepository.ts`
- `backend/server.ts`
- `docs/database/sql-inline-classification.md`
- `docs/implementation-logs/2026-05-24-area-color-repository-and-admin-login-ui.md`
- `index.ts`
- `tests/adminAuthUiSource.test.mjs`
- `tests/areaColorRepositoryBoundarySource.test.mjs`

## Behavior Changed

- Admin login password field now has a visibility toggle.
- Area color persistence SQL was moved out of `backend/server.ts` and into
  `backend/areaColorRepository.ts`.
- `/api/area-colors` routes still keep the same request/response behavior, but
  now delegate persistence to repository functions.
- SQL classification documentation now reflects the new area color repository
  boundary.

## Security Decisions

- Password visibility is opt-in per click; password fields remain masked by
  default.
- Admin credentials remain configured through environment variables and password
  hash only.
- No database user/admin table was added.
- SQL behavior was moved, not broadened; request parsing and admin middleware
  remain in the route layer.

## Tests And Build Commands

- `node --test tests\adminAuthUiSource.test.mjs` -> pass.
- `npm run build` -> pass, with existing large chunk warning.
- `node --test tests\areaColorRepositoryBoundarySource.test.mjs tests\backendSecuritySource.test.mjs` -> pass.
- `npx ts-node backend\areaColors.test.ts` -> pass.

## Known Remaining Risks

- Area color SQL is now in a repository but still not yet promoted to stored
  procedures.
- Larger business SQL blocks remain in `backend/server.ts`, especially
  `/api/areas/sync`, `/api/categories/subcategory/:id/assign`, and
  `syncCategories`.
- `server.ts` and `index.ts` are still large files. This batch only moved one
  low-risk SQL boundary and did not attempt a broad rewrite.
- Full `node --test tests\*.test.mjs` still has unrelated existing failures in
  tutorial/layout/import-path tests.

## Intentionally Not Changed

- No database schema or stored procedure was changed.
- No public viewer behavior was changed.
- No category/area assignment business flow was rewritten in this batch.
