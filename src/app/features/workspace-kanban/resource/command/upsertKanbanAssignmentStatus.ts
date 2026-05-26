import { command } from '~/resources/command';

type UpsertKanbanAssignmentStatusInput = {
  workspaceSlug: string;
  memoSlug: string;
  kanbanId: number;
  kanbanStatusId?: number | null;
  position?: number | null;
};

export async function upsertKanbanAssignmentStatus(input: UpsertKanbanAssignmentStatusInput) {
  await command.kanbanAssignment.upsertStatus({
    workspaceSlugName: input.workspaceSlug,
    memoSlugTitle: input.memoSlug,
    kanbanId: input.kanbanId,
    kanbanStatusId: input.kanbanStatusId,
    position: input.position,
  });
}
