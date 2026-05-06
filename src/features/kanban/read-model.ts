import { computed, toValue } from 'vue';

import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import type { Kanban } from '~/models/kanban';
import type { KanbanStatus } from '~/models/kanbanStatus';
import type { ResourceSnapshot } from '~/resource-runtime/infra/types';

import { useRoute } from '#imports';
import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceKanbansQuery } from '~/resources/kanban/queries';
import { workspaceKanbanStatusesQuery } from '~/resources/kanban-status/queries';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

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

export function useKanbanCollectionViewModel(workspaceSlugArg?: MaybeRefOrGetter<string>) {
  const route = useRoute();
  const workspaceSlug = computed(() => workspaceSlugArg != null
    ? toValue(workspaceSlugArg)
    : (getEncodedWorkspaceSlugFromPath(route) || ''));
  const { snapshot: snap } = useQuery(workspaceKanbansQuery, {
    workspaceSlug,
  });

  const items = computed<Kanban[]>(() => snap.value.current ?? []);
  return defineReadModel<KanbanCollectionViewModel['data']>({
    data: computed(() => ({ items: items.value })),
    snapshots: [snap],
  });
}

export function useKanbanStatusCollectionViewModel(
  workspaceSlugArg: MaybeRefOrGetter<string> | undefined,
  kanbanId: ComputedRef<number | null>,
) {
  const route = useRoute();
  const workspaceSlug = computed(() => workspaceSlugArg != null
    ? toValue(workspaceSlugArg)
    : (getEncodedWorkspaceSlugFromPath(route) || ''));
  const { snapshot: querySnap } = useQuery(workspaceKanbanStatusesQuery, {
    workspaceSlug,
    kanbanId: computed(() => kanbanId.value ?? 0),
  });

  const statusSnap = computed(() => {
    if (kanbanId.value === null) {
      return emptySnapshot;
    }
    return querySnap.value;
  });

  const items = computed<KanbanStatus[]>(() => statusSnap.value.current ?? []);
  return defineReadModel<KanbanStatusCollectionViewModel['data']>({
    data: computed(() => ({ items: items.value })),
    snapshots: [statusSnap],
  });
}
