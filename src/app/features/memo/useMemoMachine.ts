import { ref } from 'vue';

import { transition, type MemoEffect, type MemoEvent, type MemoState } from './memoMachine';

type SaveResult = {
  ok: boolean;
  memoSlug?: string;
  error?: unknown;
};

type DeleteConfirmResult =
  | { action: 'cancel'; error?: unknown }
  | { action: 'proceed'; savedSlug?: string };

type MemoMachineHandlers = {
  saveMemo: (mode: 'explicit' | 'auto') => Promise<SaveResult>;
  syncLinks: (added: string[], deleted: string[]) => Promise<void>;
  notifyUpdated: (memoSlug: string) => void;
  notifyDeleted: () => void;
  confirmDelete: (previousState: MemoState) => Promise<DeleteConfirmResult>;
  deleteMemo: (previousState: MemoState) => Promise<boolean>;
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

  const dispatch = (event: MemoEvent) => {
    const previous = state.value;
    const result = transition(previous, event);
    options.onTransition?.({ previous, event, next: result.next, effects: result.effects });
    if (result.next !== state.value) {
      state.value = result.next;
    }
    runEffects(result.effects);
  };

  const runEffects = (effects: MemoEffect[]) => {
    for (const effect of effects) {
      void handleEffect(effect);
    }
  };

  const handleEffect = async (effect: MemoEffect) => {
    switch (effect.type) {
      case 'effect/save-memo': {
        let result: SaveResult;
        try {
          result = await handlers.saveMemo(effect.mode);
        }
        catch (error) {
          dispatch({ type: 'memo/save-failed', payload: { error } });
          return;
        }

        if (result.ok && result.memoSlug) {
          dispatch({ type: 'memo/save-succeeded', payload: { memoSlug: result.memoSlug } });
        }
        else {
          dispatch({ type: 'memo/save-failed', payload: { error: result.error } });
        }
        return;
      }
      case 'effect/sync-links': {
        await handlers.syncLinks(effect.added, effect.deleted);
        dispatch({ type: 'memo/save-requested', payload: { mode: 'auto' } });
        return;
      }
      case 'effect/notify-updated': {
        handlers.notifyUpdated(effect.memoSlug);
        return;
      }
      case 'effect/confirm-delete': {
        const result = await handlers.confirmDelete(effect.previousState);
        if (result.action === 'cancel') {
          if (result.error) {
            dispatch({ type: 'memo/delete-failed', payload: { previousState: effect.previousState, error: result.error } });
          }
          return;
        }

        if (result.savedSlug) {
          dispatch({ type: 'memo/save-succeeded', payload: { memoSlug: result.savedSlug } });
        }
        const nextPreviousState: MemoState = result.savedSlug ? 'clean' : effect.previousState;
        dispatch({ type: 'memo/delete-confirmed', payload: { previousState: nextPreviousState } });
        return;
      }
      case 'effect/delete-memo': {
        const ok = await handlers.deleteMemo(effect.previousState);
        if (ok) {
          dispatch({ type: 'memo/delete-succeeded' });
        }
        else {
          dispatch({ type: 'memo/delete-failed', payload: { previousState: effect.previousState } });
        }
        return;
      }
      case 'effect/notify-deleted': {
        handlers.notifyDeleted();
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
