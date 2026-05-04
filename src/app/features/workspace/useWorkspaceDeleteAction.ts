import { command } from '~/external/tauri/command';
import { emitEvent } from '~/resource-state/infra/eventBus';

export function useWorkspaceDeleteAction() {
  const deleteWorkspace = async (slugName: string) => {
    await command.workspace.delete({ slugName });
    emitEvent('workspace/deleted', {});
  };

  return {
    deleteWorkspace,
  };
}
