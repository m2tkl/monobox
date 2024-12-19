type SafeExecuteResult<T> = { ok: true; data: T } | { ok: false; error: any };

export function safeExecute<T>(
  fn: (...args: any[]) => Promise<T>,
  name: string,
): (...args: any[]) => Promise<SafeExecuteResult<T>> {
  const logger = useConsoleLogger(`[${name}]`);

  return async (...args: any[]): Promise<SafeExecuteResult<T>> => {
    logger.log(`${name} start`);

    try {
      const data = await fn(...args);
      return { ok: true, data };
    } catch (error) {
      logger.error(`${name} failed`, error);
      return { ok: false, error };
    } finally {
      logger.log(`${name} end`);
    }
  };
}
