import test from 'node:test';import assert from 'node:assert/strict';
import manifest from '../Model3D/flb/manifest.json' with {type:'json'};
import {createFlbPersistenceController} from '../src/map/flbPersistenceController.js';
const model={uuid:'one',url:manifest.entries[0].assetUrl,desc:'verified',floorId:'F',latitude:10,longitude:107,rotation:[0,0,0],scale:[1,1,1]};
const defer=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve};};
test('delete waits for first pending save and fences delayed edits',async()=>{
 const first=defer(),calls=[];const controller=createFlbPersistenceController({manifest,save:async m=>{calls.push('save');return first.promise;},deleteModel:async()=>{calls.push('delete');return true;}});
 const save=controller.save(model),remove=controller.delete('one');
 assert.equal(controller.reservedModels().length,1);assert.equal(await controller.save({...model,latitude:11}),false);
 first.resolve(true);await Promise.all([save,remove]);assert.deepEqual(calls,['save','delete']);assert.equal(controller.reservedModels().length,0);assert.equal(await controller.save(model),false);
});
test('failed latest edit restores an earlier successful snapshot',async()=>{
 const snapshots=[];let calls=0;const controller=createFlbPersistenceController({manifest,save:async()=>++calls===1,deleteModel:async()=>true,onSnapshot:(m,reason)=>snapshots.push([m,reason])});
 await Promise.all([controller.save(model),controller.save({...model,latitude:11})]);
 assert.equal(controller.reservedModels()[0].latitude,10);assert.equal(snapshots.at(-1)[0].latitude,10);assert.equal(snapshots.at(-1)[1],'restore');
});
test('failed delete retains number and restores confirmed placement',async()=>{
 const controller=createFlbPersistenceController({manifest,initialModels:[model],save:async()=>true,deleteModel:async()=>false});
 const before=controller.generation('one');assert.equal(await controller.delete('one'),false);assert.equal(controller.reservedModels().length,1);assert.ok(controller.generation('one')>before);assert.equal(controller.canLoad('one'),true);
});
test('generation invalidates loads on save, reconciliation and deletion',async()=>{
 const controller=createFlbPersistenceController({manifest,initialModels:[model],save:async()=>true,deleteModel:async()=>true});const old=controller.generation('one');
 await controller.save({...model,latitude:11});assert.notEqual(controller.generation('one'),old);const version=controller.generation('one');
 await controller.delete('one');assert.notEqual(controller.generation('one'),version);assert.equal(controller.canLoad('one'),false);
});
test('failed first save remains reserved until a fresh server snapshot resolves ambiguity',async()=>{
 const controller=createFlbPersistenceController({manifest,save:async()=>false,deleteModel:async()=>true});await controller.save(model);assert.equal(controller.reservedModels().length,1);assert.equal(controller.canLoad('one'),false);
 controller.hydrate([]);assert.equal(controller.reservedModels().length,0);
});
test('a number reserved by one UUID cannot be written as a second UUID',async()=>{
 const controller=createFlbPersistenceController({manifest,initialModels:[model],save:async()=>true,deleteModel:async()=>true});
 await assert.rejects(controller.save({...model,uuid:'two'}),/DUPLICATE_FLB/);
});
test('an old server read cannot undo an acknowledged save or delete',async()=>{
 const controller=createFlbPersistenceController({manifest,initialModels:[model],save:async()=>true,deleteModel:async()=>true});
 const beforeSave=controller.reconciliationToken();await controller.save({...model,latitude:11});
 assert.equal(controller.hydrate([model],{token:beforeSave}),false);assert.equal(controller.confirmedModel('one').latitude,11);
 const beforeDelete=controller.reconciliationToken();await controller.delete('one');
 assert.equal(controller.hydrate([model],{token:beforeDelete}),false);assert.equal(controller.canLoad('one'),false);
});
test('queued loaders resolve a copy of the latest acknowledged metadata',async()=>{
 const controller=createFlbPersistenceController({manifest,initialModels:[model],save:async()=>true,deleteModel:async()=>true});
 const queued={...model};await controller.save({...model,latitude:11});
 const fresh=controller.confirmedModel(queued.uuid);assert.equal(fresh.latitude,11);fresh.latitude=99;
 assert.equal(controller.confirmedModel('one').latitude,11);
});
test('reads begun during an in-flight write are invalidated when it settles',async()=>{
 for(const action of ['save','delete']){
  const response=defer(),controller=createFlbPersistenceController({manifest,initialModels:[model],save:()=>response.promise,deleteModel:()=>response.promise});
  const pending=action==='save'?controller.save({...model,latitude:11}):controller.delete('one');
  const token=controller.reconciliationToken();response.resolve(true);await pending;
  assert.equal(controller.hydrate([model],{token}),false);
  if(action==='save')assert.equal(controller.confirmedModel('one').latitude,11);
  else assert.equal(controller.canLoad('one'),false);
 }
});
