export function getManualFloorSwitchSequence({
  isInOverview,
  targetIsOverview,
  targetFloorId,
  overviewFloorId,
  hasPreloadedFloors,
  floorIds,
}) {
  if (!targetFloorId) return [];

  // If floors are preloaded, always switch directly to avoid lag
  if (hasPreloadedFloors) {
    return [targetFloorId];
  }

  if (!isInOverview || targetIsOverview || hasPreloadedFloors) {
    return [targetFloorId];
  }

  const warmupFloorId = (floorIds || []).find(
    (floorId) => floorId !== targetFloorId && floorId !== overviewFloorId,
  );

  return warmupFloorId ? [warmupFloorId, targetFloorId] : [targetFloorId];
}
