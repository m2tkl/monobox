import { computed } from 'vue';

import { deriveViewModelFlags } from '../infra/types';
import { readCurrentWorkspaceSnapshot } from '../resources/workspace';

import type { Workspace } from '~/models/workspace';

export type CurrentWorkspaceViewModel = {
  data: {
    workspace: Workspace | null;
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useCurrentWorkspaceViewModel() {
  const snap = readCurrentWorkspaceSnapshot();

  const workspace = computed<Workspace | null>(() => snap.value.current ?? null);
  const flags = computed(() => deriveViewModelFlags(snap.value));

  return computed<CurrentWorkspaceViewModel>(() => ({
    data: { workspace: workspace.value },
    flags: flags.value,
  }));
}
