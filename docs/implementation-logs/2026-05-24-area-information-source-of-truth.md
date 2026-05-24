# 2026-05-24 AreaInformation Source Of Truth

## User Request Summary

- The user clarified that area/location information is already stored in
  `AreaInformation`.
- The user questioned whether `MasterData_Locations` is necessary.
- Decision: do not require `MasterData_Locations` for current area information
  saves.

## Files Changed

- `backend/adminLocationRepository.ts`
- `backend/server.ts`
- `tests/adminLocationRepositoryBoundarySource.test.mjs`
- `docs/database/ssms-run-list.md`
- `docs/database/sql-inline-classification.md`

## Behavior Changed

- `POST /api/admin/locations` remains available as a compatibility endpoint.
- That endpoint no longer calls `SP_Admin_UpsertLocation`.
- The endpoint now converts admin-location payloads into the existing
  `SP_UpsertAreaInformation` flow through `AreaList` and `AreaInformation`.

## Security / Data Decisions

- No admin/user/login table was added.
- `MasterData_Locations` is treated as optional/legacy metadata, not required
  for the current public viewer/admin area information workflow.
- `AreaList` + `AreaInformation` remain the source of truth for displayed area
  information.

## Verification

- `node --test tests\adminLocationRepositoryBoundarySource.test.mjs tests\areaInfoRepositoryBoundarySource.test.mjs tests\backendSecuritySource.test.mjs` passed.
- `npm run build` in `backend/` passed.

## Known Remaining Risks

- If a future feature needs `SlugKey`, logo, website, or social media metadata,
  a separate data model should be designed explicitly instead of reusing this
  compatibility endpoint implicitly.

## Intentionally Not Changed

- Existing `SP_Admin_UpsertLocation` in the database was not dropped.
- Existing empty `MasterData_Locations` table was not dropped.
- Historical archive SQL files were not edited.
