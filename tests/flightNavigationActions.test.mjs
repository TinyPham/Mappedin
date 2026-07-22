import test from 'node:test';
import assert from 'node:assert/strict';

import * as flightNavigationActions from '../src/navigation/flightNavigationActions.js';

const { shouldRenderFlightNavigationActions } = flightNavigationActions;

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

test('builds kiosk departure plans for check-in, gate and full route', () => {
  assert.equal(typeof flightNavigationActions.buildFlightWayfindingPlan, 'function');
  const kiosk = { id: 'kiosk' };
  const checkin = { id: 'checkin' };
  const gate = { id: 'gate' };
  const common = {
    isKioskMode: true,
    kioskOrigin: kiosk,
    currentOrigin: { id: 'ignored-current-origin' },
    checkin,
    gate
  };

  assert.deepEqual(
    flightNavigationActions.buildFlightWayfindingPlan({ ...common, action: 'checkin' }),
    { origin: kiosk, destination: checkin, stopovers: [] }
  );
  assert.deepEqual(
    flightNavigationActions.buildFlightWayfindingPlan({ ...common, action: 'gate' }),
    { origin: kiosk, destination: gate, stopovers: [] }
  );
  assert.deepEqual(
    flightNavigationActions.buildFlightWayfindingPlan({ ...common, action: 'route' }),
    { origin: kiosk, destination: gate, stopovers: [checkin] }
  );
});

test('builds kiosk arrival plan with only the baggage belt as destination', () => {
  assert.equal(typeof flightNavigationActions.buildFlightWayfindingPlan, 'function');
  const kiosk = { id: 'kiosk' };
  const belt = { id: 'belt' };

  assert.deepEqual(flightNavigationActions.buildFlightWayfindingPlan({
    action: 'belt',
    isKioskMode: true,
    kioskOrigin: kiosk,
    currentOrigin: { id: 'ignored-current-origin' },
    belt
  }), {
    origin: kiosk,
    destination: belt,
    stopovers: []
  });
});

test('keeps the existing website departure route behavior', () => {
  assert.equal(typeof flightNavigationActions.buildFlightWayfindingPlan, 'function');
  const checkin = { id: 'checkin' };
  const gate = { id: 'gate' };

  assert.deepEqual(flightNavigationActions.buildFlightWayfindingPlan({
    action: 'route',
    isKioskMode: false,
    kioskOrigin: { id: 'ignored-kiosk' },
    currentOrigin: null,
    checkin,
    gate
  }), {
    origin: checkin,
    destination: gate,
    stopovers: []
  });
});
