export function useEventHandler() {
  const store = useWorkspaceStore();

  onEvent('app/init', () => store.loadWorkspaces());
  onEvent('workspace/switched', async ({ workspaceSlug }) => {
    store.exitWorkspace();
    await Promise.all([
      store.loadWorkspace(workspaceSlug),
      store.loadWorkspaceMemos(workspaceSlug),
      store.loadFavoriteMemos(workspaceSlug),
      store.loadBookmarks(workspaceSlug),
    ]);
  });
  onEvent('workspace/created', () => store.loadWorkspaces());
  onEvent('workspace/deleted', () => store.loadWorkspaces());
  onEvent('memo/switched', ({ workspaceSlug, memoSlug }) => {
    store.loadMemo(workspaceSlug, memoSlug);
    store.loadLinks(workspaceSlug, memoSlug);
  });
  onEvent('memo/updated', ({ workspaceSlug, memoSlug }) => {
    store.loadWorkspaceMemos(workspaceSlug);
    store.loadLinks(workspaceSlug, memoSlug);
    store.loadFavoriteMemos(workspaceSlug);
  });
  onEvent('memo/deleted', ({ workspaceSlug }) => {
    store.loadWorkspaceMemos(workspaceSlug);
    store.loadFavoriteMemos(workspaceSlug);
  });
  onEvent('bookmark/updated', ({ workspaceSlug }) => {
    store.loadBookmarks(workspaceSlug);
  });
}
