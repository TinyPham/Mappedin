export const STARTUP_LOADING_MAX_MS = 25000;

export function getStartupGateTimeoutMs(elapsedMs, options = {}) {
  const maxMs = options.maxMs ?? STARTUP_LOADING_MAX_MS;
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  return Math.max(0, maxMs - elapsed);
}

export function withStartupTimeout(taskPromise, timeoutMs, timeoutValue = undefined) {
  const timeout = Math.max(0, Number(timeoutMs) || 0);

  return Promise.race([
    Promise.resolve(taskPromise),
    new Promise((resolve) => {
      setTimeout(() => resolve(timeoutValue), timeout);
    })
  ]);
}
