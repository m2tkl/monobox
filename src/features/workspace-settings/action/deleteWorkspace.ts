import { emitEvent } from '~/resource-runtime/infra/eventBus';
import { command } from '~/resources/command';

export async function deleteWorkspace(slugName: string) {
  await command.workspace.delete({ slugName });
  emitEvent('workspace/deleted', {});
}
