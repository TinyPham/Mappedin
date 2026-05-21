const CHECKIN_TERMS = [
  'quay thu tuc',
  'quay lam thu tuc',
  'thu tuc',
  'lam thu tuc',
  'dao lam thu tuc',
  'check in',
  'checkin',
  'check-in',
  'check',
  'check in counter',
  'checkin counter',
  'counter',
  '值机',
  '办理登机',
  'チェックイン',
  '체크인'
];

const GATE_TERMS = [
  'cua ra tau bay',
  'cua tau bay',
  'cua khoi hanh',
  'cong bay',
  'gate',
  'boarding gate',
  'departure gate',
  '登机口',
  '搭乗口',
  '탑승구'
];

const RESTROOM_TERMS = [
  'nha ve sinh',
  'toilet',
  'restroom',
  'wc',
  '卫生间',
  'トイレ',
  '화장실'
];

const BAGGAGE_CAROUSEL_TERMS = [
  'bang chuyen',
  'bang chuyen hanh ly',
  'hanh ly',
  'lay hanh ly',
  'nhan hanh ly',
  'dao nhan hanh ly',
  'baggage carousel',
  'baggage belt',
  'baggage claim',
  'baggage reclaim',
  'baggage pickup',
  'luggage',
  'luggage pickup',
  'luggage claim',
  'carousel',
  '\u884c\u674e\u8f6c\u76d8',
  '\u884c\u674e\u63d0\u53d6',
  '\u884c\u674e\u9886\u53d6',
  '\u884c\u674e',
  '\u624b\u8377\u7269\u53d7\u53d6',
  '\u8377\u7269\u53d7\u53d6',
  '\u8377\u7269',
  '\u30d0\u30b2\u30fc\u30b8',
  '\u624b\u8377\u7269',
  '\uc218\ud558\ubb3c',
  '\uc218\ud558\ubb3c \ubca8\ud2b8',
  '\uc218\ud558\ubb3c \ucc3e\uae30',
  '\uc9d0 \ucc3e\uae30'
];

const DEFAULT_ORIGIN_SUGGESTION_RADIUS_METERS = 100;

