# Airport Route Geometry Implementation Log

## Task 1 Baseline

Captured before Task 1 edits on 2026-07-18 with:

```powershell
git diff -- src/navigation/wayfindingRouteTargets.js tests/wayfindingRouteTargets.test.mjs main/main-function/index.ts src/navigation/navigationInstructionRules.js tests/navigationInstructionRules.test.mjs
```

### Existing route behavior

- The pre-Task-1 policy uses `dp-optimal` for a one-leg route.
- The pre-Task-1 policy uses `greedy-los` for a multi-leg route.
- `main/main-function/index.ts` builds one smoothing object with radius `0.5`.
- The route loop manually combines coordinates, instructions, distance, path, and paths into `combinedDirections`.
- Rendering calls `mapView.Navigation.draw(directions, navigationOptions)`, where `directions` is the manual combined object.

### Pre-existing uncommitted changes to protect

- `src/navigation/wayfindingRouteTargets.js`: an uncommitted
  `getWayfindingRouteCalculationPolicy(routeLegCount)` export was already present.
  It returns `refineObjectTargets`, `compareAccessibleRoutes`, and a
  `smoothingMethod` of `dp-optimal` or `greedy-los`.
- `tests/wayfindingRouteTargets.test.mjs`: uncommitted work already imports that
  helper, asserts the old three-field policy, and checks the existing
  `index.ts` policy integration by source matching.
- `main/main-function/index.ts`: uncommitted route work already imports the
  policy helper, resolves route legs, gates object-target refinement and
  accessible-route comparison through the policy, logs route calculation
  stages, and selects the old `smoothingMethod` with radius `0.5`.
- `main/main-function/index.ts` also contains extensive unrelated uncommitted
  kiosk runtime/admin/origin-locking/camera work and flight-wayfinding changes.
  Those hunks must not be reverted or rewritten by this task.
- `src/navigation/navigationInstructionRules.js` and
  `tests/navigationInstructionRules.test.mjs` had no working-tree diff at this
  baseline and are outside Task 1 ownership.
- Other dirty tracked work that must remain untouched exists in
  `backend/server.ts`, `main/css/styles.css`, `main/html/index.html`,
  `src/navigation/flightNavigationActions.js`,
  `tests/flightNavigationActions.test.mjs`, and `vite.config.ts`.
- Existing untracked kiosk/config/database/test/plan files shown by
  `git status --short` are user or prior-task work and must remain untouched.

### Task 1 ownership

Only the policy export, its focused test, and this log are changed by Task 1.
Route integration in `main/main-function/index.ts` remains unchanged.

## Task 1 TDD Evidence

### RED

Command:

```powershell
node --test tests/wayfindingRouteTargets.test.mjs
```

Exit code: `1`. Result: `14` passed and `1` failed. The focused policy
assertion received the old `{ smoothingMethod: "dp-optimal" }` contract
instead of `primarySmoothing` and `fallbackSmoothing`, which is the expected
feature-missing failure.

### GREEN

Command:

```powershell
node --test tests/wayfindingRouteTargets.test.mjs
```

Exit code: `0`. Result: `15` passed and `0` failed. Node emitted the existing
`MODULE_TYPELESS_PACKAGE_JSON` warning; there were no test failures.

## Task 1 Exact Hunks

- `tests/wayfindingRouteTargets.test.mjs`: replaced only the existing
  three-field policy assertions with the approved one-leg and multi-leg full
  smoothing configuration assertions, and renamed that focused test.
- `src/navigation/wayfindingRouteTargets.js`: replaced only the
  `smoothingMethod` property inside the pre-existing uncommitted policy helper
  with `primarySmoothing` and `fallbackSmoothing`.
- `docs/implementation-logs/2026-07-18-airport-route-geometry.md`: created this
  baseline and TDD record.
- No route integration hunk was changed in `main/main-function/index.ts`.

## Task 1 Review Follow-up: Early Contract-Consumer Update

Code review found that the active `index.ts` consumer still read the removed
`routeCalculationPolicy.smoothingMethod` property. That made the production
smoothing method undefined after the Task 1 policy contract changed.

This follow-up expands Task 1 ownership narrowly to the existing route-policy
consumer:

- `tests/wayfindingRouteTargets.test.mjs`: the source assertion now requires
  `smoothing: routeCalculationPolicy.primarySmoothing` and rejects any
  `routeCalculationPolicy.smoothingMethod` reference.
- `main/main-function/index.ts`: removed only the locally reconstructed
  `smoothingConfig` object and passed
  `routeCalculationPolicy.primarySmoothing` directly to the existing preview,
  accessible/non-accessible variant, and fast-route primary calls.
- Existing route branching, call counts, accessible comparison, object-target
  refinement, manual `combinedDirections`, and
  `Navigation.draw(directions, navigationOptions)` remain unchanged.
- No fallback smoothing or `Directions[]` rendering was implemented.

This is an early contract-consumer update required to keep the active route
integration valid between Task 1 and the later integration task.

### Review follow-up RED/GREEN

- RED: `node --test tests/wayfindingRouteTargets.test.mjs` exited `1`; `14`
  tests passed and the source-integration test failed because direct
  `primarySmoothing` usage was absent.
- GREEN: the same command exited `0`; all `15` tests passed.

