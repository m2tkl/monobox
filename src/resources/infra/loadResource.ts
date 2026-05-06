import { useResourceManager } from './useResourceManager';

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

  const resourceManager = useResourceManager();
  const task = (async () => {
    resourceManager.start(key);

    try {
      const value = await fetcher();
      resourceManager.set(key, value);
      resourceManager.succeed(key);
      return value;
    }
    catch (error) {
      resourceManager.fail(key, error);
      throw error;
    }
    finally {
      inflightLoads.delete(cacheKey);
    }
  })();

  inflightLoads.set(cacheKey, task);
  return task;
}
