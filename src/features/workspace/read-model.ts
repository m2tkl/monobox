import { computed, toValue } from 'vue';

import type { MaybeRefOrGetter } from 'vue';
import type { Workspace } from '~/models/workspace';

import { useRoute } from '#imports';
import { deriveViewModelFlags } from '~/resources/infra/types';
import { useQuery } from '~/resources/useQuery';
import { workspaceCollectionQuery, workspaceQuery } from '~/resources/workspace/queries';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

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

export function useCurrentWorkspaceViewModel(workspaceSlugArg?: MaybeRefOrGetter<string>) {
  const route = useRoute();
  const workspaceSlug = computed(() =>
    workspaceSlugArg != null
      ? toValue(workspaceSlugArg)
      : (getEncodedWorkspaceSlugFromPath(route) || ''));
  const { snapshot: snap } = useQuery(workspaceQuery, () => ({
    workspaceSlug: workspaceSlug.value,
  }), {
    enabled: computed(() => workspaceSlug.value.length > 0),
  });

  const workspace = computed<Workspace | null>(() => snap.value.current ?? null);
  const flags = computed(() => deriveViewModelFlags(snap.value));

  return computed<CurrentWorkspaceViewModel>(() => ({
    data: { workspace: workspace.value },
    flags: flags.value,
  }));
}

export function useWorkspacesViewModel() {
  const { snapshot: workspacesSnap } = useQuery(workspaceCollectionQuery, () => ({}));

  const items = computed<Workspace[]>(() => workspacesSnap.value.current ?? []);
  const flags = computed(() => deriveViewModelFlags(workspacesSnap.value));

  return computed<WorkspacesViewModel>(() => ({
    data: { items: items.value },
    flags: flags.value,
  }));
}
