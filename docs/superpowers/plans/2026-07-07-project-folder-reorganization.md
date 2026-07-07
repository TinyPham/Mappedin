# Project Folder Reorganization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize project files by function so the repository root is cleaner while preserving existing behavior.

**Architecture:** Keep app entry files and runtime asset folders stable. Move helper modules into `src/*`, source-inspection tests into `tests/source`, reports into `docs/reports`, and maintenance scripts into `tools`.

**Tech Stack:** Vite, TypeScript, JavaScript ES modules, Node test runner, PowerShell.

---

### Task 1: Create Destination Folders

**Files:**
- Create: `src/data/`
- Create: `src/navigation/`
- Create: `src/performance/`
- Create: `src/tutorial/`
- Create: `src/ui/`
- Create: `docs/reports/`
- Create: `tools/archive/`
- Create: `tests/source/`

- [ ] **Step 1: Create missing folders**

Run:

```powershell
New-Item -ItemType Directory -Force src\data,src\navigation,src\performance,src\tutorial,src\ui,docs\reports,tools\archive,tests\source
```

- [ ] **Step 2: Verify folders exist**

Run:

```powershell
Test-Path src\data,src\navigation,src\performance,src\tutorial,src\ui,docs\reports,tools\archive,tests\source
```

Expected: all values are `True`.

### Task 2: Move Frontend Helper Modules

**Files:**
- Move: root helper `.js` and `.d.ts` files into `src/*`
- Modify: `index.ts`
- Modify: affected tests under `tests/`

- [ ] **Step 1: Move helper modules**

Use `Move-Item -LiteralPath` for:

```text
categoryPanelData.js -> src/data/categoryPanelData.js
flightNavigationActions.js -> src/navigation/flightNavigationActions.js
navigationInstructionRules.js -> src/navigation/navigationInstructionRules.js
wayfindingRouteTargets.js -> src/navigation/wayfindingRouteTargets.js
wayfindingSearchRules.js -> src/navigation/wayfindingSearchRules.js
wayfindingSearchRules.d.ts -> src/navigation/wayfindingSearchRules.d.ts
modelStreamingThresholds.js -> src/performance/modelStreamingThresholds.js
startupLoadingBudget.js -> src/performance/startupLoadingBudget.js
tutorialAutoOpen.js -> src/tutorial/tutorialAutoOpen.js
tutorialDevice.js -> src/tutorial/tutorialDevice.js
tutorialSteps.js -> src/tutorial/tutorialSteps.js
categoryDropdownLayout.js -> src/ui/categoryDropdownLayout.js
```

- [ ] **Step 2: Update `index.ts` imports**

Replace root-relative imports with:

```ts
import { shouldRenderFlightNavigationActions } from "./src/navigation/flightNavigationActions.js";
import { rankWayfindingSearchResults } from "./src/navigation/wayfindingSearchRules.js";
import { getCategoryAreaListStyle } from "./src/ui/categoryDropdownLayout.js";
import { getModelStreamingZoomThresholds } from "./src/performance/modelStreamingThresholds.js";
import { getTutorialDevice } from "./src/tutorial/tutorialDevice.js";
import { tutorialSteps } from "./src/tutorial/tutorialSteps.js";
```

Also update the existing imports from `categoryPanelData.js`, `navigationInstructionRules.js`, `wayfindingRouteTargets.js`, `startupLoadingBudget.js`, and `tutorialAutoOpen.js`.

- [ ] **Step 3: Update direct test imports**

Change `../<module>.js` imports to the new `../src/<group>/<module>.js` paths.

- [ ] **Step 4: Run targeted moved-module tests**

Run:

```powershell
node --test tests/categoryPanelData.test.mjs tests/categoryPanelDataLocalization.test.mjs tests/desktopTutorialTargets.test.mjs tests/flightNavigationActions.test.mjs tests/modelStreamingThresholds.test.mjs tests/navigationInstructionRules.test.mjs tests/startupLoadingBudget.test.mjs tests/tutorialAutoOpen.test.mjs tests/tutorialDeviceDetection.test.mjs tests/tutorialSteps.test.mjs tests/wayfindingRouteTargets.test.mjs tests/wayfindingSearchRules.test.mjs
```

Expected: tests pass or reveal only path issues to fix.

### Task 3: Move Source-Inspection Tests

**Files:**
- Move: `tests/*Source.test.mjs` to `tests/source/`
- Modify: read paths inside moved tests from `../...` to `../../...` where needed

- [ ] **Step 1: Move `*Source.test.mjs` files**

Run:

```powershell
Get-ChildItem tests -File -Filter *Source.test.mjs | Move-Item -Destination tests\source
```

- [ ] **Step 2: Update relative source paths**

For moved files, update repository-root relative reads from `../` to `../../` as needed.

- [ ] **Step 3: Run source tests**

Run:

```powershell
node --test tests/source/*.test.mjs
```

Expected: all source tests pass.

### Task 4: Move Docs, Reports, And Tools

**Files:**
- Move: `SETUP_GUIDE.md` to `docs/SETUP_GUIDE.md`
- Move: `WORKFLOW.md` to `docs/WORKFLOW.md`
- Move: report files to `docs/reports/`
- Move: `scripts/` contents to `tools/`
- Move: `fix*.js` to `tools/archive/`

- [ ] **Step 1: Move documentation and reports**

Use `Move-Item -LiteralPath` for the files listed above.

- [ ] **Step 2: Move scripts into `tools`**

If `tools` does not exist, create it. Move current `scripts/*` into `tools/`, preserving `tools/archive/`.

- [ ] **Step 3: Search stale references**

Run:

```powershell
rg -n "scripts/|scripts\\\\|SETUP_GUIDE.md|WORKFLOW.md|glb_optimization_report|3d_model_optimization_analysis|area_name_differences" -g "!node_modules/**" -g "!dist/**"
```

Expected: remaining references are documentation-only or are updated to new paths.

### Task 5: Final Validation And Cleanup Report

**Files:**
- Modify: `.gitignore` if needed for `debug.log` or local artifacts
- No deletion without explicit final confirmation

- [ ] **Step 1: Check stale root files**

Run:

```powershell
Get-ChildItem -File | Select-Object Name,Length | Sort-Object Name
```

- [ ] **Step 2: Build**

Run:

```powershell
npm run build
```

Expected: Vite build succeeds.

- [ ] **Step 3: Run relevant tests**

Run:

```powershell
node --test tests/*.test.mjs tests/source/*.test.mjs src/**/*.test.mjs
```

Expected: tests pass, or failures are documented if unrelated.

- [ ] **Step 4: Report delete candidates**

List runtime-safe delete candidates:

```text
debug.log
diff.txt
tools/archive/fix.js
tools/archive/fix2.js
tools/archive/fix_sidebar.js
```

Explain that `Model3D_backup/` can be removed from runtime perspective but should be archived externally or deleted only after confirmation because it is tracked and large.
