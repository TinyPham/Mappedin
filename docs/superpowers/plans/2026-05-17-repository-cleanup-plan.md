# Repository Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dọn repo gọn hơn bằng cách xóa file tạm, build output, script/SQL không còn cần thiết, nhưng không làm mất dữ liệu deploy hoặc phá tính năng hiện tại.

**Architecture:** Cleanup phải đi theo hướng evidence-first: phân loại file, xác minh file còn được import/reference hay không, sau đó mới xóa. Riêng SQL patch/migration chỉ được xóa khỏi luồng làm việc chính khi đã có bằng chứng đã chạy trên DB hoặc đã được gộp vào schema/seed chuẩn.

**Tech Stack:** Node/Vite frontend, TypeScript backend, SQL Server scripts, Node test runner.

---

## Safety Rules

- Không xóa file SQL chỉ dựa vào tên file hoặc ngày sửa.
- Không xóa `database/archive` nếu chưa xác nhận team không cần lịch sử phục hồi DB.
- Không xóa `Model3D_backup`, `uploads`, hoặc asset lớn nếu chưa biết chúng có được dùng ngoài repo hay không.
- Không xóa thay đổi code đang làm dở của user.
- Trước mỗi nhóm xóa phải có `git status --short` và danh sách file chính xác.
- Sau mỗi nhóm xóa phải chạy test/build tối thiểu.

## Current Cleanup Candidates

### Likely safe to ignore from git, not necessarily delete manually

These are already in `.gitignore` and can be regenerated:

- `dist/`
- `node_modules/`
- `backend/node_modules/`
- `.env`
- `uploads/`

Action: chỉ xóa nếu user muốn giảm dung lượng local. Không đưa vào commit.

### SQL files needing evidence before deletion

Primary SQL groups:

- `database/schema.sql`
- `database/stored_procedures.sql`
- `database/create_database.sql`
- `database/longthanh_flightbk_full.sql`
- `database/migration_premium_info.sql`
- `database/mappedin_flight_navigation_mapping.sql`
- `database/optimized_procedures.sql`
- `database/patches/*.sql`
- `database/seeds/*.sql`
- `database/archive/*.sql`

Risk: repo hiện không có migration runner chuẩn hoặc bảng `schema_migrations` cho các file trong `database/patches`, nên không biết file nào đã apply xong nếu không đối chiếu DB/deploy log.

### Temporary or one-off script candidates

Scripts likely created for analysis/generation/debug:

- `scripts/analyze_backup.py`
- `scripts/analyze_backup_v2.py`
- `scripts/debug_schema.py`
- `scripts/debug_schema_clean.py`
- `scripts/extract_schema.py`
- `scripts/generate_seed.py`
- `scripts/generate_seed_column_based_2f_3f.py`
- `scripts/generate_seed_row_based.py`
- `scripts/read_raw.py`
- `scripts/read_sql_head.py`
- `scripts/search_counter.py`
- `scripts/search_sql.py`
- `scripts/search_tables.py`
- `scripts/archive/*.js`

Risk: some scripts may still be useful for regenerating seed data. Do not delete until references and docs are checked.

---

## Task 1: Create Cleanup Inventory

**Files:**
- Create: `docs/cleanup/2026-05-17-cleanup-inventory.md`
- Read only: entire repo

- [ ] **Step 1: Record current git state**

Run:

```powershell
git status --short
```

Expected: list existing modified/untracked files. Save this state in the inventory so cleanup does not mix with user work.

- [ ] **Step 2: List SQL files**

Run:

```powershell
rg --files -g "*.sql" | Sort-Object
```

Expected: complete SQL list grouped by `database/`, `database/patches/`, `database/seeds/`, and `database/archive/`.

- [ ] **Step 3: List generated/temp-looking files**

Run:

```powershell
rg --files -g "*.tmp" -g "*.temp" -g "*.bak" -g "*.backup" -g "*.old" -g "*.orig" -g "*.log"
```

Expected: candidates only. If no output, record that no obvious temp extensions were found.

- [ ] **Step 4: List heavy generated folders**

Run:

```powershell
Get-ChildItem -Force | Where-Object { $_.PSIsContainer } | Select-Object Name,LastWriteTime
```

