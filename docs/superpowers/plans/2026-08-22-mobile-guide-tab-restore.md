# Mobile Guide Tab Restore Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the mobile sidebar tab that was active before the user guide opened so closing the guide returns an active route to Directions before floor/language controls reappear.

**Architecture:** Add a small tutorial tab-state module that captures the active Search/Directions tab and restores it through the existing tab click handlers. Its mobile-close helper restores the tab and only then invokes a supplied guide-state release callback, making the critical ordering runtime-testable. Wire it into the existing guide lifecycle only for guides opened at mobile width; retain the existing desktop cleanup.

**Tech Stack:** TypeScript, browser DOM APIs, JavaScript ES modules, Node.js built-in test runner, Vite.

---

## File Structure

- Create `src/tutorial/tutorialTabState.js`: focused capture/restore helpers for Search and Directions tabs.
- Create `tests/tutorialTabState.test.mjs`: runtime behavioral tests for the tab helper and the route-information restoration sequence.
- Modify `tests/mobileUserGuideLayering.test.mjs`: source-level lifecycle contract and close-path regression coverage.
- Modify `main/main-function/index.ts`: capture mobile entry state on open and restore it on close.

### Task 1: Runtime tab-state behavior

**Files:**
- Create: `tests/tutorialTabState.test.mjs`
- Create: `src/tutorial/tutorialTabState.js`

- [ ] **Step 1: Write the failing runtime tests**

Create fake Search/Directions elements whose `click()` methods update active classes. In the Directions test, also model the existing `syncDirectionsInfoPanelVisibility` effect by adding `directions-info-open` only when the route summary is visible and Directions becomes active.

```js
test('restores Directions and route stacking before guide state is released', () => {
  const fixture = createTabFixture({ activeTab: 'directions', routeSummaryVisible: true });
  const captured = captureActiveTutorialTab(fixture.document);

  fixture.search.click(); // first mobile guide step
  assert.equal(fixture.sidebar.classList.contains('directions-info-open'), false);

  restoreTutorialTabBeforeGuideRelease(fixture.document, captured, () => {
    fixture.body.classList.remove('user-guide-open');
  });

  assert.equal(fixture.directions.classList.contains('active'), true);
  assert.equal(fixture.sidebar.classList.contains('directions-info-open'), true);
  assert.equal(fixture.directionsClickObservedGuideOpen, true);
  assert.equal(fixture.body.classList.contains('user-guide-open'), false);
});
```

Also cover Search restoration and a `null` capture that performs no click.

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test tests/tutorialTabState.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/tutorial/tutorialTabState.js`.

- [ ] **Step 3: Implement the minimal helper module**

```js
export function captureActiveTutorialTab(documentRef) {
  if (documentRef.getElementById('tab-directions')?.classList.contains('active')) return 'directions';
  if (documentRef.getElementById('tab-search')?.classList.contains('active')) return 'search';
  return null;
}

export function restoreTutorialTab(documentRef, tab) {
  if (tab !== 'search' && tab !== 'directions') return false;
  const tabElement = documentRef.getElementById(tab === 'directions' ? 'tab-directions' : 'tab-search');
  if (!tabElement) return false;
  tabElement.click();
  return true;
}

