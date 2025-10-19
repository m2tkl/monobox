import { emitEvent as emitEvent_ } from '~/resource-state/infra/eventBus';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

export function useRouteWatcher() {
  const route = useRoute();

  watch(
    () => route.params.workspace,
    () => {
      const workspaceSlug = getEncodedWorkspaceSlugFromPath(route) || '';

      if (!workspaceSlug) return;

      emitEvent('workspace/switched', { workspaceSlug });
      emitEvent_('workspace/switched', { workspaceSlug });
    },
    { immediate: true },
  );

  watch(
    () => route.params.memo,
    () => {
      const workspaceSlug = getEncodedWorkspaceSlugFromPath(route) || '';
      const memoSlug = getEncodedMemoSlugFromPath(route);

      if (!workspaceSlug || !memoSlug) return;

      emitEvent('memo/switched', { workspaceSlug, memoSlug });
      emitEvent_('memo/switched', { workspaceSlug, memoSlug });
    },
    { immediate: true },
  );
}
