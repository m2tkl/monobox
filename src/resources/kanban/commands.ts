import { command as tauriCommand } from '~/external/tauri/command';

export const kanbanCommand = {
  list: (workspace: { slugName: string }) => tauriCommand.kanban.list(workspace),
  create: (params: { workspaceSlugName: string; name: string }) => tauriCommand.kanban.create(params),
  delete: (params: { workspaceSlugName: string; id: number }) => tauriCommand.kanban.delete(params),
} as const;
