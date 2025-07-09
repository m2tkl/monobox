export function useActionFlow<T, Args extends unknown[]>(
  action: (...args: Args) => Promise<T>,
) {
  const isRunning = ref(false);
  const error = ref<Error | null>(null);
  const data = ref<T | null>(null);

  async function execute(
    args: Args,
    handlers?: {
      onSuccess?: (result: T) => void;
      onError?: (err: Error) => void;
    },
  ): Promise<{ ok: true; data: T } | { ok: false }> {
    isRunning.value = true;
    error.value = null;

    try {
      const result = await action(...args);
      data.value = result;
      handlers?.onSuccess?.(result);
      return { ok: true, data: result };
    }
    catch (err) {
      const appError = handleError(err);
      error.value = appError;
      handlers?.onError?.(appError);
      return { ok: false };
    }
    finally {
      isRunning.value = false;
    }
  }

  return {
    isRunning,
    error,
    data,
    execute,
  };
}
