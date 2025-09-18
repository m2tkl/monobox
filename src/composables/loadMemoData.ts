import { useWorkspaceStore } from '~/stores/workspace';

export function loadMemoData(workspaceSlug: string, memoSlug: string) {
  const store = useWorkspaceStore();

  const loading = computed(() =>
    store.workspaceLoading || store.memoLoading,
  );

  const error = computed(() =>
    store.workspaceLoadingError || store.memoLoadingError,
  );

  const ready = (async () => {
    await Promise.all([
      store.loadWorkspace(workspaceSlug),
      store.loadMemo(workspaceSlug, memoSlug),
    ]);

    if (!store.workspace || !store.memo) {
      throw new Error('Invariant: expected data to be loaded');
    }

    return {
      workspace: store.workspace,
      memo: store.memo,
    };
  })();

  return {
    loading,
    error,
    ready,
  };
}
