# Collapse Initial Walking Instruction Design

## Goal

Simplify the displayed navigation timeline by removing the first walking instruction after Departure while preserving the physical distance, estimated time, landmark context, all later instructions, route geometry, and SDK navigation data.

## Display Contract

Given a final UI instruction list:

1. Departure / Start
2. First walking instruction
3. Next instruction
4. Any number of later instructions

the display transformation must:

- add the second instruction's effective displayed distance to Departure's existing effective displayed distance;
- add its `time` and `duration` metadata to the corresponding Departure metadata when either side defines those fields, so downstream consumers do not lose explicit timing data;
- remove the second instruction;
- preserve the former third and all later instructions in their original order with their own actions, coordinates, distances, timing, and connection metadata unchanged;
- renumber naturally through the existing render-loop index;
- transfer the removed instruction's landmark lookup coordinate to the next retained walking instruction, searching past structural connection/stopover steps when necessary, allowing that walking action text to include the former `near <landmark>` context;
- leave the Arrival instruction as the final step.

For the example `[Departure 0m, Turn A 5m, Turn B 8m, Turn C 11m, Arrival]`, the result is `[Departure 5m, Turn B near A 8m, Turn C 11m, Arrival]`. If Departure already displays 2m, the same collapse yields Departure 7m rather than discarding its existing segment.

## Eligibility and Safety

Apply the transformation exactly once to the combined route displayed to the user, not once per leg or stopover.

The transformation is eligible only when:

- the first retained instruction is `departure` or `start`;
- a second instruction exists;
- the second instruction is a walking action: `turn` or `continue`;
- the second instruction has no `action.connection` metadata and is not identified as an elevator, escalator, stair, or connection action;
- the route has at least one retained instruction after the removed step.

Do not remove a second instruction that is Arrival, a stopover, an elevator, escalator, stair, connection entry/exit, or any other structural action. Do not transfer landmark wording onto a connection, stopover, or Arrival. Search forward for the next retained `turn` or `continue` instruction and attach the landmark override there; omit the override only when no later walking instruction exists.

The helper must clone instruction/action shells and must not mutate SDK directions, prepared legs, or its input array. Route drawing continues to use the original per-leg SDK directions.

## Data Flow

1. SDK directions are requested and prepared with the existing validation and simplification pipeline.
2. Prepared legs are aggregated into `uiDirections`.
3. Existing structural filtering produces the final candidate UI instruction list.
4. A pure display helper transforms that candidate list once.
5. The transformed list is assigned to the UI directions used by timeline rendering, click selection, cumulative preview boundaries, total display distance, and estimated step time.
6. `createInstructionFormatter` resolves a landmark using an optional transferred landmark coordinate before falling back to the instruction's own coordinate.

The helper treats `getInstructionDisplayDistance()` as the effective display source. Departure receives the sum of its existing effective distance and the removed instruction's effective distance, stored coherently in both `distance` and the higher-precedence `_displayDistance`. `originalDistance` is merged separately from the two original-distance values so cumulative preview distance remains conserved. Every later distance remains unchanged; therefore both the effective displayed-distance sum and all later physical preview boundaries remain conserved.

The current renderer derives badge seconds from effective distance rather than consuming `time` or `duration`. It continues doing so after collapse, meaning Departure's displayed seconds are recomputed from the merged distance. Explicit `time`/`duration` fields are additively preserved for other consumers but do not override the existing UI speed formula.

## Components

### Navigation instruction rules

Add a pure exported helper in `src/navigation/navigationInstructionRules.js` that:

- clones the instruction list;
- checks eligibility by action type;
- additively merges the removed instruction's effective display distance, original distance, and timing metadata into Departure;
- stores the removed step coordinate on the next walking instruction, even beyond intervening structural steps, as internal landmark metadata;
- removes exactly the second instruction;
- returns the transformed clone.

Extend the existing clone helper so the internal landmark coordinate survives later defensive clones.

### Formatter

Update landmark lookup to prefer the transferred internal landmark coordinate. The next step keeps its own action and coordinate for route selection; only landmark lookup uses the override. A normal `continue` still never receives a nearby landmark. A `continue` with transferred landmark metadata explicitly appends the transferred `near <landmark>` text.

### Main integration

Call the helper once after aggregated structural filtering and before assigning/rendering `directions.instructions`. The map SDK draw call and original `legDirections` remain unchanged.

## Error and Edge Handling

- Empty, one-step, and two-step lists return cloned unchanged lists.
- Missing coordinates do not throw; landmark lookup falls back to the retained instruction coordinate.
- Missing or non-finite distance/timing metadata contributes zero and does not create an explicit timing field unless one of the merged instructions defined it.
- The existing UI time calculation continues deriving seconds from the merged displayed distance regardless of explicit timing metadata, preserving current rendering semantics.
- The input list and nested action objects remain unchanged.

## Testing

Add test-first regression coverage for:

- a five-step example matching the requested transformation;
- a long route proving only the initial walking step is removed and every later step is preserved;
- effective display-distance sum conservation with nonzero distances on both Departure and step two, plus coherent additive merging of `distance`, `originalDistance`, `_displayDistance`, `time`, and `duration` where defined;
- original-distance cumulative-total conservation and unchanged physical preview boundaries for every later retained instruction;
- landmark lookup using the removed step coordinate while retaining the next step action/coordinate;
- landmark transfer searching beyond intervening connections/stopovers to the next walking step;
- transferred landmark support for `continue`, while ordinary go-straight instructions remain landmark-free;
- no input or nested-action mutation;
- no collapse when step two is a connection, carries connection metadata despite a walking action type, is an elevator/escalator/stair action, stopover, Arrival, or another structural action;
- safe behavior for short lists and missing coordinates;
- a multi-leg route proving collapse happens once after aggregation and not again after a stopover;
- retained click/index coordinate mapping proving old step three becomes displayed step two without losing its coordinate;
- main-source integration calling the helper once after filtering and before rendering/assignment;
- related navigation rule tests and the production build.
