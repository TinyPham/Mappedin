export const USER_GUIDE_AUTO_SHOW_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const STARTUP_CAMERA_ROTATION_DURATION_MS = 1400;
export const STARTUP_CAMERA_ZOOM_DELAY_MS = 1000;
export const STARTUP_CAMERA_ZOOM_DURATION_MS = 3000;
export const STARTUP_GUIDE_AFTER_ROTATION_BUFFER_MS = 300;
export const STARTUP_GUIDE_OPEN_DELAY_MS = 1000;

export function shouldAutoOpenUserGuide(lastAutoShowValue, now = Date.now()) {
  if (!lastAutoShowValue) return true;

  const lastAutoShow = Number.parseInt(lastAutoShowValue, 10);
  if (!Number.isFinite(lastAutoShow)) return true;

  return now - lastAutoShow > USER_GUIDE_AUTO_SHOW_INTERVAL_MS;
}

export function shouldShowPwaInstallPrompt({ innerWidth, userAgent } = {}) {
  const width = typeof innerWidth === 'number' ? innerWidth : Number.POSITIVE_INFINITY;
  const ua = typeof userAgent === 'string' ? userAgent : '';
  const isMobileViewport = width <= 768;
  const isMobileAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

  return !isMobileViewport && !isMobileAgent;
}

export function waitForStartupCameraRotation(animationResult, waitMs = STARTUP_CAMERA_ROTATION_DURATION_MS + STARTUP_GUIDE_AFTER_ROTATION_BUFFER_MS) {
  const minimumVisibleRotation = new Promise((resolve) => setTimeout(resolve, waitMs));
  const animationFinished = animationResult && typeof animationResult.then === 'function'
    ? animationResult.catch(() => undefined)
    : Promise.resolve();

  return Promise.all([animationFinished, minimumVisibleRotation]).then(() => undefined);
}
