import assert from 'node:assert/strict';import test from 'node:test';
import manifest from '../Model3D/flb/manifest.json' with {type:'json'};
import {verifiedFlbRuntimeModels,flbPickerCatalogue,flbOverviewProxies} from '../src/map/flbPlacementRuntime.js';
const model={uuid:'flb-native-1',url:manifest.entries[0].assetUrl,latitude:10,longitude:107,floorId:'2F',rotation:[0,0,0],scale:[1,1,1],elevation:0,desc:JSON.stringify({role:'flb-signage',flbNo:1,placementStatus:'verified',source:'admin-map-placement'})};
test('unverified placement never becomes persistent signage',()=>{assert.equal(verifiedFlbRuntimeModels([{...model,desc:''}],manifest).length,0);assert.equal(verifiedFlbRuntimeModels([model],manifest).length,1);});
test('rejects duplicate numbers and invalid transforms',()=>{assert.throws(()=>verifiedFlbRuntimeModels([model,{...model,uuid:'second'}],manifest),/DUPLICATE_FLB/);assert.equal(verifiedFlbRuntimeModels([{...model,scale:[0,1,1]}],manifest).length,0);});
test('picker uses all32assets but excludes already placedFLB',()=>{assert.equal(flbPickerCatalogue(manifest,[]).length,32);assert.equal(flbPickerCatalogue(manifest,[model]).length,31);});
test('picker uses the live SDK roof orientation without changing stored transforms',()=>{assert.deepEqual(flbPickerCatalogue(manifest,[])[0].rotation,[90,0,0]);assert.deepEqual(verifiedFlbRuntimeModels([model],manifest)[0].rotation,[0,0,0]);});
test('Overview proxy has own identity and original source, leaving native model unchanged',()=>{const proxy=flbOverviewProxies([model],'Overview',16)[0];assert.notEqual(proxy.uuid,model.uuid);assert.equal(proxy.flbProxySourceUuid,model.uuid);assert.equal(proxy.floorId,'Overview');assert.equal(model.floorId,'2F');assert.equal(proxy.elevation,16);});
