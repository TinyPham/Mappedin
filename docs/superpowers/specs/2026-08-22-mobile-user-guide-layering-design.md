# Mobile User Guide Layering Design

## Goal

On mobile screens, the floor and language controls must never appear over the user-guide panel. The guide must remain visible after it opens, including when a directions result was active immediately before opening it.

## Confirmed Failure

Moving `#user-guide-modal` from `#main-content` to `document.body` made the first tutorial step switch the app back to Search, but the guide modal itself disappeared in the real mobile layout. The root-level portal is therefore removed.

The controls also remain visually exposed at the bottom because the mobile guide uses a transparent overlay and a panel with bottom spacing. A z-index-only assertion is insufficient to prevent that visual leak.

## Design

Keep `#user-guide-modal` in its original `#main-content` DOM position.

Use the existing `body.user-guide-open` lifecycle plus one step-specific body class:

- While the guide is open on ordinary steps, hide the fixed floor and language controls and disable their pointer events.
- On the `mobile-floor-language` step, restore both controls so the tutorial can highlight them. The guide panel already uses top placement for this step, while the controls stay at the bottom beneath the modal layer.
- Remove the step-specific class when the guide closes so no tutorial state leaks into normal map use.

The controls are not recreated or moved. Directions, area-information, map control positioning, and desktop tutorial behavior remain unchanged.

## Lifecycle Contract

- Opening the guide shows the existing modal inside `#main-content`.
- Rendering a tutorial step synchronizes whether the floor/language controls are the active tutorial targets.
- Ordinary tutorial steps conceal both controls.
- The `mobile-floor-language` step reveals both controls underneath the guide for highlighting.
- Closing the guide removes both `user-guide-open` and the step-specific body class.
- An empty guide open returns before adding either guide body class and leaves the modal hidden.

## Testing

Add regression coverage that verifies:

- No code reparents `userGuideModal` to `document.body`.
- The HTML fixture keeps `#user-guide-modal` as a descendant of `#main-content`.
- Opening/closing the guide continues to toggle `body.user-guide-open`.
- The empty-step guard runs before either guide body class can be added.
- Step rendering toggles a dedicated floor/language-step class only for `mobile-floor-language`.
- Mobile CSS hides and disables both controls during ordinary guide steps.
- Mobile CSS restores both controls during the floor/language step without raising them above the modal.
- The real tutorial data retains both floor/language target selectors.

Run the targeted regression test, related tutorial/directions/area layering tests, and the production build. Preserve the existing unstaged `MAX_CONCURRENT_MODELS = 300` change.
