# Startup Loading Budget

## User request summary

The operator asked to implement the first startup-loading approach: keep the map loading screen active until the critical startup work has settled, while calculating whether the loading period can stay within roughly 10 seconds.

## Files changed

- `index.ts`
- `startupLoadingBudget.js`
- `tests/startupLoadingBudget.test.mjs`
- `tests/tutorialStartupFlow.test.mjs`
- `docs/implementation-logs/2026-05-27-startup-loading-budget.md`

## Exact behavior changed

- Added a startup loading gate with a hard 10 second maximum.
- The loading overlay now waits for model metadata/current-floor startup preload to settle, or for the 10 second timeout, before hiding.
- Startup camera animation now begins after the startup gate is released instead of beginning immediately while assets may still be loading.
- Current-floor model preload runs with a bounded budget:
  - Maximum total startup loading budget: 10,000 ms.
  - Reserved overlay exit time: 900 ms.
  - Maximum model preload window: 4,500 ms.
  - Example calculations:
    - If earlier startup work takes 2,000 ms, model preload can use up to 4,500 ms.
    - If earlier startup work takes 8,500 ms, model preload can use up to 600 ms.
    - If earlier startup work takes 9,400 ms, model preload is skipped so the loading screen can finish.
- If the startup budget is exhausted, remaining model streaming continues in the background.

## Security decisions made

- No authentication, authorization, cookie, database, or secret-handling behavior was changed.
- No viewer write API was added.
- No `.env` or connection string values were changed.

## Tests/build commands run and results

- `npm run build` - passed.
- `node --test tests\startupLoadingBudget.test.mjs tests\tutorialStartupFlow.test.mjs tests\tutorialAutoOpen.test.mjs` - passed, 10 tests.

Node emitted a module-type warning for ES module syntax in local `.js` helper files during tests. This is not a build failure and was left unchanged to avoid broad package metadata changes.

## Known remaining risks

- This change does not guarantee all 3D models are loaded before the map appears. It intentionally caps startup work at 10 seconds and lets lower-priority models continue through the existing streaming path.
- Actual perceived smoothness still depends on browser/device GPU performance and the local SQL response time.
- A manual browser smoke check should confirm whether the initial camera movement now feels smoother on the local DB.

## Items intentionally not changed

- Map colors and area styling.
- Wayfinding behavior.
- Admin authentication and login behavior.
- Database connection configuration.
- Existing kiosk/debug source test failures outside this startup-loading change.
