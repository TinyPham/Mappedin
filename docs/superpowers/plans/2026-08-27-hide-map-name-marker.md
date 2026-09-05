# Hide Map Name Marker Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable the custom airport logo and venue-name marker on the overview map.

**Architecture:** Keep the current marker lifecycle and add a single disabled-by-default feature flag. Enforce it both inside marker creation and at the overview-floor call site so language and floor refreshes cannot recreate the marker.

**Tech Stack:** TypeScript, Node.js built-in test runner, Vite

---

## Chunk 1: Marker visibility

### Task 1: Disable the custom map-name marker

**Files:**
- Modify: `main/main-function/index.ts:4102`
- Modify: `main/main-function/index.ts:5570`
- Modify: `main/main-function/index.ts:5784`
- Create: `tests/source/mapNameMarkerVisibilitySource.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../main/main-function/index.ts', import.meta.url), 'utf8');

test('custom map logo and venue name marker stays disabled', () => {
  assert.match(source, /const SHOW_MAP_NAME_MARKER = false;/);

  const createStart = source.indexOf('const createMapNameMarker = () => {');
  const markerHtmlStart = source.indexOf('const markerHtml = `', createStart);
  const createPrefix = source.slice(createStart, markerHtmlStart);
  assert.match(createPrefix, /if \(!SHOW_MAP_NAME_MARKER\) \{[\s\S]*?return;[\s\S]*?\}/);

  assert.match(source, /if \(SHOW_MAP_NAME_MARKER && !mapNameMarker\) \{\s*createMapNameMarker\(\);/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/source/mapNameMarkerVisibilitySource.test.mjs`

Expected: FAIL because the visibility flag and guards do not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
const SHOW_MAP_NAME_MARKER = false;
let mapNameMarker: any = null;
```

At the start of `createMapNameMarker`:

```ts
if (!SHOW_MAP_NAME_MARKER) {
  if (mapNameMarker) {
    try {
      mapView.Markers.remove(mapNameMarker);
    } catch (e) { }
    mapNameMarker = null;
  }
  return;
}
```

Gate the overview call:

```ts
if (SHOW_MAP_NAME_MARKER && !mapNameMarker) {
  createMapNameMarker();
}
```

- [ ] **Step 4: Run the targeted test**

Run: `node --test tests/source/mapNameMarkerVisibilitySource.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run the production build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 6: Review the final diff**

Confirm only the intended TypeScript, regression test, and documentation files changed; preserve the user's pre-existing lockfile modifications.

- [ ] **Step 7: Commit if the user requests a commit**

No commit is authorized by the current request. If authorized later, run:

```bash
git add main/main-function/index.ts tests/source/mapNameMarkerVisibilitySource.test.mjs docs/superpowers/specs/2026-08-27-hide-map-name-marker-design.md docs/superpowers/plans/2026-08-27-hide-map-name-marker.md
git commit -m "fix: hide custom map name marker"
```
