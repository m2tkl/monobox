export type Phase = 'idle' | 'loading' | 'success' | 'error';

export type AsyncStatus = {
  phase: Phase;
  inflight: number;
  error?: unknown;
};

export type ResourceState<T> = {
  data?: T;
  status: AsyncStatus;
};
