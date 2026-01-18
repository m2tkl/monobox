import { invokeCommand } from '../core/invoker';

import type { KanbanAssignmentEntry, KanbanAssignmentItem } from '~/models/kanbanAssignment';

export const kanbanAssignmentCommand = {
  listItems: async (params: { workspaceSlugName: string; kanbanId: number }) => {
    return await invokeCommand<KanbanAssignmentItem[]>('list_kanban_assignment_items', {
      workspace_slug_name: params.workspaceSlugName,
      kanban_id: params.kanbanId,
    });
  },

  listEntries: async (params: { workspaceSlugName: string; memoSlugTitle: string }) => {
    return await invokeCommand<KanbanAssignmentEntry[]>('list_kanban_assignment_entries', {
      workspace_slug_name: params.workspaceSlugName,
      memo_slug_title: params.memoSlugTitle,
    });
  },

  upsertStatus: async (params: {
    workspaceSlugName: string;
    memoSlugTitle: string;
    kanbanId: number;
    kanbanStatusId?: number | null;
    position?: number | null;
  }) => {
    await invokeCommand('upsert_kanban_assignment_status', {
      workspace_slug_name: params.workspaceSlugName,
      memo_slug_title: params.memoSlugTitle,
      kanban_id: params.kanbanId,
      kanban_status_id: params.kanbanStatusId ?? null,
      position: params.position ?? null,
    });
  },

  remove: async (params: { workspaceSlugName: string; memoSlugTitle: string; kanbanId: number }) => {
    await invokeCommand('remove_kanban_assignment', {
      workspace_slug_name: params.workspaceSlugName,
      memo_slug_title: params.memoSlugTitle,
      kanban_id: params.kanbanId,
    });
  },
};
