/* eslint-disable @typescript-eslint/no-explicit-any */
export const useConsoleLogger = (tag: string) => ({
  debug: (...args: any[]) => {
    console.debug(`${tag}:`, ...args);
  },
  log: (...args: any[]) => {
    console.log(`${tag}:`, ...args);
  },
  warn: (...args: any[]) => {
    console.warn(`${tag}:`, ...args);
  },
  error: (...args: any[]) => {
    console.error(`${tag}:`, ...args);
  },
});
