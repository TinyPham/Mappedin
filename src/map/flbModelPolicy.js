// Manifest identity is authoritative. Names and DisplayWebsite are not FLB classifiers.
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const vector3 = (value, positive = false) => Array.isArray(value) && value.length === 3 && value.every(n => Number.isFinite(n) && (!positive || n > 0));

function assetPath(value) {
  if (!nonempty(value)) return null;
  try { return decodeURI(new URL(value, 'https://flb.invalid/').pathname); } catch { return null; }
}

function verified(entry) {
  const p = entry?.placement;
  return p?.status === 'verified' && nonempty(entry.uuid) && nonempty(p.floorId)
    && Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90
    && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180
    && Number.isFinite(p.elevation) && vector3(p.rotation) && vector3(p.scale, true)
    && nonempty(p.source) && nonempty(p.evidence);
}

/** Returns errors rather than throwing, for admin preflight. Complete set is always 1..32. */
export function validateFlbManifest(manifest) {
  const errors = [];
  if (!Array.isArray(manifest?.entries)) return ['Manifest entries must be an array'];
  if (manifest.schemaVersion !== 1 || !nonempty(manifest.configVersion)) errors.push('Manifest schema/config version is required');
  if (manifest.numbering?.direction !== 'clockwise') errors.push('Manifest numbering must be clockwise');
  const numbers = new Set(), uuids = new Set(), urls = new Set(), coordinates = new Set();
  for (const entry of manifest.entries) {
    if (!entry || !Number.isInteger(entry.flbNo) || entry.flbNo < 1 || entry.flbNo > 32) {
      errors.push('FLB number must be an integer in 1..32');
      continue;
    }
    const tag = `FLB ${entry.flbNo}`;
    if (numbers.has(entry.flbNo)) errors.push(`${tag}: duplicate number`);
    numbers.add(entry.flbNo);
    if (entry.label !== `FLB ${String(entry.flbNo).padStart(2, '0')}`) errors.push(`${tag}: invalid label`);
    const url = assetPath(entry.assetUrl);
    if (!url?.startsWith('/Model3D/flb/') || !url.endsWith('.glb') || !entry.assetUrl.startsWith('/Model3D/flb/') || /[?#]/.test(entry.assetUrl)) errors.push(`${tag}: invalid canonical asset URL`);
    if (urls.has(url)) errors.push(`${tag}: duplicate asset URL`);
    urls.add(url);
    if (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? '') || entry.assetVersion !== entry.sha256?.slice(0, 12)
      || url !== `/Model3D/flb/FLB-${String(entry.flbNo).padStart(2, '0')}.glb`) errors.push(`${tag}: hash, asset version or numbered filename mismatch`);
    if (entry.uuid !== null) {
      if (!nonempty(entry.uuid)) errors.push(`${tag}: invalid UUID`);
      else if (uuids.has(entry.uuid)) errors.push(`${tag}: duplicate UUID`);
      uuids.add(entry.uuid);
    }
    const p = entry.placement;
    if (!['unplaced', 'proposed', 'verified'].includes(p?.status)) errors.push(`${tag}: invalid placement status`);
    if (p?.status === 'unplaced' && Object.keys(p).some(key => key !== 'status')) errors.push(`${tag}: unplaced entry contains placement data`);
    if (p?.status === 'verified' && !verified(entry)) errors.push(`${tag}: verified placement requires assigned UUID, floor, finite transform and survey evidence`);
    if (verified(entry)) {
      const coordinate = JSON.stringify([p.floorId, p.latitude, p.longitude]);
      if (coordinates.has(coordinate)) errors.push(`${tag}: duplicate verified floor coordinate`);
      coordinates.add(coordinate);
    }
  }
  for (let n = 1; n <= 32; n++) if (!numbers.has(n)) errors.push(`FLB ${n}: missing number`);
  return errors;
}

/** All-or-nothing publication guard; proposed or unplaced records never become instances. */
export function getVerifiedFlbPlacements(manifest) {
  const errors = validateFlbManifest(manifest);
  if (errors.length) throw new Error(`Invalid FLB manifest: ${errors.join('; ')}`);
  return manifest.entries.filter(verified);
}

export function getFlbManifestEntry(model, manifest) {
  if (!model || !Array.isArray(manifest?.entries)) return null;
  const path = assetPath(model.url ?? model.assetUrl);
  const byUuid = nonempty(model.uuid) ? manifest.entries.filter(e => nonempty(e?.uuid) && e.uuid === model.uuid) : [];
  const byUrl = path ? manifest.entries.filter(e => assetPath(e?.assetUrl) === path) : [];
  if (byUuid.length > 1 || byUrl.length > 1) return null;
  if (byUuid.length && byUrl.length && byUuid[0] !== byUrl[0]) return null;
  return byUuid[0] ?? byUrl[0] ?? null;
}

export function isFlbModel(model, manifest) { return getFlbManifestEntry(model, manifest) !== null; }
export function getFlbAssetUrl(model, manifest) {
  const entry = getFlbManifestEntry(model, manifest);
  return entry ? `${entry.assetUrl}?v=${entry.assetVersion}` : null;
}

/** Signage bypasses decorative zoom/distance thresholds; no automatic lower-floor shadows. */
export function getFlbModelPolicy(model, manifest, { currentFloorId } = {}) {
  const entry = getFlbManifestEntry(model, manifest);
  const visible = Boolean(entry && verified(entry) && model.uuid === entry.uuid && entry.placement.floorId === currentFloorId);
  return {
    isFlb: Boolean(entry), flbNo: entry?.flbNo ?? null, priority: entry ? 'signage' : 'general',
    shouldLoad: visible, keepLoaded: visible, assetUrl: getFlbAssetUrl(model, manifest),
    placementStatus: entry?.placement?.status ?? null
  };
}
