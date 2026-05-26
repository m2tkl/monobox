import { computed } from 'vue';

import { useRoute } from '#imports';
import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { workspaceQuery } from '~/resources/workspace/queries';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export function useTitleBarWorkspace() {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const memoTitleSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');

  const { snapshot: workspaceSnap } = useQuery(workspaceQuery, {
    workspaceSlug,
  });

  const workspace = computed(() => workspaceSnap.value.current ?? null);
  const workspaceReadModel = defineReadModel({
    data: computed(() => ({
      workspace: workspace.value,
    })),
    snapshots: [workspaceSnap],
  });
  const workspaceName = computed(() => workspaceReadModel.value.data.workspace?.name ?? '');

  return {
    route,
    workspaceSlug,
    memoTitleSlug,
    workspaceReadModel,
    workspaceName,
  };
}
