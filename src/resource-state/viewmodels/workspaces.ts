import { computed } from 'vue';

import { deriveViewModelFlags } from '../infra/types';

import type { Workspace } from '~/models/workspace';

import { workspaceCollectionQuery } from '~/app/features/workspace/queries/workspaceCollectionQuery';
import { useQuery } from '~/resource-state/useQuery';

export type WorkspacesViewModel = {
  data: {
    items: Workspace[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useWorkspacesViewModel() {
  const { snapshot: workspacesSnap } = useQuery(workspaceCollectionQuery, () => ({}));

  const items = computed<Workspace[]>(() => workspacesSnap.value.current ?? []);

  const flags = computed(() => {
    const f = deriveViewModelFlags(workspacesSnap.value);
    return { ...f };
  });

  const vm = computed<WorkspacesViewModel>(() => ({
    data: { items: items.value },
    flags: {
      isLoading: flags.value.isLoading,
      isStale: flags.value.isStale,
      hasError: flags.value.hasError,
    },
  }));

  return vm;
}
