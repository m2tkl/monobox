import { computed, toValue } from 'vue';

import { deriveViewModelFlags } from '../infra/types';

import type { ResourceSnapshot } from '../infra/types';
import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import type { KanbanStatus } from '~/models/kanbanStatus';

import { useRoute } from '#imports';
import { workspaceKanbanStatusesQuery } from '~/app/features/kanban/queries/workspaceKanbanStatusesQuery';
import { useQuery } from '~/resource-state/useQuery';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

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

export function useKanbanStatusCollectionViewModel(
  workspaceSlugArg: MaybeRefOrGetter<string> | undefined,
  kanbanId: ComputedRef<number | null>,
) {
  const route = useRoute();
  const workspaceSlug = computed(() => workspaceSlugArg != null
    ? toValue(workspaceSlugArg)
    : (getEncodedWorkspaceSlugFromPath(route) || ''));
  const { snapshot: querySnap } = useQuery(workspaceKanbanStatusesQuery, () => ({
    workspaceSlug: workspaceSlug.value,
    kanbanId: kanbanId.value ?? 0,
  }), {
    enabled: computed(() => workspaceSlug.value.length > 0 && kanbanId.value !== null),
  });

  const statusSnap = computed(() => {
    if (kanbanId.value === null) {
      return emptySnapshot;
    }
    return querySnap.value;
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
