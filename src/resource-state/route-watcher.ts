import { useRoute, watch } from '#imports';
import { emitEvent } from '~/resource-state/infra/eventBus';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

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
}
