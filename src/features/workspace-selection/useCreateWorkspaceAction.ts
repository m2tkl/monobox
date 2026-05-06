import { emitEvent } from '~/resource-runtime/infra/eventBus';
import { command } from '~/resources/command';

export function useCreateWorkspaceAction() {
  const { runTask: execute, isLoading, error } = useAsyncTask(async (data: { name: string }) => {
    const workspace = await command.workspace.create(data);
    emitEvent('workspace/created', {});
    return workspace;
  });

  return { execute, isLoading, error };
}
