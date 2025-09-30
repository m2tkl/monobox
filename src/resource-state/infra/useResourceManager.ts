import { defineStore } from 'pinia';
import { computed, type ComputedRef } from 'vue';

import type { AsyncStatus, ResourceSnapshot, ResourceState } from './types';

const init = (): AsyncStatus => ({ phase: 'idle', inflight: 0 });
const k = (key: readonly unknown[]) => JSON.stringify(key);

export const useResourceManager = defineStore('resourceManager', {
  state: () => ({
    data: new Map<string, unknown>(),
    status: new Map<string, AsyncStatus>(),
    // timestamps
    updatedAt: new Map<string, number>(),
    loadingSince: new Map<string, number>(),
  }),
  actions: {
    select<T>(key: readonly unknown[]): ComputedRef<ResourceState<T>> {
      return computed(() => this.get<T>(key));
    },
    /** Enriched snapshot accessor (retains last successful data and timestamps). */
    selectSnapshot<T>(key: readonly unknown[]): ComputedRef<ResourceSnapshot<T>> {
      return computed(() => this.getSnapshot<T>(key));
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
    /**
     * Snapshot accessor that returns last known successful value as `current`,
     * regardless of current phase, along with timestamps.
     */
    getSnapshot<T>(key: readonly unknown[]): ResourceSnapshot<T> {
      const kk = k(key);
      const s = this.status.get(kk) ?? init();
      const current = (this.data.get(kk) as T | undefined) ?? null;
      const updatedAt = this.updatedAt.get(kk) ?? null;
      const loadingSince = this.loadingSince.get(kk) ?? null;
      if (s.phase === 'error') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err: unknown = (s as any).error;
        return { current, status: 'error', updatedAt, loadingSince, error: err };
      }
      return { current, status: s.phase, updatedAt, loadingSince };
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
      const kk = k(key);
      const cur = this.status.get(kk) ?? init();
      const nextInflight = cur.inflight + 1;
      this.status.set(kk, { phase: 'loading', inflight: nextInflight });
      if (nextInflight === 1) {
        this.loadingSince.set(kk, Date.now());
      }
    },
    set<T>(key: readonly unknown[], value: T) {
      const kk = k(key);
      this.data.set(kk, value as unknown);
      // Do not update timestamps here; updatedAt is set on succeed.
    },
    succeed(key: readonly unknown[]) {
      const kk = k(key);
      const cur = this.status.get(kk) ?? init();
      const n = Math.max(cur.inflight - 1, 0);
      this.status.set(kk, { phase: n > 0 ? 'loading' : 'success', inflight: n });
      if (n === 0) {
        this.loadingSince.delete(kk);
      }
      // Mark the time when latest successful value is ready
      this.updatedAt.set(kk, Date.now());
    },
    fail(key: readonly unknown[], err: unknown) {
      const kk = k(key);
      const cur = this.status.get(kk) ?? init();
      const n = Math.max(cur.inflight - 1, 0);
      this.status.set(kk, { phase: n > 0 ? 'loading' : 'error', inflight: n, error: err });
      if (n === 0) {
        this.loadingSince.delete(kk);
      }
      // Keep updatedAt as last success; do not modify on error
    },
    clear(key: readonly unknown[]) {
      const kk = k(key);
      this.data.delete(kk);
      this.status.delete(kk);
      this.updatedAt.delete(kk);
      this.loadingSince.delete(kk);
    },
    clearAll() {
      this.data.clear();
      this.status.clear();
      this.updatedAt.clear();
      this.loadingSince.clear();
    },
  },
});