Expected: identify `dist`, `node_modules`, `backend/node_modules`, and other large candidate folders.

- [ ] **Step 5: Save inventory**

Write `docs/cleanup/2026-05-17-cleanup-inventory.md` with:

- Keep
- Candidate for local-only deletion
- Candidate for git deletion
- Needs DB verification
- Needs user confirmation

---

## Task 2: Verify SQL Patch Status

**Files:**
- Create: `docs/cleanup/2026-05-17-sql-patch-status.md`
- Read: `database/**/*.sql`
- Optional DB read: SQL Server database

- [ ] **Step 1: Search for migration tracking**

Run:

```powershell
rg -n "schema_migrations|MigrationBatchLog|MigrationErrorLog|patch|migration" database backend scripts
```

Expected: confirm whether there is a reliable applied-migration table. Current evidence suggests only `MigrationBatchLog` exists for data migration logging, not per-file SQL patch tracking.

- [ ] **Step 2: Classify SQL files**

Classify every SQL file:

- `canonical`: needed for fresh setup, e.g. schema/stored procedures/current seed
- `patch-active`: latest patch not yet folded into canonical schema/seed
- `patch-applied`: verified applied and no longer needed in main flow
- `archive-reference`: historical backup or one-off dump
- `unknown`: cannot safely remove yet

- [ ] **Step 3: Verify active DB state for each patch**

For each `database/patches/*.sql`, check the object/key/data it creates:

- translation patches: verify `Translation_UI.KeyCode`
- schema patches: verify columns/tables/indexes exist
- procedure patches: verify procedure definition includes expected change
- data patches: verify rows exist with expected values

Example checks:

```sql
SELECT KeyCode FROM Translation_UI WHERE KeyCode IN (
  'direction_connector_and',
  'action_turn_left_lower',
  'action_turn_right_lower',
  'action_go_straight_lower',
  'at_floor_label',
  'connection_direction_up',
  'connection_direction_down'
);
```

- [ ] **Step 4: Decide SQL cleanup policy**

Pick one:

- Keep all applied SQL in `database/patches` as audit history.
- Move applied SQL to `database/archive/applied-patches/`.
- Delete applied SQL only after confirming they are folded into `schema.sql`/`seed.sql` and recoverable from git history.

Recommended: move applied SQL to `database/archive/applied-patches/`, not hard-delete in the first cleanup pass.

- [ ] **Step 5: Save SQL status report**

Write `docs/cleanup/2026-05-17-sql-patch-status.md` with exact status per SQL file.

---

## Task 3: Remove Local Generated Output Only

**Files:**
- Local deletion only: `dist/`
- Do not commit: local workspace cleanup

- [ ] **Step 1: Confirm folder is generated**

Run:

```powershell
git check-ignore dist
```

Expected: `dist` is ignored by `.gitignore`.

- [ ] **Step 2: Delete only if user wants local disk cleanup**

Run only after confirmation:

```powershell
Remove-Item -LiteralPath .\dist -Recurse -Force
```

Expected: folder removed locally. No git diff should appear.

- [ ] **Step 3: Rebuild to verify regenerability**

Run:

```powershell
npm run build
```

Expected: build succeeds and recreates `dist/`.

---

## Task 4: Remove Confirmed One-Off Scripts

**Files:**
- Candidate delete or move:
  - `scripts/analyze_backup.py`
  - `scripts/analyze_backup_v2.py`
  - `scripts/debug_schema.py`
  - `scripts/debug_schema_clean.py`
  - `scripts/extract_schema.py`
  - `scripts/read_raw.py`
  - `scripts/read_sql_head.py`
  - `scripts/search_counter.py`
  - `scripts/search_sql.py`
  - `scripts/search_tables.py`
  - `scripts/archive/*.js`

- [ ] **Step 1: Search references**

Run:

```powershell
rg -n "analyze_backup|debug_schema|extract_schema|read_raw|read_sql_head|search_counter|search_sql|search_tables|cleanup_contamination|final_status_fix|inspect_labels|redesign_data_pro|reinit_env|restore_func" .
```

Expected: only self references or docs. Any active reference blocks deletion.

