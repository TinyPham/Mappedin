import {getFlbManifestEntry} from './flbModelPolicy.js';
// Acknowledged server snapshots, reservations and GPU generations have separate lifetimes.
export function createFlbPersistenceController({manifest,initialModels=[],save,deleteModel,onSnapshot=()=>{},onError=()=>{}}){
 const states=new Map();let revision=0;
 const copy=m=>m?JSON.parse(JSON.stringify(m)):null;
 const stateFor=(uuid,model=null)=>{if(!states.has(uuid))states.set(uuid,{uuid,flbNo:getFlbManifestEntry(model,manifest)?.flbNo,generation:0,version:0,pending:0,queue:Promise.resolve(),confirmed:null,wanted:null,deleting:false,deleted:false});return states.get(uuid);};
 const enqueue=(state,operation)=>{state.pending++;const promise=state.queue.catch(()=>{}).then(operation).finally(()=>state.pending--);state.queue=promise;return promise;};
 const emit=(state,reason)=>onSnapshot(copy(state.confirmed),reason,state.uuid);
 const hydrate=(models,{notify=true,token=null}={})=>{
  if(token!==null&&token!==revision)return false;
  revision++;
  const present=new Map(models.filter(m=>getFlbManifestEntry(m,manifest)&&!m.flbProxySourceUuid).map(m=>[m.uuid,m]));
  for(const [uuid,model]of present){const state=stateFor(uuid,model);if(state.pending||state.deleting)continue;state.confirmed=copy(model);state.wanted=copy(model);state.deleted=false;state.generation++;if(notify)emit(state,'hydrate');}
  for(const state of states.values())if(!present.has(state.uuid)&&!state.pending&&!state.deleting){state.confirmed=null;state.wanted=null;state.deleted=true;state.generation++;if(notify)emit(state,'deleted');}
  return true;
 };
 hydrate(initialModels,{notify:false});
 return {
  hydrate,
  reconciliationToken:()=>revision,
  confirmedModel:uuid=>copy(states.get(uuid)?.confirmed),
  isFlb:uuid=>states.has(uuid),
  generation:uuid=>states.get(uuid)?.generation||0,
  canLoad:uuid=>{const s=states.get(uuid);return Boolean(s&&!s.deleted&&!s.deleting&&s.confirmed);},
  reservedModels:()=>[...states.values()].filter(s=>!s.deleted&&(s.confirmed||s.wanted)).map(s=>copy(s.wanted||s.confirmed)),
  async save(model){
   const entry=getFlbManifestEntry(model,manifest);if(!entry||!model.uuid)throw new Error('INVALID_FLB');
   const state=stateFor(model.uuid,model);if(state.deleted||state.deleting)return false;
   if([...states.values()].some(s=>s.uuid!==state.uuid&&!s.deleted&&s.flbNo===entry.flbNo&&(s.confirmed||s.wanted)))throw new Error('DUPLICATE_FLB');
   revision++;
   const snapshot=copy(model),version=++state.version;state.flbNo=entry.flbNo;state.wanted=snapshot;state.generation++;
   return enqueue(state,async()=>{
    let ok=false;try{ok=await save(snapshot)===true;}catch{}
    revision++;
    // Record every acknowledged write, including writes superseded in the UI.
    if(ok)state.confirmed=copy(snapshot);
    if(state.deleting||state.deleted||version!==state.version)return ok;
    state.generation++;
    if(ok){state.wanted=copy(state.confirmed);emit(state,'saved');}
    else{if(state.confirmed)state.wanted=copy(state.confirmed);emit(state,'restore');onError('SAVE_FAILED',state.uuid);}
    return ok;
   });
  },
  async delete(uuid){
   const state=states.get(uuid);if(!state||state.deleted)return true;if(state.deleting)return state.queue;
   revision++;state.deleting=true;state.version++;state.generation++;emit(state,'deleting');
   return enqueue(state,async()=>{
    let ok=false;try{ok=await deleteModel(uuid)===true;}catch{}
    revision++;
    state.deleting=false;state.generation++;
    if(ok){state.deleted=true;state.confirmed=null;state.wanted=null;emit(state,'deleted');}
    else{state.deleted=false;if(state.confirmed)state.wanted=copy(state.confirmed);emit(state,'delete-failed');onError('DELETE_FAILED',uuid);}
    return ok;
   });
  }
 };
}
