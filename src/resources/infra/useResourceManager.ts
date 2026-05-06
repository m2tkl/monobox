import { defineStore } from 'pinia';
import { computed, type ComputedRef } from 'vue';

import type { AsyncStatus, ResourceSnapshot, ResourceState } from './types';

const init = (): AsyncStatus => ({ phase: 'idle', inflight: 0 });
const keyOf = (key: readonly unknown[]) => JSON.stringify(key);

export const useResourceManager = defineStore('resourceManager', {
  state: () => ({
    data: new Map<string, unknown>(),
    status: new Map<string, AsyncStatus>(),
    updatedAt: new Map<string, number>(),
    loadingSince: new Map<string, number>(),
  }),
  actions: {
    select<T>(key: readonly unknown[]): ComputedRef<ResourceState<T>> {
      return computed(() => this.get<T>(key));
    },
    selectSnapshot<T>(key: readonly unknown[]): ComputedRef<ResourceSnapshot<T>> {
      return computed(() => this.getSnapshot<T>(key));
    },
    selectRequired<T>(key: readonly unknown[]): ComputedRef<T> {
      return computed(() => this.require<T>(key));
    },
    getSnapshot<T>(key: readonly unknown[]): ResourceSnapshot<T> {
      const cacheKey = keyOf(key);
      const status = this.status.get(cacheKey) ?? init();
      const current = (this.data.get(cacheKey) as T | undefined) ?? null;
      const updatedAt = this.updatedAt.get(cacheKey) ?? null;
      const loadingSince = this.loadingSince.get(cacheKey) ?? null;
      if (status.phase === 'error') {
        return { current, status: 'error', updatedAt, loadingSince, error: status.error };
      }
      return { current, status: status.phase, updatedAt, loadingSince };
    },
    get<T>(key: readonly unknown[]): ResourceState<T> {
      const status = this.status.get(keyOf(key)) ?? init();
      const data = this.data.get(keyOf(key)) as T | undefined;
      switch (status.phase) {
        case 'success':
          return { status: 'success', inflight: status.inflight, data: data as T };
        case 'loading':
          return { status: 'loading', inflight: status.inflight };
        case 'idle':
          return { status: 'idle', inflight: status.inflight };
        case 'error':
          return { status: 'error', inflight: status.inflight, error: status.error } as ResourceState<T>;
      }
    },
    require<T>(key: readonly unknown[]): T {
      const resource = this.get<T>(key);
      if (resource.status !== 'success') {
        throw new Error(`Resource not ready: ${keyOf(key)} (status=${resource.status})`);
      }
      return resource.data;
    },
    start(key: readonly unknown[]) {
      const cacheKey = keyOf(key);
      const current = this.status.get(cacheKey) ?? init();
      const nextInflight = current.inflight + 1;
      this.status.set(cacheKey, { phase: 'loading', inflight: nextInflight });
      if (nextInflight === 1) {
        this.loadingSince.set(cacheKey, Date.now());
      }
    },
    set<T>(key: readonly unknown[], value: T) {
      this.data.set(keyOf(key), value as unknown);
    },
    succeed(key: readonly unknown[]) {
      const cacheKey = keyOf(key);
      const current = this.status.get(cacheKey) ?? init();
      const nextInflight = Math.max(current.inflight - 1, 0);
      this.status.set(cacheKey, { phase: nextInflight > 0 ? 'loading' : 'success', inflight: nextInflight });
      if (nextInflight === 0) {
        this.loadingSince.delete(cacheKey);
      }
      this.updatedAt.set(cacheKey, Date.now());
    },
    fail(key: readonly unknown[], error: unknown) {
      const cacheKey = keyOf(key);
      const current = this.status.get(cacheKey) ?? init();
      const nextInflight = Math.max(current.inflight - 1, 0);
      this.status.set(cacheKey, { phase: nextInflight > 0 ? 'loading' : 'error', inflight: nextInflight, error });
      if (nextInflight === 0) {
        this.loadingSince.delete(cacheKey);
      }
    },
    clear(key: readonly unknown[]) {
      const cacheKey = keyOf(key);
      this.data.delete(cacheKey);
      this.status.delete(cacheKey);
      this.updatedAt.delete(cacheKey);
      this.loadingSince.delete(cacheKey);
    },
    clearAll() {
      this.data.clear();
      this.status.clear();
      this.updatedAt.clear();
      this.loadingSince.clear();
    },
  },
});
