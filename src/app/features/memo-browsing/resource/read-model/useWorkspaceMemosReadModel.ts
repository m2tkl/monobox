import { computed } from 'vue';

import type { MemoIndexItem } from '~/models/memo';

import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceMemosQuery } from '~/resources/memo/queries';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export type WorkspaceMemosReadModel = {
  data: {
    items: MemoIndexItem[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useWorkspaceMemosReadModel() {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, {
    workspaceSlug,
  });

  const items = computed<MemoIndexItem[]>(() => memosSnap.value.current ?? []);
  return defineReadModel<WorkspaceMemosReadModel['data']>({
    data: computed(() => ({ items: items.value })),
    snapshots: [memosSnap],
  });
}
