/** One registry per map view. Call delete only AFTER removing the resolved SDK instance.
 * A pending load cannot be deleted: await it before an unload/floor cleanup.
 * A proxy must use its own explicitly assigned UUID; never key instances by asset URL.
 */
export function createModelLoadRegistry() {
  const pending = new Map();
  const loaded = new Map();
  return {
    has: uuid => pending.has(uuid) || loaded.has(uuid),
    get: uuid => loaded.get(uuid),
    delete(uuid) { return pending.has(uuid) ? false : loaded.delete(uuid); },
    load(uuid, loader) {
      if (typeof uuid !== 'string' || !uuid.trim()) throw new TypeError('A nonempty UUID is required');
      if (loaded.has(uuid)) return Promise.resolve(loaded.get(uuid));
      if (pending.has(uuid)) return pending.get(uuid);
      // Defer loader so the pending promise is installed before synchronous/reentrant loads.
      const promise = Promise.resolve().then(loader).then(instance => {
        if (instance === undefined || instance === null) throw new Error('Model loader did not return an instance');
        loaded.set(uuid, instance);
        return instance;
      }).finally(() => pending.delete(uuid));
      pending.set(uuid, promise);
      return promise;
    }
  };
}
