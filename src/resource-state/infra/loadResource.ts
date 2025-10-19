import { useResourceManager } from './useResourceManager';

/**
 * Runs a standardized load cycle against ResourceManager for the given key.
 * - start -> await fetch -> set -> succeed
 * - on error: fail -> rethrow
 */
export async function loadResource<T>(
  key: readonly unknown[],
  fetcher: () => Promise<T>,
): Promise<T> {
  const rm = useResourceManager();
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
}
