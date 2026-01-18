import { computed } from 'vue';

import { deriveViewModelFlags } from '../infra/types';
import { readKanbanCollectionSnapshot } from '../resources/kanbanCollection';

import type { Kanban } from '~/models/kanban';

export type KanbanCollectionViewModel = {
  data: {
    items: Kanban[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useKanbanCollectionViewModel() {
  const snap = readKanbanCollectionSnapshot();

  const items = computed<Kanban[]>(() => snap.value.current ?? []);

  const flags = computed(() => {
    const f = deriveViewModelFlags(snap.value);
    return { ...f };
  });

  const vm = computed<KanbanCollectionViewModel>(() => ({
    data: { items: items.value },
    flags: {
      isLoading: flags.value.isLoading,
      isStale: flags.value.isStale,
      hasError: flags.value.hasError,
    },
  }));

  return vm;
}
