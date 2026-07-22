# Stopover Route Continuity Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every multi-leg route share one physical boundary target at each stopover and render all legs with the same blue path style.

**Architecture:** Resolve every intermediate waypoint once against both neighboring waypoints, then reuse that exact route target as the inbound destination and outbound origin. Continue drawing SDK `Directions[]`, but explicitly apply the same active and inactive path options so Mappedin does not de-emphasize one leg. Keep per-leg instruction preparation and aggregate stopover rules unchanged.

**Tech Stack:** TypeScript, JavaScript, Mappedin JS 6.9.1, Node test runner, Vite.

---

### Task 1: Shared stopover route target

**Files:**
- Modify: `src/navigation/wayfindingRouteTargets.js`
- Test: `tests/wayfindingRouteTargets.test.mjs`

- [ ] Add a failing test where a stopover has two doors and independently resolved legs choose different doors.
- [ ] Verify the test fails because adjacent legs do not share one route target.
- [ ] Resolve an intermediate waypoint once by scoring candidates against both neighbors.
- [ ] Reuse the selected target for both adjacent legs.
- [ ] Verify existing single-leg behavior remains unchanged.

### Task 2: Uniform multi-leg path color

**Files:**
- Modify: `main/main-function/index.ts`
- Test: `tests/navigationInstructionRules.test.mjs`

- [ ] Add a failing source integration test requiring identical active and inactive path styling.
- [ ] Verify the test fails because `inactivePathOptions` is absent.
- [ ] Define one blue path style with both `color` and `accentColor` set to `#214ca6`.
- [ ] Apply copies of that style to `pathOptions` and `inactivePathOptions`.
- [ ] Keep `Navigation.draw(legDirections, ...)` and instruction aggregation unchanged.

### Task 3: Rollback record and verification

**Files:**
- Create: `docs/implementation-logs/2026-07-22-stopover-route-continuity.md`

- [ ] Record root cause, exact changed behavior, files, test evidence, and rollback hunks.
- [ ] Run route target, instruction, kiosk, and flight navigation tests.
- [ ] Run TypeScript and Vite production builds.
- [ ] Run `git diff --check` for touched files.

No commit is created because the shared worktree already contains unrelated uncommitted work and the user did not request a commit.
