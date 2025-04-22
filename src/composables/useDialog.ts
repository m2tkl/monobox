export function useDialog() {
  const isOpen = ref(false);

  const open = () => {
    isOpen.value = true;
  };
  const close = () => {
    isOpen.value = false;
  };

  /**
   * Wraps a function that performs any setup logic before opening the dialog.
   *
   * @param fn - A function to run before opening the dialog. Can be async.
   * @returns A function that takes the same arguments and opens the dialog after `fn` completes.
   */
  const withOpen = <Args extends unknown[]>(
    fn: (...args: Args) => void | Promise<void>,
  ) => {
    return async (...args: Args) => {
      await fn(...args);
      open();
    };
  };

  /**
   * Wraps a function that performs an action and conditionally closes the dialog based on the result.
   *
   * This higher-order function is useful for handling submission logic or clearing states,
   * and automatically closes the dialog if the result satisfies the `shouldClose` condition.
   *
   * @param fn - A function that performs some operation. Must return a value or Promise.
   * @param shouldClose - A predicate that determines whether to close the dialog based on the result.
   *                      Defaults to closing if the result is not `false`.
   * @returns A function that executes `fn`, and closes the dialog if `shouldClose(result)` is `true`.
   */
  const withClose = <Args extends unknown[], R>(
    fn: (...args: Args) => Promise<R>,
    shouldClose: (result: R) => boolean = r => r !== false,
  ) => {
    return async (...args: Args) => {
      const result = await fn(...args);
      if (shouldClose(result)) {
        close();
      }
    };
  };

  return {
    isOpen,
    open,
    close,
    withOpen,
    withClose,
  };
}
