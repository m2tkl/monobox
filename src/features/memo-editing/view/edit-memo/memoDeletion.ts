import { deleteMemo as executeDeleteMemo } from '../../resource/command/deleteMemo';

import type { DeleteMemoDialogHandle } from './deleteMemoDialog';
import type { Ref } from 'vue';

type UseMemoDeletionOptions = {
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  deleteDialogRef: Ref<DeleteMemoDialogHandle | null>;
};

export function useMemoDeletion(options: UseMemoDeletionOptions) {
  const { createEffectHandler } = useEffectHandler();

  const confirmDelete = async (): Promise<boolean> => {
    if (!options.deleteDialogRef.value) {
      throw new Error('Delete dialog ref is not set correctly.');
    }

    return options.deleteDialogRef.value.confirm();
  };

  const deleteMemo = async (): Promise<boolean> => {
    const result = await createEffectHandler(() => executeDeleteMemo({
      workspaceSlug: options.workspaceSlug.value,
      memoSlug: options.memoSlug.value,
    }))
      .withToast('Delete memo successfully.', 'Failed to delete.')
      .execute();

    return result.ok;
  };

  return {
    confirmDelete,
    deleteMemo,
  };
}
