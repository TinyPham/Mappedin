/** A session-scoped poller: one timer and one cancellable request per session. */
export function createAuthenticatedPolling({
  isAuthenticated,
  task,
  canPoll = () => true,
  onError = (_error) => {},
  intervalMs = 5000,
  setInterval: schedule = globalThis.setInterval,
  clearInterval: cancel = globalThis.clearInterval
}) {
  let timer = null;
  let request = null;
  let generation = 0;
  return {
    start() {
      if (!isAuthenticated() || timer !== null) return;
      const session = ++generation;
      timer = schedule(async () => {
        if (session !== generation || !isAuthenticated() || !canPoll() || request) return;
        const current = { controller: new AbortController() };
        request = current;
        try {
          await task({ signal: current.controller.signal });
        } catch (error) {
          if (session === generation && isAuthenticated()) onError(error);
        } finally {
          if (request === current) request = null;
        }
      }, intervalMs);
    },
    stop() {
      ++generation;
      request?.controller.abort();
      request = null;
      if (timer !== null) cancel(timer);
      timer = null;
    }
  };
}
