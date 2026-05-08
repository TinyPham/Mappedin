# Flight Map Overlay Design

**Date:** 2026-05-06  
**Scope:** Long Thành flight information overlay, backend flight APIs, navigation target resolution, and TSN-style modal UI.

## Goal

Add a flight information feature to the current map application so users can:

- open a flight information modal from a dedicated icon/button on the map
- browse departure and arrival flights
- filter by date, status, and flight number
- navigate to a gate, a random check-in counter inside `CheckInCounterSpec`, or a baggage belt

The current source of truth is `LongThanhFlightBK.dbo.Flight`. Later, runtime will switch to a live API source without changing frontend behavior.

## Confirmed Decisions

1. `GET /api/flights` reads directly from `LongThanhFlightBK.dbo.Flight`.
2. If `CheckInCounterSpec` expands to multiple counters, `Đến check-in` routes to one random valid counter.
3. The UI is a TSN-style modal overlay, opened from a flight-info icon/button placed on top of the map.

## Architecture

### Backend

Backend keeps a stable internal contract for flights and navigation targets.

Runtime flow:

`LongThanhFlightBK.dbo.Flight -> backend API -> frontend modal -> existing wayfinding flow`

Phase-1 data source:

- SQL Server database `LongThanhFlightBK`
- stored procedures already available:
  - `dbo.SP_GetFlights`
  - `dbo.SP_GetFlightNavigationTargets`

Future data source:

- live flight API through backend adapter
- `backend/config/flight-source-mapping.json` remains the adaptation point for renamed source fields

### Map Target Resolution

Flight data stores business keys only:

- `Gate`
- `CheckInIsland`
- `CheckInCounterSpec`
- `Belt`

Runtime must resolve them against the current Mappedin area data:

- `Gate 21` -> `Cửa ra tàu bay 21`
- `CheckInIsland = A`, `CheckInCounterSpec = 1,4-7` -> `Quầy thủ tục 1 - Đảo A`, `4 - Đảo A`, `5 - Đảo A`, `6 - Đảo A`, `7 - Đảo A`
- `Belt 3` -> `Đảo nhận hành lý 3`

For check-in routing, the resolver expands the counter spec, finds all matching counters on the current floor set, then randomly chooses one target for navigation.

## Backend API Design

### `GET /api/flights`

Query params:

- `date`
- `arrDep`
- `search`
- `status` (initially optional; may be UI-side until status rules are finalized)

Primary source:

- `LongThanhFlightBK.dbo.Flight`

Returned fields:

- `FlightId`
- `FlightNo`
- `FlightDate`
- `ArrDep`
- `Route`
- `Airline`
- `Status`
- `ScheduledTime`
- `EstimatedTime`
- `ActualTime`
- `Gate`
- `CheckInIsland`
- `CheckInCounterSpec`
- `Belt`
- `IsSimulatedCheckIn`
- `IsSimulatedGate`
- `IsSimulatedBelt`

### `GET /api/flights/:id/navigation-targets`

Purpose:

- return resolved navigation candidates for gate, check-in, and belt
- return enough metadata for frontend to decide which buttons are enabled

Response shape:

- `gateTarget`
- `checkInTargets`
- `beltTarget`
- `randomCheckInTarget`
- `canNavigateGate`
- `canNavigateCheckIn`
- `canNavigateBelt`

## Resolver Design

Resolver should not depend on hardcoded Mappedin ids.

Matching rules:

- gate: match AreaList by normalized gate number
- check-in: match AreaList by island letter + counter number from expanded spec
- belt: match AreaList by normalized belt number

Normalization rules:

- trim spaces
- compare numbers numerically
- accept either `01` and `1` for counters/belts where needed

Failure handling:

- if no area is found, mark the corresponding button disabled
- do not fail the whole flight card if one target is missing

## UI Design

### Entry Point

Add a new flight-info icon/button on the map overlay near the area highlighted by the user.

Behavior:

- single click opens modal overlay
- modal close button and backdrop close both supported

### Modal Layout

Use a TSN-style full overlay modal:

- title row: `Thông tin chuyến bay`
- left column:
  - departure / arrival tabs
  - date picker
  - flight number search
  - flight count summary
- right column:
  - status filter
  - scrollable list of flight cards

### Flight Card

Each card includes:

- flight number
- route
- scheduled / estimated / actual times
- gate badge
- check-in badge or belt badge
- status badge
- message area
- action buttons

Departure buttons:

- `Đến check-in`
- `Đến gate`
- `Tìm đường`

Arrival buttons:

- `Đến băng chuyền`

## Status Presentation

Status presentation follows TSN-style behavior:

- color-coded cards
- badge text
- optional info message
- route buttons disabled when status says navigation is no longer appropriate

Phase-1 can keep status rules simple and based on available fields in `Flight`.
More detailed operational rules can be refined after the first working overlay is in place.

## Localization

The flight database does not own multilingual labels.

Localization split:

- modal UI text: existing app translation mechanism
- gate/check-in/belt labels: resolve from current Mappedin `AreaList` / area data in the active language

This keeps the flight feature consistent with the rest of the map.

## Error Handling

- if `/api/flights` fails: show empty-state panel with retry action
- if a flight has no resolved map target: keep card visible, disable the specific route button
- if resolver finds multiple check-in counters: choose one random target only when user clicks

## Testing Strategy

Backend:

- unit tests for `CheckInCounterSpec` parsing and expansion
- unit tests for gate/check-in/belt resolver matching
- endpoint tests for `/api/flights` and `/api/flights/:id/navigation-targets`

Frontend:

- modal open/close behavior
- tab switching
- search/filter state updates
- button enabled/disabled states
- navigation action wiring

## Implementation Boundaries

Files expected to change:

- `backend/server.ts`
- new backend flight service files under `backend/`
- `index.ts`
- `index.html`
- `styles.css` and/or `responsive.css`

No changes are planned to:

- existing Mappedin source data format
- existing overview model synchronization logic
- flight DB schema in this phase

