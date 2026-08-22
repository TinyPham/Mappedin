export function captureActiveTutorialTab(documentRef) {
  if (documentRef.getElementById('tab-directions')?.classList.contains('active')) return 'directions';
  if (documentRef.getElementById('tab-search')?.classList.contains('active')) return 'search';
  return null;
}

export function beginTutorialTabSession(documentRef, openedAtMobileWidth, existingSession = null) {
  if (existingSession) return existingSession;
  return {
    openedAtMobileWidth,
    entryTab: openedAtMobileWidth ? captureActiveTutorialTab(documentRef) : null
  };
}

export function restoreTutorialTab(documentRef, tab) {
  if (tab !== 'search' && tab !== 'directions') return false;
  const tabElement = documentRef.getElementById(tab === 'directions' ? 'tab-directions' : 'tab-search');
  if (!tabElement) return false;
  tabElement.click();
  return true;
}

export function restoreTutorialTabBeforeGuideRelease(documentRef, tab, releaseGuideState) {
  restoreTutorialTab(documentRef, tab);
  releaseGuideState();
}

export function closeTutorialTabSession(
  documentRef,
  session,
  releaseGuideState,
  restoreDesktopSearch
) {
  try {
    if (!session) return false;
    if (session.openedAtMobileWidth) {
      return restoreTutorialTab(documentRef, session.entryTab);
    }
    restoreDesktopSearch();
    return true;
  } catch {
    return false;
  } finally {
    releaseGuideState();
  }
}
