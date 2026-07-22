export const PASSENGER_FLOOR_IDS = Object.freeze([
  'm_dae8f26a40f6017f',
  'm_41a38d6d0411d397',
  'm_d4b5674c0b15e099',
  'm_1523f7dcde647c40'
]);

const passengerFloorIdSet = new Set(PASSENGER_FLOOR_IDS);

export function isSelectableFloor(floor, overviewFloorId) {
  if (!floor?.id) return false;
  return floor.id === overviewFloorId || passengerFloorIdSet.has(floor.id);
}

export function selectFloorsForDropdown(floors, overviewFloorId) {
  return Array.isArray(floors)
    ? floors.filter((floor) => isSelectableFloor(floor, overviewFloorId))
    : [];
}
