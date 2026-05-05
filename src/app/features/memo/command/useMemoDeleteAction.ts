import type { Ref } from 'vue';

import { command } from '~/external/tauri/command';

type DeleteMemoActionTarget = {
  workspaceSlug: string;
  memoSlug: string;
};

export type MemoDeleteFlowHandle = {
  run: (operation: () => Promise<void>) => Promise<'completed' | 'cancelled'>;
};

export function useMemoDeleteAction() {
  const { createEffectHandler } = useEffectHandler();

  const deleteMemo = async (
    workflowRef: Ref<MemoDeleteFlowHandle | null>,
    target: DeleteMemoActionTarget,
  ): Promise<boolean> => {
    if (!workflowRef.value) {
      return false;
    }

    const workflowResult = await workflowRef.value.run(async () => {
      const result = await createEffectHandler(() => command.memo.trash(target))
        .withToast('Delete memo successfully.', 'Failed to delete.')
        .execute();

      if (!result.ok) {
        throw new Error('Failed to delete.');
      }
    });

    return workflowResult === 'completed';
  };

  return {
    deleteMemo,
  };
}
