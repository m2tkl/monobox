import { command } from '~/resources/command';

type CreateKanbanInput = {
  workspaceSlug: string;
  name: string;
};

export async function createKanban(input: CreateKanbanInput) {
  return await command.kanban.create({
    workspaceSlugName: input.workspaceSlug,
    name: input.name,
  });
}
