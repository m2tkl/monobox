import type { KanbanStatus } from '~/models/kanbanStatus';

import { workspaceKanbanStatusesQuery } from '~/resources/kanban-status/queries';

export async function loadKanbanStatuses(
  workspaceSlug: string,
  kanbanId: number,
): Promise<KanbanStatus[]> {
  return workspaceKanbanStatusesQuery.fetch({ workspaceSlug, kanbanId });
}
