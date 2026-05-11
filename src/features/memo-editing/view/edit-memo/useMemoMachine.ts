import { ref } from 'vue';

import { useMemoDeletion } from './memoDeletion';
import { apply, type MemoEffect, type MemoEvent, type MemoState } from './memoMachine';
import { useMemoSaveFlow } from './memoSaveFlow';
import { syncMemoLinks } from '../../resource/command/syncMemoLinks';

import type { DeleteMemoDialogHandle } from './deleteMemoDialog';
import type { Editor } from '@tiptap/core';
import type { Ref } from 'vue';
import type { Router } from 'vue-router';

import { emitEvent } from '~/resource-runtime/infra/eventBus';

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
  const { saveMemo } = useMemoSaveFlow();
  const memoDeletion = useMemoDeletion({
    workspaceSlug: options.workspaceSlug,
    memoSlug: options.memoSlug,
    deleteDialogRef: options.deleteDialogRef,
  });

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

  const handleEffect = async (effect: MemoEffect) => {
    switch (effect.type) {
      case 'effect/save-memo': {
        let result;
        try {
          result = await saveMemo({
            target: {
              workspaceSlug: options.workspaceSlug.value,
              memoSlug: options.memoSlug.value,
            },
            editor: options.editor.value,
            title: options.memoTitle.value,
            thumbnailImage: options.headImageRef.value ?? '',
            routeHash: options.route.hash,
            mode: effect.mode,
          });
        }
        catch (error) {
          await dispatch({ type: 'memo/save-failed', payload: { error } });
          return;
        }

        if (result.ok) {
          await dispatch({ type: 'memo/save-succeeded', payload: { memoSlug: result.memoSlug } });
        }
        else {
          await dispatch({ type: 'memo/save-failed', payload: { error: result.error } });
        }
        return;
      }
      case 'effect/sync-links': {
        try {
          await syncMemoLinks({
            workspaceSlug: options.workspaceSlug.value,
            memoSlug: options.memoSlug.value,
          }, effect.added, effect.deleted);
        }
        catch {
          return;
        }
        await dispatch({ type: 'memo/save-requested', payload: { mode: 'auto' } });
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
        const confirmed = await memoDeletion.confirmDelete();
        await dispatch({ type: 'memo/delete-confirmation-resolved', payload: { confirmed } });
        return;
      }
      case 'effect/delete-memo': {
        const ok = await memoDeletion.deleteMemo();
        if (ok) {
          await dispatch({ type: 'memo/delete-succeeded' });
        }
        else {
          await dispatch({ type: 'memo/delete-failed', payload: {} });
        }
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
