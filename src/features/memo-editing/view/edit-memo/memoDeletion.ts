import { ref } from 'vue';

import { deleteMemo as executeDeleteMemo } from '../../resource/command/deleteMemo';

import type { DeleteMemoDialogHandle } from './deleteMemoDialog';
import type { MemoEvent, MemoState } from './memoMachine';
import type { Ref } from 'vue';

export type MemoDeleteConfirmResult =
  | { action: 'cancel'; error?: unknown }
  | { action: 'proceed' };

type UseMemoDeletionOptions = {
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  deleteDialogRef: Ref<DeleteMemoDialogHandle | null>;
  dispatch: (event: MemoEvent) => void;
};

export function useMemoDeletion(options: UseMemoDeletionOptions) {
  const { createEffectHandler } = useEffectHandler();
  const pendingDeleteAfterSave = ref(false);

  const confirmDelete = async (previousState: MemoState): Promise<MemoDeleteConfirmResult> => {
    if (!options.deleteDialogRef.value) {
      throw new Error('Delete dialog ref is not set correctly.');
    }

    if (previousState === 'dirty') {
      const shouldSaveBeforeDelete = window.confirm('You have unsaved changes. Save before deleting?');
      if (shouldSaveBeforeDelete) {
        pendingDeleteAfterSave.value = true;
        options.dispatch({ type: 'memo/save-requested', payload: { mode: 'explicit' } });
        return { action: 'cancel' };
      }

      const confirmDeleteWithoutSave = window.confirm('Delete without saving changes?');
      if (!confirmDeleteWithoutSave) {
        return { action: 'cancel' };
      }
    }

    return { action: 'proceed' };
  };

  const deleteMemo = async (): Promise<boolean> => {
    if (!options.deleteDialogRef.value) {
      throw new Error('Delete dialog ref is not set correctly.');
    }

    const confirmed = await options.deleteDialogRef.value.confirm();
    if (!confirmed) {
      return false;
    }

    const result = await createEffectHandler(() => executeDeleteMemo({
      workspaceSlug: options.workspaceSlug.value,
      memoSlug: options.memoSlug.value,
    }))
      .withToast('Delete memo successfully.', 'Failed to delete.')
      .execute();

    return result.ok;
  };

  const continuePendingDeleteIfNeeded = () => {
    if (!pendingDeleteAfterSave.value) {
      return;
    }

    pendingDeleteAfterSave.value = false;
    options.dispatch({ type: 'memo/delete-requested' });
  };

  return {
    confirmDelete,
    deleteMemo,
    continuePendingDeleteIfNeeded,
  };
}