## Task 2: Per-Leg Navigation Instruction Pipeline

Task 2 changes only:

- `src/navigation/navigationInstructionRules.js`
- `tests/navigationInstructionRules.test.mjs`
- this implementation log

No Task 2 hunk changes `main/main-function/index.ts`, language formatting,
route calculation, kiosk behavior, flight behavior, or any other dirty
working-tree file.

### Task 2 API Shape

```js
validateNavigationInstructionsAgainstPath(instructions, options)
// {
//   valid,
//   reason,
//   coordinateIndices,
//   coordinateFloorIds,
//   displayDistance,
//   walkingDisplayDistance,
//   routeDistance,
//   distanceDeviation,
//   distanceTolerance,
//   maxCoordinateDistanceMeters
// }

prepareNavigationLeg(legDirections, options)
// {
//   legDirections,
//   legInstructions,
//   legCoordinates,
//   legDistance,
//   legIndex,
//   validation,
//   usedFallback,
//   instructionSource,
//   fallbackReason
// }

aggregateNavigationLegs(preparedLegs, options)
// {
//   legDirections,
//   uiDirections: { coordinates, instructions, distance },
//   legSpans
// }
```

`legSpans` uses inclusive `coordinateStartIndex`,
`coordinateEndIndex`, `instructionStartIndex`, and `instructionEndIndex`
fields. Intermediate stopover labels come from
`options.waypointLabels[legIndex + 1]`; `boundaryWaypointLabels[legIndex]` is
also accepted as a boundary-only alias.

### Task 2 TDD Evidence

#### Initial RED

Command:

```powershell
node --test tests/navigationInstructionRules.test.mjs
```

Exit code: `1`. Node stopped at module import because
`aggregateNavigationLegs` was not exported. This was the expected
feature-missing failure before any Task 2 production implementation.

#### Strong-Turn Review RED

After the first implementation passed the focused cases, self-review found
that validation checked retained turn instructions but did not detect a
strong path turn whose instruction had been removed completely. A regression
test was added before the fix.

The same command exited `1`: `34` tests passed and `1` failed. The focused
failure received `valid: true` instead of `false` for a displayed path with a
45-degree turn and no mapped turn instruction.

This historical interpretation was superseded by the code-quality review
below. A path bend without an SDK Turn instruction is valid; only strong Turn
actions present in the original SDK source must be preserved.

#### GREEN

Command:

```powershell
node --test tests/navigationInstructionRules.test.mjs
```

Exit code: `0`. Result: `35` passed and `0` failed. Node emitted the existing
`MODULE_TYPELESS_PACKAGE_JSON` warning; there were no test failures.

### Task 2 Exact Hunks

- `tests/navigationInstructionRules.test.mjs`: extended the existing import
  hunk with the three new exports and appended focused validator, preparation,
  aggregation, fallback, boundary, span, connection-floor, strong-turn,
  leg-local mapping, distance-edge, and no-mutation tests. Existing formatter
  and source-integration tests were not rewritten.
- `src/navigation/navigationInstructionRules.js`: appended private validation
  helpers and the
  `validateNavigationInstructionsAgainstPath(instructions, options)` export.
  Mapping is restricted to `options.pathCoordinates`, requires a strict floor
  match within `1.5m` by default, enforces nondecreasing indices, protects
  same-floor turns at `45` degrees, validates display-distance tolerance, and
  infers connection floors from adjacent walking instructions.
- `src/navigation/navigationInstructionRules.js`: appended
  `prepareNavigationLeg(legDirections, options)`. It always passes
  `legDirections.coordinates` to simplification and validation, applies
  minimum instruction normalization, and clones raw SDK instructions only
  when that leg fails validation.
- `src/navigation/navigationInstructionRules.js`: appended boundary helpers
  and `aggregateNavigationLegs(preparedLegs, options)`. It clones UI data,
  drops an exact duplicate boundary only when the floor ID is also known and
  equal, converts each intermediate arrival to one labeled stopover, removes
  later departures, retains the final arrival and all connection instructions,
  and calculates inclusive leg spans after adaptation. It does not invoke
  simplification across legs.
- `docs/implementation-logs/2026-07-18-airport-route-geometry.md`: appended
  this Task 2 API, TDD, exact-hunk, and rollback record.

### Task 2 Rollback Notes

To roll back Task 2 without disturbing Task 1 or unrelated dirty work:

1. Remove only the appended Task 2 helpers and three exports after
   `shouldRenderNavigationInstruction` in
   `src/navigation/navigationInstructionRules.js`.
2. Remove only the three Task 2 imports and the appended Task 2 tests after
   the existing final `index.ts` source test in
   `tests/navigationInstructionRules.test.mjs`.
3. Remove only the `Task 2: Per-Leg Navigation Instruction Pipeline` section
   from this log.

No commit was created, and rollback must not use a whole-worktree reset.

## Task 2 Code-Quality Review Resolution

The follow-up remains limited to the same three Task 2 owned files. No
formatter, `index.ts`, kiosk, flight, or route-calculation file was changed.

### Review RED Evidence

#### Distance, Corridor, and Getter RED

Command:

```powershell
node --test tests/navigationInstructionRules.test.mjs
```

Exit code: `1`. Result: `33` passed and `4` failed:

