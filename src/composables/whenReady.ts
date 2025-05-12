/**
 * Waits until the provided predicate returns true, reacting to reactive sources.
 * Immediately resolves if the predicate is initially true.
 *
 * @param predicate - A function returning a boolean, typically using reactive refs or computed.
 * @returns Promise<void> that resolves when predicate() returns true
 */
export function whenReady(predicate: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    if (predicate()) {
      resolve();
      return;
    }

    const stop = watch(
      predicate,
      (val) => {
        if (val) {
          stop();
          resolve();
        }
      },
      { flush: 'sync', immediate: true },
    );
  });
}
