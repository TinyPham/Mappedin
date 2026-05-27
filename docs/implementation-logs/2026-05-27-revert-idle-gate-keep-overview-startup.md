# 2026-05-27 Revert Idle Gate Keep Overview Startup

## User request summary

Revert the broad code changes that paused model streaming during general map interaction, floor switching, zooming, and dragging. Keep only the startup overview behavior where the loading flow reaches 100%, the startup camera rotates smoothly, and overview 3D model loading starts only after that camera animation finishes.

## Files changed

- `index.ts`
- `startupLoadingBudget.js`
- `tests/startupLoadingBudget.test.mjs`
- `tests/tutorialStartupFlow.test.mjs`
- `docs/implementation-logs/2026-05-27-revert-idle-gate-keep-overview-startup.md`

## Exact behavior changed

- Removed the general map-interaction idle gate that deferred model streaming during drag, zoom, camera movement, and floor switching.
- Removed the startup model preload step that could load overview models before the startup camera animation.
- Kept the startup gate budget at 25 seconds.
- Kept startup camera protection so background geometric cache work and model streaming wait while `_isStartupCameraAnimating` is true.
- On startup overview load, model metadata is prepared before the loading overlay completes, but 3D model streaming is not started yet.
- After the startup camera sequence finishes, if the current floor is an overview floor, `_loadModelsForFloor(currentFloorId)` starts the overview 3D model stream.

## Security decisions made

- No authentication, authorization, cookie, database credential, or static-serving behavior was changed.
- No admin API protection behavior was changed.

## Tests/build commands run and results

- `node --test tests\tutorialStartupFlow.test.mjs tests\startupLoadingBudget.test.mjs`
  - Result: passed, 7 tests passed, 0 failed.
  - Note: Node emitted a module type warning for `startupLoadingBudget.js`; tests still passed.
- `npm run build`
  - Result: passed.
  - Note: Vite emitted existing bundle-size and CJS API deprecation warnings.

## Known remaining risks

- This does not fix any stutter caused internally by Mappedin SDK rendering or browser GPU work.
- Overview 3D models now intentionally start after the startup camera completes, so models may appear after the initial camera movement rather than during the loading overlay.
- Floor-switch and user-interaction idle smoothing was intentionally reverted per request, so it is not active.

## Items intentionally not changed

- Map colors and area rendering.
- Admin authentication and authorization.
- Database connection settings.
- Wayfinding, connection, stair, elevator, or escalator routing logic.
- Floor-switch model streaming behavior outside the startup overview flow.
