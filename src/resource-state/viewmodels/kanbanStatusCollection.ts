import { computed } from 'vue';

import { deriveViewModelFlags } from '../infra/types';
import { readKanbanStatusCollectionSnapshot } from '../resources/kanbanStatusCollection';

import type { ResourceSnapshot } from '../infra/types';
import type { ComputedRef } from 'vue';
import type { KanbanStatus } from '~/models/kanbanStatus';

export type KanbanStatusCollectionViewModel = {
  data: {
    items: KanbanStatus[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

const emptySnapshot: ResourceSnapshot<KanbanStatus[]> = {
  current: [],
  status: 'idle',
  updatedAt: null,
  loadingSince: null,
};

export function useKanbanStatusCollectionViewModel(kanbanId: ComputedRef<number | null>) {
  const statusSnap = computed(() => {
    if (kanbanId.value === null) {
      return emptySnapshot;
    }
    return readKanbanStatusCollectionSnapshot(kanbanId.value).value;
  });

  const items = computed<KanbanStatus[]>(() => statusSnap.value.current ?? []);

  const flags = computed(() => {
    const f = deriveViewModelFlags(statusSnap.value);
    return { ...f };
  });

  const vm = computed<KanbanStatusCollectionViewModel>(() => ({
    data: { items: items.value },
    flags: {
      isLoading: flags.value.isLoading,
      isStale: flags.value.isStale,
      hasError: flags.value.hasError,
    },
  }));

  return vm;
}
