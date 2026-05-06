import { computed, toValue } from 'vue';

import { deriveViewModelFlags } from './infra/types';

import type { ResourceSnapshot } from './infra/types';
import type { ComputedRef, MaybeRefOrGetter } from 'vue';

export type ReadModelFlags = {
  isLoading: boolean;
  isStale: boolean;
  hasError: boolean;
};

export type ReadModel<TData> = {
  data: TData;
  flags: ReadModelFlags;
};

type SnapshotSource = MaybeRefOrGetter<ResourceSnapshot<unknown>>;

export function mergeReadModelFlags(...snapshotSources: SnapshotSource[]): ReadModelFlags {
  return snapshotSources.reduce<ReadModelFlags>((acc, snapshotSource) => {
    const flags = deriveViewModelFlags(toValue(snapshotSource));
    return {
      isLoading: acc.isLoading || flags.isLoading,
      isStale: acc.isStale || flags.isStale,
      hasError: acc.hasError || flags.hasError,
    };
  }, {
    isLoading: false,
    isStale: false,
    hasError: false,
  });
}

export function defineReadModel<TData>(options: {
  data: MaybeRefOrGetter<TData>;
  snapshots: SnapshotSource[];
}): Readonly<ComputedRef<ReadModel<TData>>> {
  const data = computed(() => toValue(options.data));
  const flags = computed(() => mergeReadModelFlags(...options.snapshots));

  return computed(() => ({
    data: data.value,
    flags: flags.value,
  }));
}
