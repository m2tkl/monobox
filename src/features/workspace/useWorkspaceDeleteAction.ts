import { command } from '~/resources/command';
import { emitEvent } from '~/resources/infra/eventBus';

export function useWorkspaceDeleteAction() {
  const deleteWorkspace = async (slugName: string) => {
    await command.workspace.delete({ slugName });
    emitEvent('workspace/deleted', {});
  };

  return {
    deleteWorkspace,
  };
}
