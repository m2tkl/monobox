import { workspaceKanbanStatusesQuery } from '~/app/features/kanban/queries/workspaceKanbanStatusesQuery';

export async function loadKanbanStatuses(workspaceSlug: string, kanbanId: number) {
  return workspaceKanbanStatusesQuery.fetch({ workspaceSlug, kanbanId });
}
