import { computed, toValue } from 'vue';

import type { MaybeRefOrGetter } from 'vue';
import type { Workspace } from '~/models/workspace';

import { useRoute } from '#imports';
import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceCollectionQuery, workspaceQuery } from '~/resources/workspace/queries';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export type CurrentWorkspaceReadModel = {
  data: {
    workspace: Workspace | null;
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

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

export function useCurrentWorkspaceReadModel(workspaceSlugArg?: MaybeRefOrGetter<string>) {
  const route = useRoute();
  const workspaceSlug = computed(() =>
    workspaceSlugArg != null
      ? toValue(workspaceSlugArg)
      : (getEncodedWorkspaceSlugFromPath(route) || ''));
  const { snapshot: snap } = useQuery(workspaceQuery, {
    workspaceSlug,
  });

  const workspace = computed<Workspace | null>(() => snap.value.current ?? null);
  return defineReadModel<CurrentWorkspaceReadModel['data']>({
    data: computed(() => ({ workspace: workspace.value })),
    snapshots: [snap],
  });
}

export function useWorkspacesReadModel() {
  const { snapshot: workspacesSnap } = useQuery(workspaceCollectionQuery, () => ({}));

  const items = computed<Workspace[]>(() => workspacesSnap.value.current ?? []);
  return defineReadModel<WorkspacesReadModel['data']>({
    data: computed(() => ({ items: items.value })),
    snapshots: [workspacesSnap],
  });
}
