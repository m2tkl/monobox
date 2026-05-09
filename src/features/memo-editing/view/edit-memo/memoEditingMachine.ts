import { ref } from 'vue';

import { createMemoMutationNotifications } from './memoMutationNotifications';
import { useMemoSaveFlow } from './memoSaveFlow';
import { useMemoMachine } from './useMemoMachine';
import { deleteMemo as executeDeleteMemo } from '../../resource/command/deleteMemo';
import { syncMemoLinks } from '../../resource/command/syncMemoLinks';

import type { DeleteMemoDialogHandle } from './deleteMemoDialog';
import type { MemoEvent, MemoState } from './memoMachine';
import type { Editor } from '@tiptap/core';
import type { Ref } from 'vue';
import type { Router } from 'vue-router';

type MemoSnapshot = {
  title: string;
  content: string;
};

type UseMemoEditingMachineOptions = {
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  routeHash: Ref<string>;
  router: Router;
  editor: Ref<Editor | undefined>;
  memoTitle: Ref<string>;
  headImageRef: Ref<string | null | undefined>;
  deleteDialogRef: Ref<DeleteMemoDialogHandle | null>;
  getCurrentSnapshot: () => MemoSnapshot;
  onSnapshotSaved: (snapshot: MemoSnapshot) => void;
  logger: {
    debug: (message: string, payload: unknown) => void;
  };
};

export function useMemoEditingMachine(options: UseMemoEditingMachineOptions) {
  const { saveMemo } = useMemoSaveFlow();
  const { createEffectHandler } = useEffectHandler();
  const pendingDeleteAfterSave = ref(false);
  let dispatch: (event: MemoEvent) => void = () => {};

  const { notifyUpdated, notifyDeleted } = createMemoMutationNotifications({
    workspaceSlug: options.workspaceSlug,
    routeHash: options.routeHash,
    router: options.router,
    onAfterUpdated: () => {
      options.onSnapshotSaved(options.getCurrentSnapshot());
      if (pendingDeleteAfterSave.value) {
        pendingDeleteAfterSave.value = false;
        dispatch({ type: 'memo/delete-requested' });
      }
    },
  });

  async function saveMemoContent(mode: 'explicit' | 'auto') {
    return saveMemo({
      target: {
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.memoSlug.value,
      },
      editor: options.editor.value,
      title: options.memoTitle.value,
      thumbnailImage: options.headImageRef.value ?? '',
      routeHash: options.routeHash.value,
      mode,
    });
  }

  const confirmDelete = async (previousState: MemoState) => {
    if (!options.deleteDialogRef.value) {
      throw new Error('Delete dialog ref is not set correctly.');
    }

    if (previousState === 'dirty') {
      const shouldSaveBeforeDelete = window.confirm('You have unsaved changes. Save before deleting?');
      if (shouldSaveBeforeDelete) {
        pendingDeleteAfterSave.value = true;
        dispatch({ type: 'memo/save-requested', payload: { mode: 'explicit' } });
        return { action: 'cancel' } as const;
      }

      const confirmDeleteWithoutSave = window.confirm('Delete without saving changes?');
      if (!confirmDeleteWithoutSave) {
        return { action: 'cancel' } as const;
      }
    }

    return { action: 'proceed' } as const;
  };

  const deleteMemo = async (_previousState: MemoState) => {
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

  const machine = useMemoMachine('clean', {
    saveMemo: saveMemoContent,
    syncLinks: async (added, deleted) => {
      await syncMemoLinks({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.memoSlug.value,
      }, added, deleted);
    },
    notifyUpdated,
    notifyDeleted,
    confirmDelete,
    deleteMemo,
  }, {
    onTransition: ({ previous, event, next, effects }) => {
      options.logger.debug('memo-machine', {
        previous,
        event: event.type,
        next,
        effects: effects.map(effect => effect.type),
      });
    },
  });

  dispatch = machine.dispatch;

  return {
    state: machine.state,
    dispatch: machine.dispatch,
    saveMemoContent,
  };
}
