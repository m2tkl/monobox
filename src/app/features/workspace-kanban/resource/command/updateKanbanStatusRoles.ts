import { command } from '~/resources/command';

type UpdateKanbanStatusRolesInput = {
  workspaceSlug: string;
  kanbanId: number;
  defaultStatusId?: number | null;
  focusStatusId?: number | null;
};

export async function updateKanbanStatusRoles(input: UpdateKanbanStatusRolesInput) {
  await command.kanban.updateStatusRoles({
    workspaceSlugName: input.workspaceSlug,
    id: input.kanbanId,
    defaultStatusId: input.defaultStatusId,
    focusStatusId: input.focusStatusId,
  });
}
