import { emitEvent } from '~/resource-runtime/infra/eventBus';
import { command } from '~/resources/command';

type DeleteMemoInput = {
  workspaceSlug: string;
  memoSlug: string;
};

export async function deleteMemo(input: DeleteMemoInput) {
  await command.memo.trash(input);
  emitEvent('memo/deleted', { workspaceSlug: input.workspaceSlug });
}
