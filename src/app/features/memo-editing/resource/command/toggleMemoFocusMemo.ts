import { command } from '~/resources/command';

type ToggleMemoFocusMemoInput = {
  workspaceSlug: string;
  memoSlug: string;
  isFocused: boolean;
};

export async function toggleMemoFocusMemo(input: ToggleMemoFocusMemoInput) {
  if (!input.isFocused) {
    const kanban = (await command.kanban.list({ slugName: input.workspaceSlug }))[0];
    if (!kanban) return;
    const nowStatus = (await command.kanbanStatus.list({
      slugName: input.workspaceSlug,
      kanbanId: kanban.id,
    })).find(status => status.name === 'Now');
    if (!nowStatus) return;

    await command.kanbanAssignment.upsertStatus({
      workspaceSlugName: input.workspaceSlug,
      memoSlugTitle: input.memoSlug,
      kanbanId: kanban.id,
      kanbanStatusId: nowStatus.id,
      position: null,
    });
    return;
  }

  const kanban = (await command.kanban.list({ slugName: input.workspaceSlug }))[0];
  if (!kanban) return;

  await command.kanbanAssignment.remove({
    workspaceSlugName: input.workspaceSlug,
    memoSlugTitle: input.memoSlug,
    kanbanId: kanban.id,
  });
}
