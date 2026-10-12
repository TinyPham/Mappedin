// Presentation clusters retain actual Mappedin objects/anchors for routing.
const normalized = name => String(name || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
const identity = e => `${e.obj.id}:${e.coordinate.floorId}:${e.coordinate.latitude}:${e.coordinate.longitude}`;
// A single security hall or retail/service row can span hundreds of metres.
// Keep its geographic members stable while zoom reveals 1, 2, 3–5, then all.
// Complete-link grouping below stops chains merging separate distant halls.
const FACILITY_GROUP_MAX_DIAMETER_METERS = 260;

// One actual named point at far zoom, then progressively reveal the local points.
// These steps match the controller's 0.5-zoom buckets; close zoom exposes all IDs.
export function visibleMarkerLimit(zoom) {
  if (zoom <= 17.5) return 1;
  if (zoom < 18.5) return 2;
  if (zoom < 19) return 3;
  if (zoom < 19.5) return 4;
  if (zoom < 20) return 5;
  if (zoom < 20.5) return 8;
  if (zoom < 21) return 12;
  if (zoom < 21.5) return 18;
  return Infinity;
}

// Partition every physical point exactly once so choosing a proxy can still
// select a specific counter or security desk. A representative is a real POI.
function representativeGroups(members, limit, sortBy = identity) {
  const ordered = [...members].sort((a, b) => {
    const x = sortBy(a), y = sortBy(b);
    return typeof x === 'number' && typeof y === 'number' ? x - y || identity(a).localeCompare(identity(b)) :
      String(x).localeCompare(String(y));
  });
  const count = Math.min(ordered.length, limit);
  if (count === ordered.length) return ordered.map(e => [e]);
  const groups = [];
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * ordered.length / count);
    const end = Math.floor((i + 1) * ordered.length / count);
    groups.push(ordered.slice(start, end));
  }
  return groups;
}

function nearbyGroups(entries, radius, distance) {
  if (radius <= 0) return entries.map(e => [e]);
  const ordered = [...entries].sort((a, b) =>
    a.coordinate.longitude - b.coordinate.longitude ||
    a.coordinate.latitude - b.coordinate.latitude || identity(a).localeCompare(identity(b)));
  const groups = [];
  for (const entry of ordered) {
    let best = null, bestDistance = Infinity;
    for (const group of groups) {
      // Complete-link: a chain of facilities must not collapse a whole wing.
      let farthest = 0;
      for (const member of group) {
        farthest = Math.max(farthest, distance(entry, member));
        if (farthest > radius) break;
      }
      if (farthest <= radius && farthest < bestDistance) {
        best = group;
        bestDistance = farthest;
      }
    }
    if (best) best.push(entry);
    else groups.push([entry]);
  }
  return groups;
}

export function clusterAviationMarkers(entries, {zoom = 17, floorId, overviewFloorId} = {}) {
  if (!floorId || floorId === overviewFloorId) return [];
  const ordered = entries.filter(e => e.coordinate.floorId === floorId)
    .sort((a, b) => identity(a).localeCompare(identity(b)));
  const indices = new Map(ordered.map((e, i) => [e, i]));
  const distances = new Map();
  function distance(a, b) {
    if (a === b) return 0;
    const i = indices.get(a), j = indices.get(b);
    const key = i < j ? `${i}:${j}` : `${j}:${i}`;
    if (!distances.has(key)) {
      const ca = a.coordinate, cb = b.coordinate;
      distances.set(key, Math.hypot((ca.longitude - cb.longitude) *
        Math.cos((ca.latitude + cb.latitude) * Math.PI / 360),
      ca.latitude - cb.latitude) * 111320);
    }
    return distances.get(key);
  }
  function present(members, {preferred = null, name = null} = {}) {
    const sorted = [...members].sort((a, b) => identity(a).localeCompare(identity(b)));
    let entry = preferred;
    if (!entry) {
      let minimum = Infinity;
      for (const candidate of sorted) {
        const sum = sorted.reduce((total, m) => total + distance(candidate, m), 0);
        if (sum < minimum) { minimum = sum; entry = candidate; }
      }
    }
    return {...entry, name: name || entry.name, members: sorted,
      key: sorted.map(identity).join('|')};
  }
  const groups = new Map(), result = [], facilities = [];
  for (const entry of ordered) {
    if (entry.policy.iconOnly) { result.push(present([entry])); continue; }
    const island = entry.checkin?.island;
    if (!island && !entry.policy.label) { facilities.push(entry); continue; }
    const kind = island ? `island:${island}` : `individual:${identity(entry)}`;
    if (!groups.has(kind)) groups.set(kind, []);
    groups.get(kind).push(entry);
  }
  // Connect nearby-compatible facilities by either their localized display name
  // or the exact catalogue category+icon. A point may bridge both definitions;
  // the geographic diameter limit below still separates different concourses.
  const parent = facilities.map((_, i) => i);
  const root = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const seen = new Map();
  for (let i = 0; i < facilities.length; i++) {
    const entry = facilities[i];
    const category = entry.location?.subCategoryId ?? entry.location?.SubCategoryID;
    const name = normalized(entry.name);
    const keys = [name && `name:${name}`,
      category != null && entry.icon && `category-icon:${category}:${entry.icon}`].filter(Boolean);
    for (const key of keys) {
      if (seen.has(key)) parent[root(i)] = root(seen.get(key));
      else seen.set(key, i);
    }
  }
  for (let i = 0; i < facilities.length; i++) {
    const kind = `facility:${root(i)}`;
    if (!groups.has(kind)) groups.set(kind, []);
    groups.get(kind).push(facilities[i]);
  }
  for (const members of groups.values()) {
    const island = members.find(e => e.checkin?.counterNo === null);
    const counters = members.filter(e => Number.isInteger(e.checkin?.counterNo));
    const limit = visibleMarkerLimit(zoom);
    if (counters.length) {
      const clusters = representativeGroups(counters, limit, e => e.checkin.counterNo);
      for (const [index, cluster] of clusters.entries()) {
        // Keep the original island point available in the far-zoom chooser.
        const included = index === 0 && zoom <= 17.5 && island ? [...cluster, island] : cluster;
        const representative = cluster[Math.floor((cluster.length - 1) / 2)];
        result.push(present(included, {preferred: representative, name: representative.name}));
      }
      continue;
    }
    const radius = zoom >= 21.5 ? 0 : FACILITY_GROUP_MAX_DIAMETER_METERS;
    for (const vicinity of nearbyGroups(members, radius, distance)) {
      // All named service/security points of the same category and icon can be
      // represented by a few real points, even when their display names differ.
      for (const cluster of representativeGroups(vicinity, limit, e =>
        `${e.coordinate.longitude.toFixed(8)}:${e.coordinate.latitude.toFixed(8)}:${identity(e)}`)) {
        const representative = cluster[Math.floor((cluster.length - 1) / 2)];
        result.push(present(cluster, {preferred: representative, name: representative.name}));
      }
    }
  }
  return result.sort((a, b) => a.key.localeCompare(b.key));
}
