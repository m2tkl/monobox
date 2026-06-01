import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
import { command } from '~/resources/command';
import { loadGlobalStatusKanban } from '~/resources/kanban/globalStatus';

type CreateMemoInput = {
  workspaceSlug: string;
  title: string;
};

export async function createMemo(input: CreateMemoInput) {
  const newMemo = await command.memo.create({
    workspaceSlugName: input.workspaceSlug,
    title: input.title,
  });

  void publishResourceChanges([
    changeRefs.memoCreated(input.workspaceSlug, newMemo.slug_title),
  ]);

  const kanban = await loadGlobalStatusKanban(input.workspaceSlug);
  if (kanban) {
    void publishResourceChanges([
      changeRefs.kanbanAssignmentCollectionChanged(input.workspaceSlug, kanban.id),
    ]);
  }

  return newMemo;
}
