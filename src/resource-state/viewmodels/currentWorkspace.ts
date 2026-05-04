import { computed, toValue } from 'vue';

import { deriveViewModelFlags } from '../infra/types';

import type { MaybeRefOrGetter } from 'vue';
import type { Workspace } from '~/models/workspace';

import { useRoute } from '#imports';
import { workspaceQuery } from '~/app/features/workspace/queries/workspaceQuery';
import { useQuery } from '~/resource-state/useQuery';
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
