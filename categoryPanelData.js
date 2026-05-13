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

function firstNonEmpty(values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() || '';
}

export function getLocalizedAreaName(row, language = 'vn', fallback = '') {
  const requestedLang = String(language || 'vn').toLowerCase();
  const lang = requestedLang === 'vi' ? 'vn' : requestedLang;
  const columnByLang = {
    vn: 'VN',
    en: 'EN',
    zh: 'ZH',
    ja: 'JA',
    ko: 'KO'
  };
  const preferredColumn = columnByLang[lang] || 'VN';

  return firstNonEmpty([
    row?.names?.[lang],
    row?.[preferredColumn],
    row?.[preferredColumn.toLowerCase()],
    row?.names?.vn,
    row?.VN,
    row?.vn,
    row?.EN,
    row?.en,
    row?.Name,
    row?.name,
    fallback,
    row?.MappedinID,
    row?.mappedinId
  ]);
}

function getMapObjectByMappedinId(mapObjectsById, mappedinId) {
  if (!mapObjectsById || !mappedinId) return null;
  const mid = String(mappedinId).trim();
  return mapObjectsById.get(mid) ||
    mapObjectsById.get(mid.toLowerCase()) ||
    mapObjectsById.get(mid.toUpperCase()) ||
    null;
}

function hasMeaningfulValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function mergeMeaningfulValues(base, incoming) {
  const merged = { ...(base || {}) };
  Object.entries(incoming || {}).forEach(([key, value]) => {
    if (!hasMeaningfulValue(value)) return;

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      merged[key] &&
      typeof merged[key] === 'object' &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = mergeMeaningfulValues(merged[key], value);
      return;
    }

    merged[key] = value;
  });
  return merged;
}

export function mergeLocationRowsByMappedinId(...rowGroups) {
  const mergedMap = new Map();

  rowGroups.flat().forEach((row) => {
    const mid = typeof row?.MappedinID === 'string'
      ? row.MappedinID.trim()
      : (typeof row?.mappedinId === 'string' ? row.mappedinId.trim() : '');
    if (!mid) return;

    const existing = mergedMap.get(mid) || {};
    mergedMap.set(mid, mergeMeaningfulValues(existing, row));
  });

  return Array.from(mergedMap.values());
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

      const mapObject = getMapObjectByMappedinId(mapObjectsById, mappedinId);
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
    const mapObject = getMapObjectByMappedinId(mapObjectsById, mid);

    const floorIds = [
      normalizeFloorId(assignment?.FloorID),
      ...getMapObjectFloorIds(mapObject)
    ].filter(Boolean);
    return floorIds.some((floorId) => floorMatches(floorId, normalizedCurrentFloorIds));
  });
}

export function buildVisibleCategoryAreas(locationRows, currentFloorId, isOverview, mapObjectsById = new Map(), language = 'vn') {
  const normalizedCurrentFloorIds = normalizeFloorIds(currentFloorId);

  return locationRows
    .map((row) => {
      const mappedinId = row?.MappedinID;
      if (!mappedinId) return null;

      const mapObject = getMapObjectByMappedinId(mapObjectsById, mappedinId);
      const floorId = normalizeFloorId(row?.FloorID) || getMapObjectFloorId(mapObject);
      if (!isOverview && floorId && !floorMatches(floorId, normalizedCurrentFloorIds)) {
        return null;
      }

      return {
        mappedinId,
        floorId,
        mapObject,
        dbRow: row,
        displayName: getLocalizedAreaName(row, language, mapObject?.name)
      };
    })
    .filter(Boolean);
}

export function buildSubCategoryLocationEntries(subCategoryId, locationRows, currentFloorId, isOverview, mapObjectsById = new Map(), language = 'vn') {
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

      return true;
    });

  return buildVisibleCategoryAreas(normalizedRows, currentFloorId, isOverview, mapObjectsById, language);
}
