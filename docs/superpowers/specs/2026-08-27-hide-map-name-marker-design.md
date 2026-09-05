# Hide Map Name Marker Design

## Goal

Hide the custom overview marker that displays the airport logo and venue name, while preserving every other location and entrance marker.

## Design

Add one local boolean configuration beside the existing `mapNameMarker` state. The marker creation function will treat the disabled state as authoritative: it removes any existing instance and returns before building marker HTML. The overview floor handler will also avoid requesting marker creation when the setting is disabled.

This guard covers initial load, floor changes, and language changes because every path ultimately calls the same guarded creation function. Mappedin's existing watermark configuration and other map markers remain unchanged.

## Verification

Add a source-level regression test asserting that the feature flag defaults to disabled, that `createMapNameMarker` exits before constructing the marker, and that overview-floor creation is gated. Run the targeted test and the production build.
