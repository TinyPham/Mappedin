# Startup Loading 25s Budget

## User request summary

The operator asked to make the startup loading time slightly longer after the 20 second startup loading and camera pause adjustment.

## Files changed

- `startupLoadingBudget.js`
- `tests/startupLoadingBudget.test.mjs`
- `docs/implementation-logs/2026-05-27-startup-loading-25s-budget.md`

## Exact behavior changed

- Increased the startup loading hard budget from 20 seconds to 25 seconds.
- Increased the maximum startup current-floor model preload budget from 14 seconds to 18 seconds.
- Kept the existing camera-animation pause behavior unchanged.

## Security decisions made

- No authentication, authorization, cookie, secret, or database behavior was changed.

## Tests/build commands run and results

- `node --test tests\startupLoadingBudget.test.mjs tests\tutorialStartupFlow.test.mjs` - passed, 6 tests.
- `npm run build` - passed.

## Known remaining risks

- The loading screen can now remain visible up to 25 seconds before falling back to background streaming.
- Actual smoothness still needs browser verification on the target machine.

## Items intentionally not changed

- Map colors and styling.
- Wayfinding logic.
- Admin login/auth behavior.
- Database connection settings.
