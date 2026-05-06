import { computed, onScopeDispose, toValue, watch } from 'vue';

import { useResourceManager } from './infra/useResourceManager';
import { registerActiveQuery } from './query-runtime';

import type { ResourceSnapshot } from './infra/types';
import type { DefinedQuery } from './query';
import type { ComputedRef, MaybeRefOrGetter } from 'vue';

type UseQueryOptions = {
  immediate?: boolean;
  enabled?: MaybeRefOrGetter<boolean>;
};

type DeepMaybeRefOrGetter<T> =
  T extends (...args: never[]) => unknown ? T
    : T extends readonly (infer U)[] ? ReadonlyArray<DeepMaybeRefOrGetter<U>>
      : T extends object ? { [K in keyof T]: DeepMaybeRefOrGetter<T[K]> | MaybeRefOrGetter<T[K]> }
        : MaybeRefOrGetter<T>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function resolveQueryArgs<T>(value: DeepMaybeRefOrGetter<T> | MaybeRefOrGetter<T>): T {
  const resolved = toValue(value as MaybeRefOrGetter<T>);

  if (Array.isArray(resolved)) {
    return resolved.map(item => resolveQueryArgs(item)) as T;
  }

  if (isPlainObject(resolved)) {
    const entries = Object.entries(resolved).map(([key, entryValue]) => [key, resolveQueryArgs(entryValue)]);
    return Object.fromEntries(entries) as T;
  }

  return resolved;
}

export function useQuery<Args, Data>(
  query: DefinedQuery<Args, Data>,
  args: DeepMaybeRefOrGetter<Args> | MaybeRefOrGetter<Args>,
  options: UseQueryOptions = {},
): {
    snapshot: Readonly<ComputedRef<ResourceSnapshot<Data>>>;
    refetch: () => Promise<Data>;
  } {
  const resourceManager = useResourceManager();
  const resolvedArgs = computed(() => resolveQueryArgs(args));
  const isEnabled = computed(() => {
    const byQuery = query.when?.(resolvedArgs.value) ?? true;
    const byOption = toValue(options.enabled) ?? true;
    return byQuery && byOption;
  });
  const serializedKey = computed(() => JSON.stringify(query.key(resolvedArgs.value)));
  const snapshot = computed(() => resourceManager.getSnapshot<Data>(query.key(resolvedArgs.value)));

  let unsubscribeDeps: Array<() => void> = [];

  const cleanupDeps = () => {
    unsubscribeDeps.forEach(off => off());
    unsubscribeDeps = [];
  };

  const refetch = () => query.fetch(resolvedArgs.value);

  watch([serializedKey, isEnabled], () => {
    cleanupDeps();
    if (!isEnabled.value) {
      return;
    }

    const currentArgs = resolvedArgs.value;
    unsubscribeDeps = (query.dependencies ?? []).map(dep =>
      registerActiveQuery({
        event: dep.event,
        matches: payload => (dep.match as (payload: unknown, args: Args) => boolean)(
          payload,
          currentArgs,
        ),
        refetch: () => query.fetch(currentArgs),
      }),
    );
  }, { immediate: true });

  watch([serializedKey, isEnabled], async ([, enabled], previous) => {
    if (!enabled) {
      return;
    }

    const shouldFetchImmediately = options.immediate !== false;
    const previousEnabled = previous?.[1];
    if (!shouldFetchImmediately && previousEnabled !== false) {
      return;
    }

    await refetch();
  }, { immediate: true });

  onScopeDispose(() => {
    cleanupDeps();
  });

  return {
    snapshot,
    refetch,
  };
}
