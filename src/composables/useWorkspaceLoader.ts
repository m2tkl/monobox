export const useWorkspaceLoader = () => {
  const store = useWorkspaceStore();

  const loadWorkspace = async (workspaceSlug: string) => {
    await Promise.all([
      store.loadWorkspace(workspaceSlug),
      store.loadWorkspaceMemos(workspaceSlug),
      store.loadFavoriteMemos(workspaceSlug),
    ]);
  };

  const loadMemo = async (workspaceSlug: string, memoSlug: string) => {
    const [workspaceResult, memoResult, linksResult] = await Promise.all([
      store.loadWorkspace(workspaceSlug),
      store.loadMemo(workspaceSlug, memoSlug),
      store.loadLinks(workspaceSlug, memoSlug),
    ]);

    const allOk = workspaceResult.ok && memoResult.ok && linksResult.ok;

    if (allOk) {
      return {
        ok: true,
        data: {
          workspace: workspaceResult.data,
          memo: memoResult.data,
          links: linksResult.data,
        },
      } as const;
    }
    else {
      return {
        ok: false,
      } as const;
    }
  };

  return {
    store,

    loadWorkspace,
    loadMemo,
  };
};