- a 90-degree corridor bend with no SDK Turn was rejected;
- raw fallback retained SDK `[0, 10, 10]` distances instead of normalized
  `[10, 10, 0]` display distances;
- a realistic `Departure(0) -> Arrival(22)` fallback produced a hidden
  zero-distance departure;
- getter-backed connection/action objects were lost by JSON cloning, so the
  expected fallback and connection identity were absent.

#### Source-Turn RED

After removing the blanket path-vertex requirement, a separate source-aware
regression was added before its implementation.

The same command exited `1`: `37` passed and `1` failed. Validation returned
`valid: true` after a simplified candidate removed a non-slight SDK Turn at a
90-degree path corner.

### Review GREEN Evidence

Command:

```powershell
node --test tests/navigationInstructionRules.test.mjs
```

Exit code: `0`. Result: `38` passed and `0` failed. Node emitted only the
existing `MODULE_TYPELESS_PACKAGE_JSON` warning.

### Exact Review Resolutions

1. **Raw fallback distance semantics**

   - Extracted the existing post-simplification SDK-to-display distance shift
     into `normalizeInstructionDisplayDistances`.
   - Both simplified output and per-leg raw fallback now use that same helper.
   - Raw action types, bearings, instructions, coordinates, and connection
     references are retained while cloned distances are shifted from SDK
     preceding-segment semantics to UI next-step semantics.
   - Realistic valid and invalid fixtures now use `Departure(0)` and carry
     traversed distance on the following Turn/Arrival. The 22m fallback keeps
     an actionable departure with 22m display and route distance.

2. **Source-aware strong turns**

   - Removed the rule requiring every path vertex at or above 45 degrees to
     have a Turn instruction.
   - `validateNavigationInstructionsAgainstPath` now accepts optional
     `options.sourceInstructions`; `prepareNavigationLeg` always supplies the
     leg's raw SDK instructions.
   - Only non-slight Turn actions present in that source are protected. Each
     must map within 1.5m on the same floor to displayed geometry of at least
     45 degrees and remain represented by a non-slight Turn in the simplified
     candidate.
   - A 90-degree degree-two corridor bend with no SDK Turn is valid.

3. **Getter-backed SDK members**

   - Replaced JSON serialization with non-mutating plain instruction, action,
     and coordinate shell cloning.
   - Required getter values are read explicitly. Connection objects are kept
     as immutable SDK references, preserving getter-backed `type`, `name`, and
     identity.
   - Split-turn cloning, simplification, minimum-route handling, fallback,
     boundary adaptation, and aggregate coordinates now use the shell clone
     path; no JSON clone remains in the instruction rules module.
   - Getter-backed elevator and escalator tests verify identity plus 3m/6m
     connection display distances after fallback and aggregation.

### Review Test Hunks

- Replaced relevant already-shifted preparation/aggregation fixtures with
  realistic SDK distance placement.
- Added getter-backed SDK instruction, action, and connection fixture classes.
- Added valid and invalid 22m short-leg normalization coverage.
- Added source-free 90-degree corridor and original SDK strong-turn coverage.
- Strengthened raw fallback assertions for action order, normalized distances,
  renderability, connection identity, and source immutability.

### Review Rollback Notes

To remove only this code-quality follow-up:

1. Revert the shell-clone helpers and restore the previous Task 2 clone
   implementation.
2. Inline the normalization block back into simplification and restore the
   previous raw fallback branch.
3. Remove `sourceInstructions` handling and restore the prior strong-turn
   validator block.
4. Remove only the review fixture classes/tests and restore the prior Task 2
   fixture distances.
5. Remove only this `Task 2 Code-Quality Review Resolution` section and the
   superseded-interpretation note above.

Do not reset the worktree or touch unrelated dirty files. No commit was
created.

## Task 2 Second Code-Quality Review Resolution

This follow-up fixes post-connection walking distance in raw SDK fallback and
changes only the same Task 2 owned source, test, and log files.

### Second Review RED

Command:

```powershell
node --test tests/navigationInstructionRules.test.mjs
```

Exit code: `1`. Result: `37` passed and `1` failed. For the getter-backed SDK
sequence:

```text
Departure(0), TakeConnection(10), ExitConnection(0), Arrival(10)
```

the elevator fallback produced `[10, 3, 0, 0]` instead of
`[10, 3, 10, 0]`. The final 10m SDK walking segment was lost because raw
normalization forced an unmerged ExitConnection to zero before zeroing
Arrival.

### Second Review GREEN

Command:

```powershell
node --test tests/navigationInstructionRules.test.mjs
```

Exit code: `0`. Result: `38` passed and `0` failed. Node emitted only the
existing `MODULE_TYPELESS_PACKAGE_JSON` warning.

### Exact Resolution and Rationale

- `normalizeInstructionDisplayDistances` now assigns the following SDK
  segment to an unmerged ExitConnection before Arrival is zeroed.
- ExitConnection receives `_displayDistance` equal to that walking segment.
  Existing formatter behavior remains an Exit action, and the render filter
  keeps it visible because it now has actionable distance.
