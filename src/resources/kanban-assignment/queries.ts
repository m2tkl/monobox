import type { KanbanAssignmentEntry } from '~/models/kanbanAssignment';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';

export type MemoKanbanEntriesQueryArgs = {
  workspaceSlug: string;
  memoSlug: string;
};

export const memoKanbanEntriesQuery = defineQuery<MemoKanbanEntriesQueryArgs, KanbanAssignmentEntry[]>({
  key: ({ workspaceSlug, memoSlug }) => ['workspace', workspaceSlug, 'memo', memoSlug, 'kanban-entries'] as const,
  load: ({ workspaceSlug, memoSlug }) => command.kanbanAssignment.listEntries({
    workspaceSlugName: workspaceSlug,
    memoSlugTitle: memoSlug,
  }),
  dependencies: [
    {
      event: 'kanban-assignment/updated',
      match: (payload, args) =>
        payload.workspaceSlug === args.workspaceSlug
        && payload.memoSlug === args.memoSlug,
    },
  ],
});
