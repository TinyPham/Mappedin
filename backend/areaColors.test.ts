import assert from 'node:assert/strict';
import {
  buildAreaColorMap,
  parseAreaColorDeletePayload,
  parseAreaColorUpsertPayload
} from './areaColors';

(() => {
  const areaColors = buildAreaColorMap([
    { MappedinID: 'ar_alpha', ColorHex: '#00bfa5' },
    { MappedinID: '  ', ColorHex: '#ff0000' },
    { MappedinID: 'ar_beta', ColorHex: 'invalid' },
    { MappedinID: 'ar_gamma', ColorHex: '#ABCDEF' }
  ]);

  assert.deepEqual(areaColors, {
    ar_alpha: '#00BFA5',
    ar_gamma: '#ABCDEF'
  });
})();

(() => {
  const payload = parseAreaColorUpsertPayload({
    areaIds: [' ar_alpha ', 'ar_beta', '', 'ar_alpha'],
    color: '#00bfa5'
  });

  assert.deepEqual(payload, {
    areaIds: ['ar_alpha', 'ar_beta'],
    color: '#00BFA5'
  });
})();

(() => {
  assert.throws(() => parseAreaColorUpsertPayload({
    areaIds: ['ar_alpha'],
    color: 'blue'
  }), /Invalid color/i);
})();

(() => {
  const payload = parseAreaColorDeletePayload({
    areaIds: [' ar_alpha ', 'ar_beta', '', 'ar_alpha']
  });

  assert.deepEqual(payload, {
    areaIds: ['ar_alpha', 'ar_beta']
  });
})();

(() => {
  assert.throws(() => parseAreaColorDeletePayload({
    areaIds: []
  }), /at least one area/i);
})();

console.log('areaColors tests passed');
