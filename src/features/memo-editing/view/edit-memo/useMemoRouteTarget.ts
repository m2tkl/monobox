import { computed } from 'vue';

import type { RouteLocationNormalizedLoaded } from 'vue-router';

import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

// Extract the memo-editing target identifiers from the current route.
export function useMemoRouteTarget(route: RouteLocationNormalizedLoaded) {
  const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
  const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');

  return {
    workspaceSlug,
    memoSlug,
  };
}
