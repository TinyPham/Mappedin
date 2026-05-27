# 2026-05-27 Revert Connection Route Visual Snap

## User Request Summary

Revert the previous connection route visual snap/debug implementation.

## Files Changed

- `index.ts`
- `tests/navigationInstructionRules.test.mjs`
- Removed `wayfindingConnectionVisuals.js`
- Removed `tests/wayfindingConnectionVisuals.test.mjs`
- Removed `docs/implementation-logs/2026-05-27-connection-route-visual-snap.md`
- Added `docs/implementation-logs/2026-05-27-revert-connection-route-visual-snap.md`

## Exact Behavior Changed

- Removed the visual-only connection snapping helper from route rendering.
- Removed the connection route debug `console.table`.
- Restored `mapView.Navigation.draw(directions, navigationOptions)` so the SDK route object is drawn directly again.
- Restored the source test expectation to match drawing the original `directions` object.

## Security Decisions Made

- No authentication, cookie, JWT, database, or secret-handling logic was changed.

## Tests And Build

- `node --test tests\navigationInstructionRules.test.mjs tests\wayfindingRouteTargets.test.mjs` passed: 37 tests passed.
- `npm run build` passed.
- Existing module-type, Vite CJS API, and bundle-size warnings remain.

## Known Remaining Risks

- The original Mappedin connection routing behavior is restored, including any existing issue where the route transitions at SDK graph nodes instead of visually reaching a connection icon.

## Items Intentionally Not Changed

- Labels were not changed.
- Map colors were not changed.
- Backend, database, admin auth, and `.env` were not changed.
