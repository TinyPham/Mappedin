# Stopover Route Continuity - Implementation And Rollback Record

## Scope

This change fixes two behaviors only:

1. Adjacent route legs must share one physical route target at an intermediate stopover.
2. Active and inactive paths in Mappedin multi-destination rendering must use the same blue style.

Instruction simplification, per-leg validation, stopover boundary adaptation, kiosk origin handling, and flight route-plan construction are unchanged.

## Root Cause

`resolveWayfindingRouteTargets()` previously resolved every leg endpoint independently. For a stopover with multiple doors, the inbound leg selected the door closest to the previous waypoint while the outbound leg selected the door closest to the next waypoint. As a result:

```text
legs[i].routeDestination !== legs[i + 1].routeOrigin
```

`Navigation.draw(Directions[])` correctly rendered those as separate paths, exposing a gap or crossing at the stopover. It also used Mappedin's default `inactivePathOptions` for non-current paths, making one leg lighter than the active leg.

## Changed Files

### `src/navigation/wayfindingRouteTargets.js`

- Added `chooseIntermediateCandidate()`.
- Added `resolveIntermediateRouteTarget()`.
- `resolveWayfindingRouteTargets()` now pre-resolves one target per waypoint.
- An intermediate waypoint is scored against both adjacent waypoints and the exact selected target is reused by both neighboring legs.
- Endpoint and one-leg route resolution retain the previous behavior.

Invariant introduced:

```js
legs[i].routeDestination === legs[i + 1].routeOrigin
```

### `main/main-function/index.ts`

- Added `navigationPathOptions` with `color` and `accentColor` set to `#214ca6`.
- Passed copies of this style to both `pathOptions` and `inactivePathOptions`.
- Kept `mapView.Navigation.draw(legDirections, navigationOptions)` unchanged.

### Tests

- `tests/wayfindingRouteTargets.test.mjs` covers a two-door stopover and requires a shared target.
- `tests/navigationInstructionRules.test.mjs` requires identical active/inactive path configuration.

## TDD Evidence

RED command:

```powershell
node --test tests/wayfindingRouteTargets.test.mjs tests/navigationInstructionRules.test.mjs
```

Expected failures observed:

- The inbound stopover target was `stop-left-door` while the outbound target was `stop-right-door`.
- `inactivePathOptions` and the shared blue path style were absent.

GREEN result after implementation: 57 tests passed, 0 failed.

Expanded verification:

```powershell
node --test tests/wayfindingRouteTargets.test.mjs tests/navigationInstructionRules.test.mjs tests/flightNavigationActions.test.mjs tests/kioskRuntime.test.mjs tests/source/kioskRuntimeIntegrationSource.test.mjs
npx tsc --noEmit --pretty false
npm run build
```

Results:

- Route, instruction, flight, and kiosk regression suite: 92 passed, 0 failed.
- TypeScript check: passed.
- Vite production build: passed (159 modules transformed).
- `git diff --check` for scoped files: passed; only the repository's existing LF-to-CRLF notices were emitted.

## Exact Rollback Guide

To restore independent stopover endpoint resolution only:

1. Remove `chooseIntermediateCandidate()` and `resolveIntermediateRouteTarget()` from `src/navigation/wayfindingRouteTargets.js`.
2. Remove the `routeTargets` pre-resolution block from `resolveWayfindingRouteTargets()`.
3. Restore these leg fields:

```js
routeOrigin: resolveWayfindingRouteTarget(origin, destination, options),
routeDestination: resolveWayfindingRouteTarget(destination, origin, options)
```

4. Remove the test named `reuses one physical route target on both sides of a multi-door stopover`.

To restore Mappedin's active/inactive default colors only:

1. Remove `navigationPathOptions` from `main/main-function/index.ts`.
2. Restore the previous inline `pathOptions` object with `accentColor: '#214ca6'` and width `0.7`.
3. Remove `inactivePathOptions`.
4. Remove the five corresponding source assertions from `tests/navigationInstructionRules.test.mjs`.

Do not revert the whole files because they contain unrelated kiosk, flight-navigation, URL, instruction, and route-quality work.

## Follow-up: Geometry-aware candidate selection

After the shared-boundary fix, real map data showed that two valid SDK legs could still cross in the
middle of a corridor. Sharing the stopover target guarantees continuity only at the stopover; it does
not guarantee that the complete polylines do not intersect or backtrack.

### Additional changed files

- Added `src/navigation/routeGeometryQuality.js`.
  - Detects same-floor intersections between adjacent `Directions.coordinates`.
  - Ignores only the legitimate shared stopover endpoint.
  - Measures collinear overlap/backtracking and boundary continuity gap.
  - Evaluates Mappedin-generated routes for stopover candidates in priority order.
  - In strict mode, returns only a route with zero intersections, at most `1m` overlap, and at most
    `1.5m` continuity gap.
- Updated `src/navigation/wayfindingRouteTargets.js`.
  - Exports `getIntermediateWayfindingRouteTargetCandidates()`.
  - Returns unique candidates in Mappedin priority order: entrances/doors before nodes and generated
    object-edge coordinates.
- Updated `main/main-function/index.ts`.
  - Two-leg routes now call `selectNonIntersectingStopoverRoute()` before drawing.
  - Runtime uses best-effort selection (`requireNonIntersecting: false`): it prefers a clean route,
    otherwise it keeps navigation available by selecting the valid candidate with the fewest
    intersections, then the smallest continuity gap, overlap, and total distance.
  - A route error is shown only when Mappedin cannot return usable directions for any candidate, not
    merely because every valid candidate has a geometry-quality warning.
  - The selected SDK `Directions` objects are reused by preparation and drawing, so the winning route
    is not calculated again.
  - Both active and inactive paths now use the documented Mappedin default path color `#4b90e2` and
    default white accent `#ffffff`.
- Added `tests/routeGeometryQuality.test.mjs` and expanded route/source regression tests.

### Follow-up rollback

To remove geometry-aware candidate selection while retaining the shared stopover target fix:

1. Delete `src/navigation/routeGeometryQuality.js` and `tests/routeGeometryQuality.test.mjs`.
2. Remove `getIntermediateWayfindingRouteTargetCandidates()` from
   `src/navigation/wayfindingRouteTargets.js` and its import in `main/main-function/index.ts`.
3. Remove the `selectNonIntersectingStopoverRoute` import, `preselectedDirections` map, and the
   `routeLegs.length === 2 && waypoints.length === 3` selection block from `index.ts`.
4. Restore `reusablePrimaryDirections` so it begins directly with `directionsRequestsMatch(...)`.
5. Remove the geometry-aware source assertions and candidate-list test.

To restore the former strict behavior that rejected every crossing candidate, set
`requireNonIntersecting` back to `true`. That behavior can display `Lỗi khi tìm đường đi` even when
Mappedin has returned otherwise usable directions, so it is not recommended for the current map.

To restore the dark custom color from the first continuity change only, change `color` and
`accentColor` in `navigationPathOptions` back to `#214ca6`. Do not remove `inactivePathOptions`, or the
second leg will again be rendered with a lighter inactive style.
