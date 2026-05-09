import { emitEvent } from '~/resource-runtime/infra/eventBus';
import { command } from '~/resources/command';

type CreateMemoInput = {
  workspaceSlug: string;
  title: string;
};

export async function createMemo(input: CreateMemoInput) {
  const newMemo = await command.memo.create({
    workspaceSlugName: input.workspaceSlug,
    title: input.title,
  });

  emitEvent('memo/created', { workspaceSlug: input.workspaceSlug });

  return newMemo;
}
