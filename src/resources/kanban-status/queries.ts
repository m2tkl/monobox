import type { KanbanStatus } from '~/models/kanbanStatus';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type WorkspaceKanbanStatusesQueryArgs = {
  workspaceSlug: string;
  kanbanId: number;
};

export const workspaceKanbanStatusesQuery = defineQuery<WorkspaceKanbanStatusesQueryArgs, KanbanStatus[]>({
  key: ({ workspaceSlug, kanbanId }) => ['workspace', workspaceSlug, 'kanban', kanbanId, 'statuses'] as const,
  resources: ({ workspaceSlug, kanbanId }) => [resourceRefs.kanbanStatusCollection(workspaceSlug, kanbanId)],
  when: ({ workspaceSlug, kanbanId }) => workspaceSlug.length > 0 && kanbanId > 0,
  load: ({ workspaceSlug, kanbanId }) => command.kanbanStatus.list({ slugName: workspaceSlug, kanbanId }),
});
