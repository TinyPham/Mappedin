import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldRenderFlightNavigationActions } from '../flightNavigationActions.js';

test('hides departure navigation actions when status blocks navigation', () => {
  assert.equal(shouldRenderFlightNavigationActions({
    navigationBlockedByStatus: true,
    canNavigateGate: true,
    canNavigateCheckin: true
  }), false);
});

test('hides arrival navigation actions when status blocks navigation', () => {
  assert.equal(shouldRenderFlightNavigationActions({
    navigationBlockedByStatus: true,
    canNavigateBelt: true
  }), false);
});

test('shows actions for available navigation statuses', () => {
  assert.equal(shouldRenderFlightNavigationActions({
    navigationBlockedByStatus: false,
    canNavigateGate: false,
    canNavigateCheckin: false
  }), true);
});
