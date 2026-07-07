import test from 'node:test';
import assert from 'node:assert/strict';

import { getTutorialDeviceFromContext } from '../src/tutorial/tutorialDevice.js';

test('tutorial device detection treats phone widths and phone agents as mobile', () => {
  assert.equal(getTutorialDeviceFromContext({ width: 375, userAgent: 'Mozilla/5.0' }), 'mobile');
  assert.equal(getTutorialDeviceFromContext({ width: 1024, userAgent: 'Mozilla/5.0 (iPhone)' }), 'mobile');
  assert.equal(getTutorialDeviceFromContext({ width: 1024, userAgent: 'Mozilla/5.0 (Android)' }), 'mobile');
});

test('tutorial device detection distinguishes tablet and desktop', () => {
  assert.equal(getTutorialDeviceFromContext({ width: 820, userAgent: 'Mozilla/5.0' }), 'tablet');
  assert.equal(getTutorialDeviceFromContext({ width: 1366, userAgent: 'Mozilla/5.0' }), 'desktop');
  assert.equal(getTutorialDeviceFromContext({ width: 1180, userAgent: 'Mozilla/5.0 (iPad)' }), 'tablet');
});
