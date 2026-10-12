#!/usr/bin/env node
// Run from any cwd. Requires the existing three dependency; no browser/exporter shim.
// First run: --numbers 1,2,...,32. Later runs use the manifest numbers and preserve placements.
// --validator <absolute path to gltf-validator/index.js> enables Khronos validation.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { BoxGeometry, REVISION } from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputs = [resolve(root, 'Model3D/flb')];
const args = process.argv.slice(2);
function option(name) {
  const i = args.indexOf(name);
  if (i === -1) return null;
  if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`${name} requires a value`);
  return args[i + 1];
}
for (let i = 0; i < args.length; i += 2) if (!['--numbers', '--validator'].includes(args[i])) throw new Error(`Unknown option: ${args[i]}`);
const manifestPath = resolve(outputs[0], 'manifest.json');
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
const numberArg = option('--numbers');
const numbers = numberArg ? (numberArg.startsWith('[') ? JSON.parse(numberArg) : numberArg.split(',').map(Number)) : previous?.entries.map(e => e.flbNo);
if (!Array.isArray(numbers) || !numbers.length || numbers.some(n => !Number.isInteger(n) || n < 1 || n > 32) || new Set(numbers).size !== numbers.length) throw new Error('Supply unique integer --numbers in 1..32');
numbers.sort((a, b) => a - b);
const validatorPath = option('--validator');
let validator;
if (validatorPath) validator = require(resolve(validatorPath));
else { try { validator = require('gltf-validator'); } catch { /* optional dependency; status is explicit below */ } }

// Vendor the exact font and license used, so regeneration does not depend on font downloads.
const fontPath = resolve(outputs[0], 'font/helvetiker_bold.typeface.json');
const threeRoot = resolve(dirname(require.resolve('three')), '..');
const fontBytes = readFileSync(existsSync(fontPath) ? fontPath : resolve(threeRoot, 'examples/fonts/helvetiker_bold.typeface.json'));
const fontLicense = readFileSync(existsSync(resolve(outputs[0], 'font/LICENSE.txt')) ? resolve(outputs[0], 'font/LICENSE.txt') : resolve(threeRoot, 'examples/fonts/LICENSE'));
const threeLicense = readFileSync(resolve(threeRoot, 'LICENSE'));
const font = new FontLoader().parse(JSON.parse(fontBytes));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function writeAsset(relative, bytes) {
  for (const output of outputs) {
    const path = resolve(output, relative);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, bytes);
  }
}
writeAsset('font/helvetiker_bold.typeface.json', fontBytes);
writeAsset('font/LICENSE.txt', fontLicense);
writeAsset('font/THREE-LICENSE.txt', threeLicense);
const readmePath = resolve(outputs[0], 'README.md');
if (existsSync(readmePath)) writeAsset('README.md', readFileSync(readmePath));

function encodeGlb(label, geometries) {
  const chunks = [], views = [], accessors = [], primitives = [];
  let byteLength = 0;
  function attribute(geometry, name) {
    const attribute = geometry.getAttribute(name);
    const bytes = Buffer.from(attribute.array.buffer, attribute.array.byteOffset, attribute.array.byteLength);
    views.push({ buffer: 0, byteOffset: byteLength, byteLength: bytes.length, target: 34962 });
    chunks.push(bytes); byteLength += bytes.length;
    const accessor = { bufferView: views.length - 1, componentType: 5126, count: attribute.count, type: 'VEC3' };
    if (name === 'position') {
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < attribute.count; i++) for (let j = 0; j < 3; j++) {
        const value = attribute.array[i * 3 + j];
        min[j] = Math.min(min[j], value); max[j] = Math.max(max[j], value);
      }
      accessor.min = min; accessor.max = max;
    }
    accessors.push(accessor);
    return accessors.length - 1;
  }
  for (const [material, input] of geometries.entries()) {
    const geometry = input.index ? input.toNonIndexed() : input;
    primitives.push({ attributes: { POSITION: attribute(geometry, 'position'), NORMAL: attribute(geometry, 'normal') }, material, mode: 4 });
    if (geometry !== input) geometry.dispose();
  }
  const gltf = {
    asset: { version: '2.0', generator: `FLB mesh generator v1 / three r${REVISION}`, copyright: 'Font: Copyright (c) 2004 MAGENTA Ltd.; see font/LICENSE.txt' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: label, mesh: 0 }],
    meshes: [{ name: label, primitives }],
    materials: [
      { name: 'navy backing', pbrMetallicRoughness: { baseColorFactor: [0.012, 0.035, 0.09, 1], metallicFactor: 0, roughnessFactor: 0.8 } },
      { name: 'white raised lettering', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.65 } }
    ], buffers: [{ byteLength }], bufferViews: views, accessors
  };
  const json = Buffer.from(JSON.stringify(gltf));
  const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  const bin = Buffer.concat(chunks);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + paddedJson.length + bin.length, 8);
  header.writeUInt32LE(paddedJson.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, paddedJson, binHeader, bin]);
}

