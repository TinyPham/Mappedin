# Mobile User Guide Layering Design

## Goal

On mobile screens, the user-guide modal must always render above the fixed floor and language controls, including when a directions result is active. The controls remain available underneath the guide so the tutorial step that introduces them can still highlight their positions.

## Root Cause

The user-guide modal currently lives inside `#main-content`, alongside several fixed map controls. Mobile floor and language controls use their own high stacking layers, and other active panels can raise neighboring stacking contexts. This makes the guide's effective stacking dependent on its ancestor context instead of its own `z-index` alone.

## Design

During initialization, move `#user-guide-modal` to be a direct child of `document.body` when it is not already there. This creates one stable root-level overlay layer and lets the modal's existing `z-index: 9000` consistently outrank the floor/language controls and active sidebar layers.

The move is idempotent and does not recreate the modal, replace event targets, or change its visual layout. Existing element references, event listeners, focus behavior, tutorial step navigation, and highlight target selectors continue to work because the same DOM node is retained.

## Lifecycle Contract

- Opening the guide displays the root-level modal and adds `body.user-guide-open` as today.
- Closing the guide hides the same modal and restores focus as today.
- Floor and language controls remain in their existing DOM positions below the modal.
- The floor/language tutorial step can still measure and highlight both controls.
- Directions and area-information stacking states remain unchanged.

## Testing

Add a regression test that verifies:

- Initialization appends the existing guide modal to `document.body` only when necessary.
- The modal remains the same element rather than being cloned or recreated.
- The root-level guide layer has a higher `z-index` than the maximum floor/language control layer.
- Existing mobile tutorial targets for floor and language remain present.

Run the targeted guide-layering test, related tutorial and mobile-layering tests, and the production build. Preserve the existing unstaged `MAX_CONCURRENT_MODELS = 300` change.
