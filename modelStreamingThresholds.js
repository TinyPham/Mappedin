export function getModelStreamingZoomThresholds(isMobileDevice) {
  return isMobileDevice
    ? { load: 17.2, unload: 17, loadRadius: 180, unloadRadius: 230 }
    : { load: 19.2, unload: 18.8, loadRadius: 120, unloadRadius: 150 };
}