- The normalized elevator sequence is `[10, 3, 10, 0]`.
- The normalized escalator sequence is `[10, 6, 10, 0]`.
- The 3m/6m connection value remains a UI estimate on TakeConnection.
- Validator metadata now exposes both:
  - `displayDistance`: `23m` for elevator or `26m` for escalator;
  - `walkingDisplayDistance`: `20m` for both.
- Route-distance deviation compares `walkingDisplayDistance` with the SDK
  route's `20m` walking distance, so `distanceDeviation` is `0m`. The
  connection estimate no longer creates a false walking-distance mismatch.
- Arrival remains `0m`; no zero-distance walking instruction is introduced.
- Getter-backed connection identity and the original raw `[0, 10, 0, 10]`
  distances remain unchanged.

### Second Review Test Hunk

The existing getter-backed elevator/escalator fallback test now uses the exact
realistic SDK sequence above and asserts:

- final normalized arrays `[10, 3, 10, 0]` and `[10, 6, 10, 0]`;
- visible 10m ExitConnection;
- separate total UI and walking validation distances;
- zero route walking-distance deviation;
- source instruction immutability.

### Second Review Rollback

To remove only this follow-up:

1. Restore the previous unmerged ExitConnection branch in
   `normalizeInstructionDisplayDistances`.
2. Remove `instructionWalkingDistanceValue` and
   `walkingDisplayDistance`, restoring deviation to the prior display sum.
3. Restore only the previous getter-backed fallback assertions.
4. Remove this second-review section and the API-shape
   `walkingDisplayDistance` line.

No commit was created. Do not reset the worktree or alter unrelated dirty
files.

## Task 3: Directions Array and Sequential Per-Leg Fallback

Task 3 changes only:

- `main/main-function/index.ts`
- `src/navigation/navigationInstructionRules.js` (quality-review coordinate
  identity fix only)
- `tests/navigationInstructionRules.test.mjs`
- `tests/wayfindingRouteTargets.test.mjs`
- `tests/source/kioskRuntimeIntegrationSource.test.mjs`
- this implementation log

The quality-review follow-up changes
`src/navigation/navigationInstructionRules.js` only so aggregation preserves
SDK Coordinate element identity. Existing kiosk, flight, admin, route-target,
and Task 1/Task 2 dirty hunks remain in place. No commit was created.

### Old and New Route Flow

The old route hunk calculated accessible/non-accessible variants with
`Promise.all`, manually accumulated `allCoordinates`, `allInstructions`,
`totalDistance`, and `allPaths`, assigned that object to
`combinedDirections`, simplified instructions across the combined route, and
called:

```ts
mapView.Navigation.draw(directions, navigationOptions)
```

The new executable flow is:

1. Resolve the existing route targets and route calculation policy.
2. Define usable SDK `Directions` as a value whose `coordinates` is an array
   with at least two entries.
3. Await each leg in order. Its primary options use
   `routeCalculationPolicy.primarySmoothing` exactly once.
4. Pass fallback options only when the primary smoothing method is `rdp` and
   `routeCalculationPolicy.fallbackSmoothing` exists.
5. Retry only that failed or unusable leg once. A successful primary leg is
   never retried, and no route variants or fallbacks run in parallel.
6. Push each untouched SDK result into `const legDirections: any[]`.
7. Prepare each UI leg with:

```ts
prepareNavigationLeg(dir, {
  legIndex: i,
  routeDistance: dir.distance,
  pathCoordinates: dir.coordinates
})
```

8. Build waypoint labels from the actual origin, stopovers, and destination,
   then call `aggregateNavigationLegs(preparedLegs, { waypointLabels })`.
9. Draw only the SDK `Directions[]`; after that Promise resolves, commit
   `wayfindingDirections = uiDirections`, active controller/UI state, and URL:

```ts
await drawThenCommitNavigation({
  draw: () => mapView.Navigation.draw(legDirections, navigationOptions),
  commit: () => {
    wayfindingDirections = uiDirections;
    currentNavigation = mapView.Navigation;
    (window as any).isNavigationActive = true;
    syncURL(false);
  }
});
```

The legacy manual cross-leg combine hunk has been removed. The active route no
longer invokes cross-leg `simplifyNavigationInstructions` or
`ensureMinimumRouteInstructions`.

### Failure and Diagnostics Behavior

- `null`, `undefined`, and results with zero or one coordinate are unusable.
- A DP single-leg policy has no smoothing fallback.
- An RDP multi-leg primary rejection or unusable result retries that leg once
  with greedy LOS.
- A missing fallback, rejected fallback, or unusable fallback throws into the
  existing `drawNavigation` catch. That catch clears route state and renders
  the existing no-route/error UI. Drawing occurs only after every leg has
  completed, so no partial route is drawn and no straight-line substitute is
  created.
- Debug logging records each leg's elapsed milliseconds, coordinate count,
  source/UI instruction counts, instruction source, smoothing fallback use,
  and primary failure message. Aggregate logging records total coordinates,
  instructions, distance, and `legSpans`.

Review of all `wayfindingDirections` consumers found they require
`coordinates`, `instructions`, and `distance`; none reads `path` or `paths`.
The aggregate result therefore remains compatible with Blue Dot animation,
step animation/preview, route summary, and instruction rendering without
synthetic path fields.

### Task 3 TDD Evidence

#### RED

Command:

