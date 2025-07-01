export function useWorkspacesLoader() {
  const store = useWorkspaceStore();

  const { workspaces } = storeToRefs(store);

  return {
    workspaces,
  };
}
