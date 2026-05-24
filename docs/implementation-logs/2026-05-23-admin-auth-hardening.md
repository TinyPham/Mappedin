# Admin Auth Hardening Implementation Log

## User Request Summary

Triển khai theo kế hoạch public viewer/admin auth: mặc định load bản đồ ở chế độ người xem public, chỉ đăng nhập admin khi cần chỉnh sửa, chỉ có một quyền `admin`, không thêm bảng admin/user vào `MappedIn3DModels`, và giữ hệ thống ổn định.

## Files Changed

- `.gitignore`
- `.env.example`
- `backend/auth/index.ts`
- `backend/auth/auth.test.ts`
- `backend/db.ts`
- `backend/server.ts`
- `backend/tsconfig.json`
- `index.ts`
- `tests/adminAuthUiSource.test.mjs`
- `tests/backendConfigSource.test.mjs`
- `tests/backendSecuritySource.test.mjs`

## Behavior Changed

- Public viewer remains the default mode. `?admin=true` no longer grants admin access by itself.
- `?admin=true` opens the admin login prompt only.
- Frontend checks `/api/auth/me` with `credentials: "include"` to decide whether to show admin tools.
- Admin write requests now include cookies with `credentials: "include"`.
- Backend adds:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Backend protects these write/admin endpoints with `requireAdmin`:
  - `POST /api/upload-image`
  - `POST /api/update-area-info`
  - `POST /api/area-colors`
  - `DELETE /api/area-colors`
  - `POST /api/models/sync-overview-floor`
  - `POST /api/models`
  - `DELETE /api/models/:uuid`
  - `POST /api/models/batch`
  - `POST /api/areas/sync`
  - `POST /api/categories/subcategory/:id/assign`
  - `POST /api/admin/locations`
  - `POST /api/sync-locations`
- Public read endpoints remain public.
- Backend no longer serves the repository root as static files.
- DB config now prefers `DB_CONNECTION_STRING` or `DB_*` environment variables before appsettings.
- Backend TypeScript build now includes nested folders with `**/*.ts`.

## Security Decisions

- JWT is stored in an `httpOnly` cookie.
- Cookie options:
  - Production: `secure: true`, `sameSite: "strict"`.
  - Local/dev: `secure: false`, `sameSite: "lax"`.
- No admin/user table was added to `MappedIn3DModels`.
- Password verification uses Node.js built-in `crypto.scryptSync` with a stored `scrypt$...` hash format to avoid adding native dependencies in this batch.
- CORS now supports credentials and uses `ALLOWED_ORIGINS` in production.
- `.env.example` was added with placeholders only.
- `.gitignore` now ignores appsettings files for future safety.

## Tests And Build Commands

- `npx ts-node backend\auth\auth.test.ts` -> pass.
- `node --test tests\backendSecuritySource.test.mjs tests\adminAuthUiSource.test.mjs tests\backendConfigSource.test.mjs tests\flightDateRange.test.mjs tests\flightInfoTopIconSize.test.mjs tests\modelEditingPermissions.test.mjs` -> 16/16 pass.
- `npx ts-node backend\areaColors.test.ts` -> pass.
- `npx ts-node backend\overviewFloorSync.test.ts` -> pass.
- `npx ts-node backend\flights\checkInCounterSpec.test.ts` -> pass.
- `npx ts-node backend\flights\flightRepository.test.ts` -> pass.
- `npm run build` -> pass, with existing Vite warnings about large chunks.
- `npm run build` in `backend/` -> pass.

## Known Remaining Risks

- Full `node --test tests\*.test.mjs` still has unrelated existing failures in tutorial/CSS/import-path tests. These were not fixed because they are outside this admin auth/static hardening batch.
- `backend/appsettings.json` is still a tracked file from before. `.gitignore` now prevents future accidental adds, but it does not remove existing tracked history.
- Admin password hash must be configured through `ADMIN_PASSWORD_HASH`; without it, login returns "Admin login is not configured" while public viewer still works.
- The frontend bundle remains large (`main` chunk over 4 MB minified). This was already flagged as a kiosk performance item and should be handled in a later performance/refactor batch.
- Upload endpoint is now auth-protected but still needs a later hardening pass for filename sanitization, MIME validation, async writes, and strict size limits.

## Intentionally Not Changed

- No database schema/table was added for admin login.
- No broad `index.ts` or `server.ts` refactor was attempted.
- No stored procedure/query rewrite was included in this batch.
- No kiosk model streaming optimization was included in this batch.
