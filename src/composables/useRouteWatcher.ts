export function useRouteWatcher() {
  const route = useRoute();

  watch(
    () => route.params.workspace,
    (workspaceSlug) => {
      if (typeof workspaceSlug === 'string') {
        emitEvent('workspace/switched', { workspaceSlug });
      }
    },
    { immediate: true },
  );

  watch(
    () => route.params.memo,
    (memoSlug) => {
      const workspaceSlug = route.params.workspace;

      if (
        typeof memoSlug === 'string'
        && typeof workspaceSlug === 'string'
      ) {
        emitEvent('memo/switched', { workspaceSlug, memoSlug });
      }
    },
    { immediate: true },
  );
}
