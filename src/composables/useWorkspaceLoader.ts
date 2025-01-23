export const useWorkspaceLoader = () => {
  const store = useWorkspaceStore();

  const loadWorkspace = async (workspaceSlug: string) => {
    await Promise.all([
      store.loadWorkspace(workspaceSlug),
      store.loadWorkspaceMemos(workspaceSlug),
    ]);
  };

  const loadMemo = async (workspaceSlug: string, memoSlug: string) => {
    await Promise.all([
      store.loadWorkspace(workspaceSlug),
      store.loadMemo(workspaceSlug, memoSlug),
      store.loadLinks(workspaceSlug, memoSlug),
    ]);
  };

  return {
    store,

    loadWorkspace,
    loadMemo,
  };
};
