import { command } from '~/resources/command';

type UpdateKanbanStatusInput = {
  workspaceSlug: string;
  kanbanId: number;
  id: number;
  name: string;
  color?: string;
};

export async function updateKanbanStatus(input: UpdateKanbanStatusInput) {
  await command.kanbanStatus.update({
    workspaceSlugName: input.workspaceSlug,
    kanbanId: input.kanbanId,
    id: input.id,
    name: input.name,
    color: input.color,
  });
}
