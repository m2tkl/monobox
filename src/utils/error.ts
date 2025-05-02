/**
 * Represents a structured application-level error.
 *
 * This class distinguishes between operational errors (expected and recoverable errors)
 * and programmer errors (unexpected or fatal errors).
 *
 * @extends Error
 */
export class AppError extends Error {
  /**
   * A short identifier representing the type of error.
   */
  public readonly error: string;

  /**
   * Indicates whether the error is operational (recoverable and expected)
   * or a programmer/fatal error (unexpected and critical).
   */
  public readonly isOperational: boolean;

  /**
   * Creates a new AppError instance.
   *
   * @param args - An object containing the error code and human-readable message.
   * @param isOperational - True if the error is an expected operational error; false if it is a critical system error.
   */
  constructor(
    args: { error: string; message: string },
    isOperational: boolean,
  ) {
    super(args.message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.error = args.error;
    this.isOperational = isOperational;

    // Capture this error's stack (Node.js only)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this);
    }
  }
}

/**
 * Converts an unknown error into an AppError.
 *
 * @param error - Any thrown error or unknown value
 * @returns AppError
 */
const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      { error: 'Unexpected error', message: error.message },
      true,
    );
  }

  return new AppError(
    { error: 'Unexpected error', message: String(error) },
    true,
  );
};

/**
 * Logs an AppError to the console.
 *
 * @param error - AppError to be logged
 */
const logAppError = (error: AppError) => {
  const logMessage = {
    error: error.error,
    message: error.message,
    isOperational: error.isOperational,
    stack: error.stack,
  };

  if (error.isOperational) {
    console.warn(`[Operational Error]: ${JSON.stringify(logMessage, null, 2)}`);
    // TODO: Handle operational error (e.g., show notification)
  }
  else {
    console.error(`[Fatal Error] ${JSON.stringify(logMessage, null, 2)}`);
    // TODO: Handle fatal error (e.g., terminate app)
  }
};

/**
 * Handles an unknown error: normalizes it and logs it.
 *
 * @param error - Any thrown error or unknown value
 * @returns Normalized AppError
 */
export const handleError = (error: unknown): AppError => {
  const appError = toAppError(error);
  logAppError(appError);
  return appError;
};

/**
 * Creates normalized error information for command invocation failures.
 *
 * @param error - An unknown error value caught from invoke
 * @returns An object containing error code and message
 */
export const createCommandErrorInfo = (error: unknown): { error: string; message: string } => {
  if (typeof error === 'string') {
    return {
      error: 'CommandError',
      message: error,
    };
  }

  if (error instanceof Error) {
    return {
      error: 'CommandError',
      message: error.message,
    };
  }

  try {
    return {
      error: 'CommandError',
      message: `Non-standard error object: ${JSON.stringify(error)}`,
    };
  }
  catch {
    return {
      error: 'CommandError',
      message: 'Unknown non-serializable error occurred.',
    };
  }
};
