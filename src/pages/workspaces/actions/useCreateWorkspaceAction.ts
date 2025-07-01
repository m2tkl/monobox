export function useCreateWorkspaceAction() {
  const command = useCommand();

  const { runTask: execute, isLoading, error } = useAsyncTask(async (data: { name: string }) => {
    return await command.workspace.create(data);
  });

  return { execute, isLoading, error };
}
