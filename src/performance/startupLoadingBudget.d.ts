export interface StartupGateTimeoutOptions {
  maxMs?: number;
}

export const STARTUP_LOADING_MAX_MS: number;

export function getStartupGateTimeoutMs(
  elapsedMs: number,
  options?: StartupGateTimeoutOptions
): number;

export function withStartupTimeout<T, TTimeout = undefined>(
  taskPromise: Promise<T>,
  timeoutMs: number,
  timeoutValue?: TTimeout
): Promise<T | TTimeout>;
