import {getAviationMarkerPolicy, markerCoordinatesForFloor} from './aviationMarkerPolicy.js';
import {markerPresentation} from './markerPresentation.js';
import {clusterAviationMarkers} from './aviationMarkerClustering.js';

// Each rendered marker is anchored to one real POI, even at reduced detail.
export function createAirportMarkerController({mapView, objects, getLocations, getName, getImage,
  getGate, getCheckin = () => null, getRequiredObjectIds = () => [], overviewFloorId,
  markerIdToObject, onSelect}) {
  const owned = new Map();
  let floorId = null, floorEntries = null, lastBucket = null, pendingFrame = null;
  // A distinct bucket at 16.5 guarantees the label threshold is exact.
  const bucket = zoom => zoom < 16.5 ? 16 : zoom <= 17.5 ? 17.5 :
    zoom >= 21.5 ? 21.5 : Math.floor(zoom * 2) / 2;

  const choose = async (entry, event) => {
    if (entry.sourceFloorId !== mapView.currentFloor?.id) await mapView.setFloor(entry.sourceFloorId);
    // Select the displayed real POI; suppressed POIs are never click candidates.
    onSelect(entry.obj, null, event);
  };
  const pick = event => {
    const target = event.target.closest?.('.airport-poi-marker[data-airport-key]');
    const clicked = target && owned.get(target.dataset.airportKey);
    if (!clicked) return;
    event.preventDefault();
    event.stopPropagation();
    void choose(clicked, event);
  };
  document.addEventListener('click', pick, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const element = event.target.closest?.('.airport-poi-marker');
    if (!element) return;
    const rect = element.getBoundingClientRect();
    pick({target: element, clientX: rect.x + rect.width / 2,
      clientY: rect.y + rect.height / 2, preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation()});
  }, true);

  function cancelPending() {
    if (pendingFrame !== null) { cancelAnimationFrame(pendingFrame); pendingFrame = null; }
  }
  function remove(key, entry) {
    markerIdToObject.delete(entry.marker.id);
    mapView.Markers.remove(entry.marker);
    owned.delete(key);
  }
  function clear() {
    cancelPending();
    for (const [key, entry] of owned) remove(key, entry);
    floorEntries = null;
    floorId = null;
    lastBucket = null;
  }
  function syncFloor() {
    const current = mapView.currentFloor?.id || null;
    if (current === floorId) return;
    for (const [key, entry] of owned) remove(key, entry);
    floorId = current;
    floorEntries = null;
    lastBucket = null;
    if (current && current !== overviewFloorId) mapView.Labels.removeAll();
  }
  function collectFloorEntries() {
    if (!floorId || floorId === overviewFloorId) return [];
    const locations = getLocations() || {}, requiredObjectIds = getRequiredObjectIds();
    const entries = [];
    for (const obj of objects) {
      const coordinates = markerCoordinatesForFloor(obj, floorId, overviewFloorId);
      if (!coordinates.length) continue;
      const name = getName(obj);
      if (!name) continue;
      const location = locations[obj.id] || locations[obj.mappedinId];
      const policy = getAviationMarkerPolicy(obj, location,
        {zoom: mapView.Camera.zoomLevel, gate: getGate(obj.id), requiredObjectIds});
      const iconPath = location?.subCategoryIcon || getImage(obj);
      const icon = iconPath ? (iconPath.startsWith('/') || /^https?:/.test(iconPath) ?
        iconPath : `/icon-category/${iconPath}`) : null;
      for (const coordinate of coordinates) {
        entries.push({obj, name, location, icon, policy, coordinate, checkin: getCheckin(obj.id)});
      }
    }
    return entries;
  }
  function reconcile(zoom) {
    lastBucket = zoom;
    const clustered = clusterAviationMarkers(floorEntries || [], {zoom, floorId, overviewFloorId});
    const desired = new Map();
    for (const entry of clustered) {
      const {obj, name, icon, policy, coordinate, members, key} = entry;
      const sourceFloorId = coordinate.sourceFloorId || coordinate.floorId;
      const html = markerPresentation({name, icon, policy, sourceFloorId,
        ownershipKey: key, memberCount: members.length,
        checkinIsland: entry.checkin?.island || '', showLabel: zoom >= 16.5});
      const options = {interactive: 'pointer-events-auto', rank: policy.rank,
        occlude: policy.occlude, dynamicResize: policy.dynamicResize,
        placement: ['center'], lowPriorityPin: {enabled: false}};
      const signature = JSON.stringify([html, coordinate.latitude, coordinate.longitude,
        sourceFloorId, options.rank, options.occlude, options.dynamicResize]);
      desired.set(key, {...entry, obj, members, sourceFloorId, html, options, signature});
    }
    for (const [key, entry] of owned) {
      if (desired.get(key)?.signature !== entry.signature) remove(key, entry);
    }
    for (const [key, entry] of desired) {
      const existing = owned.get(key);
      if (existing) {
        existing.members = entry.members;
        existing.obj = entry.obj;
        markerIdToObject.set(existing.marker.id, entry.obj);
        continue;
      }
      try {
        const point = mapView.createCoordinate(entry.coordinate.latitude,
          entry.coordinate.longitude, mapView.currentFloor);
        const marker = mapView.Markers.add(point, entry.html, entry.options);
        markerIdToObject.set(marker.id, entry.obj);
        owned.set(key, {...entry, marker});
      } catch (error) {
        console.warn('[Airport markers] Anchor unavailable', entry.obj.id, error?.message);
      }
    }
  }
  function refresh() {
    cancelPending();
    syncFloor();
    floorEntries = collectFloorEntries();
    reconcile(bucket(mapView.Camera.zoomLevel));
  }
  mapView.on('camera-change', () => {
    const targetBucket = bucket(mapView.Camera.zoomLevel);
    if (mapView.currentFloor?.id === floorId && targetBucket === lastBucket) return;
    if (pendingFrame !== null) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = null;
      syncFloor();
      if (floorEntries === null) floorEntries = collectFloorEntries();
      const nextBucket = bucket(mapView.Camera.zoomLevel);
      if (nextBucket !== lastBucket) reconcile(nextBucket);
    });
  });
  return {refresh, clear, count: () => owned.size};
}
