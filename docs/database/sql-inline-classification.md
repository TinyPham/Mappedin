# SQL Inline Classification

Date: 2026-05-23

Scope reviewed:

- `backend/server.ts`
- `backend/flights/flightRepository.ts`
- `database/**/*.sql`
- `D:\E-Map-Website\Scripts-Mappedin-23-05-2026-V2.sql`

This document records the SQL risk classification requested for the admin-auth
maintenance plan. No database behavior was changed as part of this classification.

## Current Good Boundaries

- Critical model writes already use stored procedures:
  - `SP_UpsertModel`
  - `SP_DeleteModel`
  - `SP_UpdateOverviewModelFloorId`
  - `SP_SyncAvailableModel`
- Flight list and navigation lookups use stored procedures in
  `backend/flights/flightRepository.ts`:
  - `SP_GetFlights`
  - `SP_GetFlightNavigationTargets`
- Admin-facing location information writes use `SP_UpsertAreaInformation` with
  `AreaList` and `AreaInformation` as the source of truth.
- Mappedin location sync uses `SP_SyncMappedinLocation`.
- Initial app data is loaded through `SP_GetInitialData`.
- Area color override SQL is isolated in `backend/areaColorRepository.ts` rather
  than route handlers.
- Read-only area/category listing SQL is isolated in
  `backend/categoryAreaRepository.ts` rather than route handlers.
- Mappedin area sync SQL is isolated in `backend/areaSyncRepository.ts` rather
  than route handlers.
- Subcategory assignment transaction SQL is isolated in
  `backend/categoryAssignmentRepository.ts` rather than route handlers. A
  stored procedure candidate is available at
  `database/patches/create_sp_assign_subcategory_areas.sql` for SSMS review.
- Category directory sync SQL is isolated in `backend/categorySyncRepository.ts`
  rather than route handlers. It still reads input from the `icon-category`
  filesystem directory, so it is not yet a pure SSMS/stored procedure workflow.
- Mappedin location sync route logic is isolated in
  `backend/locationSyncRepository.ts` and calls the existing
  `SP_SyncMappedinLocation` stored procedure.
- Admin location compatibility route logic is isolated in
  `backend/adminLocationRepository.ts`, then writes through
  `backend/areaInfoRepository.ts` and `SP_UpsertAreaInformation`.
- Area information update route logic is isolated in
  `backend/areaInfoRepository.ts` and calls the existing
  `SP_UpsertAreaInformation` stored procedure.
- Model route logic is isolated in `backend/modelRepository.ts` and calls the
  existing model stored procedures:
  - `SP_GetAllModels`
  - `SP_UpdateOverviewModelFloorId`
  - `SP_GetModelByUUID`
  - `SP_UpsertModel`
  - `SP_DeleteModel`
  - `SP_GetAvailableModels`
- Category tree route logic is isolated in `backend/categoryTreeRepository.ts`
  and calls the existing `SP_GetCategoryTree` stored procedure.
- Available model library sync writes are isolated in
  `backend/availableModelSyncRepository.ts` and call the existing
  `SP_SyncAvailableModel` stored procedure.
- Initial public viewer data loading is isolated in
  `backend/initDataRepository.ts` and calls the existing `SP_GetInitialData`
  stored procedure.

## Inline SQL That Can Remain Temporarily

These blocks are parameterized and small, but should be moved behind repository
functions when the backend is split into modules.

| File | Area | Current use | Risk | Recommended next step |
| --- | --- | --- | --- | --- |
| `backend/areaColorRepository.ts` | `fetchAreaColorMap` | Reads `AreaColorOverrides` if the table exists | Low | Optional `SP_GetAreaColorOverrides` later |
| `backend/areaColorRepository.ts` | `ensureAreaColorTableExists` | Checks table existence | Low | Keep as migration/bootstrap helper or move to a startup migration script |
| `backend/categoryAreaRepository.ts` | `GET /api/categories/subcategory/:id/locations` | Reads assigned/available locations by subcategory | Medium | Consider `SP_GetSubCategoryLocations` later |
| `backend/categoryAreaRepository.ts` | `GET /api/areas/assigned` | Reads assigned areas | Low | Candidate for `SP_GetAssignedAreas` only if read contract stabilizes |
| `backend/categoryAreaRepository.ts` | `GET /api/categories/active` | Reads active categories | Low | Candidate for `SP_GetActiveCategories` only if read contract stabilizes |

