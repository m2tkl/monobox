import { command } from '~/resources/command';

type CreateKanbanStatusInput = {
  workspaceSlug: string;
  kanbanId: number;
  name: string;
  color?: string;
};

export async function createKanbanStatus(input: CreateKanbanStatusInput) {
  return await command.kanbanStatus.create({
    workspaceSlugName: input.workspaceSlug,
    kanbanId: input.kanbanId,
    name: input.name,
    color: input.color,
  });
}
