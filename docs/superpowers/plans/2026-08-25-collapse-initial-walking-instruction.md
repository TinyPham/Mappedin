# Collapse Initial Walking Instruction Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the first eligible walking instruction into Departure once per displayed route while conserving distance/timing data and transferring its nearby-landmark context to the next retained walking instruction.

**Architecture:** Add a pure display-list transformation to the navigation rules module and invoke it once after aggregated structural filtering. Keep SDK directions and route geometry untouched. Extend the formatter to consume an internal landmark-coordinate override without changing the retained instruction's own coordinate or action.

**Tech Stack:** JavaScript ES modules, TypeScript application integration, Node test runner, Vite production build.

---

## Task 1: Add the pure initial-step collapse transformation

**Files:**
- Modify: `tests/navigationInstructionRules.test.mjs`
- Modify: `src/navigation/navigationInstructionRules.js`

- [ ] **Step 1: Add a failing core-collapse test**

Import the new `collapseInitialWalkingInstructionForDisplay` export. Use the requested five-step example and assert that the output types are exactly `[departure, turn-B, turn-C, arrival]`, Departure receives step two's effective distance, and old step three becomes displayed index one with its own coordinate.

- [ ] **Step 2: Run the core test and confirm RED**

Run: `node --test tests/navigationInstructionRules.test.mjs`

Expected: FAIL because `collapseInitialWalkingInstructionForDisplay` is not exported/implemented.

- [ ] **Step 3: Implement only the core collapse**

In `src/navigation/navigationInstructionRules.js`:

- clone the list with cloned action shells;
- recognize only `departure`/`start` followed by a safe `turn`/`continue` without connection metadata and with at least one later retained instruction;
- sum effective distance through `getInstructionDisplayDistance()` and write the result to both `distance` and `_displayDistance` on Departure;
- remove exactly index 1;
- preserve later instruction order and coordinates.

- [ ] **Step 4: Run the core test and confirm GREEN**

Run: `node --test tests/navigationInstructionRules.test.mjs`

Expected: PASS.

- [ ] **Step 5: Add failing conservation and immutability tests**

Use non-zero values on both merged instructions and assert:

- `_displayDistance` precedence and additive effective-distance conservation;
- `originalDistance` sums only finite `originalDistance` values; absent/non-finite original values contribute zero and never fall back to normalized `distance`;
- `time` and `duration` are independently additive when either side defines them;
- original-distance total and all later cumulative preview boundaries are conserved;
- the input array, instruction objects, nested action objects, and arbitrary metadata are not mutated.

- [ ] **Step 6: Run the conservation tests and confirm RED**

Run: `node --test tests/navigationInstructionRules.test.mjs`

Expected: FAIL on metadata sums and/or mutation assertions not covered by the core implementation.

- [ ] **Step 7: Implement additive conservation without mutation**

Merge finite effective distance, finite `originalDistance` (zero otherwise), `time`, and `duration` into cloned Departure data. Extend the clone shell only as needed to preserve internal properties. Do not derive original physical distance from normalized display distance.

- [ ] **Step 8: Run the conservation tests and confirm GREEN**

Run: `node --test tests/navigationInstructionRules.test.mjs`

Expected: PASS.

- [ ] **Step 9: Add failing safety, long-route, and transfer-placement tests**

Cover:

- empty, one-step, two-step, and missing-coordinate lists;
- no collapse for arrival, stopover, connection, elevator, escalator, stair, or `turn`/`continue` carrying `action.connection`;
- a long list where exactly index one is removed;
- every retained later instruction preserves `distance`, `originalDistance`, `_displayDistance`, `time`, `duration`, arbitrary metadata, all action fields, connection metadata, coordinate identity, and order, except that one walking recipient may gain only the internal transfer fields;
- a multi-leg-shaped combined list where the route-level initial walking instruction is removed but the first walking instruction after a later stopover remains present;
- transfer placement searches past connection/stopover steps to the next safe walking step.

- [ ] **Step 10: Run the safety/long-route tests and confirm RED**

Run: `node --test tests/navigationInstructionRules.test.mjs`

Expected: FAIL on unimplemented transfer placement or safety assertions.

- [ ] **Step 11: Complete safety checks and transfer metadata**

Store a boolean internal transfer-presence sentinel on the recipient independently from the removed coordinate, plus the optional removed coordinate. Search forward for the next safe retained `turn`/`continue`, skipping structural/stopover instructions. Extend the existing instruction clone shell so both internal fields survive defensive cloning.

- [ ] **Step 12: Run all Task 1 tests and confirm GREEN**

