import { ref } from 'vue';

import { apply, type MemoEffect, type MemoEvent, type MemoState } from './memoMachine';

import type { MemoSaveMode, MemoSaveResult } from './memoSaveFlow';

type MemoMachineHandlers = {
  saveMemo: (mode: MemoSaveMode) => Promise<MemoSaveResult>;
  syncLinks: (added: string[], deleted: string[]) => Promise<void>;
  snapshotSaved: () => void;
  emitMemoUpdated: (memoSlug: string) => void;
  replaceMemoRoute: (memoSlug: string) => void;
  confirmDelete: () => Promise<boolean>;
  deleteMemo: () => Promise<boolean>;
  emitMemoDeleted: () => void;
  replaceWorkspaceRoute: () => void;
};

type MemoMachineOptions = {
  onTransition?: (data: { previous: MemoState; event: MemoEvent; next: MemoState; effects: MemoEffect[] }) => void;
};

export function useMemoMachine(
  initialState: MemoState,
  handlers: MemoMachineHandlers,
  options: MemoMachineOptions = {},
) {
  const state = ref<MemoState>(initialState);

  const dispatch = async (event: MemoEvent) => {
    const previous = state.value;
    const result = apply(previous, event);
    options.onTransition?.({ previous, event, next: result.state, effects: result.effects });
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
        let result: MemoSaveResult;
        try {
          result = await handlers.saveMemo(effect.mode);
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
          await handlers.syncLinks(effect.added, effect.deleted);
        }
        catch {
          return;
        }
        await dispatch({ type: 'memo/save-requested', payload: { mode: 'auto' } });
        return;
      }
      case 'effect/snapshot-saved': {
        handlers.snapshotSaved();
        return;
      }
      case 'effect/emit-memo-updated': {
        handlers.emitMemoUpdated(effect.memoSlug);
        return;
      }
      case 'effect/replace-memo-route': {
        handlers.replaceMemoRoute(effect.memoSlug);
        return;
      }
      case 'effect/confirm-delete': {
        const confirmed = await handlers.confirmDelete();
        await dispatch({ type: 'memo/delete-confirmation-resolved', payload: { confirmed } });
        return;
      }
      case 'effect/delete-memo': {
        const ok = await handlers.deleteMemo();
        if (ok) {
          await dispatch({ type: 'memo/delete-succeeded' });
        }
        else {
          await dispatch({ type: 'memo/delete-failed', payload: {} });
        }
        return;
      }
      case 'effect/emit-memo-deleted': {
        handlers.emitMemoDeleted();
        return;
      }
      case 'effect/replace-workspace-route': {
        handlers.replaceWorkspaceRoute();
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
