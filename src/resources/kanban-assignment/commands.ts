import { command as tauriCommand } from '~/external/tauri/command';

export const kanbanAssignmentCommand = {
  listItems: (params: { workspaceSlugName: string; kanbanId: number }) => tauriCommand.kanbanAssignment.listItems(params),
  listEntries: (params: { workspaceSlugName: string; memoSlugTitle: string }) =>
    tauriCommand.kanbanAssignment.listEntries(params),
  upsertStatus: (params: {
    workspaceSlugName: string;
    memoSlugTitle: string;
    kanbanId: number;
    kanbanStatusId?: number | null;
    position?: number | null;
  }) => tauriCommand.kanbanAssignment.upsertStatus(params),
  remove: (params: { workspaceSlugName: string; memoSlugTitle: string; kanbanId: number }) =>
    tauriCommand.kanbanAssignment.remove(params),
} as const;
