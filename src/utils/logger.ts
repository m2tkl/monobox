/* eslint-disable @typescript-eslint/no-explicit-any */
export const useConsoleLogger = (tag: string) => {
  const logPrefix = `[${tag}]:`;

  return {
    debug: (...args: any[]) => {
      console.debug(logPrefix, ...args);
    },
    log: (...args: any[]) => {
      console.log(logPrefix, ...args);
    },
    warn: (...args: any[]) => {
      console.warn(logPrefix, ...args);
    },
    error: (...args: any[]) => {
      console.error(logPrefix, ...args);
    },
  };
};
