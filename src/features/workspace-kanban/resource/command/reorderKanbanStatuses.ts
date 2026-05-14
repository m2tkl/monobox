import { command } from '~/resources/command';

type ReorderKanbanStatusesInput = {
  workspaceSlug: string;
  kanbanId: number;
  updates: { id: number; orderIndex: number }[];
};

export async function reorderKanbanStatuses(input: ReorderKanbanStatusesInput) {
  await command.kanbanStatus.updateOrders({
    workspaceSlugName: input.workspaceSlug,
    kanbanId: input.kanbanId,
    updates: input.updates,
  });
}
