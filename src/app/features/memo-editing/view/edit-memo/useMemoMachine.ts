import { onScopeDispose, ref, watch } from 'vue';

import { apply, type MemoEffect, type MemoEvent, type MemoSaveMode, type MemoState } from './memoMachine';
import { sameMemoSnapshot, type MemoSnapshot } from '../../memoSnapshot';
import { deleteMemo as executeDeleteMemo } from '../../resource/command/deleteMemo';
import { saveMemo as executeSaveMemo } from '../../resource/command/saveMemo';
import { syncMemoLinks } from '../../resource/command/syncMemoLinks';

import type { Editor } from '@tiptap/core';
import type { Ref } from 'vue';
import type { Router } from 'vue-router';

import { observeResourceChanges } from '~/resource-runtime/query-runtime';

export type DeleteMemoDialogHandle = {
  confirm: () => Promise<boolean>;
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

type EffectExecutionResult = {
  nextEvent?: MemoEvent;
};

type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error?: unknown };

export function useMemoMachine(options: UseMemoMachineDeps) {
  const state = ref<MemoState>(options.initialState);
  // A successful rename can precede navigation while newer edits remain unsaved.
  let persistedMemoSlug = options.memoSlug.value;
  watch([options.workspaceSlug, options.memoSlug], () => {
    persistedMemoSlug = options.memoSlug.value;
  });
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
      const result = await handleEffect(effect);
      if (result.nextEvent) {
        await dispatch(result.nextEvent);
      }
    }
  };

  const confirmDelete = async (): Promise<boolean> => {
    if (!options.deleteDialogRef.value) {
      throw new Error('Delete dialog ref is not set correctly.');
    }

    return options.deleteDialogRef.value.confirm();
  };

  const deleteMemo = async (): Promise<Result> => {
    try {
      await executeDeleteMemo({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: persistedMemoSlug,
      });
      return { ok: true, data: undefined };
    }
    catch (error) {
      logger.error(error);
      return { ok: false, error };
    }
  };

  const saveMemo = async (mode: MemoSaveMode): Promise<Result<{ memoSlug: string; snapshot: MemoSnapshot }>> => {
    const editor = options.editor.value;

    try {
      if (!editor) {
        if (mode !== 'auto') {
          throw new Error('Editor instance not set.');
        }
        return { ok: false };
      }

      if (!options.memoTitle.value) {
        if (mode !== 'auto') {
          window.alert('Please set title.');
        }
        return { ok: false };
      }

      const saved = await executeSaveMemo(
        {
          workspaceSlug: options.workspaceSlug.value,
          memoSlug: persistedMemoSlug,
        },
        editor,
        options.memoTitle.value,
        options.headImageRef.value ?? '',
        options.route.hash,
      );

      persistedMemoSlug = saved.memoSlug;
      return { ok: true, data: saved };
    }
    catch (error) {
      if (mode !== 'auto') {
        logger.error(error);
      }
      return { ok: false, error };
    }
  };

  const syncLinks = async (added: string[], deleted: string[]): Promise<Result> => {
    try {
      await syncMemoLinks({
        workspaceSlug: options.workspaceSlug.value,
        memoSlug: persistedMemoSlug,
      }, added, deleted);
      return { ok: true, data: undefined };
    }
    catch {
      return { ok: false };
    }
  };

  const handleEffect = async (effect: MemoEffect): Promise<EffectExecutionResult> => {
    switch (effect.type) {
      case 'effect/save-memo': {
        const result = await saveMemo(effect.mode);
        return result.ok
          ? { nextEvent: { type: 'memo/save-succeeded', payload: { ...result.data, dirty: !sameMemoSnapshot(options.getCurrentSnapshot(), result.data.snapshot) } } }
          : { nextEvent: { type: 'memo/save-failed', payload: { error: result.error } } };
      }
      case 'effect/sync-links': {
        const result = await syncLinks(effect.added, effect.deleted);
        return result.ok
          ? { nextEvent: { type: 'memo/save-requested', payload: { mode: 'auto' } } }
          : {};
      }
      case 'effect/snapshot-saved': {
        options.onSnapshotSaved(effect.snapshot);
        return {};
      }
      case 'effect/notify-save-failed': {
        toast.add({
          title: 'Failed to save',
          description: 'Please try again',
          color: 'error',
          icon: iconKey.failed,
        });
        return {};
      }
      case 'effect/replace-memo-route': {
        options.router.replace(`/${options.workspaceSlug.value}/${effect.memoSlug}${options.route.hash}`);
        return {};
      }
      case 'effect/confirm-delete': {
        const confirmed = await confirmDelete();
        return {
          nextEvent: { type: 'memo/delete-confirmation-resolved', payload: { confirmed } },
        };
      }
      case 'effect/delete-memo': {
        const result = await deleteMemo();
        return result.ok
          ? { nextEvent: { type: 'memo/delete-succeeded' } }
          : { nextEvent: { type: 'memo/delete-failed', payload: {} } };
      }
      case 'effect/notify-delete-succeeded': {
        toast.add({ title: 'Delete memo successfully.', icon: iconKey.success, duration: 1000 });
        return {};
      }
      case 'effect/notify-delete-failed': {
        toast.add({
          title: 'Failed to delete.',
          description: 'Please try again',
          color: 'error',
          icon: iconKey.failed,
        });
        return {};
      }
      default:
        return {};
    }
  };

  // Deletion is already committed when this fact is published. Observe it
  // before the router evaluates guards for open-page reconciliation.
  const stopObserving = observeResourceChanges((changes) => {
    if (changes.some(change => change.type === 'memoDeleted'
      && change.workspaceSlug === options.workspaceSlug.value
      && change.memoSlug === persistedMemoSlug)) {
      void dispatch({ type: 'memo/deleted' });
    }
    return undefined;
  });
  onScopeDispose(stopObserving);

  return {
    state,
    dispatch,
  };
}