```powershell
node --test tests/wayfindingRouteTargets.test.mjs tests/source/kioskRuntimeIntegrationSource.test.mjs
```

Exit code: `1`. Result: `25` passed and `4` failed. The integration test could
not find `requestUsableLegDirections` or the `Directions[]` aggregation/draw
flow. These were the expected feature-missing failures before the production
hunk was changed.

#### Source GREEN

The same command exited `0`: `29` passed and `0` failed.

The executable source-helper tests prove:

- a rejected primary Promise produces exactly two sequential calls, RDP then
  greedy LOS, and returns the fallback result;
- a resolved primary with one coordinate is rejected by the same usability
  rule and retries exactly once;
- a primary with two coordinates is retained and is never retried.

#### Focused GREEN

Command:

```powershell
node --test tests/wayfindingRouteTargets.test.mjs tests/navigationInstructionRules.test.mjs tests/source/kioskRuntimeIntegrationSource.test.mjs
```

Exit code: `0`. Result: `67` passed and `0` failed. Node emitted only the
existing `MODULE_TYPELESS_PACKAGE_JSON` warnings.

#### Build

Command:

```powershell
npm run build
```

Exit code: `0`. Vite transformed `159` modules and completed the production
build. It emitted the existing CJS Node API deprecation and large-chunk
warnings. An earlier build attempt identified one loop brace accidentally
included in the bypassed legacy block; the brace was restored before this
successful build.

### Exact Task 3 Hunks

- `main/main-function/index.ts`: imported `prepareNavigationLeg` and
  `aggregateNavigationLegs`, removing the route-only simplify/ensure imports.
- `main/main-function/index.ts`: added the testable
  `requestUsableLegDirections` helper for one primary call and at most one
  sequential fallback call.
- `main/main-function/index.ts`: replaced active manual combination and
  parallel variant routing with per-leg SDK storage, preparation, aggregation,
  diagnostics, `uiDirections` state, and `Directions[]` drawing.
- `tests/wayfindingRouteTargets.test.mjs`: added source assertions for the RDP
  fallback gate, usable-coordinate rule, helper calls, aggregation, state,
  drawing target, and absence of active cross-leg simplification/parallel
  variants.
- `tests/source/kioskRuntimeIntegrationSource.test.mjs`: added an executable
  source-function extractor and reject, short-coordinate, and no-retry tests.
- `tests/navigationInstructionRules.test.mjs`: updated the old `index.ts`
  source assertions to require per-leg preparation, aggregation,
  `uiDirections` state, and `Directions[]` drawing.
- This log: added Task 3 flow, evidence, exact hunks, and rollback notes.

### Task 3 Rollback

To roll back only Task 3 without disturbing kiosk, flight, admin, Task 1, or
Task 2 work:

1. Remove only `aggregateNavigationLegs` and `prepareNavigationLeg` from the
   `index.ts` import hunk and restore the two removed route-only imports.
2. Remove `requestUsableLegDirections`.
3. Restore only the route loop from `const isUsableDirections` through the
   `uiDirections` aggregation/draw call to its prior manual
   `combinedDirections` implementation.
4. Remove only the appended Task 3 test in
   `tests/wayfindingRouteTargets.test.mjs`.
5. Remove only `extractFunction`, `loadRequestUsableLegDirections`, and the
   three appended helper tests in
   `tests/source/kioskRuntimeIntegrationSource.test.mjs`.
6. Restore only the two replaced Task 2-era `index.ts` source assertions and
   remove the structural-filter regression test in
   `tests/navigationInstructionRules.test.mjs`.
7. Restore the aggregate coordinate append from direct SDK Coordinate
   references to coordinate-shell clones, and remove only the corresponding
   getter-backed identity regression test.
8. Remove this Task 3 log section.

Do not reset or check out whole files. The owned files contain pre-existing
uncommitted work, and no commit exists to use as a whole-file rollback point.

## Task 3 Spec-Review Follow-up

Spec review found that the post-aggregation render filter dropped the
zero-distance stopover created by `aggregateNavigationLegs`.

### Follow-up RED

Command:

```powershell
node --test tests/navigationInstructionRules.test.mjs
```

Exit code: `1`. Result: `38` passed and `1` failed. The focused executable
test could not find the structural-action predicate, proving that the
post-aggregation filter had no way to retain a zero-distance stopover.

### Follow-up GREEN

The same command exited `0`: `39` passed and `0` failed.

`shouldKeepAggregatedNavigationInstruction` now preserves zero-distance route
boundaries and structural transitions:

- `departure` and `start`;
- `stopover`;
- `arrival` and `arrive`;
- `takeconnection` and `enter`;
- `exitconnection` and `exit`.

Other actions still use `shouldRenderNavigationInstruction`, so a
zero-distance walking `continue` remains hidden while a positive-distance
walking step remains visible.

The follow-up also:

- removed the obsolete commented manual `combinedDirections` block;
- removed the test-only migration comment;
- replaced stale Task 2-era source assertions with the real Task 3 pipeline
  and `Directions[]` draw contract.

### Pending Task 5 Browser Verification and Quality Metrics

No browser route was executed and no runtime route-quality metrics were
collected as part of Task 3. The following remain explicitly pending for
Task 5:

