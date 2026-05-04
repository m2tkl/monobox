import { useResourceManager } from './useResourceManager';

/**
 * Runs a standardized load cycle against ResourceManager for the given key.
 * - start -> await fetch -> set -> succeed
 * - on error: fail -> rethrow
 */
const inflightLoads = new Map<string, Promise<unknown>>();

export async function loadResource<T>(
  key: readonly unknown[],
  fetcher: () => Promise<T>,
): Promise<T> {
  const cacheKey = JSON.stringify(key);
  const existing = inflightLoads.get(cacheKey);
  if (existing) {
    return existing as Promise<T>;
  }

  const rm = useResourceManager();
  const task = (async () => {
    rm.start(key);

    try {
      const value = await fetcher();
      rm.set(key, value);
      rm.succeed(key);
      return value;
    }
    catch (e) {
      rm.fail(key, e);
      throw e;
    }
    finally {
      inflightLoads.delete(cacheKey);
    }
  })();

  inflightLoads.set(cacheKey, task);
  return task;
}
