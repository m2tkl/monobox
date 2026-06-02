import { command as tauriCommand } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

export const kanbanCommand = {
  list: (workspace: { slugName: string }) => tauriCommand.kanban.list(workspace),
  create: async (params: { workspaceSlugName: string; name: string }) => {
    const created = await tauriCommand.kanban.create(params);
    void publishResourceChanges([changeRefs.kanbanCollectionChanged(params.workspaceSlugName)]);
    return created;
  },
  updateStatusRoles: async (params: { workspaceSlugName: string; id: number; defaultStatusId?: number | null; focusStatusId?: number | null }) => {
    await tauriCommand.kanban.updateStatusRoles(params);
    void publishResourceChanges([changeRefs.kanbanCollectionChanged(params.workspaceSlugName)]);
  },
  delete: async (params: { workspaceSlugName: string; id: number }) => {
    await tauriCommand.kanban.delete(params);
    void publishResourceChanges([changeRefs.kanbanCollectionChanged(params.workspaceSlugName)]);
  },
} as const;
