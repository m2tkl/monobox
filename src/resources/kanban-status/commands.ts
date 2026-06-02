import { command as tauriCommand } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

export const kanbanStatusCommand = {
  list: (workspace: { slugName: string; kanbanId?: number }) => tauriCommand.kanbanStatus.list(workspace),
  create: async (params: { workspaceSlugName: string; kanbanId: number; name: string; color?: string }) => {
    const created = await tauriCommand.kanbanStatus.create(params);
    void publishResourceChanges([
      changeRefs.kanbanStatusCollectionChanged(params.workspaceSlugName, params.kanbanId),
    ]);
    return created;
  },
  update: async (params: { workspaceSlugName: string; kanbanId: number; id: number; name: string; color?: string }) => {
    await tauriCommand.kanbanStatus.update(params);
    void publishResourceChanges([
      changeRefs.kanbanStatusCollectionChanged(params.workspaceSlugName, params.kanbanId),
    ]);
  },
  updateOrders: async (params: { workspaceSlugName: string; kanbanId: number; updates: { id: number; orderIndex: number }[] }) => {
    await tauriCommand.kanbanStatus.updateOrders(params);
    void publishResourceChanges([
      changeRefs.kanbanStatusCollectionChanged(params.workspaceSlugName, params.kanbanId),
    ]);
  },
  delete: async (params: { workspaceSlugName: string; kanbanId: number; id: number }) => {
    await tauriCommand.kanbanStatus.delete(params);
    void publishResourceChanges([
      changeRefs.kanbanCollectionChanged(params.workspaceSlugName),
      changeRefs.kanbanStatusCollectionChanged(params.workspaceSlugName, params.kanbanId),
    ]);
  },
} as const;
