export function captureActiveTutorialTab(documentRef) {
  if (documentRef.getElementById('tab-directions')?.classList.contains('active')) return 'directions';
  if (documentRef.getElementById('tab-search')?.classList.contains('active')) return 'search';
  return null;
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
