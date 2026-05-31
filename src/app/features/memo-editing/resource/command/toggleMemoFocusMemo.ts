import { command } from '~/resources/command';

type ToggleMemoFocusMemoInput = {
  workspaceSlug: string;
  memoSlug: string;
  isFocused: boolean;
};

export async function toggleMemoFocusMemo(input: ToggleMemoFocusMemoInput) {
  if (!input.isFocused) {
    await command.focusMemo.add(input.workspaceSlug, input.memoSlug);
    return;
  }

  await command.focusMemo.delete(input.workspaceSlug, input.memoSlug);
}
