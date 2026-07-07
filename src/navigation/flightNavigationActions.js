export function shouldRenderFlightNavigationActions(meta) {
  return !meta?.navigationBlockedByStatus;
}
