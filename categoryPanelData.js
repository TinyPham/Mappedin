function normalizeFloorId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeFloorIds(value) {
  if (Array.isArray(value)) {
    return new Set(value.map(normalizeFloorId).filter(Boolean));
  }
  const normalized = normalizeFloorId(value);
  return normalized ? new Set([normalized]) : new Set();
}

export function normalizeOptionalNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function normalizeLocationRecord(row) {
  const rawMappedinId = row?.MappedinID ?? row?.mappedinId;
  const mappedinId = typeof rawMappedinId === 'string' ? rawMappedinId.trim() : rawMappedinId;
  const areaListId = normalizeOptionalNumber(row?.AreaListID ?? row?.id);
  const categoryId = normalizeOptionalNumber(row?.CategoryID ?? row?.categoryId);
  const subCategoryId = normalizeOptionalNumber(row?.SubCategoryID ?? row?.subCategoryId);
  return {
    ...row,
    id: areaListId,
    AreaListID: areaListId,
    categoryId,
    CategoryID: categoryId,
    subCategoryId,
    SubCategoryID: subCategoryId,
    mappedinId: typeof mappedinId === 'string' ? mappedinId : '',
    MappedinID: typeof mappedinId === 'string' ? mappedinId : ''
  };
}

function getMapObjectFloorId(mapObject) {
  if (!mapObject || typeof mapObject !== 'object') return null;
  return normalizeFloorId(
    mapObject.floor?.mappedinId ||
    mapObject.floor?.id ||
    mapObject.floorId ||
    (typeof mapObject.floor === 'string' ? mapObject.floor : null)
  );
}

function getMapObjectFloorIds(mapObject) {
  const ids = [
    mapObject?.floor?.mappedinId,
    mapObject?.floor?.externalId,
    mapObject?.floor?.id,
    mapObject?.floorId,
    typeof mapObject?.floor === 'string' ? mapObject.floor : null
  ].map(normalizeFloorId).filter(Boolean);
  return Array.from(new Set(ids));
}

function floorMatches(floorId, currentFloorIds) {
  if (currentFloorIds.size === 0) return true;
  return currentFloorIds.has(floorId);
}

export function buildAssignedAreaEntries(assignedMIDs, locationRows, currentFloorId, isOverview, mapObjectsById = new Map()) {
  const normalizedCurrentFloorIds = normalizeFloorIds(currentFloorId);
  const locationRowsById = new Map();

  (locationRows || []).forEach((row) => {
    const mappedinId = row?.MappedinID;
    if (mappedinId && !locationRowsById.has(mappedinId)) {
      locationRowsById.set(mappedinId, row);
    }
  });

  const effectiveMappedinIds = (assignedMIDs && assignedMIDs.length > 0)
    ? assignedMIDs
    : (locationRows || []).map((row) => row?.MappedinID).filter(Boolean);

  return Array.from(new Set(effectiveMappedinIds))
    .map((mappedinId) => {
      if (!mappedinId) return null;

      const mapObject = mapObjectsById.get(mappedinId) || null;
      const dbRow = locationRowsById.get(mappedinId) || null;
      const floorId = normalizeFloorId(dbRow?.FloorID) || getMapObjectFloorId(mapObject);

      if (!isOverview && floorId && !floorMatches(floorId, normalizedCurrentFloorIds)) {
        return null;
      }

      return {
        mappedinId,
        floorId,
        mapObject,
        dbRow
      };
    })
    .filter(Boolean);
}

export function hasAssignmentsOnVisibleFloor(subCategoryId, assignments, currentFloorId, isOverview, mapObjectsById = new Map()) {
  const normalizedSubCategoryId = String(subCategoryId);
  const normalizedCurrentFloorIds = normalizeFloorIds(currentFloorId);

  return assignments.some((assignment) => {
    if (String(assignment?.SubCategoryID) !== normalizedSubCategoryId) return false;
    if (isOverview) return true;

    const mid = String(assignment?.MappedinID || "").trim();
    const mapObject = mapObjectsById.get(mid) || 
                       mapObjectsById.get(mid.toLowerCase()) || 
                       mapObjectsById.get(mid.toUpperCase());

    const floorIds = [
      normalizeFloorId(assignment?.FloorID),
      ...getMapObjectFloorIds(mapObject)
    ].filter(Boolean);
    return floorIds.some((floorId) => floorMatches(floorId, normalizedCurrentFloorIds));
  });
}

export function buildVisibleCategoryAreas(locationRows, currentFloorId, isOverview, mapObjectsById = new Map()) {
  const normalizedCurrentFloorIds = normalizeFloorIds(currentFloorId);

  return locationRows
    .map((row) => {
      const mappedinId = row?.MappedinID;
      if (!mappedinId) return null;

      const mapObject = mapObjectsById.get(mappedinId) || null;
      const floorId = normalizeFloorId(row?.FloorID) || getMapObjectFloorId(mapObject);
      if (!isOverview && floorId && !floorMatches(floorId, normalizedCurrentFloorIds)) {
        return null;
      }

      return {
        mappedinId,
        floorId,
        mapObject,
        dbRow: row
      };
    })
    .filter(Boolean);
}

export function buildSubCategoryLocationEntries(subCategoryId, locationRows, currentFloorId, isOverview, mapObjectsById = new Map()) {
  const normalizedSubCategoryId = normalizeOptionalNumber(subCategoryId);
  const normalizedRows = (locationRows || [])
    .map(normalizeLocationRecord)
    .filter((row) => {
      if (!row.MappedinID) return false;
      
      // If we have a specific subcategory filter, apply it
      if (normalizedSubCategoryId !== null) {
        const rowSubId = normalizeOptionalNumber(row.SubCategoryID);
        if (rowSubId !== null && rowSubId !== normalizedSubCategoryId) return false;
      }

      // If mapObjectsById is provided, we prefer to have a match, but if we're relying on DB, 
      // we might want to show it anyway (e.g. if the SDK hasn't loaded it yet but we have the ID).
      // However, for highlighting to work, we eventually need the mapObject.
      // We'll keep the filter but make it case-insensitive for robustness if possible.
      const mid = String(row.MappedinID).trim();
      const hasObject = mapObjectsById.has(mid) || 
                       mapObjectsById.has(mid.toLowerCase()) || 
                       mapObjectsById.has(mid.toUpperCase());
      
      return hasObject || (mapObjectsById.size === 0);
    });

  return buildVisibleCategoryAreas(normalizedRows, currentFloorId, isOverview, mapObjectsById);
}
