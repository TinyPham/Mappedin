# Mobile User Guide Control State Layering Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the guide visible and prevent mobile floor/language controls from appearing over ordinary tutorial steps, while preserving them for the dedicated floor/language tutorial step.

**Architecture:** Remove the failed root-level modal portal and retain the modal under `#main-content`. Synchronize a `user-guide-controls-step` body class from the active tutorial step, then use mobile-only CSS to conceal controls on ordinary steps and reveal them at a lower layer on `mobile-floor-language`.

**Tech Stack:** TypeScript, CSS, DOM APIs, Node.js built-in test runner, Vite

---

## Files

- Modify `tests/mobileUserGuideLayering.test.mjs`: replace the portal contract with DOM ownership, lifecycle, step-state, and CSS visibility contracts.
- Modify `main/main-function/index.ts`: remove the portal; toggle and clean up the step-specific body class.
- Modify `main/css/styles.css`: add mobile-only guide-state rules for floor/language controls.

### Task 0: Create an isolated feature worktree

- [ ] Commit only this reviewed plan on `main`.
- [ ] Verify `.worktrees` is ignored and create branch `fix/mobile-user-guide-control-state` at the current `main` HEAD in `.worktrees/mobile-user-guide-control-state`.
- [ ] Install dependencies and run the related baseline suite.
- [ ] Confirm the feature worktree starts clean and contains `MAX_CONCURRENT_MODELS = 200`; the user's unstaged `300` hunk must remain only in the main workspace.

### Task 1: Replace the failed portal regression with the desired state contract

- [ ] Update `tests/mobileUserGuideLayering.test.mjs` to assert:
  - `#user-guide-modal` is nested inside `#main-content` in `main/html/index.html`.
  - user-guide setup does not append the modal to `document.body`.
  - `renderUserGuideStep` toggles `user-guide-controls-step` only when the active mobile step id is `mobile-floor-language`.
  - `closeUserGuide` removes both `user-guide-open` and `user-guide-controls-step`.
  - the empty-step guard in `openUserGuide` precedes modal reveal and both guide body states.
  - a non-empty `openUserGuide` reveals the modal, adds `user-guide-open`, and then renders the first step.
  - mobile CSS disables pointer events for both controls while guide is open, hides both controls outside `user-guide-controls-step`, and restores visibility with a z-index below `9000` inside that step.
  - real tutorial data still targets both controls.
- [ ] Run `node --test tests/mobileUserGuideLayering.test.mjs` and verify RED for the portal/state/CSS differences.
- [ ] Commit only the test with `test: reproduce guide control state layering`.

### Task 2: Implement the minimal guide-state fix

- [ ] Remove the `document.body.appendChild(userGuideModal)` guard from `main/main-function/index.ts`.
- [ ] In `renderUserGuideStep`, toggle:

```ts
document.body.classList.toggle(
  'user-guide-controls-step',
  Boolean(step && window.innerWidth <= 768 && step.id === 'mobile-floor-language')
);
```

Do this before the empty-step return so stale state is cleared.

- [ ] In `closeUserGuide`, remove `user-guide-controls-step` beside `user-guide-open`.
- [ ] In the existing mobile guide media query in `main/css/styles.css`, add:

```css
body.user-guide-open #custom-floor-wrapper,
body.user-guide-open #custom-lang-wrapper {
  pointer-events: none !important;
}

body.user-guide-open:not(.user-guide-controls-step) #custom-floor-wrapper,
body.user-guide-open:not(.user-guide-controls-step) #custom-lang-wrapper {
  visibility: hidden !important;
}

body.user-guide-open.user-guide-controls-step #custom-floor-wrapper,
body.user-guide-open.user-guide-controls-step #custom-lang-wrapper {
  visibility: visible !important;
  z-index: 0 !important;
}
```

- [ ] Run the targeted test and verify GREEN.
- [ ] Run related tutorial, directions, area-info, and mobile control tests.
- [ ] Stage only `main/main-function/index.ts` and `main/css/styles.css`; inspect the staged diff to confirm no concurrency hunk or unrelated change is present.
- [ ] Commit production changes with `fix: keep guide controls below tutorial panel`.

### Task 3: Verify and integrate

- [ ] Run the full targeted/related suite with zero failures.
- [ ] Run `npm run build` successfully.
- [ ] Run `git diff --check` and inspect the complete branch diff.
- [ ] Review spec compliance and code quality.
- [ ] In the main workspace, stash only `main/main-function/index.ts`, fast-forward `fix/mobile-user-guide-control-state` into `main`, then pop that stash.
- [ ] Verify the only remaining unstaged diff is `MAX_CONCURRENT_MODELS = 300`; feature commits must contain no concurrency hunk.
- [ ] Re-run targeted tests and build on `main`; confirm the dev server serves the new state class code.
