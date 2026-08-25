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

- copy the second instruction's displayed distance to Departure;
- copy its `time` and `duration` metadata when present, so downstream consumers do not lose explicit timing data;
- remove the second instruction;
- preserve the former third and all later instructions in their original order with their own actions, coordinates, distances, timing, and connection metadata unchanged;
- renumber naturally through the existing render-loop index;
- transfer the removed instruction's landmark lookup coordinate to the next retained walking instruction, allowing its action text to include the former `near <landmark>` context;
- leave the Arrival instruction as the final step.

For the example `[Departure, Turn A 5m, Turn B 8m, Turn C 11m, Arrival]`, the result is `[Departure 5m, Turn B near A 8m, Turn C 11m, Arrival]`.

## Eligibility and Safety

Apply the transformation exactly once to the combined route displayed to the user, not once per leg or stopover.

The transformation is eligible only when:

- the first retained instruction is `departure` or `start`;
- a second instruction exists;
- the second instruction is a walking action: `turn` or `continue`;
- the route has at least one retained instruction after the removed step.

Do not remove a second instruction that is Arrival, a stopover, an elevator, escalator, stair, connection entry/exit, or any other structural action. Do not transfer landmark wording onto a connection, stopover, or Arrival. If the immediate next retained instruction cannot receive walking landmark context, omit the landmark transfer while still applying the approved walking-step collapse.

The helper must clone instruction/action shells and must not mutate SDK directions, prepared legs, or its input array. Route drawing continues to use the original per-leg SDK directions.

## Data Flow

1. SDK directions are requested and prepared with the existing validation and simplification pipeline.
2. Prepared legs are aggregated into `uiDirections`.
3. Existing structural filtering produces the final candidate UI instruction list.
4. A pure display helper transforms that candidate list once.
5. The transformed list is assigned to the UI directions used by timeline rendering, click selection, cumulative preview boundaries, total display distance, and estimated step time.
6. `createInstructionFormatter` resolves a landmark using an optional transferred landmark coordinate before falling back to the instruction's own coordinate.

Because the removed instruction's distance metadata is moved to Departure and every later distance remains unchanged, the displayed walking-distance sum and preview boundaries remain conserved for the expected SDK representation.

## Components

### Navigation instruction rules

Add a pure exported helper in `src/navigation/navigationInstructionRules.js` that:

- clones the instruction list;
- checks eligibility by action type;
- transfers the removed instruction's display/original distance and timing metadata to Departure;
- stores the removed step coordinate on the next walking instruction as internal landmark metadata;
- removes exactly the second instruction;
- returns the transformed clone.

Extend the existing clone helper so the internal landmark coordinate survives later defensive clones.

### Formatter

Update landmark lookup to prefer the transferred internal landmark coordinate. The next step keeps its own action and coordinate for route selection; only landmark lookup uses the override.

### Main integration

Call the helper once after aggregated structural filtering and before assigning/rendering `directions.instructions`. The map SDK draw call and original `legDirections` remain unchanged.

## Error and Edge Handling

- Empty, one-step, and two-step lists return cloned unchanged lists.
- Missing coordinates do not throw; landmark lookup falls back to the retained instruction coordinate.
- Missing or non-finite distance/timing metadata is not synthesized by the helper.
- The existing UI time calculation continues deriving seconds from the transferred displayed distance when explicit timing is absent.
- The input list and nested action objects remain unchanged.

## Testing

Add test-first regression coverage for:

- a five-step example matching the requested transformation;
- a long route proving only the initial walking step is removed and every later step is preserved;
- distance sum conservation and transfer of `distance`, `originalDistance`, `_displayDistance`, `time`, and `duration` where defined;
- landmark lookup using the removed step coordinate while retaining the next step action/coordinate;
- no input or nested-action mutation;
- no collapse when step two is a connection, elevator/escalator/stair action, stopover, Arrival, or another structural action;
- safe behavior for short lists and missing coordinates;
- main-source integration calling the helper once after filtering and before rendering/assignment;
- related navigation rule tests and the production build.
