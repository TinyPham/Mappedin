# Mobile Directions Layering Design

## Goal

On screens up to 768 px wide, an open directions result sheet must completely cover the fixed floor and language controls. The controls remain in their normal positions and become visible and usable again after the directions result is cleared or closed.

## Root Cause

`#directions-tab-content` is a fixed child of `#main-sidebar-left`. Although the sheet has its own high `z-index`, it cannot escape the sidebar's stacking context. The mobile sidebar and the later floor/language control layers currently compete at the same parent stacking level, so the controls can render over the directions sheet.

## Design

Add a directions-result visibility state class to `#main-sidebar-left`. A small helper will keep that class synchronized with whether a usable directions result sheet is visible. On mobile only, the state class raises the sidebar stacking context above the maximum open-dropdown layer (`6500`), using the existing overlay level of `7000`.

The state becomes active when a route result and its summary are presented. It is cleared whenever navigation is reset, route generation fails, or the directions UI returns to its empty/hidden state. The existing `area-info-open` state remains responsible for the area-information sheet; the two states are independent and may share the same mobile stacking level.

This change modifies stacking only. It does not change the position, dimensions, spacing, content, scrolling, or normal availability of the floor/language controls. It also does not change the height or layout of the directions sheet.

## Lifecycle Contract

- Successful route presentation activates the directions layering state before the result is available to the user.
- Clearing or resetting navigation removes the state.
- Failed or unusable route generation removes the state.
- Returning the directions UI to an empty state removes the state.
- Outside an active directions result, the mobile sidebar retains its current stacking level so the floor and language controls remain usable.

## Testing

Add a source/CSS regression test that verifies:

- The visibility helper toggles the directions state class on the sidebar.
- Successful result presentation activates the state.
- reset, failure, and empty-state paths deactivate it.
- The mobile-only CSS state raises the sidebar above `6500`.
- The rule changes only `z-index`, preventing accidental layout changes.

Run the targeted regression test, the full Node test suite, and the production build. Existing unrelated working-tree changes, including the current model concurrency adjustment, must remain untouched.
