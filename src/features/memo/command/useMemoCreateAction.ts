import { command } from '~/resources/command';
import { emitEvent } from '~/resources/infra/eventBus';

type CreateMemoInput = {
  workspaceSlug: string;
  title: string;
};

export function useMemoCreateAction() {
  const createMemo = async (input: CreateMemoInput) => {
    const newMemo = await command.memo.create({
      workspaceSlugName: input.workspaceSlug,
      title: input.title,
    });

    emitEvent('memo/created', { workspaceSlug: input.workspaceSlug });

    return newMemo;
  };

  return {
    createMemo,
  };
}
