# Mobile Directions Layering Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make an active mobile directions result sheet completely cover the fixed floor and language controls until the result is cleared.

**Architecture:** Centralize the directions-sheet stacking state in a small DOM helper that toggles `directions-info-open` on `#main-sidebar-left`. Route success activates the state; clear, failure, and empty-state paths deactivate it. A mobile-only CSS rule raises that sidebar state above the maximum dropdown layer without changing layout.

**Tech Stack:** TypeScript, CSS, Node.js built-in test runner, Vite

---

## File Structure

- Create `tests/mobileDirectionsLayering.test.mjs`: source/CSS regression tests for the directions overlay lifecycle and stacking contract.
- Modify `main/main-function/index.ts`: add the state helper and synchronize it with route-result lifecycle paths.
- Modify `main/css/responsive.css`: add the mobile-only `directions-info-open` stacking rule.

### Task 1: Add the failing directions-layering regression test

**Files:**
- Create: `tests/mobileDirectionsLayering.test.mjs`
- Read: `tests/mobileAreaInfoLayering.test.mjs`
- Read: `main/main-function/index.ts`
- Read: `main/css/responsive.css`

- [ ] **Step 1: Write the source lifecycle test**

Create a test using the existing `getBalancedBlock` helper pattern. Assert that:

```js
const helperBlock = getBalancedBlock(
  source,
  'const setDirectionsInfoPanelVisible = (isVisible: boolean) =>'
);

assert.match(
  helperBlock,
  /document\.getElementById\(["']main-sidebar-left["']\)[\s\S]*?classList\.toggle\(["']directions-info-open["'],\s*isVisible\)/
);
```

Also extract `clearNavigation`, `renderRouteNotFoundState`, and `updateWayfindingUI`. Locate the successful summary block only within the extracted `drawNavigation` body and after its local `summaryContainer` declaration, so the test cannot accidentally match another similarly named block. Require deactivation in clear/failure/empty-state paths and activation alongside the successful summary presentation.

- [ ] **Step 2: Write the CSS stacking test**

Extract the first `@media (max-width: 768px)` block and assert that `#main-sidebar-left.directions-info-open` contains only a `z-index` declaration greater than `6500`. Assert that this selector occurs exactly once in `responsive.css`.

- [ ] **Step 3: Run the targeted test and verify RED**

Run:

```powershell
node --test tests/mobileDirectionsLayering.test.mjs
```

Expected: FAIL because `setDirectionsInfoPanelVisible` and the mobile CSS state do not exist.

- [ ] **Step 4: Commit the failing test**

```powershell
git add tests/mobileDirectionsLayering.test.mjs
git commit -m "test: reproduce mobile directions layering"
```

### Task 2: Implement the directions overlay state

**Files:**
- Modify: `main/main-function/index.ts` near `setAreaInfoPanelVisible`, `clearNavigation`, `renderRouteNotFoundState`, route summary presentation, and `updateWayfindingUI`
- Modify: `main/css/responsive.css` inside `@media (max-width: 768px)` beside `#main-sidebar-left.area-info-open`
- Test: `tests/mobileDirectionsLayering.test.mjs`

- [ ] **Step 1: Add the centralized visibility helper**

Add beside the existing area-information helper:

```ts
const setDirectionsInfoPanelVisible = (isVisible: boolean) => {
  document
    .getElementById("main-sidebar-left")
    ?.classList.toggle("directions-info-open", isVisible);
};
```

- [ ] **Step 2: Deactivate state on clear, failure, and empty UI**

Call `setDirectionsInfoPanelVisible(false)` at the beginning of `clearNavigation`, in `renderRouteNotFoundState`, and in the empty-state branch of `updateWayfindingUI`. Keep the calls explicit so each exit path remains safe if its callers change later.

- [ ] **Step 3: Activate state when the successful route summary is shown**

In the successful result block, call:

```ts
setDirectionsInfoPanelVisible(true);
```

immediately before or after `summaryContainer.style.display = "block"`, so the parent stacking context is raised when the result becomes visible.

- [ ] **Step 4: Add the mobile-only stacking rule**

Beside the existing `area-info-open` rule, add:

```css
#main-sidebar-left.directions-info-open {
    z-index: 7000 !important;
}
```

- [ ] **Step 5: Run the targeted test and verify GREEN**

Run:

```powershell
node --test tests/mobileDirectionsLayering.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 6: Run the related mobile layering tests**

Run:

```powershell
node --test tests/mobileAreaInfoLayering.test.mjs tests/mobileControlPositionCss.test.mjs tests/mobileSettingsAndBottomControlsCss.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 7: Commit the implementation**

```powershell
git add main/main-function/index.ts main/css/responsive.css
git commit -m "fix: layer mobile directions above controls"
```

Do not stage the pre-existing `MAX_CONCURRENT_MODELS` working-tree change.

### Task 3: Full verification

**Files:**
- Verify only; no intended source changes

- [ ] **Step 1: Run the complete Node test suite**

Run:

```powershell
node --test tests/*.test.mjs tests/source/*.test.mjs
```

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Run the production build**

Run:

```powershell
npm run build
```

Expected: Vite build exits successfully.

- [ ] **Step 3: Inspect the final diff and working tree**

Run:

```powershell
git diff --check
git status --short
git diff -- main/main-function/index.ts main/css/responsive.css tests/mobileDirectionsLayering.test.mjs
```

Expected: no whitespace errors; the user's pre-existing model concurrency edit remains present and unstaged; implementation changes are limited to the planned lifecycle and CSS rules.
