import { emitEvent } from '~/resource-state/infra/eventBus';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath, isNewMemoRoute } from '~/utils/route';

export function startRouteWatcher() {
  const route = useRoute();

  watch(
    () => route.params.workspace,
    () => {
      const workspaceSlug = getEncodedWorkspaceSlugFromPath(route) || '';

      if (!workspaceSlug) return;

      emitEvent('workspace/switched', { workspaceSlug });
    },
    { immediate: true },
  );

  watch(
    () => route.params.memo,
    () => {
      const workspaceSlug = getEncodedWorkspaceSlugFromPath(route) || '';
      const memoSlug = getEncodedMemoSlugFromPath(route);

      if (isNewMemoRoute(route)) return;
      if (!workspaceSlug || !memoSlug) return;

      emitEvent('memo/switched', { workspaceSlug, memoSlug });
    },
    { immediate: true },
  );
}
