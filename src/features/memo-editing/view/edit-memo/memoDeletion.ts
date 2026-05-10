import { deleteMemo as executeDeleteMemo } from '../../resource/command/deleteMemo';

import type { DeleteMemoDialogHandle } from './deleteMemoDialog';
import type { Ref } from 'vue';

type UseMemoDeletionOptions = {
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  deleteDialogRef: Ref<DeleteMemoDialogHandle | null>;
};

export function useMemoDeletion(options: UseMemoDeletionOptions) {
  const toast = useToast();
  const logger = useConsoleLogger('memo-editing/memoDeletion');

  const confirmDelete = async (): Promise<boolean> => {
    if (!options.deleteDialogRef.value) {
      throw new Error('Delete dialog ref is not set correctly.');
    }

    return options.deleteDialogRef.value.confirm();
  };

  const deleteMemo = async (): Promise<boolean> => {
    try {
      await executeDeleteMemo({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.memoSlug.value,
      });

      toast.add({ title: 'Delete memo successfully.', icon: iconKey.success, duration: 1000 });
      return true;
    }
    catch (error) {
      logger.error(error);
      toast.add({
        title: 'Failed to delete.',
        description: 'Please try again',
        color: 'error',
        icon: iconKey.failed,
      });
      return false;
    }
  };

  return {
    confirmDelete,
    deleteMemo,
  };
}
