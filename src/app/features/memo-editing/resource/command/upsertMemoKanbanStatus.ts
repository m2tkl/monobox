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
}
