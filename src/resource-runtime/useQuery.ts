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

export function useQuery<Args, Data>(
  query: DefinedQuery<Args, Data>,
  args: MaybeRefOrGetter<Args>,
  options: UseQueryOptions = {},
): {
    snapshot: Readonly<ComputedRef<ResourceSnapshot<Data>>>;
    refetch: () => Promise<Data>;
  } {
  const resourceManager = useResourceManager();
  const isEnabled = computed(() => toValue(options.enabled) ?? true);
  const resolvedArgs = computed(() => toValue(args));
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
