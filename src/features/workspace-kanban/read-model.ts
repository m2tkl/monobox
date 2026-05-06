import { computed } from 'vue';

import type { ComputedRef } from 'vue';
import type { Kanban } from '~/models/kanban';
import type { KanbanStatus } from '~/models/kanbanStatus';
import type { ResourceSnapshot } from '~/resource-runtime/infra/types';

import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceKanbansQuery } from '~/resources/kanban/queries';
import { workspaceKanbanStatusesQuery } from '~/resources/kanban-status/queries';

export type WorkspaceKanbanCollectionReadModel = {
  data: {
    items: Kanban[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export type WorkspaceKanbanStatusCollectionReadModel = {
  data: {
    items: KanbanStatus[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

const emptyStatusSnapshot: ResourceSnapshot<KanbanStatus[]> = {
  current: [],
  status: 'idle',
  updatedAt: null,
  loadingSince: null,
};

export function useWorkspaceKanbanCollectionReadModel(workspaceSlug: ComputedRef<string>) {
  const { snapshot } = useQuery(workspaceKanbansQuery, {
    workspaceSlug,
  });

  const items = computed<Kanban[]>(() => snapshot.value.current ?? []);

  return defineReadModel<WorkspaceKanbanCollectionReadModel['data']>({
    data: computed(() => ({ items: items.value })),
    snapshots: [snapshot],
  });
}

export function useWorkspaceKanbanStatusCollectionReadModel(
  workspaceSlug: ComputedRef<string>,
  kanbanId: ComputedRef<number | null>,
) {
  const { snapshot: querySnapshot } = useQuery(workspaceKanbanStatusesQuery, {
    workspaceSlug,
    kanbanId: computed(() => kanbanId.value ?? 0),
  });

  const statusSnapshot = computed(() => {
    if (kanbanId.value === null) {
      return emptyStatusSnapshot;
    }
    return querySnapshot.value;
  });

  const items = computed<KanbanStatus[]>(() => statusSnapshot.value.current ?? []);

  return defineReadModel<WorkspaceKanbanStatusCollectionReadModel['data']>({
    data: computed(() => ({ items: items.value })),
    snapshots: [statusSnapshot],
  });
}