## Inline SQL That Should Become Stored Procedures

These are business writes or multi-step synchronization flows. They are
parameterized, but they do not belong in route handlers long term.

| File | Area | Current use | Risk | Recommended stored procedure |
| --- | --- | --- | --- | --- |
| `backend/areaColorRepository.ts` | `POST /api/area-colors` | `MERGE dbo.AreaColorOverrides` | Medium | `SP_UpsertAreaColorOverride` |
| `backend/areaColorRepository.ts` | `DELETE /api/area-colors` | Deletes one color override | Medium | `SP_DeleteAreaColorOverride` |
| `backend/categorySyncRepository.ts` | `syncCategories` helper | Upserts/deduplicates category metadata from `icon-category` | Medium | Existing `SP_SyncCategoryStructure` should absorb remaining inline logic |
| `backend/categorySyncRepository.ts` | `syncCategories` subcategory loop | Upserts/deduplicates subcategories from `icon-category` | Medium | Future batch table-valued parameter procedure if filesystem input is converted to structured rows |
| `backend/areaSyncRepository.ts` | `POST /api/areas/sync` | Upserts Mappedin areas to `AreaList` | High | `SP_SyncMappedinArea` or batch table-valued parameter procedure |
| `backend/categoryAssignmentRepository.ts` | `POST /api/categories/subcategory/:id/assign` | Transactional category assignment | High | Review/run `database/patches/create_sp_assign_subcategory_areas.sql`, then switch backend to `SP_AssignSubCategoryAreas` |

## Flight Repository Dynamic SQL

`backend/flights/flightRepository.ts` builds small dynamic lookup queries for
gate, belt, and check-in mapping tables. The table and column names come from
local constants, while user-controlled values are passed through SQL parameters.

Status:

- Acceptable short term.
- Not directly copy/paste runnable in SSMS because Node builds the final SQL with
  parameters.
- Should remain isolated in the repository, not duplicated in route handlers.

Recommended next step:

- If airport flight data rules stabilize, move these lookup queries into stored
  procedures such as `SP_GetGateNavigationTargets`, `SP_GetBeltNavigationTargets`,
  and `SP_GetCheckInNavigationTargets`.

## External SQL Script Review

The external script `D:\E-Map-Website\Scripts-Mappedin-23-05-2026-V2.sql`
contains stored procedures required by the current backend, including:

- `SP_DeleteLocationAsset`
- `SP_GetAllLocationAssets`
- `SP_GetAvailableModels`
- `SP_GetCategoryTree`
- `SP_GetLocationAssetByUUID`
- `SP_SyncCategoryStructure`
- `SP_SyncMappedinLocation`
- `SP_UpsertAreaInformation`
- `SP_UpsertCategorySync`
- `SP_UpsertLocationAsset`
- `SP_UpsertSubCategorySync`

It also contains cleanup/deduplication `DELETE` statements inside sync
procedures. These are valid only when reviewed as part of the intended sync
behavior and should not be copied into ad hoc route-level SQL.

## Dev/Bootstrap SQL Scripts

The `database/` folder contains schema, seed, patch, and archive SQL. Several
files include destructive statements such as `DELETE`, `DROP`, or schema-altering
operations.

Rules:

- Treat `database/seeds/**`, `database/patches/**`, and `database/archive/**` as
  deployment/admin scripts, not runtime code.
- Any script with destructive statements must be run manually through SSMS or a
  controlled migration process.
- Runtime Express routes must not execute raw patch/archive scripts.

## Maintenance Rule Going Forward

- New public read queries may be added in repositories only, with parameterized
  inputs and tests.
- New admin/write database behavior should use stored procedures, or at minimum a
  repository method with a follow-up task to promote it to a stored procedure.
- Route handlers must not contain new business SQL.
- SQL scripts intended for SSMS must live under `database/` and include a clear
  purpose header.
