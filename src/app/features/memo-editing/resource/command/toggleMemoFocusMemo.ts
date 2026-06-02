import { command } from '~/resources/command';
import { loadGlobalStatusKanban } from '~/resources/kanban/globalStatus';

type ToggleMemoFocusMemoInput = {
  workspaceSlug: string;
  memoSlug: string;
  isFocused: boolean;
};

export async function toggleMemoFocusMemo(input: ToggleMemoFocusMemoInput) {
  if (!input.isFocused) {
    const kanban = await loadGlobalStatusKanban(input.workspaceSlug);
    if (!kanban) return;
    if (!kanban.focus_status_id) return;

    await command.kanbanAssignment.upsertStatus({
      workspaceSlugName: input.workspaceSlug,
      memoSlugTitle: input.memoSlug,
      kanbanId: kanban.id,
      kanbanStatusId: kanban.focus_status_id,
      position: null,
    });
    await command.focusMemo.add(input.workspaceSlug, input.memoSlug);
    return;
  }

  const kanban = await loadGlobalStatusKanban(input.workspaceSlug);
  if (!kanban) return;

  await command.kanbanAssignment.remove({
    workspaceSlugName: input.workspaceSlug,
    memoSlugTitle: input.memoSlug,
    kanbanId: kanban.id,
  });
  await command.focusMemo.delete(input.workspaceSlug, input.memoSlug);
}
