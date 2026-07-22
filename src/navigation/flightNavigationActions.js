export function shouldRenderFlightNavigationActions(meta) {
  return !meta?.navigationBlockedByStatus;
}

/**
 * @param {{
 *   action: 'checkin' | 'gate' | 'route' | 'belt',
 *   isKioskMode?: boolean,
 *   kioskOrigin?: any,
 *   currentOrigin?: any,
 *   checkin?: any,
 *   gate?: any,
 *   belt?: any
 * }} options
 */
export function buildFlightWayfindingPlan({
  action,
  isKioskMode = false,
  kioskOrigin = null,
  currentOrigin = null,
  checkin = null,
  gate = null,
  belt = null
} = {}) {
  if (action === 'route') {
    return {
      origin: isKioskMode ? kioskOrigin : checkin,
      destination: gate,
      stopovers: isKioskMode && checkin ? [checkin] : []
    };
  }

  const destinations = {
    checkin,
    gate,
    belt
  };

  return {
    origin: isKioskMode ? kioskOrigin : currentOrigin,
    destination: destinations[action] ?? null,
    stopovers: []
  };
}
