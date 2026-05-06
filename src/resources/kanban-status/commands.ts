import { command as tauriCommand } from '~/external/tauri/command';

export const kanbanStatusCommand = {
  list: (workspace: { slugName: string; kanbanId?: number }) => tauriCommand.kanbanStatus.list(workspace),
  create: (params: { workspaceSlugName: string; kanbanId?: number; name: string; color?: string }) =>
    tauriCommand.kanbanStatus.create(params),
  update: (params: { workspaceSlugName: string; id: number; name: string; color?: string }) =>
    tauriCommand.kanbanStatus.update(params),
  updateOrders: (params: { workspaceSlugName: string; updates: { id: number; orderIndex: number }[] }) =>
    tauriCommand.kanbanStatus.updateOrders(params),
  delete: (params: { workspaceSlugName: string; id: number }) => tauriCommand.kanbanStatus.delete(params),
} as const;
