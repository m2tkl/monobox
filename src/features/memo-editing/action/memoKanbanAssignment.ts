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

export async function loadMemoKanbanEntries(target: MemoKanbanTarget): Promise<KanbanAssignmentEntry[]> {
  return command.kanbanAssignment.listEntries({
    workspaceSlugName: target.workspaceSlug,
    memoSlugTitle: target.memoSlug,
  });
}

export async function loadKanbanStatuses(
  workspaceSlug: string,
  kanbanId: number,
): Promise<KanbanStatus[]> {
  return workspaceKanbanStatusesQuery.fetch({ workspaceSlug, kanbanId });
}

export async function removeMemoKanbanStatus(input: RemoveMemoKanbanStatusInput) {
  await command.kanbanAssignment.remove({
    workspaceSlugName: input.workspaceSlug,
    memoSlugTitle: input.memoSlug,
    kanbanId: input.kanbanId,
  });
  emitEvent('kanban-assignment/updated', {
    workspaceSlug: input.workspaceSlug,
    memoSlug: input.memoSlug,
  });
}

export async function upsertMemoKanbanStatus(input: UpsertMemoKanbanStatusInput) {
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
}
