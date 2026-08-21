# Mobile Area Information and Flight Filters Design

## Goal

Fix two smartphone-only layout problems without changing tablet or desktop behavior:

1. The area information bottom sheet must render above the fixed floor and language controls. While the information sheet is open, those controls must be covered and unavailable; they become usable again after the sheet closes.
2. The flight modal filters must be collapsible on smartphones and collapsed by default so the flight list receives more vertical space.

## Area information stacking

The existing mobile information sheet remains fixed to the bottom of the viewport with its current height and scrolling behavior. This is a stacking-only fix: it will not add, reduce, or otherwise rely on a height cap, bottom offset, or artificial padding to make room for the floor and language controls. The existing viewport-safety scrolling rule is left unchanged rather than used as the solution.

The mobile sidebar stacking context will be raised only while `#sidebar-info-panel` is visible. This places the complete sheet, including its opaque background, above `#custom-floor-wrapper` and `#custom-lang-wrapper`. Because the controls are behind the sheet, they cannot receive pointer input until `hideInfo()` closes the information sheet. Normal search/category/header layering remains unchanged when the sheet is closed.

## Flight filter accordion

On smartphone viewports, the flight modal will contain a dedicated filter toggle row above the existing filter content. The toggle will:

- be visible only at `max-width: 768px`;
- start collapsed each time the flight modal opens;
- expose the existing departure/arrival tabs, date, flight search, summary, and status filter as one coordinated collapsible filter region;
- update `aria-expanded`, `aria-controls`, the localized label, and chevron state;
- preserve the selected filters and loaded results while opening or closing;
- avoid reloading flight data solely because the accordion was toggled.

Desktop and tablet layouts continue to show the filters permanently and do not display the mobile toggle.

## Implementation boundaries

- `main/html/index.html`: add the semantic mobile toggle and stable IDs for the two existing filter groups.
- `main/main-function/index.ts`: initialize toggle state, reset to collapsed on modal open, update accessible state, and refresh its localized label.
- `main/css/responsive.css`: implement smartphone-only stacking and coordinated accordion layout without moving the desktop status toolbar.
- `tests/mobileAreaInfoLayering.test.mjs`: source/CSS regression tests for the information sheet stacking contract.
- `tests/mobileFlightFilterAccordion.test.mjs`: structure, state, localization, and responsive CSS regression tests for the filter accordion.

No backend, SQL, flight API, route calculation, model streaming, or desktop layout changes are included.

## Verification

- Run the two new focused tests and verify they fail before implementation and pass afterward.
- Run relevant existing mobile/flight tests.
- Run the complete Node test suite and distinguish pre-existing failures from regressions.
- Build the Vite frontend.
- Inspect the local build at 393x852 and 360x740: area sheet covers both bottom controls; controls reappear after closing; flight filters start closed, open/close without losing values, and the flight list gains vertical space.
