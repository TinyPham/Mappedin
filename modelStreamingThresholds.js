export function getModelStreamingZoomThresholds(isMobileDevice) {
  return isMobileDevice
    ? { load: 16.8, unload: 16.6, loadRadius: 180, unloadRadius: 230 }
    : { load: 19.2, unload: 18.8, loadRadius: 120, unloadRadius: 150 };
}
