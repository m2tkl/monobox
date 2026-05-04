import { computed, toValue } from 'vue';

import { deriveViewModelFlags } from '../infra/types';

import type { MaybeRefOrGetter } from 'vue';
import type { Kanban } from '~/models/kanban';

import { useRoute } from '#imports';
import { workspaceKanbansQuery } from '~/app/features/kanban/queries/workspaceKanbansQuery';
import { useQuery } from '~/resource-state/useQuery';
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

export function useKanbanCollectionViewModel(workspaceSlugArg?: MaybeRefOrGetter<string>) {
  const route = useRoute();
  const workspaceSlug = computed(() => workspaceSlugArg != null
    ? toValue(workspaceSlugArg)
    : (getEncodedWorkspaceSlugFromPath(route) || ''));
  const { snapshot: snap } = useQuery(workspaceKanbansQuery, () => ({
    workspaceSlug: workspaceSlug.value,
  }), {
    enabled: computed(() => workspaceSlug.value.length > 0),
  });

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
