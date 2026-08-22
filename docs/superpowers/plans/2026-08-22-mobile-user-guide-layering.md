# Mobile User Guide Layering Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the mobile floor and language controls below the user-guide panel in every tutorial step, including while directions or area information is active.

**Architecture:** Preserve the existing guide modal node and portal it from `#main-content` to `document.body` during initialization. The modal's existing root-level `z-index: 9000` then consistently outranks the maximum control/sidebar layer (`7000`) without changing guide layout, control visibility, or tutorial highlight targets.

**Tech Stack:** TypeScript, CSS, DOM APIs, Node.js built-in test runner, Vite

---

## File Structure

- Create `tests/mobileUserGuideLayering.test.mjs`: source/CSS regression coverage for root-level modal ownership and stacking priority.
- Modify `main/main-function/index.ts`: move the existing user-guide modal node to `document.body` exactly once during initialization.
- Preserve `main/css/styles.css` and `main/css/responsive.css`: existing guide/control/sidebar z-index values are sufficient once the modal escapes `#main-content`.

### Task 0: Commit the reviewed implementation plan

**Files:**
- Create: `docs/superpowers/plans/2026-08-22-mobile-user-guide-layering.md`

- [ ] **Step 1: Confirm setup did not alter the lockfile**

```powershell
git diff --exit-code -- package-lock.json
```

Expected: exit code 0 and no diff.

- [ ] **Step 2: Commit only the plan**

```powershell
git add docs/superpowers/plans/2026-08-22-mobile-user-guide-layering.md
git commit -m "docs: plan mobile user guide layering"
```

### Task 1: Add the failing user-guide layering regression test

**Files:**
- Create: `tests/mobileUserGuideLayering.test.mjs`
- Read: `tests/tutorialUiStructure.test.mjs`
- Read: `tests/mobileDirectionsLayering.test.mjs`
- Read: `main/main-function/index.ts:2471-2484`
- Read: `main/css/styles.css:3029-3039`
- Read: `main/css/responsive.css:175-181`

- [ ] **Step 1: Write a source test for root-level modal ownership**

Create a source regression test that reads `main/main-function/index.ts`, extracts the setup surrounding `const userGuideModal`, and requires this idempotent ownership guard:

```js
assert.match(
  setupBlock,
  /if\s*\(userGuideModal\s*&&\s*userGuideModal\.parentElement !== document\.body\)\s*{[\s\S]*?document\.body\.appendChild\(userGuideModal\)/
);
```

Also assert that `appendChild(userGuideModal)` occurs exactly once and that the setup does not call `cloneNode`, `createElement`, or replace `innerHTML`.

- [ ] **Step 2: Write a stacking contract test**

Read `main/css/styles.css` and `main/css/responsive.css`. Extract the base `.user-guide-modal` rule that declares `z-index`, plus `#main-sidebar-left.area-info-open` and `#main-sidebar-left.directions-info-open`. Assert that the guide modal's numeric `z-index` is greater than both sidebar state values and greater than `6500`, the maximum open floor/language dropdown layer. Later `.user-guide-modal` rules need not redeclare `z-index`; the test must respect normal CSS cascading instead of assuming the last matching rule contains every property.

- [ ] **Step 3: Protect the existing floor/language tutorial targets**

Read `src/tutorial/tutorialSteps.js` and assert that the `mobile-floor-language` step still targets both `#custom-floor-wrapper` and `#custom-lang-wrapper`. This ensures portaling the modal does not lead to hiding or removing the controls.

- [ ] **Step 4: Run the targeted test and verify RED**

Run:

```powershell
node --test tests/mobileUserGuideLayering.test.mjs
```

Expected: FAIL because the guide modal is not yet appended to `document.body`.

- [ ] **Step 5: Commit the failing test**

```powershell
git add tests/mobileUserGuideLayering.test.mjs
git commit -m "test: reproduce mobile user guide layering"
```

### Task 2: Portal the existing guide modal to the document root

**Files:**
- Modify: `main/main-function/index.ts:2471-2484`
- Test: `tests/mobileUserGuideLayering.test.mjs`

- [ ] **Step 1: Add the minimal idempotent portal**

Immediately after resolving `userGuideModal`, add:

```ts
if (userGuideModal && userGuideModal.parentElement !== document.body) {
  document.body.appendChild(userGuideModal);
}
```

Keep the existing `userGuideModal` reference and all subsequent element lookups/listeners unchanged.

- [ ] **Step 2: Run the targeted test and verify GREEN**

Run:

```powershell
node --test tests/mobileUserGuideLayering.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 3: Run related tutorial and layering tests**

Run:

```powershell
node --test tests/tutorialUiStructure.test.mjs tests/tutorialStartupFlow.test.mjs tests/tutorialMultiArrowRendering.test.mjs tests/tutorialDeviceDetection.test.mjs tests/tutorialAutoOpen.test.mjs tests/mobileTutorialBehavior.test.mjs tests/mobileDirectionsLayering.test.mjs tests/mobileAreaInfoLayering.test.mjs tests/mobileControlPositionCss.test.mjs
```

Expected: 38 tests PASS, zero failures.

- [ ] **Step 4: Commit the implementation**

```powershell
git add main/main-function/index.ts
git commit -m "fix: keep mobile guide above map controls"
```

### Task 3: Verify and integrate

**Files:**
- Verify only; no intended source changes

- [ ] **Step 1: Run targeted and related tests together**

```powershell
node --test tests/mobileUserGuideLayering.test.mjs tests/tutorialUiStructure.test.mjs tests/tutorialStartupFlow.test.mjs tests/tutorialMultiArrowRendering.test.mjs tests/tutorialDeviceDetection.test.mjs tests/tutorialAutoOpen.test.mjs tests/mobileTutorialBehavior.test.mjs tests/mobileDirectionsLayering.test.mjs tests/mobileAreaInfoLayering.test.mjs tests/mobileControlPositionCss.test.mjs
```

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Run the production build**

```powershell
npm run build
```

Expected: Vite exits successfully.

- [ ] **Step 3: Inspect the branch diff**

```powershell
git diff --check main...HEAD
git status --short
git diff --stat main...HEAD
```

Expected: no whitespace errors; the branch contains only the committed plan, regression test, and minimal modal portal. `package-lock.json` must be unchanged.

- [ ] **Step 4: Integrate into `main` while preserving user changes**

In the main workspace, stash only `main/main-function/index.ts`, fast-forward merge `fix/mobile-user-guide-layering`, then pop the stash. Verify the remaining unstaged diff is still only `MAX_CONCURRENT_MODELS = 300`.

- [ ] **Step 5: Re-run the targeted test and build on `main`**

Run the targeted guide-layering test and `npm run build` from the main workspace. Confirm both exit successfully before reporting completion.
