import { defineStore } from 'pinia';
import { computed, type ComputedRef } from 'vue';

import type { AsyncStatus, ResourceState } from './types';

const init = (): AsyncStatus => ({ phase: 'idle', inflight: 0 });
const k = (key: readonly unknown[]) => JSON.stringify(key);

export const useResourceManager = defineStore('resourceManager', {
  state: () => ({
    data: new Map<string, unknown>(),
    status: new Map<string, AsyncStatus>(),
  }),
  actions: {
    select<T>(key: readonly unknown[]): ComputedRef<ResourceState<T>> {
      return computed(() => this.get<T>(key));
    },
    /**
     * Required access: returns a ComputedRef that synchronously exposes the
     * resource value for the given key. Throws if the resource is not in a
     * success state. Use when the page-level loader (e.g. usePageLoader)
     * has already guaranteed readiness.
     */
    selectRequired<T>(key: readonly unknown[]): ComputedRef<T> {
      return computed(() => this.require<T>(key));
    },
    get<T>(key: readonly unknown[]): ResourceState<T> {
      const s = this.status.get(k(key)) ?? init();
      const d = this.data.get(k(key)) as T | undefined;
      switch (s.phase) {
        case 'success':
          return { status: 'success', inflight: s.inflight, data: d as T };
        case 'loading':
          return { status: 'loading', inflight: s.inflight };
        case 'idle':
          return { status: 'idle', inflight: s.inflight };
        case 'error':
          return { status: 'error', inflight: s.inflight, error: s.error } as ResourceState<T>;
      }
    },
    /**
     * Internal accessor: returns the value when in success state,
     * otherwise throws.
     */
    require<T>(key: readonly unknown[]): T {
      const r = this.get<T>(key);
      if (r.status !== 'success') {
        throw new Error(`Resource not ready: ${k(key)} (status=${r.status})`);
      }
      return r.data;
    },
    start(key: readonly unknown[]) {
      const cur = this.status.get(k(key)) ?? init();
      this.status.set(k(key), { phase: 'loading', inflight: cur.inflight + 1 });
    },
    set<T>(key: readonly unknown[], value: T) {
      this.data.set(k(key), value as unknown);
    },
    succeed(key: readonly unknown[]) {
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
