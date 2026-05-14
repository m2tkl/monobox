import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { command } from '~/resources/command';
import { changeRefs } from '~/resources/changes';

type CreateWorkspaceInput = {
  name: string;
};

export async function createWorkspace(input: CreateWorkspaceInput) {
  const workspace = await command.workspace.create(input);
  void publishResourceChanges([
    changeRefs.workspaceCollectionChanged(),
  ]);
  return workspace;
}
