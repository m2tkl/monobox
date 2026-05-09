import { emitEvent } from '~/resource-runtime/infra/eventBus';
import { command } from '~/resources/command';

type RemoveMemoKanbanStatusInput = {
  workspaceSlug: string;
  memoSlug: string;
  kanbanId: number;
};

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
