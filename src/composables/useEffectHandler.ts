import { useToast } from '#imports';

/**
 * Creates a chainable effect handler that allows composing multiple side effects
 * for async operations.
 *
 * @example
 * ```typescript
 * const copyPageAsMarkdown = () =>
 *   createEffectHandler(() => EditorCommand.copyAsMarkdown(editor.value!, title.value))
 *     .withToast('Copied page as markdown.', 'Failed to copy.')
 *     .withAnalytics('copy_markdown')
 *     .execute();
 * ```
 */
export const useEffectHandler = () => {
  const toast = useToast();
  const logger = useConsoleLogger('composables/useEffectHandler');

  /**
   * Creates a chainable effect handler for the given operation
   */
  function createEffectHandler<T, Args extends unknown[] = []>(operation: (...args: Args) => Promise<T>) {
    const effects = {
      success: [] as Array<(result: T) => void>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: [] as Array<(error: any) => void>,
    };

    const handler = {
      /**
       * Adds a side effect to be executed on success or error
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addEffect: (type: 'success' | 'error', effect: (data: any) => void) => {
        effects[type].push(effect);
        return handler;
      },

      /**
       * Adds toast notifications for success and error states
       */
      withToast: (success: string, error: string) =>
        handler
          .addEffect('success', () =>
            toast.add({ title: success, icon: iconKey.success, duration: 1000 }),
          )
          .addEffect('error', (data) => {
            logger.error(data);
            toast.add({
              title: error,
              description: 'Please try again',
              color: 'error',
              icon: iconKey.failed,
            });
          },
          ),

      /**
       * Adds console logging for success and error states
       */
      withLog: (message: string) =>
        handler
          .addEffect('success', result => console.log(`${message}:`, result))
          .addEffect('error', error => console.error(`${message} failed:`, error)),

      /**
       * Adds custom callbacks for success and error states
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      withCallback: (onSuccess?: (result: T) => void, onError?: (error: any) => void) => {
        if (onSuccess) handler.addEffect('success', onSuccess);
        if (onError) handler.addEffect('error', onError);
        return handler;
      },

      /**
       * Executes the operation and all registered side effects
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      execute: async (...args: Args): Promise<{ ok: true; data: T } | { ok: false; error?: any }> => {
        try {
          const result = await operation(...args);
          effects.success.forEach(effect => effect(result));
          return { ok: true, data: result };
        }
        catch (error) {
          effects.error.forEach(effect => effect(error));
          return { ok: false, error };
        }
      },
    };

    return handler;
  }

  return {
    createEffectHandler,
  };
};