- website-mode and kiosk-mode browser verification;
- single-leg and multi-leg airport route interaction checks;
- flight route checks through check-in stopovers and gates;
- per-route coordinate, instruction, turn, connection, stopover, and timing
  measurements;
- post-draw pan, zoom, click, preview, and Blue Dot interaction checks.

Task 3 reports only automated source/helper tests, static consumer review,
debug instrumentation, and production build evidence.

### Follow-up Final Verification

The focused Task 3 command passed `68` tests with `0` failures after the
spec-review fixes. `npm run build` also exited `0` after transforming `159`
modules. Only the existing Node module-type, Vite CJS API, and large-chunk
warnings were emitted.

## Task 3 Quality-Review Follow-up

### Awaited Draw and Active State

The SDK declaration defines `Navigation.draw()` as `Promise<void>`. The old
assignment stored that Promise in `currentNavigation`. The new hunk awaits:

```ts
await mapView.Navigation.draw(legDirections, navigationOptions);
currentNavigation = mapView.Navigation;
```

`clearNavigation()` sets `currentNavigation` to `null` before route work
starts. The active UI flag is set only after the awaited draw. A rejected draw
therefore reaches the existing outer catch, whose
`renderRouteNotFoundState()` clears `wayfindingDirections`,
`currentNavigation`, the active flag, summary, and preview UI.

### Preview Reuse Call Semantics

Single-leg object-target refinement remains enabled. Its successful preview
is retained with the exact origin, destination, and primary options used for
that request. It is reused as the official leg's primary Directions only
when:

- the refined final origin and destination are the same object references;
- smoothing is the same reference;
- accessibility mode is equal;
- the preview remains usable with at least two coordinates.

When any comparison fails, the final endpoint pair gets one normal primary
request. Multi-leg policy does not run target refinement, so each leg still
gets exactly one sequential primary request and only a failed RDP leg can get
one fallback request.

### Coordinate Identity

`aggregateNavigationLegs` now creates a new coordinates array while appending
the original SDK Coordinate elements directly. It no longer spreads each
Coordinate into a plain shell. This preserves Coordinate prototype behavior,
getter-backed values, `anchorTarget`, and strict element identity for marker,
Blue Dot, and anchor consumers. Instruction shells remain independently
cloned.

### Quality-Review TDD Evidence

Before the production changes, the focused command reported `71` tests:
`67` passed and `4` failed. The expected failures covered Coordinate
prototype/identity loss, duplicate preview routing, missing exact request
matching, and the non-awaited draw lifecycle.

The added executable/source coverage proves:

- a matching usable preview causes zero additional SDK calls;
- endpoint, smoothing, or accessibility mismatch disables preview reuse;
- SDK Coordinate strict identity, prototype, getter values, and
  `anchorTarget` survive aggregation;
- draw is awaited before active state and `currentNavigation` assignment;
- the draw rejection catch invokes the existing state-clearing failure flow;
- no inert `if (false)` legacy simplification block remains.

### TypeScript Evidence

Before the type cleanup:

```powershell
npx tsc --noEmit --pretty false
```

reported `11` errors: `9` in the new Task 3 helpers/call sites and `2`
pre-existing flight-state errors. After explicit helper parameter/result
types, the usable-Directions type predicate, and smoothing narrowing to
`TGetDirectionsOptions['smoothing']`, the same command reports only the `2`
unrelated existing errors:

- `main/main-function/index.ts:14409` - `action` is not in the flight reset
  state type;
- `main/main-function/index.ts:14436` - the same unrelated flight reset
  state mismatch.

Task 3 TypeScript errors therefore changed from `9` to `0`; total repository
errors changed from `11` to `2`. No compiler checks were suppressed.

### Quality-Review Final Verification

```powershell
node --test tests/wayfindingRouteTargets.test.mjs tests/navigationInstructionRules.test.mjs tests/source/kioskRuntimeIntegrationSource.test.mjs
```

Exit code: `0`. Result: `71` passed and `0` failed.

```powershell
npm run build
```

Exit code: `0`. Vite transformed `159` modules. The output contained only the
existing Node module-type, Vite CJS API, and large-chunk warnings.

### Quality-Review Rollback

To roll back only this quality-review follow-up:

1. Remove the preview request record/matcher and
   `reusablePrimaryDirections` branch, restoring one official request after
   refinement.
2. Replace the awaited draw and Navigation-controller assignment with the
   prior draw lifecycle.
3. Restore coordinate-shell mapping only on the aggregate coordinates append.
4. Remove only the quality-review source/helper assertions and the
   getter-backed Coordinate identity test.
5. Restore the removed inert legacy block only if reproducing the exact prior
   state is required.
6. Remove this quality-review log section.

Do not reset or check out whole files; all owned files coexist with unrelated
dirty work.

## Task 3 Final Quality Fixes

### Instruction Coordinate Identity

Instruction cloning now creates new instruction and action shells while
retaining each immutable SDK `instruction.coordinate` reference. Synthetic
stopover coordinates also use the actual leg-boundary Coordinate. The removed
coordinate-shell helper no longer strips SDK prototypes, getter behavior, or
`anchorTarget`.

The getter-backed Coordinate regression test asserts strict identity,
prototype, and `anchorTarget` for both:

- `uiDirections.coordinates` elements;
- `uiDirections.instructions[*].coordinate` elements.

