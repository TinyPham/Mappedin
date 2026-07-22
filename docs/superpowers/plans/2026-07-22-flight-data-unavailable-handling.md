# Flight Data Unavailable Handling Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw flight database errors with a stable public error response and a clear passenger-facing unavailable message, while measuring backend flight-query stages.

**Architecture:** The repository records duration for the stored procedure and each navigation-mapping query. The Express route maps repository failures to HTTP 503 with a stable error code, while detailed SQL diagnostics remain server-side. The frontend maps every failed flight-list request to a localized generic message and keeps an empty successful result distinct.

**Tech Stack:** TypeScript, Express, mssql, Vite frontend, Node test runner.

---

### Task 1: Backend Error Contract And Timings

**Files:**
- Modify: `backend/flights/flightRepository.ts`
- Modify: `backend/server.ts`
- Test: `backend/flights/flightRepository.test.ts`
- Test: `tests/source/flightDataErrorHandlingSource.test.mjs`

- [ ] Write failing tests for stage timing and HTTP 503 public response.
- [ ] Run tests and confirm expected failures.
- [ ] Add minimal timing instrumentation and stable unavailable response.
- [ ] Run tests and confirm they pass.

### Task 2: Passenger-Facing Frontend Message

**Files:**
- Modify: `main/main-function/index.ts`
- Test: `tests/source/flightDataErrorHandlingSource.test.mjs`

- [ ] Write a failing source regression test that rejects raw backend error rendering.
- [ ] Run the test and confirm the expected failure.
- [ ] Render `Hiện chưa có dữ liệu chuyến bay. Vui lòng thử lại sau.` for failed requests.
- [ ] Run the test and confirm it passes.

### Task 3: Verification

- [ ] Run focused flight tests.
- [ ] Run backend build and frontend production build.
- [ ] Run TypeScript checking and `git diff --check`.
- [ ] Call the live API and verify it returns HTTP 503 with no SQL details.