Run: `node --test tests/navigationInstructionRules.test.mjs`

Expected: PASS.

- [ ] **Step 13: Commit the transformation**

```bash
git add src/navigation/navigationInstructionRules.js tests/navigationInstructionRules.test.mjs
git commit -m "feat: collapse initial walking instruction"
```

## Task 2: Format the transferred landmark context

**Files:**
- Modify: `tests/navigationInstructionRules.test.mjs`
- Modify: `src/navigation/navigationInstructionRules.js`

- [ ] **Step 1: Add failing formatter tests**

Cover that:

- landmark lookup prefers the transferred coordinate while the retained action and coordinate remain unchanged;
- transfer searches beyond intervening connection/stopover steps to the next walking instruction;
- a transferred `continue` may render `near <landmark>`;
- an ordinary `continue` remains landmark-free;
- a transferred `continue` whose removed step had no coordinate falls back to its own retained coordinate for landmark lookup while the independent transfer-presence sentinel still enables landmark wording.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/navigationInstructionRules.test.mjs`

Expected: FAIL on transferred-landmark text assertions.

- [ ] **Step 3: Update the formatter minimally**

Update `createInstructionFormatter` so landmark lookup prefers the internal transferred coordinate and explicitly falls back to the retained instruction coordinate. Preserve existing landmark behavior for turns. Permit landmark text on `continue` only when the independent transfer-presence sentinel exists, not merely when an override coordinate is truthy.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --test tests/navigationInstructionRules.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit formatter support**

```bash
git add src/navigation/navigationInstructionRules.js tests/navigationInstructionRules.test.mjs
git commit -m "feat: transfer initial landmark context"
```

## Task 3: Integrate the transformation once in the displayed route

**Files:**
- Modify: `tests/navigationInstructionRules.test.mjs`
- Modify: `main/main-function/index.ts`

- [ ] **Step 1: Add a failing source-integration regression test**

Parse/read `main/main-function/index.ts` and assert that:

- the helper is imported;
- it is called exactly once in the route-display pipeline;
- the call occurs after `shouldKeepAggregatedNavigationInstruction` filtering and before assigning `directions.instructions` and rendering;
- the original per-leg directions remain the route-drawing source.

Pair this with the multi-leg runtime assertion from Task 1: after the one route-level call, the initial walking instruction following a stopover is still present, proving the transformation is not applied per leg or restarted after stopovers.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/navigationInstructionRules.test.mjs`

Expected: FAIL because the main pipeline does not call the helper.

- [ ] **Step 3: Wire the helper into the aggregate UI pipeline**

Import `collapseInitialWalkingInstructionForDisplay` and transform `simplifiedInstructions` once immediately after the existing aggregated structural filter, before assigning `directions.instructions`. Do not alter `legDirections`, map drawing, SDK route requests, or per-leg preparation.

- [ ] **Step 4: Run focused navigation tests**

Run: `node --test tests/navigationInstructionRules.test.mjs tests/wayfindingRouteTargets.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit integration**

```bash
git add main/main-function/index.ts tests/navigationInstructionRules.test.mjs
git commit -m "feat: apply initial step collapse to route display"
```

## Task 4: Verify the complete change

**Files:**
- Verify: `src/navigation/navigationInstructionRules.js`
- Verify: `main/main-function/index.ts`
- Verify: `tests/navigationInstructionRules.test.mjs`

- [ ] **Step 1: Run all project tests**

Run: `node --test tests/*.test.mjs`

Expected: no new failures compared with the recorded pre-change frontend baseline of 309 tests, 297 pass, and 12 unrelated existing failures in layout/tutorial source assertions. The focused navigation suites must remain fully green. (`package.json` intentionally has no `test` script; avoid bare `node --test` because it also scans backend TypeScript and the recoverable `node_modules.partial` artifact.)

- [ ] **Step 2: Run the production build**

Run from the worktree using the workspace dependency installation if necessary:

`node D:\E-Map-Website\ERP-Mappedin\node_modules\vite\bin\vite.js build`

Expected: production build completes successfully.

- [ ] **Step 3: Review the final diff and repository state**

Run: `git diff HEAD~3 --check`

Run: `git status --short`

Expected: no whitespace errors and no uncommitted product-code/test changes. Ignore or remove only the known recoverable `node_modules.partial` environment artifact after verifying its absolute worktree path.

- [ ] **Step 4: Request specification and code-quality review**

Provide reviewers the approved design spec, this implementation plan, the implementation commits, and fresh test/build evidence. Resolve every verified issue and rerun affected checks.
