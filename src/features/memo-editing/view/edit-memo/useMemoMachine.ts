import { ref } from 'vue';

import { apply, type MemoEffect, type MemoEvent, type MemoState } from './memoMachine';
import { deleteMemo as executeDeleteMemo } from '../../resource/command/deleteMemo';
import { saveMemo as executeSaveMemo } from '../../resource/command/saveMemo';
import { syncMemoLinks } from '../../resource/command/syncMemoLinks';

import type { Editor } from '@tiptap/core';
import type { Ref } from 'vue';
import type { Router } from 'vue-router';

import { emitEvent } from '~/resource-runtime/infra/eventBus';

export type DeleteMemoDialogHandle = {
  confirm: () => Promise<boolean>;
};

type MemoSnapshot = {
  title: string;
  content: string;
};

type UseMemoMachineDeps = {
  initialState: MemoState;
  workspaceSlug: Ref<string>;
  memoSlug: Ref<string>;
  router: Router;
  route: { hash: string };
  editor: Ref<Editor | undefined>;
  memoTitle: Ref<string>;
  headImageRef: Ref<string | null | undefined>;
  deleteDialogRef: Ref<DeleteMemoDialogHandle | null>;
  getCurrentSnapshot: () => MemoSnapshot;
  onSnapshotSaved: (snapshot: MemoSnapshot) => void;
  logger?: {
    debug: (message: string, payload: unknown) => void;
  };
};

export function useMemoMachine(options: UseMemoMachineDeps) {
  const state = ref<MemoState>(options.initialState);
  const toast = useToast();
  const logger = useConsoleLogger('memo-editing/useMemoMachine');

  const dispatch = async (event: MemoEvent) => {
    const previous = state.value;
    const result = apply(previous, event);
    options.logger?.debug('memo-machine', {
      previous: previous.type,
      event: event.type,
      next: result.state.type,
      effects: result.effects.map(effect => effect.type),
    });
    state.value = result.state;
    await runEffects(result.effects);
  };

  const runEffects = async (effects: MemoEffect[]) => {
    for (const effect of effects) {
      await handleEffect(effect);
    }
  };

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

  const runSaveMemoEffect = async (mode: 'explicit' | 'auto') => {
    let result:
      | { ok: true; memoSlug: string }
      | { ok: false; error?: unknown };
    const editor = options.editor.value;

    try {
      if (!editor) {
        if (mode === 'explicit') {
          throw new Error('Editor instance not set.');
        }
        result = { ok: false };
      }
      else if (!options.memoTitle.value) {
        if (mode === 'explicit') {
          window.alert('Please set title.');
        }
        result = { ok: false };
      }
      else {
        const saved = await executeSaveMemo(
          {
            workspaceSlug: options.workspaceSlug.value,
            memoSlug: options.memoSlug.value,
          },
          editor,
          options.memoTitle.value,
          options.headImageRef.value ?? '',
          options.route.hash,
        );
        result = { ok: true, memoSlug: saved.memoSlug };
      }
    }
    catch (error) {
      if (mode === 'explicit') {
        logger.error(error);
        toast.add({
          title: 'Failed to save',
          description: 'Please try again',
          color: 'error',
          icon: iconKey.failed,
        });
      }
      await dispatch({ type: 'memo/save-failed', payload: { error } });
      return;
    }

    if (result.ok) {
      if (mode === 'explicit') {
        toast.add({ title: 'Saved', icon: iconKey.success, duration: 1000 });
      }
      await dispatch({ type: 'memo/save-succeeded', payload: { memoSlug: result.memoSlug } });
      return;
    }

    await dispatch({ type: 'memo/save-failed', payload: { error: result.error } });
  };

  const runSyncLinksEffect = async (added: string[], deleted: string[]) => {
    try {
      await syncMemoLinks({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: options.memoSlug.value,
      }, added, deleted);
    }
    catch {
      return;
    }
    await dispatch({ type: 'memo/save-requested', payload: { mode: 'auto' } });
  };

  const runDeleteMemoEffect = async () => {
    const ok = await deleteMemo();
    if (ok) {
      await dispatch({ type: 'memo/delete-succeeded' });
      return;
    }

    await dispatch({ type: 'memo/delete-failed', payload: {} });
  };

  const handleEffect = async (effect: MemoEffect) => {
    switch (effect.type) {
      case 'effect/save-memo': {
        await runSaveMemoEffect(effect.mode);
        return;
      }
      case 'effect/sync-links': {
        await runSyncLinksEffect(effect.added, effect.deleted);
        return;
      }
      case 'effect/snapshot-saved': {
        options.onSnapshotSaved(options.getCurrentSnapshot());
        return;
      }
      case 'effect/emit-memo-updated': {
        emitEvent('memo/updated', {
          workspaceSlug: options.workspaceSlug.value,
          memoSlug: effect.memoSlug,
        });
        return;
      }
      case 'effect/replace-memo-route': {
        options.router.replace(`/${options.workspaceSlug.value}/${effect.memoSlug}${options.route.hash}`);
        return;
      }
      case 'effect/confirm-delete': {
        const confirmed = await confirmDelete();
        await dispatch({ type: 'memo/delete-confirmation-resolved', payload: { confirmed } });
        return;
      }
      case 'effect/delete-memo': {
        await runDeleteMemoEffect();
        return;
      }
      case 'effect/emit-memo-deleted': {
        emitEvent('memo/deleted', { workspaceSlug: options.workspaceSlug.value });
        return;
      }
      case 'effect/replace-workspace-route': {
        options.router.replace(`/${options.workspaceSlug.value}`);
        return;
      }
      default:
        return;
    }
  };

  return {
    state,
    dispatch,
  };
}
