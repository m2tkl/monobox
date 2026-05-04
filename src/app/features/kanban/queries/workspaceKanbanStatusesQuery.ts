import type { KanbanStatus } from '~/models/kanbanStatus';

import { command } from '~/external/tauri/command';
import { defineQuery } from '~/resource-state/query';

export type WorkspaceKanbanStatusesQueryArgs = {
  workspaceSlug: string;
  kanbanId: number;
};

export const workspaceKanbanStatusesQuery = defineQuery<WorkspaceKanbanStatusesQueryArgs, KanbanStatus[]>({
  key: ({ workspaceSlug, kanbanId }) => ['workspace', workspaceSlug, 'kanban', kanbanId, 'statuses'] as const,
  load: ({ workspaceSlug, kanbanId }) => command.kanbanStatus.list({ slugName: workspaceSlug, kanbanId }),
  dependencies: [
    {
      event: 'kanban-status/updated',
      match: (payload, args) =>
        payload.workspaceSlug === args.workspaceSlug
        && payload.kanbanId === args.kanbanId,
    },
  ],
});
