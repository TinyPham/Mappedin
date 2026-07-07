export function getTutorialDeviceFromContext({ width, userAgent }) {
  const ua = userAgent || '';
  const isPhoneAgent = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTabletAgent = /iPad|Tablet/i.test(ua);

  if (isPhoneAgent || width <= 768) return 'mobile';
  if (isTabletAgent || width <= 1200) return 'tablet';
  return 'desktop';
}

export function getTutorialDevice() {
  return getTutorialDeviceFromContext({
    width: window.innerWidth,
    userAgent: navigator.userAgent
  });
}
