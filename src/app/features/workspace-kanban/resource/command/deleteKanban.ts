import { command } from '~/resources/command';

type DeleteKanbanInput = {
  workspaceSlug: string;
  id: number;
};

export async function deleteKanban(input: DeleteKanbanInput) {
  await command.kanban.delete({
    workspaceSlugName: input.workspaceSlug,
    id: input.id,
  });
}
