import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  STARTUP_LOADING_MAX_MS,
  getStartupGateTimeoutMs,
  withStartupTimeout
} from '../src/performance/startupLoadingBudget.js';

test('startup gate budget keeps total loading under twenty five seconds', () => {
  assert.equal(STARTUP_LOADING_MAX_MS, 25000);
  assert.equal(getStartupGateTimeoutMs(0), 25000);
  assert.equal(getStartupGateTimeoutMs(2000), 23000);
  assert.equal(getStartupGateTimeoutMs(26000), 0);
});

test('startup timeout resolves with fallback before a slow task can block loading', async () => {
  const started = Date.now();
  const result = await withStartupTimeout(
    new Promise((resolve) => setTimeout(() => resolve('late'), 50)),
    5,
    'timeout'
  );

  assert.equal(result, 'timeout');
  assert.ok(Date.now() - started < 45);
});
