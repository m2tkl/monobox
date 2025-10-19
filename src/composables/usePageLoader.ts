import { ref, type Ref } from 'vue';

import { createError, showError } from '#app';

export type PageLoaderFn = () => Promise<unknown>;

export type UsePageLoaderOptions = {
  /**
   * If true, rethrow the error for the caller to handle instead of showing the error page.
   * Default: false (show error page via showError).
   */
  rethrowOnError?: boolean;
  /**
   * Optional mapper to convert unknown errors into NuxtError-compatible payloads.
   */
  toError?: (err: unknown) => Parameters<typeof createError>[0] | string;
  /**
   * If multiple fns are provided, execute sequentially when true, otherwise in parallel.
   * Default: false (parallel).
   */
  sequential?: boolean;
};

export async function usePageLoader(
  fn: PageLoaderFn | PageLoaderFn[],
  options: UsePageLoaderOptions = {},
): Promise<{ isLoading: Ref<boolean> }> {
  const { rethrowOnError = false, toError, sequential = false } = options;
  const isLoading = ref<boolean>(true);

  try {
    if (Array.isArray(fn)) {
      if (sequential) {
        for (const f of fn) await f();
      }
      else {
        await Promise.all(fn.map(f => f()));
      }
    }
    else {
      await fn();
    }
  }
  catch (err) {
    if (rethrowOnError) {
      throw err;
    }

    const nuxtErr = toError
      ? toError(err)
      : typeof err === 'string'
        ? err
        : createError({ statusCode: 500, statusMessage: 'Page Load Error', message: (err as Error)?.message ?? 'Failed to load page.' });

    // Always route to Nuxt error page when not rethrowing
    showError(nuxtErr as never);
  }
  finally {
    isLoading.value = false;
  }

  return { isLoading };
}
