import { computed } from 'vue';

import type { ComputedRef } from 'vue';
import type { Kanban } from '~/models/kanban';

import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceKanbansQuery } from '~/resources/kanban/queries';

export type MemoEditingKanbanCollectionReadModel = {
  data: {
    items: Kanban[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useMemoEditingKanbanCollectionReadModel(workspaceSlug: ComputedRef<string>) {
  const { snapshot } = useQuery(workspaceKanbansQuery, {
    workspaceSlug,
  });

  const items = computed<Kanban[]>(() => snapshot.value.current ?? []);

  return defineReadModel<MemoEditingKanbanCollectionReadModel['data']>({
    data: computed(() => ({ items: items.value })),
    snapshots: [snapshot],
  });
}
