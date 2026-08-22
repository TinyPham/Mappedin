# Mobile User Guide Layering Design

## Goal

On mobile screens, the floor and language controls must never appear over the user-guide panel. The guide must remain visible after it opens, including when a directions result was active immediately before opening it.

## Confirmed Failure

Moving `#user-guide-modal` from `#main-content` to `document.body` made the first tutorial step switch the app back to Search, but the guide modal itself disappeared in the real mobile layout. The root-level portal is therefore removed.

The controls also remain visually exposed at the bottom because the mobile guide uses a transparent overlay and a panel with bottom spacing. A z-index-only assertion is insufficient to prevent that visual leak.

A second failure occurs when the guide opens while an active route is displayed. The first mobile tutorial step intentionally switches to the Search tab. Closing the guide only restores Search on desktop and does not restore the mobile tab that was active before the guide opened. Consequently, `directions-info-open` remains cleared after closing the guide and the floor/language controls return above the route-information region.

## Design

Keep `#user-guide-modal` in its original `#main-content` DOM position.

Use the existing `body.user-guide-open` lifecycle plus one step-specific body class:

- While the guide is open on ordinary steps, hide the fixed floor and language controls and disable their pointer events.
- On the `mobile-floor-language` step, restore both controls so the tutorial can highlight them. The guide panel already uses top placement for this step, while the controls stay at the bottom beneath the modal layer.
- Remove the step-specific class when the guide closes so no tutorial state leaks into normal map use.

Treat tutorial tab switching as temporary UI state:

- When a non-empty guide opens, record whether Search or Directions is active before rendering the first tutorial step.
- Tutorial steps may continue switching tabs as required for their highlights.
- When the guide closes through the close button, backdrop, Escape key, or Done button, restore the recorded tab before removing the guide body classes.
- Clear the recorded tab after restoration so a later guide session captures fresh state.
- If neither tab was active at open time, do not force a tab on close.

The controls are not recreated or moved. Directions, area-information, map control positioning, and desktop tutorial behavior remain unchanged.

## Lifecycle Contract

- Opening the guide shows the existing modal inside `#main-content`.
- Opening a non-empty guide captures the active sidebar tab before the first tutorial step can switch it.
- Rendering a tutorial step synchronizes whether the floor/language controls are the active tutorial targets.
- Ordinary tutorial steps conceal both controls.
- The `mobile-floor-language` step reveals both controls underneath the guide for highlighting.
- Closing the guide restores the captured sidebar tab first, then removes both `user-guide-open` and the step-specific body class.
- Closing a guide opened from an active route restores Directions, which in turn resynchronizes `directions-info-open` before the floor/language controls become visible again.
- An empty guide open returns before adding either guide body class and leaves the modal hidden.

## Testing

Add regression coverage that verifies:

- No code reparents `userGuideModal` to `document.body`.
- The HTML fixture keeps `#user-guide-modal` as a descendant of `#main-content`.
- Opening/closing the guide continues to toggle `body.user-guide-open`.
- Opening from Directions captures Directions before the first mobile step switches to Search.
- Closing restores the captured tab before removing `user-guide-open`, and clears the captured value afterward.
- Opening from Search restores Search; opening with neither tab active does not synthesize a tab selection.
- The empty-step guard runs before either guide body class can be added.
- Step rendering toggles a dedicated floor/language-step class only for `mobile-floor-language`.
- Mobile CSS hides and disables both controls during ordinary guide steps.
- Mobile CSS restores both controls during the floor/language step without raising them above the modal.
- The real tutorial data retains both floor/language target selectors.

Run the targeted regression test, related tutorial/directions/area layering tests, and the production build. Preserve the existing unstaged `MAX_CONCURRENT_MODELS = 300` change.
