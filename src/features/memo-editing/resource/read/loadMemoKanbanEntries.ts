import type { KanbanAssignmentEntry } from '~/models/kanbanAssignment';

import { command } from '~/resources/command';

type MemoKanbanTarget = {
  workspaceSlug: string;
  memoSlug: string;
};

export async function loadMemoKanbanEntries(target: MemoKanbanTarget): Promise<KanbanAssignmentEntry[]> {
  return command.kanbanAssignment.listEntries({
    workspaceSlugName: target.workspaceSlug,
    memoSlugTitle: target.memoSlug,
  });
}
