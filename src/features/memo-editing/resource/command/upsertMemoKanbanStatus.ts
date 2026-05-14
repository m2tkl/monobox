import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { command } from '~/resources/command';
import { changeRefs } from '~/resources/changes';

type UpsertMemoKanbanStatusInput = {
  workspaceSlug: string;
  memoSlug: string;
  kanbanId: number;
  kanbanStatusId: number;
};

export async function upsertMemoKanbanStatus(input: UpsertMemoKanbanStatusInput) {
  await command.kanbanAssignment.upsertStatus({
    workspaceSlugName: input.workspaceSlug,
    memoSlugTitle: input.memoSlug,
    kanbanId: input.kanbanId,
    kanbanStatusId: input.kanbanStatusId,
    position: null,
  });
  void publishResourceChanges([
    changeRefs.kanbanEntryCollectionChanged(input.workspaceSlug, input.memoSlug),
  ]);
}
