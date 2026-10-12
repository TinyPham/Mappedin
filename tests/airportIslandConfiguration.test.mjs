import test from 'node:test';import assert from 'node:assert/strict';
import config from '../src/config/airportOperations.json' with {type:'json'};
import {createJourneyContext} from '../src/navigation/airportJourneyContext.js';
// Ground truth: live SQL AreaList.VN and /api/init-data names, 09 October 2026.
const ids=['s_4ace75481f12c846','s_aa01e1492cc1352d','s_baa7214112d9754f','s_5fd9b8cdd8d1ff13','s_0a3f5e4dbd3475d3','s_d42850b9ec1a34c8','s_02ac0546ab304b0f','s_1e0794afa8b002af','s_4930c5f8ec28cdb0','s_5e6f6f47b71f143c'];
test('all ten island identities match their real A–J labels instead of the c in thủ tục',()=>{
 assert.equal(config.counters.filter(c=>c.counterNo===null).length,10);
 for(const [i,id] of ids.entries())assert.equal(config.counters.find(c=>c.mappedinId===id).island,'ABCDEFGHIJ'[i]);
});
test('islands A/B retain domestic routing, while other islands retain international routing',()=>{
 const gate=no=>config.gates.find(g=>g.gateNo===no).mappedinId;
 for(const id of ids.slice(0,2)){
  assert.equal(createJourneyContext({origin:id,destination:gate(3)},config).trafficClass,'domestic');
  assert.throws(()=>createJourneyContext({origin:id,destination:gate(9)},config),/TRAFFIC_MISMATCH/);
 }
 for(const id of ids.slice(2))assert.equal(createJourneyContext({origin:id,destination:gate(9)},config).trafficClass,'international');
});
