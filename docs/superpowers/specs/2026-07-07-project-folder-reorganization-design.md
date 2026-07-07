# Project Folder Reorganization Design

## Goal

Reorganize the root of `D:\E-Map-Website\ERP-Mappedin` so the project looks cleaner and more professional when opened, while preserving current runtime behavior.

## Reference

Use `C:\Users\Welcome\Downloads\ERP-Mappedin` as the structural reference:

- Keep entry files and build configuration in the repository root.
- Move supporting frontend modules into `src`.
- Keep one-off or maintenance scripts in `tools`.
- Keep source-scanning tests under `tests/source`.
- Keep documentation under `docs`.
- Keep runtime asset folders stable unless every consumer path is updated.

## Proposed Structure

```text
ERP-Mappedin/
├─ backend/
├─ database/
├─ docs/
│  ├─ SETUP_GUIDE.md
│  ├─ WORKFLOW.md
│  ├─ reports/
│  └─ archive/
├─ src/
│  ├─ data/
│  ├─ navigation/
│  ├─ performance/
│  ├─ tutorial/
│  └─ ui/
├─ tests/
│  └─ source/
├─ tools/
│  └─ archive/
├─ public/
├─ Model3D/
├─ icon/
├─ icon-category/
├─ Theme-Thumbnails/
├─ types/
├─ index.html
├─ admin.html
├─ index.ts
├─ admin.ts
├─ styles.css
├─ responsive.css
├─ package.json
├─ vite.config.ts
└─ tsconfig.json
```

## File Moves

Move supporting modules from root into responsibility-based folders:

- `src/data/categoryPanelData.js`
- `src/navigation/flightNavigationActions.js`
- `src/navigation/navigationInstructionRules.js`
- `src/navigation/wayfindingRouteTargets.js`
- `src/navigation/wayfindingSearchRules.js`
- `src/navigation/wayfindingSearchRules.d.ts`
- `src/performance/modelStreamingThresholds.js`
- `src/performance/startupLoadingBudget.js`
- `src/tutorial/tutorialAutoOpen.js`
- `src/tutorial/tutorialDevice.js`
- `src/tutorial/tutorialSteps.js`
- `src/ui/categoryDropdownLayout.js`

Move project documents and reports:

- `SETUP_GUIDE.md` to `docs/SETUP_GUIDE.md`
- `WORKFLOW.md` to `docs/WORKFLOW.md`
- `3d_model_optimization_analysis.md` to `docs/reports/3d_model_optimization_analysis.md`
- `glb_optimization_report.json` to `docs/reports/glb_optimization_report.json`
- `area_name_differences_2026-05-23_vs_2026-05-25.csv` to `docs/reports/area_name_differences_2026-05-23_vs_2026-05-25.csv`

Move maintenance scripts:

- `scripts/` to `tools/`
- `fix.js`, `fix2.js`, and `fix_sidebar.js` to `tools/archive/`

Move source-scanning tests:

- Tests ending in `Source.test.mjs` to `tests/source/`

## Preserve In Place

Do not move these during this pass:

- `index.ts`, `admin.ts`, `index.html`, `admin.html`, `styles.css`, `responsive.css`
- `Model3D/`, `icon/`, `icon-category/`, `Theme-Thumbnails/`, `public/`, `uploads/`
- `lotus-blue.png`, because it is referenced by `index.html`
- `Logo-LTIA-Map.gif`, until product/branding usage outside the current app is confirmed
- `Model3D_backup/`, because it is a large backup asset set and existing project notes warn against deleting it without confirmation

## Cleanup Candidates

These files appear unused by runtime source/config and are safe candidates for deletion after user confirmation:

- `debug.log`
- `diff.txt`
- `fix.js`, `fix2.js`, `fix_sidebar.js` after archival or if history is sufficient
- `area_name_differences_2026-05-23_vs_2026-05-25.csv` after report archival
- `glb_optimization_report.json` after report archival

`Model3D_backup/` is not required by runtime code but should be moved outside the repository or archived externally instead of immediately deleted.

## Validation

After moving files and updating paths:

- Run frontend build with `npm run build`.
- Run targeted Node tests for moved modules and source tests if available.
- Search for stale imports to old root module paths.
- Check git status to confirm only intended moves and path edits occurred.
