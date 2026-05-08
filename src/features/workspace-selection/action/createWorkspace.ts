import { emitEvent } from '~/resource-runtime/infra/eventBus';
import { command } from '~/resources/command';

type CreateWorkspaceInput = {
  name: string;
};

export async function createWorkspace(input: CreateWorkspaceInput) {
  const workspace = await command.workspace.create(input);
  emitEvent('workspace/created', {});
  return workspace;
}
