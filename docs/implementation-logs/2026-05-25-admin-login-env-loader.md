# Admin Login Env Loader Fix

## User Request Summary

User reported that `http://localhost:3000?admin=true` now shows the admin login dialog but login fails with the generic invalid credentials/configuration message.

## Files Changed

- `backend/db.ts`
- `tests/backendConfigSource.test.mjs`

Related existing working-tree changes from the same admin auth flow remained in place:

- `index.ts`
- `tests/adminAuthUiSource.test.mjs`

## Exact Behavior Changed

- Backend `.env` loading now checks multiple launch locations:
  - `process.cwd()/.env`
  - `backend/.env`
  - root `.env` when running from `backend/dist`
- This allows `node backend/dist/server.js` launched from the project root to read `ADMIN_PASSWORD_HASH`, `ADMIN_USERNAME`, and `JWT_ACCESS_SECRET`.
- Added a source test to prevent regressing to a single `__dirname../.env` path that works for `ts-node` but not compiled backend output.

## Security Decisions Made

- Did not print or expose secret values.
- Kept admin authentication based on environment secrets and password hash only.
- Did not add any admin/user database table.
- Did not change cookie/JWT auth behavior.

## Tests And Build Commands Run

- `node --test tests\backendConfigSource.test.mjs` -> failed before the fix, passed after the fix.
- `node --test tests\adminAuthUiSource.test.mjs tests\backendConfigSource.test.mjs tests\backendSecuritySource.test.mjs` -> passed.
- `npm run build` -> passed.
- `cd backend; npm run build` -> passed.
- `node -e "require('./backend/dist/db.js'); console.log(process.env.ADMIN_PASSWORD_HASH ? 'ADMIN_PASSWORD_HASH_LOADED' : 'ADMIN_PASSWORD_HASH_EMPTY')"` -> printed `ADMIN_PASSWORD_HASH_LOADED`.

## Known Remaining Risks

- The currently running backend process must be restarted to pick up the rebuilt backend code.
- Actual login success still depends on entering the plaintext password that matches the configured `ADMIN_PASSWORD_HASH`.
- Existing unrelated working-tree changes were not reverted.

## Items Intentionally Not Changed

- Did not change map color/highlight behavior.
- Did not suppress Mappedin SDK warnings.
- Did not modify the database.
- Did not replace the configured admin password hash.
