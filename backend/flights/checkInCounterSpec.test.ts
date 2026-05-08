import assert from 'node:assert/strict';
import {
  normalizeCheckInCounterSpec,
  parseCheckInCounterSpec,
  pickRandomCheckInCounter
} from './checkInCounterSpec';

(() => {
  assert.equal(normalizeCheckInCounterSpec(' 1, 4-7 ; 9 '), '1,4-7,9');
})();

(() => {
  assert.deepEqual(parseCheckInCounterSpec('12'), [12]);
})();

(() => {
  assert.deepEqual(parseCheckInCounterSpec('5-8'), [5, 6, 7, 8]);
})();

(() => {
  assert.deepEqual(parseCheckInCounterSpec('1,4-7'), [1, 4, 5, 6, 7]);
})();

(() => {
  assert.deepEqual(parseCheckInCounterSpec('8-5,7,7'), [5, 6, 7, 8]);
})();

(() => {
  assert.deepEqual(parseCheckInCounterSpec('abc,1-2,x'), [1, 2]);
})();

(() => {
  const value = pickRandomCheckInCounter([1, 4, 5, 6, 7], 'VN123|A|1,4-7');
  assert.ok(value !== null);
  assert.ok([1, 4, 5, 6, 7].includes(value!));
  assert.equal(value, pickRandomCheckInCounter([1, 4, 5, 6, 7], 'VN123|A|1,4-7'));
})();

console.log('checkInCounterSpec tests passed');
