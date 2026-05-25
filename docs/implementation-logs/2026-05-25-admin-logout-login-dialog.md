# Admin Logout Login Dialog Check

## User Request Summary

User asked to verify whether the current code can still reproduce the old issue where after logout, returning to `?admin=true` does not show the admin login dialog.

## Files Changed

- `index.ts`
- `tests/adminAuthUiSource.test.mjs`

## Exact Behavior Changed

- When the user clicks Logout while the current URL contains `?admin=true`, the frontend now clears admin state and immediately opens the admin login dialog again.
- Normal public viewer URLs without `?admin=true` still return to viewer mode after logout without showing a login dialog.

## Security Decisions Made

- `?admin=true` still does not grant admin permission.
- Admin mode still requires a valid cookie-backed JWT from `/api/auth/login`.
- Logout still calls `/api/auth/logout` with `credentials: "include"` before clearing frontend admin state.

## Tests And Build Commands Run

- `node --test tests\adminAuthUiSource.test.mjs` -> failed before the fix, passed after the fix.
- `node --test tests\adminAuthUiSource.test.mjs tests\backendConfigSource.test.mjs tests\backendSecuritySource.test.mjs` -> passed.
- `npm run build` -> passed.

## Known Remaining Risks

- The browser must load the newly built frontend bundle or dev server code for the behavior to appear.
- Login success still depends on `ADMIN_PASSWORD_HASH` matching the plaintext password entered by the operator.

## Items Intentionally Not Changed

- Did not change map color or highlight behavior.
- Did not suppress Mappedin SDK warnings.
- Did not modify backend auth, cookies, or database code.
