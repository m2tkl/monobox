import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { command } from '~/resources/command';
import { changeRefs } from '~/resources/changes';

type RemoveMemoKanbanStatusInput = {
  workspaceSlug: string;
  memoSlug: string;
  kanbanId: number;
};

export async function removeMemoKanbanStatus(input: RemoveMemoKanbanStatusInput) {
  await command.kanbanAssignment.remove({
    workspaceSlugName: input.workspaceSlug,
    memoSlugTitle: input.memoSlug,
    kanbanId: input.kanbanId,
  });
  void publishResourceChanges([
    changeRefs.kanbanEntryCollectionChanged(input.workspaceSlug, input.memoSlug),
  ]);
}
