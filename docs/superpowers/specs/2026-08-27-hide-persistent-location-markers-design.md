# Hide Persistent Location Markers Design

## Goal

Hide the default circular location icons and their small text labels on the map. Preserve large native 3D area text, map geometry, area colors, search, category selection, route calculation, route drawing, and floor changes driven by navigation instructions.

## Root cause

The visible circles and labels are not the custom venue-name marker. They are created independently by four persistent marker paths in `main/main-function/index.ts`:

- `renderObjectMarkersForCurrentFloor` creates markers for the initial object collection and recreates them after floor changes;
- `refreshLocationMarkers` creates translated markers on initial load and language changes;
- `renderConnectionOverlaysForCurrentFloor` automatically creates elevator, escalator, and stair circles with labels as zoom changes;
- `recreateMainEntranceMarker` separately recreates the main-entrance circle and label.

Disabling only `mapNameMarker` therefore cannot affect the markers shown in the screenshot.

## Design

Add one disabled-by-default `SHOW_LOCATION_MARKERS` flag beside the existing marker state. Each persistent marker renderer must first remove its previously tracked markers, then return while the flag is disabled. The floor-specific main-entrance call site must also be gated so it does not emit a misleading creation log.

Transient markers created after an explicit user search, category selection, admin operation, or navigation action remain unchanged. Native 3D map text such as `CHECK-IN A` and `CHECK-IN B` remains unchanged. Because elevator/escalator connection markers are intentionally hidden, their former direct-click target for changing floors during an active route is also removed; the route itself and other floor-change controls remain available.

## Verification

Add a source regression test proving the flag defaults to false and all four persistent creation paths are guarded before marker construction. Verify the targeted source tests, production build to an isolated output directory, and the final diff. Treat the current uncommitted map-name-marker edits, its regression test, its design/plan documents, and both lockfile changes as the baseline to preserve.