// Thumbnail paths come from the SAME font contours, rather than substituting a browser font.
function thumbnail(label, textBounds) {
  const width = textBounds.max.x - textBounds.min.x, height = textBounds.max.y - textBounds.min.y;
  const paths = font.generateShapes(label, 1).map(shape => {
    const contours = [shape.getPoints(4), ...shape.holes.map(hole => hole.getPoints(4))];
    return contours.map(points => points.map((p, i) => `${i ? 'L' : 'M'}${(p.x - textBounds.min.x + 0.4).toFixed(5)},${(height - (p.y - textBounds.min.y) + 0.25).toFixed(5)}`).join(' ') + ' Z').join(' ');
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width + 0.8} ${height + 0.5}" role="img" aria-label="${label} vector mesh preview"><title>${label}</title><rect width="100%" height="100%" rx="0.12" fill="#07132c"/>${paths.map(d => `<path d="${d}" fill="white" fill-rule="evenodd"/>`).join('')}</svg>\n`;
}

const entries = [], reports = [];
for (const flbNo of numbers) {
  const suffix = String(flbNo).padStart(2, '0'), label = `FLB ${suffix}`;
  const text = new TextGeometry(label, { font, size: 1, depth: 0.04, curveSegments: 4, bevelEnabled: false });
  text.computeBoundingBox();
  const bounds = text.boundingBox.clone();
  const width = bounds.max.x - bounds.min.x + 0.8, depth = bounds.max.y - bounds.min.y + 0.5;
  const svg = thumbnail(label, bounds);
  text.translate(-(bounds.min.x + bounds.max.x) / 2, -(bounds.min.y + bounds.max.y) / 2, 0);
  text.rotateX(-Math.PI / 2); text.translate(0, 0.08, 0);
  const plate = new BoxGeometry(width, 0.08, depth); plate.translate(0, 0.04, 0);
  const bytes = encodeGlb(label, [plate, text]);
  const sha256 = hash(bytes), file = `FLB-${suffix}.glb`;
  const thumbnailFile = `FLB-${suffix}.svg`;
  if (validator) {
    const result = await validator.validateBytes(new Uint8Array(bytes), { uri: file, maxIssues: 1000 });
    reports.push({ flbNo, file, errors: result.issues.numErrors, warnings: result.issues.numWarnings, infos: result.issues.numInfos, messages: result.issues.messages });
    if (result.issues.numErrors || result.issues.numWarnings) throw new Error(`${label} failed Khronos validation: ${JSON.stringify(result.issues)}`);
  }
  writeAsset(file, bytes); writeAsset(thumbnailFile, svg);
  const old = previous?.entries.find(e => e.flbNo === flbNo);
  entries.push({ ...old, flbNo, label, uuid: old?.uuid ?? null, assetUrl: `/Model3D/flb/${file}`, assetVersion: sha256.slice(0, 12), sha256,
    thumbnailUrl: `/Model3D/flb/${thumbnailFile}`, dimensionsMeters: [width, 0.12, depth],
    triangles: (plate.index.count + text.getAttribute('position').count) / 3,
    placement: old?.placement ?? { status: 'unplaced' }, gateRefs: old?.gateRefs ?? [], source: 'user-numbering-image-2026-10-08' });
  plate.dispose(); text.dispose();
}
const manifest = {
  schemaVersion: 1, configVersion: 'flb-assets-v1',
  numbering: { direction: 'clockwise', source: 'user-numbering-image-2026-10-08', imageAnchorNumbers: [1, 2, 5, 10, 15, 23, 32], placementSurveyRequired: true },
  geometry: { style: 'thin plate with raised mesh lettering', upAxis: 'Y', textFace: '+Y', units: 'meters', nodesPerAsset: 1, primitivesPerAsset: 2, textures: 0 },
  generator: { file: 'tools/generate_flb_models.mjs', version: 1, threeRevision: REVISION, font: 'Helvetiker Bold', fontSha256: hash(fontBytes), fontLicense: 'MAGENTA font license', fontLicenseUrl: '/Model3D/flb/font/LICENSE.txt' },
  entries
};
writeAsset('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
writeAsset('validation-report.json', JSON.stringify({ validator: validator ? `Khronos glTF-Validator ${validator.version()}` : null, validated: Boolean(validator), models: reports }, null, 2) + '\n');
writeAsset('preview.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>FLB mesh assets</title><style>body{font:16px system-ui;background:#e8edf5;margin:32px;color:#07132c}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}article{background:white;padding:20px;border-radius:12px}img{width:100%}a{color:#134bb2}</style><h1>FLB 01–32 mesh assets</h1><p>Clockwise numbering from the user image. All placements await survey verification. These thumbnails use the font contours; SDK runtime acceptance is a separate check.</p><main>${entries.map(e => `<article><h2>${e.label}</h2><img src=".${e.thumbnailUrl.replace('/Model3D/flb', '')}" alt="${e.label}"><p>${e.triangles} triangles · ${e.dimensionsMeters.map(n => n.toFixed(2)).join(' × ')} m</p><a href=".${e.assetUrl.replace('/Model3D/flb', '')}">GLB mesh</a></article>`).join('')}</main></html>\n`);
console.log(JSON.stringify({ generated: entries.length, outputs, validated: Boolean(validator), validator: validator?.version(), totalBytes: entries.reduce((sum, e) => sum + readFileSync(resolve(outputs[0], e.assetUrl.replace('/Model3D/flb/', ''))).length, 0) }, null, 2));
