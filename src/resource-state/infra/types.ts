export type Phase = 'idle' | 'loading' | 'success' | 'error';

// internal status (keeps inflight/error)
export type IdleStatus = { phase: 'idle'; inflight: number };
export type LoadingStatus = { phase: 'loading'; inflight: number };
export type SuccessStatus = { phase: 'success'; inflight: number };
export type ErrorStatus = { phase: 'error'; inflight: number; error: unknown };
export type AsyncStatus = IdleStatus | LoadingStatus | SuccessStatus | ErrorStatus;

// public state: string status for narrowing
export type ResourceState<T> =
  | { status: 'idle' | 'loading'; inflight: number; data?: undefined }
  | { status: 'success'; inflight: number; data: T }
  | { status: 'error'; inflight: number; data?: undefined; error: unknown };

// helpers: type guards
export function isSuccess<T>(r: ResourceState<T>): r is { status: 'success'; inflight: number; data: T } {
  return r.status === 'success';
}

export function isLoading<T>(r: ResourceState<T>): r is { status: 'loading'; inflight: number } {
  return r.status === 'loading';
}

export function isError<T>(r: ResourceState<T>): r is { status: 'error'; inflight: number; error: unknown } {
  return r.status === 'error';
}
