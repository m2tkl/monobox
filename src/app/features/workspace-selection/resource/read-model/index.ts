import { computed } from 'vue';

import type { Workspace } from '~/models/workspace';

import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceCollectionQuery } from '~/resources/workspace/queries';

export type WorkspacesReadModel = {
  data: {
    items: Workspace[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useWorkspacesReadModel() {
  const { snapshot: workspacesSnap } = useQuery(workspaceCollectionQuery, {});

  const items = computed<Workspace[]>(() => workspacesSnap.value.current ?? []);
  return defineReadModel<WorkspacesReadModel['data']>({
    data: computed(() => ({ items: items.value })),
    snapshots: [workspacesSnap],
  });
}
