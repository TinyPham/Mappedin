import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../src/config/airportOperations.json' with {type:'json'};
import { classifyAirportEndpoint, getAirportRouteNoticeKeys } from '../src/navigation/airportRouteNotice.js';

const counter = island => ({id:config.counters.find(c=>c.island===island).mappedinId});
const gate = n => ({id:config.gates.find(g=>g.gateNo===n).mappedinId});
const belt = n => ({id:config.belts.find(b=>b.beltNo===n).mappedinId});
const poi = id => ({id});
const locationRows = {
  pub: { names: { vn: 'Sảnh công cộng', en: 'Public hall' } },
  intlLounge: { subCategoryNames: { en: 'International Departure Lounge' } },
  domLounge: { names: {vn:'Phòng chờ ga đi quốc nội'} },
  mixedLounge: { names: {vn:'Phòng chờ ga đi quốc nội/ quốc tế'} },
  intlDeparture: { subCategoryNames: {vn:'Khu ga đi quốc tế'} },
  domArrival: { subCategoryNames: {en:'Domestic Arrival'} },
  intlArrival: { subCategoryNames: {en:'International Arrival'} },
  staff: { names: { en: 'Staff Only Restricted Area' } },
  security: { names: {vn:'Điểm kiểm tra an ninh soi chiếu quốc tế'} },
  unknown: { names: {en:'Water fountain'} }
};
const P=poi('pub'),IL=poi('intlLounge'),DL=poi('domLounge'),DA=poi('domArrival'),IA=poi('intlArrival');
const notice = (a,b,stops=[]) => getAirportRouteNoticeKeys({origin:a,destination:b,stopovers:stops},config,locationRows);

test('classifies authoritative mapped counters, gates and belts regardless of floor',()=>{
 assert.deepEqual(classifyAirportEndpoint(counter('A'),config,locationRows),{kind:'checkin',traffic:'domestic'});
 assert.deepEqual(classifyAirportEndpoint(counter('C'),config,locationRows),{kind:'checkin',traffic:'international'});
 assert.deepEqual(classifyAirportEndpoint(gate(9),config,locationRows),{kind:'airside',traffic:'international'});
 assert.deepEqual(classifyAirportEndpoint(belt(1),config,locationRows),{kind:'baggage',traffic:'domestic'});
 assert.deepEqual(classifyAirportEndpoint(IL,config,locationRows),{kind:'airside',traffic:'international'});
 assert.deepEqual(classifyAirportEndpoint(poi('unknown'),config,locationRows),{kind:'unknown',traffic:null});
});

test('selects airport notices for domestic/international and restricted flow matrix',()=>{
 const cases=[
  [P,P,[]], [P,gate(9),['rn_intl_departure']], [counter('A'),gate(9),['rn_intl_from_domestic_checkin']],
  [counter('C'),gate(9),['rn_intl_departure']], [P,gate(3),['rn_dom_departure']],
  [counter('C'),gate(3),['rn_dom_from_international_checkin']], [counter('A'),gate(3),['rn_dom_departure']],
  [IL,gate(3),['rn_transfer_id']], [DL,gate(9),['rn_transfer_di']],
  [IA,gate(9),['rn_transfer_ii']], [DA,gate(3),['rn_transfer_dd']],
  [DA,gate(9),['rn_transfer_di']], [IA,gate(3),['rn_transfer_id']],
  [P,belt(1),['rn_dom_arrival_area']], [P,belt(4),['rn_intl_arrival_area']],
  [IA,P,['rn_intl_arrival_exit']], [DA,P,['rn_dom_arrival_exit']],
  [gate(9),P,['rn_leave_airside']], [P,poi('staff'),['rn_staff_access']],
  [counter('C'),counter('A'),['rn_checkin_dom_from_intl']],
  [counter('A'),counter('C'),['rn_checkin_intl_from_dom']],
  [P,poi('security'),['rn_security_checkpoint']],
  [poi('unknown'),IL,['rn_intl_departure']], [P,DL,['rn_dom_departure']],
  [P,poi('mixedLounge'),['rn_departure_check']], [P,poi('intlDeparture'),['rn_intl_departure']]
 ];
 for(const [a,b,expected] of cases) assert.deepEqual(notice(a,b),expected,`${a.id} -> ${b.id}`);
});

test('includes warnings for distinct stopover legs in travel order without duplicates',()=>{
 assert.deepEqual(notice(P,gate(9),[gate(3)]),['rn_dom_departure','rn_transfer_di']);
 assert.deepEqual(notice(P,gate(9),[IL]),['rn_intl_departure']);
});
