import { command as tauriCommand } from '~/external/tauri/command';

export const workspaceCommand = {
  list: () => tauriCommand.workspace.list(),
  get: (workspace: { slugName: string }) => tauriCommand.workspace.get(workspace),
  create: (workspace: { name: string }) => tauriCommand.workspace.create(workspace),
  delete: (workspace: { slugName: string }) => tauriCommand.workspace.delete(workspace),
} as const;
