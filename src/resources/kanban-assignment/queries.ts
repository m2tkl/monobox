import type { KanbanAssignmentEntry, KanbanAssignmentItem } from '~/models/kanbanAssignment';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type MemoKanbanEntriesQueryArgs = {
  workspaceSlug: string;
  memoSlug: string;
};

export type KanbanAssignmentItemsQueryArgs = {
  workspaceSlug: string;
  kanbanId: number;
};

export const memoKanbanEntriesQuery = defineQuery<MemoKanbanEntriesQueryArgs, KanbanAssignmentEntry[]>({
  key: ({ workspaceSlug, memoSlug }) => ['workspace', workspaceSlug, 'memo', memoSlug, 'kanban-entries'] as const,
  resources: ({ workspaceSlug, memoSlug }) => [resourceRefs.kanbanEntryCollection(workspaceSlug, memoSlug)],
  when: ({ workspaceSlug, memoSlug }) => workspaceSlug.length > 0 && memoSlug.length > 0,
  load: ({ workspaceSlug, memoSlug }) => command.kanbanAssignment.listEntries({
    workspaceSlugName: workspaceSlug,
    memoSlugTitle: memoSlug,
  }),
});

export const kanbanAssignmentItemsQuery = defineQuery<KanbanAssignmentItemsQueryArgs, KanbanAssignmentItem[]>({
  key: ({ workspaceSlug, kanbanId }) => ['workspace', workspaceSlug, 'kanban', kanbanId, 'assignments'] as const,
  resources: ({ workspaceSlug, kanbanId }) => [resourceRefs.kanbanAssignmentCollection(workspaceSlug, kanbanId)],
  when: ({ workspaceSlug, kanbanId }) => workspaceSlug.length > 0 && kanbanId > 0,
  load: ({ workspaceSlug, kanbanId }) => command.kanbanAssignment.listItems({
    workspaceSlugName: workspaceSlug,
    kanbanId,
  }),
});
