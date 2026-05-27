# Map Interaction Idle Streaming

## User request summary

The operator reported that the map still briefly stuttered when loading reached 100% before the startup camera rotation. The operator also asked for smoother floor changes and requested model/background work to pause while the user rotates, drags, zooms, or while floor switching is in progress.

## Files changed

- `index.ts`
- `tests/tutorialStartupFlow.test.mjs`
- `docs/implementation-logs/2026-05-27-map-interaction-idle-streaming.md`

## Exact behavior changed

- Added an interaction idle gate using `MAP_INTERACTION_IDLE_MS`.
- Camera changes now mark the map as actively interacting.
- Model streaming is deferred while any of these are active:
  - startup camera animation;
  - user camera interaction;
  - camera reset;
  - global/manual floor switching;
  - programmatic zoom.
- Deferred model streaming is retried only after the map has been idle.
- Startup preload no longer calls live model streaming immediately before the camera starts; it only registers the current floor and lets deferred streaming resume after the startup camera finishes.
- Background geometric cache now waits while deferred work is paused.
- Manual and smart floor switch flows request deferred streaming only after their floor-switch locks are released.

## Security decisions made

- No authentication, authorization, cookie, database, or environment behavior was changed.
- No viewer write behavior was added.

## Tests/build commands run and results

- `node --test tests\tutorialStartupFlow.test.mjs tests\startupLoadingBudget.test.mjs` - passed, 7 tests.
- `npm run build` - passed.

## Known remaining risks

- If the Mappedin SDK performs internal rendering work during `setFloor` or `animateTo`, this code cannot pause that internal SDK work.
- Browser smoothness still needs manual verification on the target hardware.
- Model loading resumes slightly later after interactions, so some nearby 3D models may appear a short moment after the camera stops.

## Items intentionally not changed

- Map colors and area rendering.
- Wayfinding routes.
- Admin login/auth behavior.
- Database connection settings.
