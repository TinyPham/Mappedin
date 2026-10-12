import test from 'node:test';import assert from 'node:assert/strict';
import {createPlaybackLifecycle} from '../src/journeys/playbackLifecycle.js';
test('stop/restart and seek on the same route fence frames awaiting a floor change',async()=>{
 let finish;const view={currentFloor:{id:'1'},setFloor:()=>new Promise(resolve=>{finish=resolve;})};
 const lifecycle=createPlaybackLifecycle(()=>1),old=lifecycle.capture();
 const pending=lifecycle.changeFloor(old,'2',view);await new Promise(resolve=>setImmediate(resolve));
 lifecycle.invalidate();finish();assert.equal(await pending,false);assert.equal(lifecycle.isCurrent(old),false);
 assert.equal(lifecycle.isCurrent(lifecycle.capture()),true);
});
test('a queued stale floor change never starts after a newer playback request',async()=>{
 const calls=[];const view={currentFloor:{id:'1'},async setFloor(id){calls.push(id);}};
 const lifecycle=createPlaybackLifecycle(()=>1),old=lifecycle.capture();
 const pending=lifecycle.changeFloor(old,'2',view);const current=lifecycle.invalidate();
 const fresh=lifecycle.changeFloor(current,'3',view);
 assert.equal(await pending,false);assert.equal(await fresh,true);assert.deepEqual(calls,['3']);
});
test('changing the route invalidates frames independently of playback',()=>{
 let route=1;const lifecycle=createPlaybackLifecycle(()=>route),token=lifecycle.capture();route++;
 assert.equal(lifecycle.isCurrent(token),false);
});
