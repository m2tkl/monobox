import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { command } from '~/resources/command';
import { changeRefs } from '~/resources/changes';

export async function deleteWorkspace(slugName: string) {
  await command.workspace.delete({ slugName });
  void publishResourceChanges([
    changeRefs.workspaceCollectionChanged(),
  ]);
}
