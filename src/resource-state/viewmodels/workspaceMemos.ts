import { computed } from 'vue';

import { deriveViewModelFlags } from '../infra/types';

import type { MemoIndexItem } from '~/models/memo';

import { useRoute } from '#imports';
import { workspaceMemosQuery } from '~/app/features/memo/query/workspaceMemosQuery';
import { useQuery } from '~/resource-state/useQuery';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export type WorkspaceMemosViewModel = {
  data: {
    items: MemoIndexItem[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export function useWorkspaceMemosViewModel() {
  const route = useRoute();
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, () => ({
    workspaceSlug: workspaceSlug.value,
  }), {
    enabled: computed(() => workspaceSlug.value.length > 0),
  });

  const items = computed<MemoIndexItem[]>(() => memosSnap.value.current ?? []);

  const flags = computed(() => {
    const f = deriveViewModelFlags(memosSnap.value);
    return { ...f };
  });

  const vm = computed<WorkspaceMemosViewModel>(() => ({
    data: { items: items.value },
    flags: {
      isLoading: flags.value.isLoading,
      isStale: flags.value.isStale,
      hasError: flags.value.hasError,
    },
  }));

  return vm;
}
