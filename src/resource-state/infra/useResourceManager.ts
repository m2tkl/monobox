import { defineStore } from 'pinia';

import type { AsyncStatus, ResourceState } from './types';

const init = (): AsyncStatus => ({ phase: 'idle', inflight: 0 });
const k = (key: readonly unknown[]) => JSON.stringify(key);

export const useResourceManager = defineStore('resourceManager', {
  state: () => ({
    data: new Map<string, unknown>(),
    status: new Map<string, AsyncStatus>(),
  }),
  actions: {
    get<T>(key: readonly unknown[]): ResourceState<T> {
      const s = this.status.get(k(key)) ?? init();
      const d = this.data.get(k(key)) as T | undefined;
      return { data: d, status: s };
    },
    start(key: readonly unknown[]) {
      const cur = this.status.get(k(key)) ?? init();
      this.status.set(k(key), { phase: 'loading', inflight: cur.inflight + 1 });
    },
    set<T>(key: readonly unknown[], value: T) {
      this.data.set(k(key), value as unknown);
    },
    succeed(key: readonly unknown[]) {
      console.log('succeeded?');
      const cur = this.status.get(k(key)) ?? init();
      const n = Math.max(cur.inflight - 1, 0);
      this.status.set(k(key), { phase: n > 0 ? 'loading' : 'success', inflight: n });
    },
    fail(key: readonly unknown[], err: unknown) {
      const cur = this.status.get(k(key)) ?? init();
      const n = Math.max(cur.inflight - 1, 0);
      this.status.set(k(key), { phase: n > 0 ? 'loading' : 'error', inflight: n, error: err });
    },
    clear(key: readonly unknown[]) {
      this.data.delete(k(key));
      this.status.delete(k(key));
    },
    clearAll() {
      this.data.clear();
      this.status.clear();
    },
  },
});
