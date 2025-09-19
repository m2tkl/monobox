import { computed } from 'vue';

import { deriveViewModelFlags } from '../infra/types';
import { readWorkspaceCollectionSnapshot } from '../resources/workspaceCollection';

import type { Workspace } from '~/models/workspace';

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
  const workspacesSnap = readWorkspaceCollectionSnapshot();

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
