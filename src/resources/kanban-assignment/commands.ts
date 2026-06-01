import { command as tauriCommand } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

export const kanbanAssignmentCommand = {
  listItems: (params: { workspaceSlugName: string; kanbanId: number }) => tauriCommand.kanbanAssignment.listItems(params),
  listEntries: (params: { workspaceSlugName: string; memoSlugTitle: string }) =>
    tauriCommand.kanbanAssignment.listEntries(params),
  upsertStatus: async (params: {
    workspaceSlugName: string;
    memoSlugTitle: string;
    kanbanId: number;
    kanbanStatusId?: number | null;
    position?: number | null;
  }) => {
    await tauriCommand.kanbanAssignment.upsertStatus(params);
    void publishResourceChanges([
      changeRefs.kanbanEntryCollectionChanged(params.workspaceSlugName, params.memoSlugTitle),
      changeRefs.kanbanAssignmentCollectionChanged(params.workspaceSlugName, params.kanbanId),
    ]);
  },
  remove: async (params: { workspaceSlugName: string; memoSlugTitle: string; kanbanId: number }) => {
    await tauriCommand.kanbanAssignment.remove(params);
    void publishResourceChanges([
      changeRefs.kanbanEntryCollectionChanged(params.workspaceSlugName, params.memoSlugTitle),
      changeRefs.kanbanAssignmentCollectionChanged(params.workspaceSlugName, params.kanbanId),
    ]);
  },
} as const;
