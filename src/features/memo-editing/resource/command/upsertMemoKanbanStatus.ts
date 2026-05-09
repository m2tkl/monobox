import { emitEvent } from '~/resource-runtime/infra/eventBus';
import { command } from '~/resources/command';

type UpsertMemoKanbanStatusInput = {
  workspaceSlug: string;
  memoSlug: string;
  kanbanId: number;
  kanbanStatusId: number;
};

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
