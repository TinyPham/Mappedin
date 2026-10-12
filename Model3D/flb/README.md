# FLB asset and policy handoff

32 self-contained GLB assets represent `FLB 01` through `FLB 32`. Text is triangulated and extruded from the **Helvetiker Bold** vector font, not a textured image. Three.js r182 (MIT) generates geometry. MAGENTA's font permission and copyright notice are included in `font/LICENSE.txt`; the exact original typeface is vendored for reproducibility. The generated GLBs also carry the font attribution. `font/THREE-LICENSE.txt` contains Three.js's license.

Each asset has one root mesh node, no children or node transforms, two primitives/materials, no images, textures, external resources, extensions or compression. The navy plate is 0.08 m thick; the raised white lettering adds 0.04 m. Y is up and the readable face points +Y for roof placement. Geometry dimensions and triangle counts are recorded per entry. Surveyed rotation/scale/elevation must determine the final position and orientation. SVG thumbnails use the same font contours, and are previews rather than model textures. `preview.html` shows all 32 signs.

## Serving and URLs

Assets exist only in root `Model3D/flb/`, served by backend `express.static(ROOT_DIR/Model3D)` on port 3002 and Vite's root static serving in development. Deployment must include this root directory, as with existing models; Vite does not copy it into dist. No public duplicate is needed.

The manifest URL is `/Model3D/flb/manifest.json`. Each `assetUrl` has the requested canonical filename, and `getFlbAssetUrl` appends the content hash as a stable `?v=<assetVersion>` query. Use this helper directly, bypassing the existing `Date.now()` suffix. A geometry change updates the version; unchanged bytes keep the same URL. The mutable manifest should be bundled into the frontend or fetched with revalidation (`cache: 'no-cache'`); do not rely on the backend's 30-day immutable caching for a live manifest refresh. Publish manifest and assets together.

Examples:

- `/Model3D/flb/FLB-01.glb?v=39229ca32e39`
- `/Model3D/flb/FLB-15.glb?v=66d815348e40`
- `/Model3D/flb/FLB-32.glb?v=421c95b3164f`

## Parent integration contract

`src/map/flbModelPolicy.js` exports:

- `validateFlbManifest(manifest)`: errors for incomplete 1..32 coverage, invalid numbers, duplicate identities/assets/surveyed coordinates, hash/version mismatch or invalid placement data.
- `getVerifiedFlbPlacements(manifest)`: validates the complete manifest and returns verified entries only; throws on invalid configuration. Use before registering/loading placement instances.
- `getFlbManifestEntry(model, manifest)`, `isFlbModel(model, manifest)`: exact assigned UUID or manifest asset pathname; origins/query fragments are ignored, names and filename guesses are never classifiers. Conflicting UUID/URL matches fail closed.
- `getFlbAssetUrl(model, manifest)`: stable manifest URL or null. Pass directly to `Models.add`; bypass the existing `Date.now()` suffix for FLB.
- `getFlbModelPolicy(model, manifest, { currentFloorId })`: `isFlb`, `flbNo`, `priority`, `shouldLoad`, `keepLoaded`, `assetUrl`, `placementStatus`. Verified signage with its assigned instance UUID on its assigned floor bypasses decorative zoom and distance thresholds. URL recognition alone cannot authorize an unassigned shadow or second instance. Retain the manifest identity and placement metadata in the integration registry, and reserve signage queue capacity before decorations. No automatic lower-floor shadow or Overview proxy is created.

All supplied entries have `uuid: null` and `placement: { status: 'unplaced' }`. Numbering is clockwise and the source-image anchor numbers are **01, 02, 05, 10, 15, 23, 32**. These establish numbering, not georeferenced placement. No floor IDs, coordinates, rotations, elevations, Gate mapping or instance IDs have been inferred. After survey/admin registration, assign an actual UUID and `placement` with `status: 'verified'`, `floorId`, numeric `latitude`, `longitude`, `elevation`, three-number `rotation`, positive three-number `scale`, plus nonempty `source` and `evidence`. Proposed placements never load.

`src/map/modelLoadRegistry.js` exports `createModelLoadRegistry()` with `load(uuid, loader)`, `has(uuid)` (pending OR loaded), `get(uuid)` (resolved), and `delete(uuid)` (false while pending). Wrap the actual SDK creation and metadata-registration callback in `load`; let loader errors propagate rather than swallowing them as success. Parallel callers receive the same pending promise. Failure or an empty result clears pending state for retry. Await pending loads during floor cleanup, remove the resolved instance from the SDK, then delete it from this registry. A separately surveyed Overview proxy must have its own explicit UUID; sharing an asset URL does not mean sharing an instance.

No existing source, backend, database, or editor changes are part of this package. Parent integration owns registration, streaming call sites, verified placements, proxy policy and live SDK acceptance.

## Regeneration and validation

Uses the existing root `node_modules` junction and `three` dependency. No project package files changed. Khronos validator is optional for regeneration but required to claim glTF validation. Install it in a temporary directory, then pass its absolute module path:

```powershell
npm install --prefix "$env:TEMP/flb-gltf-validator" --no-save --package-lock=false --ignore-scripts gltf-validator@2.0.0-dev.3.10
node tools/generate_flb_models.mjs --validator "$env:TEMP/flb-gltf-validator/node_modules/gltf-validator/index.js"
node --test tests/flbManifest.test.mjs tests/flbModelPolicy.test.mjs tests/modelLoadDeduplication.test.mjs
npm run build
```

An initial run without a manifest requires `--numbers` with a JSON array or comma-separated list. The generator accepts unique integers in 1..32, rather than baking the number of generated models into its loop. Production manifest validation requires all 32. Regeneration retains existing placement/UUID/Gate mappings and uses no timestamps. The root assets, manifest and validation report are updated together. Commit them together.

Validation performed: 32/32 Khronos glTF-Validator 2.0.0-dev.3.10 with zero errors/warnings; 32/32 Three.js GLTFLoader imports with dimensions and triangle-count checks; 17 owned Node tests passed; Vite production build passed; all 32 canonical URLs returned HTTP 200 with matching SHA-256 through Vite and an isolated Express server mounting the existing backend static path/options. Regeneration produced identical assets and manifests. The isolated static-route check did not initialize the backend or access the database.

Live Mappedin SDK 6.9.1 sample loading was visually verified on 09 October 2026 for FLB 01, 15 and 32. In this SDK the roof-facing presentation uses `rotation: [90, 0, 0]`; preserve GLB Y-up geometry and apply the rotation at placement. The preview camera explicitly sets its elevation to the sample height and restores it on close. Screenshots are in `docs/superpowers/plans/assets/verification/`. These are temporary visual samples, not surveyed bridge placements. Physical placement and readability at the final Home view remain unverified. Node emits the repository's existing typeless-ESM warning; Vite emits its CJS API deprecation and large-chunk warnings.
