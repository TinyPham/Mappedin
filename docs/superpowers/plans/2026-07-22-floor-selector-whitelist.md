# Floor Selector Whitelist Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chỉ hiển thị Toàn cảnh và bốn tầng hành khách đã duyệt trong dropdown chọn tầng.

**Architecture:** Một helper thuần quản lý whitelist và quyết định tầng nào được hiển thị. Hai luồng dựng selector trong runtime dùng chung helper; dữ liệu Mappedin không bị lọc toàn cục.

**Tech Stack:** TypeScript, JavaScript ESM, Node test runner, Vite.

---

### Task 1: Tạo quy tắc hiển thị tầng

**Files:**
- Create: `src/config/selectableFloors.js`
- Create: `tests/selectableFloors.test.mjs`

- [ ] Viết test thất bại cho bốn ID hợp lệ, Toàn cảnh và tầng ngoài whitelist.
- [ ] Chạy `node tests/selectableFloors.test.mjs` và xác nhận test thất bại vì module chưa tồn tại.
- [ ] Tạo helper tối thiểu để test pass.
- [ ] Chạy lại test và xác nhận pass.

### Task 2: Áp dụng quy tắc cho dropdown

**Files:**
- Modify: `main/main-function/index.ts:3262`
- Modify: `main/main-function/index.ts:6812`
- Create: `tests/source/floorSelectorWhitelistSource.test.mjs`

- [ ] Viết source integration test yêu cầu cả hai luồng dùng chung helper.
- [ ] Chạy test và xác nhận thất bại.
- [ ] Import helper và thay hai bộ lọc theo tên hiện tại.
- [ ] Chạy test đơn vị và source integration test.
- [ ] Chạy `npx tsc --noEmit` và `npm run build`.
