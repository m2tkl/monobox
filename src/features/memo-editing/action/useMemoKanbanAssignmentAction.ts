import type { KanbanAssignmentEntry } from '~/models/kanbanAssignment';
import type { KanbanStatus } from '~/models/kanbanStatus';

import { emitEvent } from '~/resource-runtime/infra/eventBus';
import { command } from '~/resources/command';
import { workspaceKanbanStatusesQuery } from '~/resources/kanban-status/queries';

type MemoKanbanTarget = {
  workspaceSlug: string;
  memoSlug: string;
};

type UpsertMemoKanbanStatusInput = MemoKanbanTarget & {
  kanbanId: number;
  kanbanStatusId: number;
};

type RemoveMemoKanbanStatusInput = MemoKanbanTarget & {
  kanbanId: number;
};

export function useMemoKanbanAssignmentAction() {
  const loadEntries = async (target: MemoKanbanTarget): Promise<KanbanAssignmentEntry[]> => {
    return command.kanbanAssignment.listEntries({
      workspaceSlugName: target.workspaceSlug,
      memoSlugTitle: target.memoSlug,
    });
  };

  const loadStatuses = async (
    workspaceSlug: string,
    kanbanId: number,
  ): Promise<KanbanStatus[]> => {
    return workspaceKanbanStatusesQuery.fetch({ workspaceSlug, kanbanId });
  };

  const removeStatus = async (input: RemoveMemoKanbanStatusInput) => {
    await command.kanbanAssignment.remove({
      workspaceSlugName: input.workspaceSlug,
      memoSlugTitle: input.memoSlug,
      kanbanId: input.kanbanId,
    });
    emitEvent('kanban-assignment/updated', {
      workspaceSlug: input.workspaceSlug,
      memoSlug: input.memoSlug,
    });
  };

  const upsertStatus = async (input: UpsertMemoKanbanStatusInput) => {
    await command.kanbanAssignment.upsertStatus({
      workspaceSlugName: input.workspaceSlug,
      memoSlugTitle: input.memoSlug,
      kanbanId: input.kanbanId,
      kanbanStatusId: input.kanbanStatusId,
      position: null,
    });
    emitEvent('kanban-assignment/updated', {
      workspaceSlug: input.workspaceSlug,
      memoSlug: input.memoSlug,
    });
  };

  return {
    loadEntries,
    loadStatuses,
    removeStatus,
    upsertStatus,
  };
}
