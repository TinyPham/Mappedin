import assert from 'node:assert/strict';
import { parseOverviewFloorSyncPayload } from './overviewFloorSync';

(() => {
  const payload = parseOverviewFloorSyncPayload({
    overviewFloorId: ' f_6fc6e4c92a4cdb17 '
  });

  assert.deepEqual(payload, {
    overviewFloorId: 'f_6fc6e4c92a4cdb17'
  });
})();

(() => {
  assert.throws(() => parseOverviewFloorSyncPayload({
    overviewFloorId: ''
  }), /required/i);
})();

(() => {
  assert.throws(() => parseOverviewFloorSyncPayload({
    overviewFloorId: 'm_dae8f26a40f6017f'
  }), /must start with f_/i);
})();

console.log('overviewFloorSync tests passed');
