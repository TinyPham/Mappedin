# Cleanup Candidates

## Safe To Delete For Runtime

These files are not referenced by current app source, build config, or runtime asset paths:

- `debug.log`
- `diff.txt`
- `tools/archive/fix.js`
- `tools/archive/fix2.js`
- `tools/archive/fix_sidebar.js`

The `fix*.js` files were moved to `tools/archive/` first so they remain available for review before deletion.

## Safe For Runtime, But Keep Or Archive Before Deleting

These are not required by the current runtime, but they may still be useful as documentation, backup, or business assets:

- `Model3D_backup/` - tracked backup copy of 3D models; archive outside the repository before deleting.
- `Logo-LTIA-Map.gif` - not referenced by current source, but may be a branding/manual asset.
- `docs/reports/3d_model_optimization_analysis.md` - optimization report.
- `docs/reports/glb_optimization_report.json` - generated optimization report.
- `docs/reports/area_name_differences_2026-05-23_vs_2026-05-25.csv` - comparison report.

## Keep

These looked suspicious at first but are used by the app:

- `lotus-blue.png` - referenced by `index.html`.
- `Theme-Thumbnails/` - referenced by `styles.css`.
- `Model3D/`, `icon/`, `icon-category/`, `public/` - runtime assets.
