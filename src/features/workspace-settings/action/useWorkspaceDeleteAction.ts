import { emitEvent } from '~/resource-runtime/infra/eventBus';
import { command } from '~/resources/command';

export function useWorkspaceDeleteAction() {
  const deleteWorkspace = async (slugName: string) => {
    await command.workspace.delete({ slugName });
    emitEvent('workspace/deleted', {});
  };

  return {
    deleteWorkspace,
  };
}
