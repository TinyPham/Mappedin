import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Box3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
let policy;
try { policy = await import('../src/map/flbModelPolicy.js'); } catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }
const manifestPath = new URL('../Model3D/flb/manifest.json', import.meta.url);
let manifest;
if (existsSync(manifestPath)) manifest = JSON.parse(readFileSync(manifestPath));
test('32-number manifest exists', () => assert.ok(manifest, 'generated FLB manifest is missing'));
test('manifest covers 01..32 exactly, clockwise, with seven source anchors and no invented placements', () => {
  assert.deepEqual(policy.validateFlbManifest(manifest), []);
  assert.equal(manifest.numbering.direction, 'clockwise');
  assert.deepEqual(manifest.numbering.imageAnchorNumbers, [1, 2, 5, 10, 15, 23, 32]);
  assert.equal(policy.getVerifiedFlbPlacements(manifest).length, 0);
  for (const entry of manifest.entries) {
    assert.equal(entry.uuid, null);
    assert.deepEqual(entry.placement, { status: 'unplaced' });
    assert.equal(entry.label, `FLB ${String(entry.flbNo).padStart(2, '0')}`);
  }
});
test('validation rejects missing, duplicate, out-of-range, duplicate identity and bad placement data', () => {
  for (const mutate of [m => m.entries.pop(), m => m.entries.push(m.entries[0]), m => m.entries[0].flbNo = 33, m => m.entries[0].flbNo = '1', m => m.entries[0].assetUrl = m.entries[1].assetUrl, m => { m.entries[0].uuid = 'same'; m.entries[1].uuid = 'same'; }, m => m.entries[0].placement = { status: 'verified' }, m => m.entries[0].placement = { status: 'unplaced', latitude: 10 }, m => m.entries[0].sha256 = 'wrong', m => m.entries[0].assetVersion = 'wrong', m => m.numbering.direction = 'counterclockwise', m => m.entries[0].label = 'Gate 01']) {
    const copy = structuredClone(manifest); mutate(copy);
    assert.ok(policy.validateFlbManifest(copy).length > 0);
  }
});
test('distinct verified signs cannot occupy the same surveyed floor coordinate', () => {
  const copy = structuredClone(manifest);
  for (const [i, entry] of copy.entries.slice(0, 2).entries()) {
    entry.uuid = `survey-${i}`;
    entry.placement = { status: 'verified', floorId: 'survey-floor', latitude: 10, longitude: 106, elevation: 2, scale: [1, 1, 1], rotation: [0, 0, 0], source: 'survey', evidence: 'anchor comparison' };
  }
  assert.ok(policy.validateFlbManifest(copy).some(error => /duplicate.*coordinate/i.test(error)));
});
test('verified placements require finite surveyed transforms and unique complete identities', () => {
  const copy = structuredClone(manifest);
  copy.entries[0].uuid = 'survey-assigned';
  copy.entries[0].placement = { status: 'verified', floorId: 'survey-floor', latitude: 10, longitude: 106, elevation: 2, scale: [1, 1, 1], rotation: [0, 0, 0], source: 'survey', evidence: 'anchor comparison' };
  assert.deepEqual(policy.validateFlbManifest(copy), []);
  assert.equal(policy.getVerifiedFlbPlacements(copy).length, 1);
  for (const mutate of [p => p.latitude = Infinity, p => p.longitude = 181, p => p.scale = [0, 1, 1], p => p.rotation = [0, NaN, 0], p => p.floorId = '', p => p.evidence = '']) {
    const bad = structuredClone(copy); mutate(bad.entries[0].placement);
    assert.ok(policy.validateFlbManifest(bad).length);
    assert.throws(() => policy.getVerifiedFlbPlacements(bad), /manifest/i);
  }
});
test('all 32 GLBs load as real geometry with matching dimensions and triangle counts', async () => {
  const loader = new GLTFLoader();
  for (const entry of manifest.entries) {
    const bytes = readFileSync(new URL(`..${entry.assetUrl}`, import.meta.url));
    const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    const bounds = new Box3().setFromObject(gltf.scene);
    const sizes = [bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y, bounds.max.z - bounds.min.z];
    sizes.forEach((size, i) => assert.ok(Math.abs(size - entry.dimensionsMeters[i]) < 1e-5));
    let triangles = 0;
    gltf.scene.traverse(object => {
      if (!object.isMesh) return;
      triangles += object.geometry.getAttribute('position').count / 3;
      assert.equal(object.material.map, null);
    });
    assert.equal(triangles, entry.triangles);
    assert.ok(triangles > 100);
  }
});
test('each root-served GLB is hashed, versioned and a self-contained triangle mesh with flat baked hierarchy', () => {
  for (const entry of manifest.entries) {
    const bytes = readFileSync(new URL(`..${entry.assetUrl}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
    assert.equal(policy.getFlbAssetUrl({ url: entry.assetUrl }, manifest), `${entry.assetUrl}?v=${entry.sha256.slice(0, 12)}`);
    assert.equal(bytes.readUInt32LE(0), 0x46546c67);
    assert.equal(bytes.readUInt32LE(4), 2);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    const jsonLength = bytes.readUInt32LE(12);
    const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
    assert.equal(gltf.asset.version, '2.0');
    assert.equal(gltf.nodes.length, 1);
    assert.equal(gltf.nodes[0].mesh, 0);
    for (const field of ['children', 'matrix', 'translation', 'rotation', 'scale']) assert.equal(gltf.nodes[0][field], undefined);
    assert.equal(gltf.images, undefined);
    assert.equal(gltf.textures, undefined);
    assert.equal(gltf.buffers[0].uri, undefined);
    assert.equal(gltf.meshes[0].primitives.length, 2);
    for (const primitive of gltf.meshes[0].primitives) {
      assert.equal(primitive.mode, 4);
      assert.ok(gltf.accessors[primitive.attributes.POSITION].count > 0);
      assert.ok(gltf.accessors[primitive.attributes.NORMAL]);
    }
    assert.ok(entry.dimensionsMeters.every(n => Number.isFinite(n) && n > 0));
    assert.ok(existsSync(new URL(`..${entry.thumbnailUrl}`, import.meta.url)));
  }
});
