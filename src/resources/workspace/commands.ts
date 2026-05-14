import { command as tauriCommand } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

export const workspaceCommand = {
  list: () => tauriCommand.workspace.list(),
  get: (workspace: { slugName: string }) => tauriCommand.workspace.get(workspace),
  create: async (workspace: { name: string }) => {
    const created = await tauriCommand.workspace.create(workspace);
    void publishResourceChanges([changeRefs.workspaceCollectionChanged()]);
    return created;
  },
  delete: async (workspace: { slugName: string }) => {
    await tauriCommand.workspace.delete(workspace);
    void publishResourceChanges([changeRefs.workspaceCollectionChanged()]);
  },
} as const;
