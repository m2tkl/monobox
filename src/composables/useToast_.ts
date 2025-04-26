export const useToast_ = () => {
  const toast = useToast();

  /**
   * Wraps a function with toast notifications on success or failure.
   *
   * @param fn - A function that performs an asynchronous operation.
   * @param messages - Success and error messages for toast notifications.
   * @returns A function that executes `fn` with toast notifications.
   */
  function withToast<T, Args extends unknown[]>(
    fn: (...args: Args) => Promise<T>,
    messages: { success: string; error: string },
  ): (...args: Args) => Promise<{ ok: true; data: T } | { ok: false }> {
    return async (...args: Args) => {
      try {
        const result = await fn(...args);
        toast.add({
          title: messages.success,
          duration: 1000,
          icon: iconKey.success,
        });
        return { ok: true, data: result };
      }
      catch (error) {
        console.error(messages.error, error);
        toast.add({
          title: messages.error,
          description: 'Please try again',
          color: 'error',
          icon: iconKey.failed,
        });
        return { ok: false };
      }
    };
  }

  return {
    toast,
    withToast,
  };
};

// NOTE: This toast is used in executeWithToast
const toast = useToast();

/**
 * @deprecated - Use withToast instead.
 */
export async function executeWithToast<T, Args extends unknown[]>(
  action: (...args: Args) => Promise<T>,
  args: Args,
  messages: { success: string; error: string },
): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    const result = await action(...args);
    toast.add({
      title: messages.success,
      duration: 1000,
      icon: iconKey.success,
    });
    return { ok: true, data: result };
  }
  catch (error) {
    console.error(messages.error, error);
    toast.add({
      title: messages.error,
      description: 'Please try again',
      color: 'error',
      icon: iconKey.failed,
    });
    return { ok: false };
  }
};
