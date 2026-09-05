# Hide Persistent Location Markers Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide default circular location icons and small names while preserving native 3D text, route calculation/drawing, and interactive transient markers.

**Architecture:** Use one local disabled-by-default visibility flag shared by the four persistent marker creation paths. Each renderer keeps cleanup-first behavior and exits before constructing or adding markers when disabled.

**Tech Stack:** TypeScript, Node.js built-in test runner, Vite

---

## Chunk 1: Persistent location marker visibility

### Task 1: Disable all persistent circular location markers

**Files:**
- Modify: `main/main-function/index.ts:4093`
- Modify: `main/main-function/index.ts:4127`
- Modify: `main/main-function/index.ts:4449`
- Modify: `main/main-function/index.ts:5339`
- Modify: `main/main-function/index.ts:5721`
- Modify: `main/main-function/index.ts:5811`
- Create: `tests/source/locationMarkerVisibilitySource.test.mjs`

- [ ] **Step 1: Write the failing source regression test**

Create a test that reads `main/main-function/index.ts` and asserts:

```js
assert.match(source, /const SHOW_LOCATION_MARKERS = false;/);
assert.match(renderObjectPrefix, /clearObjectMarkers\(\);\s*if \(!SHOW_LOCATION_MARKERS\) return;/);
assert.match(connectionPrefix, /clearConnectionOverlays\(\);\s*if \(!SHOW_LOCATION_MARKERS\) return;/);
assert.match(refreshPrefix, /currentLocationMarkers = \[\];\s*if \(!SHOW_LOCATION_MARKERS\) return;/);
assert.match(mainEntrancePrefix, /if \(!SHOW_LOCATION_MARKERS\) \{[\s\S]*?Markers\.remove\(mainEntranceMarker\)[\s\S]*?mainEntranceMarker = null;[\s\S]*?return;/);
assert.match(source, /if \(SHOW_LOCATION_MARKERS && !mainEntranceMarker && mainEntranceObject\)/);
```

Slice each function only up to its first marker construction statement so the guards must occur before creation. For `recreateMainEntranceMarker`, assert that the disabled guard begins immediately after the function opening and therefore precedes `if (!mainEntranceObject) return` as well as marker HTML construction.

The hidden connection overlays intentionally remove their direct-click floor-switch target. Do not change route calculation, route drawing, instruction-driven floor changes, or transient search/category/navigation markers.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/source/locationMarkerVisibilitySource.test.mjs`

Expected: FAIL because `SHOW_LOCATION_MARKERS` and its guards do not exist.

- [ ] **Step 3: Implement the minimal shared guard**

Add:

```ts
const SHOW_LOCATION_MARKERS = false;
```

After cleanup in `renderObjectMarkersForCurrentFloor`, `renderConnectionOverlaysForCurrentFloor`, and `refreshLocationMarkers`, return when the flag is false. At the very start of `recreateMainEntranceMarker`, remove any existing marker, null it, and return when disabled. Gate the non-overview call with `SHOW_LOCATION_MARKERS`.

- [ ] **Step 4: Run targeted source tests**

Run: `node --test tests/source/locationMarkerVisibilitySource.test.mjs tests/source/mapNameMarkerVisibilitySource.test.mjs`

Expected: PASS with 2 tests and 0 failures.

- [ ] **Step 5: Run production build in an isolated output directory**

Run: `npx vite build --outDir .verification-dist`

Expected: exit code 0. Remove only the verified `.verification-dist` directory afterward.

- [ ] **Step 6: Review the final diff**

Run `git diff --check` and inspect the scoped diff. Preserve the baseline uncommitted map-name-marker hunks in `main/main-function/index.ts`, `tests/source/mapNameMarkerVisibilitySource.test.mjs`, the existing map-name design/plan documents, and the pre-existing changes to `package-lock.json` and `backend/package-lock.json`.

- [ ] **Step 7: Commit only if the user later requests it**

The current request does not authorize a commit, push, or pull request.