- [ ] **Step 2: Move instead of delete first**

Recommended first pass:

```powershell
New-Item -ItemType Directory -Force docs/cleanup/retired-scripts
```

Then move confirmed one-off scripts into `docs/cleanup/retired-scripts/` or delete them if user explicitly wants deletion.

- [ ] **Step 3: Run tests**

Run:

```powershell
node --test tests/*.test.mjs
```

Expected: all frontend utility/CSS tests pass.

- [ ] **Step 4: Build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

---

## Task 5: Consolidate SQL Seeds

**Files:**
- Review:
  - `database/seeds/seed.sql`
  - `database/seeds/seed_all_final.sql`
  - `database/seeds/seed_master_full.sql`
  - `database/seeds/seed_supplement_2f_3f.sql`
  - `database/seeds/seed_supplement_2f_3f_v2.sql`
  - `database/seeds/seed_ui_fix.sql`
  - `database/seeds/insert_arealist.sql`
  - `database/seeds/insert_areainformation.sql`
  - `database/seeds/raw_*.json`

- [ ] **Step 1: Identify canonical seed**

Compare row groups and comments to decide whether `seed.sql`, `seed_all_final.sql`, or `seed_master_full.sql` is the real current seed.

Run:

```powershell
Get-ChildItem database/seeds | Select-Object Name,Length,LastWriteTime
```

- [ ] **Step 2: Check setup docs**

Run:

```powershell
rg -n "seed.sql|seed_all_final|seed_master_full|seed_supplement|insert_arealist|insert_areainformation" SETUP_GUIDE.md WORKFLOW.md backend/README.md database scripts
```

Expected: identify what docs/scripts still reference.

- [ ] **Step 3: Keep one canonical path**

Recommended:

- Keep `database/schema.sql`
- Keep one canonical seed file, likely `database/seeds/seed.sql` or rename a verified canonical seed to `database/seeds/seed.sql`
- Move older seeds to `database/archive/seeds/`

- [ ] **Step 4: Update docs**

Update:

- `SETUP_GUIDE.md`
- `backend/README.md`
- `WORKFLOW.md`

Expected: setup docs point to only the canonical schema/seed.

---

## Task 6: Consolidate Applied SQL Patches

**Files:**
- Review: `database/patches/*.sql`
- Possible move: `database/archive/applied-patches/*.sql`

- [ ] **Step 1: Only process verified applied patches**

Use `docs/cleanup/2026-05-17-sql-patch-status.md`.

Do not touch files marked `unknown` or `patch-active`.

- [ ] **Step 2: Move applied patches**

Recommended command pattern per file:

```powershell
Move-Item -LiteralPath .\database\patches\<file>.sql -Destination .\database\archive\applied-patches\<file>.sql
```

Expected: git shows rename/move.

- [ ] **Step 3: Update docs**

Add a short note in `database/README.md` if created:

- current setup scripts
- where applied patches live
- rule for future patches

- [ ] **Step 4: Verify no code references moved paths**

Run:

```powershell
rg -n "database/patches|database\\\\patches|<file>.sql" .
```

Expected: no stale references, or docs updated to new path.

---

## Task 7: Final Verification

**Files:**
- All changed/deleted/moved files

- [ ] **Step 1: Review git diff**

Run:

```powershell
git status --short
git diff --stat
```

Expected: only intentional cleanup changes.

- [ ] **Step 2: Run frontend tests**

Run:

```powershell
node --test tests/*.test.mjs
```

Expected: all tests pass.

- [ ] **Step 3: Run build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Optional backend build/test**

If backend changes or docs mention backend setup:

```powershell
cd backend
npm run build
```

Expected: backend TypeScript builds.

- [ ] **Step 5: Manual smoke test**

Start app:

```powershell
npm run dev
```

Check:

- map loads
- search opens
- category panel opens
- floor/language/theme dropdowns work
- brightness control works
- flight info button works
- user guide button works

---

## Recommended First Execution Scope

Do this first because it is low risk:

1. Create cleanup inventory.
2. Create SQL patch status report.
3. Clean only local generated `dist/` if disk cleanup is needed.
4. Do not delete SQL yet.

After DB verification, do the SQL move/delete pass separately.