The same test mutates the aggregate instruction/action shells and confirms the
source SDK instruction and action remain unchanged.

### Draw, State, and URL Lifecycle

`drawThenCommitNavigation` awaits the SDK draw before invoking its commit
callback. The commit callback is the only place in the successful route hunk
that assigns:

```ts
wayfindingDirections = uiDirections;
currentNavigation = mapView.Navigation;
(window as any).isNavigationActive = true;
syncURL(false);
```

At the start of a new draw, the old active flag and aggregate Directions state
are cleared locally. `syncURL` emits a directions path only when
`wayfindingDirections` is committed and the existing kiosk route policy also
allows it. A rejected draw never calls the commit callback; the existing outer
catch calls `renderRouteNotFoundState`, which clears route state and calls
`syncURL(true)` after `wayfindingDirections = null`. The resulting URL
therefore has no directions path.

### Removed Legacy Code

The unreachable translation body after the immediate formatter return was
deleted. `translateActionType` is now only a typed delegation to
`instructionFormatter.format`. The local `findNearbyLandmark` helper was
referenced only by that unreachable body and was removed. The exported
`findNearbyLandmark` used by `createInstructionFormatter` remains unchanged.

### Final Quality TDD Evidence

The first focused RED run reported `72` tests: `69` passed and `3` failed for
the expected missing behavior:

- instruction Coordinate identity was lost;
- `drawThenCommitNavigation` did not exist;
- aggregate route state was assigned before the draw await.

After the production changes, the focused command passed `72` tests with `0`
failures:

```powershell
node --test tests/wayfindingRouteTargets.test.mjs tests/navigationInstructionRules.test.mjs tests/source/kioskRuntimeIntegrationSource.test.mjs
```

The executable rejected-draw test records `draw` but never `commit`. Source
assertions verify all externally active state and URL writes occur after the
awaited lifecycle, and that failure cleanup synchronizes a no-directions URL.

### Flight and Kiosk Regressions

The core flight/kiosk regression command passed `103` tests with `0`
failures, including flight actions/date/icon tests, kiosk mode/runtime/admin,
URL integration, and runtime integration.

The unrelated `tests/source/kioskPerformanceSource.test.mjs` suite was also
run separately. Its six existing expectations all remain failing: camera
logging, scheduled map dump, admin polling, model cap, debug gating, and
highlight reset. Those dirty performance/admin areas are outside Task 3 and
were not changed.

### Typecheck and Build

`npx tsc --noEmit --pretty false` reports only the same two unrelated
flight-state `action` errors, now at `main/main-function/index.ts:14331` and
`:14358`. Task 3 contributes zero TypeScript errors.

`npm run build` exits `0` after transforming `159` modules. It emits only the
existing Vite CJS API and large-chunk warnings.

### Final Quality Rollback

To roll back only these final fixes:

1. Restore coordinate-shell cloning in `cloneInstructionShell` and synthetic
   stopover construction.
2. Remove `drawThenCommitNavigation` and restore the pre-draw aggregate state
   assignments.
3. Remove `Boolean(wayfindingDirections) &&` from the `syncURL`
   `hasDirections` policy and remove failure-path URL synchronization.
4. Restore only the deleted unreachable formatter body and local landmark
   helper if exact legacy reproduction is required.
5. Remove only the final identity/lifecycle/source assertions and this log
   section.

Do not reset whole files or touch unrelated kiosk, flight, admin, performance,
or backend hunks. No commit was created.

## Task 4: Kiosk and Flight Regression Coverage

### Baseline Result

The required baseline command passed `111` tests with `0` failures:

```powershell
node --test tests/flightNavigationActions.test.mjs tests/kioskMode.test.mjs tests/kioskRuntime.test.mjs tests/wayfindingRouteTargets.test.mjs tests/navigationInstructionRules.test.mjs tests/source/kioskRuntimeIntegrationSource.test.mjs
```

Exit code: `0`. The output contained only the existing Node
`MODULE_TYPELESS_PACKAGE_JSON` warnings for JavaScript helpers outside a local
ESM package boundary.

### Coverage Map

No new regression test was needed. Existing coverage is split between
behavioral unit tests and source integration guards.

Behavioral unit tests:

- Departing flight `Tìm đường` from the kiosk/default origin through check-in
  to the gate: `builds kiosk departure plans for check-in, gate and full
  route` asserts `{ origin: kiosk, destination: gate, stopovers: [checkin] }`.
- Direct `Đến check-in` and `Đến gate` actions: the same test asserts each
  action uses the kiosk origin, one destination, and no stopovers.
- Arriving flight belt-only routing: `builds kiosk arrival plan with only the
  baggage belt as destination` asserts the kiosk origin, belt destination, and
  no stopovers.
- Website flight compatibility: `keeps the existing website departure route
  behavior` asserts the existing check-in-to-gate direct route remains
  unchanged.
- Kiosk origin locking and website origin flexibility: `effective origin
  policy always locks an active kiosk to its runtime origin` asserts a kiosk
  ignores a selected origin while website mode returns it.
- Stopover aggregation was deliberately not duplicated:
  `adapts kiosk to check-in to gate boundaries without merging across the
  stopover` already asserts the aggregated kiosk/check-in/gate coordinates and
  exactly one surviving `stopover` instruction.

