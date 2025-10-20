import { invoke } from '@tauri-apps/api/core';

import { AppError, createCommandErrorInfo } from '~/utils/error';

type AnyObject = Record<string, unknown>;

/**
 * Calls Tauri's `invoke` with a command name and optional args.
 * Wraps parameters into `{ args }` only when provided.
 * Normalizes and rethrows errors as `AppError`.
 */
export const invokeCommand = async <T = unknown>(
  command: string,
  args?: AnyObject,
): Promise<T> => {
  try {
    if (args && Object.keys(args).length > 0) {
      return await invoke<T>(command, { args });
    }
    return await invoke<T>(command);
  }
  catch (err) {
    const errorInfo = createCommandErrorInfo(err);
    throw new AppError(errorInfo, true);
  }
};

/**
 * Utility to create a typed invoker from a command name.
 * The returned function accepts the raw args object (content of `args`).
 */
export function defineCommand<TResult = unknown>(command: string): () => Promise<TResult>;
export function defineCommand<TResult = unknown, TArgs extends AnyObject = AnyObject>(
  command: string,
): (args: TArgs) => Promise<TResult>;
export function defineCommand<TResult = unknown, TArgs extends AnyObject = AnyObject>(
  command: string,
) {
  return async (args?: TArgs) => {
    return await invokeCommand<TResult>(command, (args as AnyObject | undefined));
  };
}
