import { command } from '~/resources/command';

type DeleteKanbanStatusInput = {
  workspaceSlug: string;
  kanbanId: number;
  id: number;
};

export async function deleteKanbanStatus(input: DeleteKanbanStatusInput) {
  await command.kanbanStatus.delete({
    workspaceSlugName: input.workspaceSlug,
    kanbanId: input.kanbanId,
    id: input.id,
  });
}
