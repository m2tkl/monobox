export type Phase = 'idle' | 'loading' | 'success' | 'error';

// internal status (keeps inflight/error)
export type IdleStatus = { phase: 'idle'; inflight: number };
export type LoadingStatus = { phase: 'loading'; inflight: number };
export type SuccessStatus = { phase: 'success'; inflight: number };
export type ErrorStatus = { phase: 'error'; inflight: number; error: unknown };
export type AsyncStatus = IdleStatus | LoadingStatus | SuccessStatus | ErrorStatus;

// public state: string status for narrowing (compat)
export type ResourceState<T> =
  | { status: 'idle' | 'loading'; inflight: number; data?: undefined }
  | { status: 'success'; inflight: number; data: T }
  | { status: 'error'; inflight: number; data?: undefined; error: unknown };

// enriched snapshot that retains last successful data and timestamps
export type ResourceSnapshotStatus = 'idle' | 'loading' | 'success' | 'error';
export type ResourceSnapshot<T> = {
  current: T | null;
  status: ResourceSnapshotStatus;
  updatedAt: number | null;
  loadingSince: number | null;
  error?: unknown;
};

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

// derive common flags used by ViewModel from snapshot
export function deriveViewModelFlags<T>(snap: ResourceSnapshot<T>): { isLoading: boolean; isStale: boolean; hasError: boolean } {
  const isLoading = snap.status === 'loading';
  const hasError = snap.status === 'error';
  // stale: last known data exists but now loading or errored
  const isStale = !!snap.current && (snap.status === 'loading' || snap.status === 'error');
  return { isLoading, isStale, hasError };
}
