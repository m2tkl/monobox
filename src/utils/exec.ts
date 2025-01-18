// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SafeExecuteResult<T> = { ok: true; data: T } | { ok: false; error: any };

export function safeExecute<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (...args: any[]) => Promise<T>,
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (...args: any[]) => Promise<SafeExecuteResult<T>> {
  const logger = useConsoleLogger(`[${name}]`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]): Promise<SafeExecuteResult<T>> => {
    logger.log(`${name} start`);

    try {
      const data = await fn(...args);
      return { ok: true, data };
    }
    catch (error) {
      logger.error(`${name} failed`, error);
      return { ok: false, error };
    }
    finally {
      logger.log(`${name} end`);
    }
  };
}
