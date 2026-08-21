# Mobile Area Information and Flight Filters Implementation Plan

**Goal:** Make the mobile area information sheet cover the fixed floor/language controls until closed, and make all mobile flight filters collapsed by default behind an accessible toggle.

**Architecture:** Keep the existing desktop DOM positions and layout. The area sheet raises its parent stacking context through an explicit open-state class. The flight modal uses one mobile-only toggle that coordinates the existing sidebar filter group and status toolbar through stable IDs and a collapsed class on the modal body.

**Tech stack:** HTML, responsive CSS, TypeScript, Node test runner, Vite.

## Task 1: Area information stacking regression

**Files:**
- Create: `tests/mobileAreaInfoLayering.test.mjs`
- Modify: `main/main-function/index.ts`
- Modify: `main/css/responsive.css`

1. Add a source/CSS test requiring `updateInfo()` to add `area-info-open`, `hideInfo()` to remove it, and the mobile rule to raise `#main-sidebar-left.area-info-open` above the bottom controls without changing the existing information-sheet height rules.
2. Run `node --test tests/mobileAreaInfoLayering.test.mjs` and confirm it fails for the missing contract.
3. Add/remove the state class in the two existing information-panel lifecycle functions and add the mobile stacking rule.
4. Re-run the focused test and confirm it passes.

## Task 2: Flight filter accordion regression

**Files:**
- Create: `tests/mobileFlightFilterAccordion.test.mjs`
- Modify: `main/html/index.html`
- Modify: `main/main-function/index.ts`
- Modify: `main/css/responsive.css`

1. Add a source/HTML/CSS test requiring a mobile toggle with `aria-expanded="false"`, ID references to both filter groups, a localized label, mobile-only visibility, coordinated collapsed selectors, toggle state synchronization, and reset-to-collapsed in `openModal()`.
2. Run `node --test tests/mobileFlightFilterAccordion.test.mjs` and confirm it fails.
3. Add the semantic toggle and stable IDs without moving the existing desktop toolbar.
4. Add `setFlightFiltersExpanded()`, the click listener, and the `openModal()` reset. The toggle only changes presentation and never calls `loadFlights()`.
5. Add the five-language static fallback for the toggle label and the smartphone-only responsive rules.
6. Re-run the focused test and confirm it passes.

## Task 3: Verification

1. Run both focused tests together.
2. Run relevant existing flight and mobile CSS tests.
3. Run the complete Node test suite, compare failures with the recorded baseline, and confirm no new failures.
4. Run `npm run build`.
5. Start the local site and inspect at 393x852 and 360x740: area sheet covers and blocks the bottom controls until close; flight filters start collapsed, expand/collapse without clearing values, and desktop remains unchanged.
6. Review `git diff` to ensure the user's pre-existing `MAX_CONCURRENT_MODELS` edit remains intact and unrelated files were not overwritten.
