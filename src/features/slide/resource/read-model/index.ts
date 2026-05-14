import { computed } from 'vue';

import { useQuery } from '~/resource-runtime/useQuery';
import { memoDetailQuery } from '~/resources/memo/queries';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export function useSlideMemoReadModel() {
  const route = useRoute();

  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');

  const { snapshot: memoSnap } = useQuery(memoDetailQuery, {
    workspaceSlug,
    memoSlug,
  });

  return {
    workspaceSlug,
    memoSlug,
    memoSnap,
  };
}
