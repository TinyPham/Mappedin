import test from 'node:test';
import assert from 'node:assert/strict';

async function setup() {
  const { createAuthenticatedPolling } = await import('../src/admin/adminPolling.js');
  let authenticated = false, editing = false, timer, calls = 0, cleared = 0, fail = false;
  let complete;
  const errors = [];
  const polling = createAuthenticatedPolling({
    isAuthenticated: () => authenticated,
    canPoll: () => !editing,
    task: () => { calls++; return new Promise((resolve, reject) => { complete = () => fail ? reject(new Error('network')) : resolve([]); }); },
    onError: error => errors.push(error),
    setInterval: callback => { assert.equal(timer, undefined); timer = callback; return 1; },
    clearInterval: () => { cleared++; timer = undefined; }
  });
  return { polling, auth: value => authenticated = value, edit: value => editing = value,
    tick: () => timer?.(), done: () => complete(), fail: () => fail = true,
    calls: () => calls, cleared: () => cleared, errors, timer: () => timer };
}

test('admin polling never starts before login, starts once and stops on logout', async () => {
  const h = await setup();
  h.polling.start(); assert.equal(h.timer(), undefined);
  h.auth(true); h.polling.start(); h.polling.start();
  const pending = h.tick(); assert.equal(h.calls(), 1);
  h.auth(false); h.polling.stop(); h.polling.stop();
  assert.equal(h.cleared(), 1); assert.equal(h.timer(), undefined);
  h.done(); await pending;
  h.polling.start(); assert.equal(h.timer(), undefined);
});

test('polling skips editing and overlapping requests, handles errors and can restart', async () => {
  const h = await setup(); h.auth(true); h.polling.start();
  h.edit(true); await h.tick(); assert.equal(h.calls(), 0);
  h.edit(false); const first = h.tick(); await h.tick(); assert.equal(h.calls(), 1);
  h.fail(); h.done(); await first; assert.equal(h.errors.length, 1);
  const next = h.tick(); assert.equal(h.calls(), 2); h.done(); await next;
  h.polling.stop(); h.polling.start(); assert.equal(typeof h.timer(), 'function');
});

test('a stale timer callback cannot poll after stop or logout', async () => {
  const h = await setup(); h.auth(true); h.polling.start(); const stale = h.timer();
  h.polling.stop(); await stale(); assert.equal(h.calls(), 0);
  h.polling.start(); await stale(); assert.equal(h.calls(), 0);
  h.auth(false); await h.tick(); assert.equal(h.calls(), 0);
});

test('logout cancels a stuck request and a new session can poll without the old finally releasing its lock', async () => {
  const { createAuthenticatedPolling } = await import('../src/admin/adminPolling.js');
  let timer, authenticated = true;
  const signals = [], completions = [];
  const polling = createAuthenticatedPolling({
    isAuthenticated: () => authenticated,
    task: ({ signal }) => { signals.push(signal); return new Promise(resolve => completions.push(resolve)); },
    setInterval: callback => { timer = callback; return 1; }, clearInterval: () => timer = null
  });
  polling.start(); const old = timer(); authenticated = false; polling.stop();
  assert.equal(signals[0].aborted, true);
  authenticated = true; polling.start(); const next = timer(); assert.equal(signals.length, 2);
  completions[0](); await old;
  await timer(); assert.equal(signals.length, 2, 'old request completion must not unlock the current request');
  completions[1](); await next; polling.stop();
});
