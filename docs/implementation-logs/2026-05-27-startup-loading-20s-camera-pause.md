# Startup Loading 20s Camera Pause

## User request summary

The operator reported that the map still felt choppy after the first startup-loading change and asked to try increasing the startup loading time to 20 seconds. The operator also required background progress to stop while the startup camera animation is rotating, to avoid competing work during the camera motion.

## Files changed

- `startupLoadingBudget.js`
- `index.ts`
- `tests/startupLoadingBudget.test.mjs`
- `tests/tutorialStartupFlow.test.mjs`
- `docs/implementation-logs/2026-05-27-startup-loading-20s-camera-pause.md`

## Exact behavior changed

- Increased the startup loading hard budget from 10 seconds to 20 seconds.
- Increased the maximum startup current-floor model preload budget from 4.5 seconds to 14 seconds.
- Added `_isStartupCameraAnimating` as a startup-only runtime flag.
- While startup camera rotation/zoom is running:
  - model streaming triggered by `camera-change` returns immediately;
  - background geometric cache waits in 250 ms intervals before continuing.
- When startup camera animation completes, the flag is cleared and model streaming is triggered once to resume normal loading.

## Security decisions made

- No authentication, authorization, JWT, cookie, environment, or database behavior was changed.
- No admin-only write path was exposed to viewer mode.

## Tests/build commands run and results

- `node --test tests\startupLoadingBudget.test.mjs tests\tutorialStartupFlow.test.mjs` - passed, 6 tests.
- `npm run build` - passed.

## Known remaining risks

- A background operation already in the middle of a single SDK call cannot be interrupted after it starts; the pause applies before subsequent cache work and before streaming work begins.
- The actual smoothness still needs a manual browser check on the target kiosk/local machine because GPU and Mappedin SDK rendering behavior cannot be fully proven by source tests.
- The loading screen may stay visible longer, up to the new 20 second startup budget.

## Items intentionally not changed

- Map colors and area rendering.
- Wayfinding logic.
- Admin login/auth behavior.
- SQL/database connection settings.
