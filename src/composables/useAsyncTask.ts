/**
 * Composable for managing an asynchronous task with loading, success, and error states.
 *
 * Provides reactive state (`isLoading`, `data`, `error`) and actions (`runTask`, `reset`) to
 * execute an asynchronous task safely while handling errors in a structured manner.
 *
 * @param task - An asynchronous function that performs the desired task and returns a Promise of type `T`.
 *
 * @returns An object containing:
 * - `isLoading`: Indicates whether the task is currently in progress.
 * - `data`: Holds the successful result produced by the task, or `null` if not available.
 * - `error`: Represents the error that occurred during task execution, or `null` if no error was encountered.
 * - `runTask`: Triggers the execution of the task with the given arguments and manages the state accordingly.
 * - `reset`: Restores the internal state to its initial values, clearing any previous results or errors.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAsyncTask<T, Args extends any[]>(
  task: (...args: Args) => Promise<T>,
) {
  const isLoading = ref(false);
  const data = ref<T | null>(null);
  const error = ref<Error | null>(null);

  /**
   * Executes the asynchronous task while managing loading and error states.
   *
   * @param args - Arguments to pass to the asynchronous task.
   * @returns A Promise resolving to an object indicating success or failure:
   * - `{ ok: true, data }` if the task succeeds
   * - `{ ok: false }` if the task fails
   */
  const runTask = async (...args: Args) => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await task(...args);
      data.value = result;
      error.value = null;
      return { ok: true, data: result };
    }
    catch (err) {
      const appError = handleError(err);
      error.value = appError;
      return { ok: false };
    }
    finally {
      isLoading.value = false;
    }
  };

  /**
   * Resets the states to their initial values.
   */
  const reset = () => {
    isLoading.value = false;
    data.value = null;
    error.value = null;
  };

  return {
    /* --- State --- */
    isLoading,
    data,
    error,

    /* --- Action --- */
    runTask,
    reset,
  };
};