Source integration guards:

- `Đi từ đây` and other UI wiring:
  `reorder, swap, info and map click paths cannot replace kiosk origin` checks
  source text for the info-action, swap, and map-click kiosk guards.
  `kiosk location details hide only the start-from-here action` checks source
  text for the kiosk-mode visibility ternary. These regex assertions verify
  that the intended UI wiring is present; they do not execute browser behavior.

Task 5 browser verification must behaviorally confirm that kiosk mode keeps
its configured origin through `Đi từ đây`, swap, map-click, drag, and related
UI interactions, and that website mode still permits a user-selected flexible
origin.

Task 4 did not add tests or edit
`tests/flightNavigationActions.test.mjs`, `tests/kioskMode.test.mjs`,
`tests/kioskRuntime.test.mjs`, or
`src/navigation/flightNavigationActions.js`. Existing dirty changes in those
files were preserved.

### Separate Kiosk Performance Baseline

The reported performance suite is:

```powershell
node --test tests/source/kioskPerformanceSource.test.mjs
```

It reads `main/main-function/index.ts` and reproduced `6` tests, `0` passed,
`6` failed, exit code `1`:

- `camera-change handler does not log every camera frame`: the camera-change
  handler still contains a per-frame `console.log`.
- `large map content dump is exposed manually but not scheduled
  automatically`: `setTimeout(logComprehensiveMapContent, 2000)` remains.
- `admin polling starts only after authenticated admin state and can be
  stopped`: a separate `if (!isViewOnly) { setInterval(async () => ...) }`
  polling path remains.
- `model streaming has a kiosk-safe concurrent model cap`:
  `MAX_CONCURRENT_MODELS` is `200`, not the expected `80`.
- `kiosk runtime diagnostics are gated behind explicit debug flag`:
  `isCategoryDebugEnabled` still enables debug from `checkIsLocal()`, and
  direct noisy runtime logs remain.
- `wayfinding highlight reset preserves original color refresh behavior`:
  the expected `isColorableMapObject` source block is absent.

These are baseline/pre-existing failures: the preceding Task 3 final-quality
section records the same six failures before Task 4 began. Both
`tests/source/kioskPerformanceSource.test.mjs` and
`main/main-function/index.ts` are outside Task 4 ownership and were not
changed.

## Task 5: Final Verification

### Browser Verification

The frontend and backend were running at:

```text
http://127.0.0.1:3000/
http://127.0.0.1:3002/
```

The kiosk route was opened with:

```text
http://127.0.0.1:3000/?mode=kiosk&kioskId=LT-KIOSK-01
```

A currently available departing flight was routed with the flight-card
`route` action. The observed route completed in `11,329ms` and produced:

```text
Origin: KIOSK TƯƠNG TÁC 01
Origin readonly: true
Stopover: Quầy thủ tục 01 - Đảo F
Destination: Cửa ra tàu bay 45
Rendered instruction rows: 26
Navigation active: true
```

The rendered instruction sequence retained the check-in boundary and then
continued to the gate. It included walking turns and airport landmarks after
the stopover instead of simplifying across the leg boundary.

Resetting the route produced:

```text
Navigation active: false
Destination: empty
Stopovers: 0
Origin: KIOSK TƯƠNG TÁC 01
Origin readonly: true
```

The reset URL retained `mode=kiosk`, `kioskId=LT-KIOSK-01`, and the configured
departure ID while removing the `/directions` path and destination.

The browser emitted two environment-level messages during the run:

- an unauthenticated request returned `401`;
- headless Edge denied geolocation permission.

Neither message prevented map initialization or route drawing.

The per-leg SDK Coordinate counts and `legDirections` objects are intentionally
local runtime state and are not exposed on `window`, so those values were not
fabricated in this log. Their structure is covered by executable unit/source
tests and route diagnostics in the browser console.

### Final Automated Verification

The complete focused route, kiosk, and flight command passed:

```powershell
node --test tests/flightNavigationActions.test.mjs tests/kioskMode.test.mjs tests/kioskRuntime.test.mjs tests/wayfindingRouteTargets.test.mjs tests/navigationInstructionRules.test.mjs tests/source/kioskRuntimeIntegrationSource.test.mjs
```

Result: `111` tests passed, `0` failed.

Production build:

```powershell
npm run build
```

Result: exit code `0`; Vite transformed `159` modules. The existing Vite CJS
API deprecation and large-chunk warnings remain.

TypeScript:

```powershell
npx tsc --noEmit --pretty false
```

Result: exit code `0`, no TypeScript errors.

Diff whitespace validation:

```powershell
git diff --check
```

Result: exit code `0`. Git reported only the repository's existing LF-to-CRLF
conversion notices.

### Final Type Contract Fix

`src/navigation/flightNavigationActions.js` now documents the
`buildFlightWayfindingPlan` options with JSDoc. The required `action` union is:

```text
checkin | gate | route | belt
```

This is a type-only contract clarification. It does not change runtime route
behavior. It removed the final two TypeScript errors at the flight route call
sites.

To roll back only this final type fix, remove the JSDoc block immediately
above `buildFlightWayfindingPlan`. Do not reset the whole file because it
contains earlier kiosk/flight work.
