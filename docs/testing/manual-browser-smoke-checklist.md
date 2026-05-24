# Manual Browser Smoke Checklist

Use this checklist against the real SQL Server before marking the maintenance
plan complete. Capture screenshots for each numbered item.

## Environment

- Backend is running and connected to the real SQL Server.
- Frontend is running at the normal public URL.
- Browser devtools Console and Network tabs are available.

## Evidence To Capture

1. Public viewer opens without login.
   - Open the normal map URL without `?admin=true`.
   - Capture the map loaded in viewer mode.

2. Public read features work without admin.
   - Search for an area.
   - Change floor.
   - Open flight information.
   - Start a wayfinding route.

3. Admin tools are hidden before login.
   - Capture the UI before admin login.
   - Confirm editing/save controls are not available.

4. Admin login works.
   - Open `?admin=true`.
   - Log in with the configured admin credential.
   - Capture the authenticated admin UI.

5. Admin save writes to `AreaInformation`.
   - Edit one area name/description/phone/opening hours.
   - Save successfully.
   - Capture SSMS showing the updated row in `dbo.AreaInformation`.

6. Dropped legacy location objects are not required.
   - In SSMS, run:

```sql
USE MappedIn3DModels;
GO

SELECT OBJECT_ID('dbo.MasterData_Locations', 'U') AS MasterDataLocationsObjectId;
SELECT OBJECT_ID('dbo.SP_Admin_UpsertLocation', 'P') AS AdminUpsertLocationObjectId;
```

   - Both results should be `NULL`.
   - Capture the result.

7. Logout blocks admin writes.
   - Log out.
   - Try one admin save action again.
   - Capture that the request is blocked or the admin UI is hidden.

8. Static security smoke checks return 404.
   - Open these URLs in browser or run them from PowerShell:

```text
http://localhost:3002/backend/appsettings.json
http://localhost:3002/.env
http://localhost:3002/database/schema.sql
```

   - Capture that they are not served.

9. Kiosk performance smoke.
   - Move/pan/zoom/floor-switch for at least 2 minutes.
   - Capture browser Console showing no repeated frame-level logs or errors.
   - Capture Task Manager or browser performance if visible and stable.

## Pass Criteria

- Public map requires no login.
- Admin tools require login.
- Area edits persist to `dbo.AreaInformation`.
- Dropped legacy objects are absent.
- Protected source/config files are not served.
- Console has no repeated runtime errors during normal kiosk interaction.