export function restoreTutorialTabBeforeGuideRelease(documentRef, tab, releaseGuideState) {
  restoreTutorialTab(documentRef, tab);
  releaseGuideState();
}
```

- [ ] **Step 4: Run the new test and verify GREEN**

Run: `node --test tests/tutorialTabState.test.mjs`

Expected: all new tests PASS.

- [ ] **Step 5: Commit the runtime helper**

```bash
git add src/tutorial/tutorialTabState.js tests/tutorialTabState.test.mjs
git commit -m "test: model mobile guide tab restoration"
```

### Task 2: Wire mobile guide lifecycle

**Files:**
- Modify: `tests/mobileUserGuideLayering.test.mjs`
- Modify: `main/main-function/index.ts:1-20,2480-2490,2831-2869`

- [ ] **Step 1: Write failing lifecycle contract tests**

Extend `tests/mobileUserGuideLayering.test.mjs` to assert:

- The capture helper and restoration-before-release helper are imported from `src/tutorial/tutorialTabState.js`.
- `openUserGuide` determines whether the guide opened at mobile width, captures the current tab only after the non-empty-step guard, and does so before `renderUserGuideStep()` can switch to Search.
- `closeUserGuide` restores the captured mobile tab before removing `user-guide-open`, clears both captured tab and mobile-session state, and retains the existing desktop Search cleanup.
- Close button, modal backdrop, Escape, and Done all call the same `closeUserGuide` function.

- [ ] **Step 2: Run the lifecycle test and verify RED**

Run: `node --test tests/mobileUserGuideLayering.test.mjs`

Expected: existing tests PASS and the new lifecycle assertions FAIL because mobile entry-tab capture/restoration is absent.

- [ ] **Step 3: Implement minimal lifecycle wiring**

Import the helper functions and add session state next to the other guide state:

```ts
let guideOpenedAtMobileWidth = false;
let guideEntryTab: 'search' | 'directions' | null = null;
```

After `activeGuideSteps.length === 0` has been guarded in `openUserGuide`, capture before rendering:

```ts
guideOpenedAtMobileWidth = window.innerWidth <= 768;
guideEntryTab = guideOpenedAtMobileWidth ? captureActiveTutorialTab(document) : null;
```

At the start of the restoration section in `closeUserGuide`, define one release callback that clears the mobile session fields and removes both guide body classes. Mobile close must pass that callback to the runtime-tested restoration-before-release helper; desktop keeps its existing Search restoration and then invokes the same release callback:

```ts
const releaseGuideState = () => {
  guideOpenedAtMobileWidth = false;
  guideEntryTab = null;
  document.body.classList.remove('user-guide-open');
  document.body.classList.remove('user-guide-controls-step');
};

if (guideOpenedAtMobileWidth) {
  restoreTutorialTabBeforeGuideRelease(document, guideEntryTab, releaseGuideState);
} else if (window.innerWidth > 768) {
  // existing desktop Search restoration
  releaseGuideState();
} else {
  releaseGuideState();
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/tutorialTabState.test.mjs tests/mobileUserGuideLayering.test.mjs tests/mobileDirectionsLayering.test.mjs tests/mobileTutorialBehavior.test.mjs`

Expected: all focused tests PASS.

- [ ] **Step 5: Commit lifecycle wiring**

```bash
git add main/main-function/index.ts tests/mobileUserGuideLayering.test.mjs
git commit -m "fix: restore mobile route tab after guide"
```

### Task 3: Regression and production verification

**Files:**
- Verify only; no planned production changes.

- [ ] **Step 1: Run the related regression suite**

Run:

```bash
node --test tests/tutorialTabState.test.mjs tests/tutorialUiStructure.test.mjs tests/tutorialStartupFlow.test.mjs tests/tutorialMultiArrowRendering.test.mjs tests/tutorialDeviceDetection.test.mjs tests/tutorialAutoOpen.test.mjs tests/mobileTutorialBehavior.test.mjs tests/mobileDirectionsLayering.test.mjs tests/mobileAreaInfoLayering.test.mjs tests/mobileControlPositionCss.test.mjs tests/mobileSettingsAndBottomControlsCss.test.mjs tests/mobileUserGuideLayering.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 2: Build production assets**

Run: `npm run build`

Expected: Vite build succeeds; existing module-type and chunk-size warnings are acceptable.

- [ ] **Step 3: Check repository hygiene**

Run: `git diff --check && git status --short && git log -4 --oneline`

Expected: no whitespace errors; only intentional files are changed or committed. Confirm the worktree baseline still contains `MAX_CONCURRENT_MODELS = 200`; the user's unstaged `300` remains only in the main worktree.

- [ ] **Step 4: Request code review and integrate**

Run an independent spec-compliance review and code-quality review. After approval, verify the main worktree contains exactly the known unstaged constant change before temporarily stashing that one path:

```powershell
git -C D:\E-Map-Website\ERP-Mappedin status --short
git -C D:\E-Map-Website\ERP-Mappedin diff -- main/main-function/index.ts
git -C D:\E-Map-Website\ERP-Mappedin stash push -m "codex-preserve-max-300-mobile-guide-tab" -- main/main-function/index.ts
git -C D:\E-Map-Website\ERP-Mappedin merge --ff-only fix/mobile-guide-tab-restore
git -C D:\E-Map-Website\ERP-Mappedin stash pop
```

Before stashing, require `git status --short` to show only `M main/main-function/index.ts` and require its diff to contain only `MAX_CONCURRENT_MODELS = 200` changing to `300`; stop if either condition differs. After `stash pop`, require the same one-hunk diff and no other unstaged file. Re-run focused tests and build on `main`, then request the dev-server TypeScript and verify it contains the new capture/restore helper usage and `MAX_CONCURRENT_MODELS = 300`.
