# SSMS Run List

Date: 2026-05-24

This file tracks SQL scripts that may need to be run manually in SSMS as the
maintenance plan progresses. Do not run every script blindly; check the purpose
and current database state first.

## Run If Missing

### `database/patches/add_area_color_overrides.sql`

Purpose:

- Creates `dbo.AreaColorOverrides`.
- Required by `/api/area-colors`.

When to run:

- Run if admin area color save/delete returns:
  `AreaColorOverrides table does not exist. Apply the database patch first.`
- Safe to re-run because the script checks whether the table already exists.

## Ready For Review, Not Yet Required By Backend

### `database/patches/create_sp_assign_subcategory_areas.sql`

Purpose:

- Creates `dbo.MappedinIDList` table type if missing.
- Creates `dbo.SP_AssignSubCategoryAreas`.
- Mirrors current `/api/categories/subcategory/:id/assign` repository behavior.

When to run:

- Optional now. The backend still uses `backend/categoryAssignmentRepository.ts`.
- Run in SSMS only after reviewing the procedure.
- After this is run and verified, a later backend batch can switch the route to
  call `SP_AssignSubCategoryAreas`.

## No New SSMS Script In Current Batch

### Category directory sync

Current code:

- `backend/categorySyncRepository.ts`

Reason no SSMS script is provided yet:

- The sync reads folders/files from `icon-category`.
- The rows do not come from a static SQL dataset.
- A future stored-procedure version should first convert the filesystem scan into
  structured rows, likely with table-valued parameters.

Existing dependency:

- The database should already contain `SP_SyncCategoryStructure`.
- If that stored procedure is missing, review the main database script used to
  provision this project before running ad hoc fixes.

### Mappedin location sync

Current code:

- `backend/locationSyncRepository.ts`

No new SSMS script is provided because this flow already calls the existing
stored procedure `SP_SyncMappedinLocation`.

If backend logs report that `SP_SyncMappedinLocation` is missing, restore it from
the main database provisioning script before testing location sync.

### Admin location upsert

Current code:

- `backend/adminLocationRepository.ts`
- `backend/areaInfoRepository.ts`

No new SSMS script is provided. `/api/admin/locations` is kept as a compatibility
endpoint, but it now maps admin location payloads into the existing
`SP_UpsertAreaInformation` flow.

`dbo.MasterData_Locations` and `SP_Admin_UpsertLocation` are not required for the
current AreaList/AreaInformation source of truth. Do not create
`MasterData_Locations` just for area information saves unless a separate
metadata feature is explicitly reintroduced.

### Area information update

Current code:

- `backend/areaInfoRepository.ts`

No new SSMS script is provided because this flow already calls the existing
stored procedure `SP_UpsertAreaInformation`.

If backend logs report that `SP_UpsertAreaInformation` is missing, restore it
from the main database provisioning script before testing area information saves.

### Model routes

Current code:

- `backend/modelRepository.ts`

No new SSMS script is provided because this flow already calls existing stored
procedures:

- `SP_GetAllModels`
- `SP_UpdateOverviewModelFloorId`
- `SP_GetModelByUUID`
- `SP_UpsertModel`
- `SP_DeleteModel`
- `SP_GetAvailableModels`

If backend logs report that one of these stored procedures is missing, restore it
from the main database provisioning script before testing model CRUD, overview
floor sync, or available model picker data.

### Category tree and init data

Current code:

- `backend/categoryTreeRepository.ts`
- `backend/initDataRepository.ts`

No new SSMS script is provided because these flows already call existing stored
procedures:

- `SP_GetCategoryTree`
- `SP_GetInitialData`

If either procedure is missing, restore it from the main database provisioning
script before testing public viewer startup or category browsing.

### Available model library sync

Current code:

- `backend/availableModelSyncRepository.ts`

No new SSMS script is provided because this flow already calls the existing
stored procedure `SP_SyncAvailableModel`.

If backend startup logs report that `SP_SyncAvailableModel` is missing, restore
it from the main database provisioning script before testing the model picker.
