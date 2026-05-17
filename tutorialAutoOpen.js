export const USER_GUIDE_AUTO_SHOW_INTERVAL_MS = 24 * 60 * 60 * 1000;

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