function stripAccents(value) {
  return String(value || '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function normalizeSearchText(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[‐‑‒–—―_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactText(value) {
  return normalizeSearchText(value).replace(/\s+/g, '');
}

function normalizedTermList(terms) {
  const values = new Set();
  for (const term of terms) {
    values.add(normalizeSearchText(term));
    values.add(compactText(term));
  }
  return values;
}

const CHECKIN_NORMALIZED_TERMS = normalizedTermList(CHECKIN_TERMS);
const GATE_NORMALIZED_TERMS = normalizedTermList(GATE_TERMS);
const RESTROOM_NORMALIZED_TERMS = normalizedTermList(RESTROOM_TERMS);
const BAGGAGE_CAROUSEL_NORMALIZED_TERMS = normalizedTermList(BAGGAGE_CAROUSEL_TERMS);

function includesAnyTerm(text, compact, terms) {
  for (const term of terms) {
    if (!term) continue;
    if (text.includes(term) || compact.includes(term)) return true;
  }
  return false;
}

function detectFamilies(...values) {
  const families = new Set();
  const text = values.map(normalizeSearchText).filter(Boolean).join(' ');
  const compact = values.map(compactText).filter(Boolean).join('');

  if (includesAnyTerm(text, compact, CHECKIN_NORMALIZED_TERMS)) families.add('checkin');
  if (includesAnyTerm(text, compact, GATE_NORMALIZED_TERMS)) families.add('gate');
  if (includesAnyTerm(text, compact, RESTROOM_NORMALIZED_TERMS)) families.add('restroom');
  if (includesAnyTerm(text, compact, BAGGAGE_CAROUSEL_NORMALIZED_TERMS)) families.add('baggage-carousel');

  return families;
}

function visibleSearchStrings(name, obj) {
  const values = [
    name,
    obj?.name,
    obj?.label,
    obj?.title
  ].filter(Boolean);
  return [...new Set(values.map(String))];
}

function hasAdjacentDescriptionPhrase(query, description) {
  const queryTokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  const descriptionTokens = normalizeSearchText(description).split(/\s+/).filter(Boolean);
  if (queryTokens.length < 2 || descriptionTokens.length < 2) return false;

  const descriptionPairs = new Set();
  for (let i = 0; i < descriptionTokens.length - 1; i++) {
    descriptionPairs.add(`${descriptionTokens[i]} ${descriptionTokens[i + 1]}`);
  }

  for (let i = 0; i < queryTokens.length - 1; i++) {
    if (descriptionPairs.has(`${queryTokens[i]} ${queryTokens[i + 1]}`)) return true;
  }

  return false;
}

function descriptionMatchScore(query, description) {
  if (!description || !hasAdjacentDescriptionPhrase(query, description)) return 0;
  return 45;
}

function extractNumbers(value) {
  const normalized = normalizeSearchText(value);
  const matches = normalized.match(/\d+/g) || [];
  return matches.map((item) => String(Number.parseInt(item, 10))).filter((item) => item !== 'NaN');
}

function hasMatchingNumbers(query, targetValues) {
  const queryNumbers = extractNumbers(query);
  if (queryNumbers.length === 0) return true;

  const targetNumbers = new Set(extractNumbers(targetValues.join(' ')));
  if (targetNumbers.size === 0) return false;
  return queryNumbers.every((num) => targetNumbers.has(num));
}

function directTextMatchScore(query, target) {
  const q = normalizeSearchText(query);
  const t = normalizeSearchText(target);
  if (!q || !t) return 0;
  if (t.includes(q)) return 90;

  const qCompact = compactText(query);
  const tCompact = compactText(target);
  if (qCompact && tCompact.includes(qCompact)) return 86;

  const qTokens = q.split(/\s+/).filter(Boolean);
  const tTokens = t.split(/\s+/).filter(Boolean);
  if (qTokens.length === 0 || tTokens.length === 0) return 0;

  let matchedTokens = 0;
  for (const qt of qTokens) {
    const matched = tTokens.some((tt) => {
      if (qt.length <= 2) return tt === qt;
      return tt.includes(qt) || qt.includes(tt);
    });
    if (!matched) return 0;
    matchedTokens++;
  }

  return 50 + matchedTokens * 10;
}

function matchScore(query, name, obj) {
  const visibleValues = visibleSearchStrings(name, obj);
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 1;

  let score = Math.max(0, ...visibleValues.map((value) => directTextMatchScore(query, value)));
  score = Math.max(score, descriptionMatchScore(query, obj?.description));

  const queryFamilies = detectFamilies(query);
  const targetFamilies = detectFamilies(...visibleValues);
  const hasFamilyMatch = [...queryFamilies].some((family) => targetFamilies.has(family));
  if (hasFamilyMatch && hasMatchingNumbers(query, visibleValues)) score += 75;

  const queryNumbers = extractNumbers(query);
  if (queryNumbers.length > 0 && hasMatchingNumbers(query, visibleValues)) score += 15;

  return score;
}

export function matchesWayfindingSearch(query, name, obj = null) {
  return matchScore(query, name, obj) > 0;
}

function coordinateOf(value) {
  if (!value) return null;
  if (Number.isFinite(value.latitude) && Number.isFinite(value.longitude)) return value;
  if (Number.isFinite(value.lat) && Number.isFinite(value.lng)) return value;
  if (value.coordinate) return coordinateOf(value.coordinate);
  if (value.anchor) return coordinateOf(value.anchor);
  if (value.center) return coordinateOf(value.center);
  if (value.centroid) return coordinateOf(value.centroid);
  if (value.position) return coordinateOf(value.position);
  if (Array.isArray(value.entrances) && value.entrances.length > 0) {
    const entrance = value.entrances[0];
    return coordinateOf(entrance.coordinate || entrance.anchor || entrance.center || entrance);
  }
  if (Array.isArray(value.navigableNodes) && value.navigableNodes.length > 0) {
    return coordinateOf(value.navigableNodes[0]);
  }
  return null;
}

function floorIdOf(value, coordinate = coordinateOf(value)) {
  const floor = value?.floor && typeof value.floor === 'object' ? value.floor : null;
  const coordinateFloor = coordinate?.floor && typeof coordinate.floor === 'object' ? coordinate.floor : null;
  return (
    (typeof value?.floor === 'string' ? value.floor : null) ||
    floor?.mappedinId ||
    floor?.id ||
    floor?.mapId ||
    floor?.code ||
    value?.floorId ||
    value?.floorMappedinId ||
    value?.mapId ||
    (typeof coordinate?.floor === 'string' ? coordinate.floor : null) ||
    coordinateFloor?.mappedinId ||
    coordinateFloor?.id ||
    coordinateFloor?.mapId ||
    coordinateFloor?.code ||
    coordinate?.floorId ||
    coordinate?.floorMappedinId ||
    coordinate?.mapId ||
    null
  );
}

function distanceMeters(a, b) {
  const ca = coordinateOf(a);
  const cb = coordinateOf(b);
  if (!ca || !cb) return Infinity;

  const lat1 = ca.latitude ?? ca.lat;
  const lng1 = ca.longitude ?? ca.lng;
  const lat2 = cb.latitude ?? cb.lat;
  const lng2 = cb.longitude ?? cb.lng;
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return Infinity;

  const radius = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function objectIdOf(obj) {
  return obj?.id || obj?.externalId || obj?.mappedinId || obj?.name || null;
}

function isExcludedSearchArea(name, obj) {
  const values = visibleSearchStrings(name, obj).map(normalizeSearchText);
  return values.some((value) =>
    value === 'khu vuc cong cong' ||
    value.startsWith('khu vuc cong cong ') ||
    value === 'khu vuc han che' ||
    value.startsWith('khu vuc han che ') ||
    value === 'public area' ||
    value.startsWith('public area ') ||
    value === 'restricted area' ||
    value.startsWith('restricted area ') ||
    value === 'public zone' ||
    value.startsWith('public zone ') ||
    value === 'restricted zone' ||
    value.startsWith('restricted zone ')
  );
}

function buildObjectIdSet(objects) {
  const ids = new Set();
  for (const obj of objects || []) {
    const id = objectIdOf(obj);
    if (id) ids.add(id);
  }
  return ids;
}

function markNearestResult(results, origin, { showDistanceForAll = false } = {}) {
  if (!origin) return;
  let nearest = null;

  for (const result of results) {
    result.isNearest = false;
    if (!isSameFloorAsOrigin(origin, result.primaryObject)) {
      result.distanceMeters = Infinity;
      result.showDistance = false;
      continue;
    }

    result.distanceMeters = distanceMeters(origin, result.primaryObject);
    result.showDistance = showDistanceForAll;
    if (Number.isFinite(result.distanceMeters) && (!nearest || result.distanceMeters < nearest.distanceMeters)) {
      nearest = result;
    }
  }

  if (nearest) {
    nearest.isNearest = true;
    nearest.showDistance = true;
  }
}

function isSameFloorAsOrigin(origin, obj) {
  const originCoord = coordinateOf(origin);
  const objCoord = coordinateOf(obj);
  const originFloorId = floorIdOf(origin, originCoord);
  const objFloorId = floorIdOf(obj, objCoord);

  if (!originFloorId) return true;
  return objFloorId === originFloorId;
}

function filterToOriginSuggestionScope(results, origin, radiusMeters) {
  if (!origin || !Number.isFinite(radiusMeters) || radiusMeters <= 0) return results;

  return results.filter((result) => {
    if (!isSameFloorAsOrigin(origin, result.primaryObject)) return false;
    result.distanceMeters = distanceMeters(origin, result.primaryObject);
    result.showDistance = true;
    return Number.isFinite(result.distanceMeters) && result.distanceMeters <= radiusMeters;
  });
}

export function rankWayfindingSearchResults({
  query = '',
  objects = [],
  origin = null,
  nodeType = 'destination',
  limit = Infinity,
  originSuggestionRadiusMeters = DEFAULT_ORIGIN_SUGGESTION_RADIUS_METERS,
  excludeObjects = [],
  getName = (obj) => obj?.name || '',
  currentFloorId = null,
  getFloorSortRank = () => Infinity,
  allowedFloorIds = null
} = {}) {
  const safeQuery = String(query || '').trim();
  const seenIds = new Set();
  const excludedIds = buildObjectIdSet(excludeObjects);
  const results = [];

  for (const obj of objects || []) {
    const name = getName(obj);
    if (!name || !String(name).trim()) continue;
    if (isExcludedSearchArea(name, obj)) continue;
    const floorId = floorIdOf(obj);
    if (allowedFloorIds && !allowedFloorIds.has(floorId)) continue;
    if (String(name).toLowerCase().includes('khu vực không tên')) continue;

    const baseScore = safeQuery ? matchScore(safeQuery, name, obj) : 1;
    if (baseScore <= 0) continue;

    const id = objectIdOf(obj);
    if (id && excludedIds.has(id)) continue;
    if (id && seenIds.has(id)) continue;
    if (id) seenIds.add(id);

    const currentFloorMatch = Boolean(safeQuery && currentFloorId && floorId === currentFloorId);

    results.push({
      name,
      primaryObject: obj,
      score: baseScore + (currentFloorMatch ? 25 : 0),
      floorId,
      floorSortRank: getFloorSortRank(obj),
      currentFloorMatch
    });
  }

  if (nodeType === 'destination' && origin && !safeQuery) {
    results.splice(0, results.length, ...filterToOriginSuggestionScope(results, origin, originSuggestionRadiusMeters));
    markNearestResult(results, origin, { showDistanceForAll: true });
  }

  results.sort((a, b) => {
    if (a.isNearest !== b.isNearest) return a.isNearest ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    const aFloorSortRank = Number.isFinite(a.floorSortRank) ? a.floorSortRank : Infinity;
    const bFloorSortRank = Number.isFinite(b.floorSortRank) ? b.floorSortRank : Infinity;
    if (aFloorSortRank !== bFloorSortRank) return aFloorSortRank - bFloorSortRank;
    const aDistance = Number.isFinite(a.distanceMeters) ? a.distanceMeters : Infinity;
    const bDistance = Number.isFinite(b.distanceMeters) ? b.distanceMeters : Infinity;
    if (aDistance !== bDistance) return aDistance - bDistance;
    return String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: 'base' });
  });

  return Number.isFinite(limit) ? results.slice(0, limit) : results;
}
