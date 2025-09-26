export function useRouteWatcher() {
  const route = useRoute();

  watch(
    () => route.params.workspace,
    () => {
      const workspaceSlug = getEncodedWorkspaceSlugFromPath(route) || '';
      emitEvent('workspace/switched', { workspaceSlug });
    },
    { immediate: true },
  );

  watch(
    () => route.params.memo,
    () => {
      const workspaceSlug = getEncodedWorkspaceSlugFromPath(route) || '';
      const memoSlug = getEncodedMemoSlugFromPath(route) || '';

      emitEvent('memo/switched', { workspaceSlug, memoSlug });
    },
    { immediate: true },
  );
}
