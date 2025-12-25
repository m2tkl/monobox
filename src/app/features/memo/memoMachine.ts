export type MemoState = 'clean' | 'dirty' | 'saving' | 'deleting';

export type MemoEvent =
  | { type: 'memo/content-changed'; payload: { dirty: boolean } }
  | { type: 'memo/title-changed'; payload: { dirty: boolean } }
  | { type: 'memo/links-changed'; payload: { added: string[]; deleted: string[] } }
  | { type: 'memo/save-requested'; payload: { mode: 'explicit' | 'auto' } }
  | { type: 'memo/save-succeeded'; payload: { memoSlug: string } }
  | { type: 'memo/save-failed'; payload: { error?: unknown } }
  | { type: 'memo/delete-requested' }
  | { type: 'memo/delete-confirmed'; payload: { previousState: MemoState } }
  | { type: 'memo/delete-succeeded' }
  | { type: 'memo/delete-failed'; payload: { previousState: MemoState; error?: unknown } };

export type MemoEffect =
  | { type: 'effect/save-memo'; mode: 'explicit' | 'auto' }
  | { type: 'effect/sync-links'; added: string[]; deleted: string[] }
  | { type: 'effect/notify-updated'; memoSlug: string }
  | { type: 'effect/confirm-delete'; previousState: MemoState }
  | { type: 'effect/delete-memo'; previousState: MemoState }
  | { type: 'effect/notify-deleted' };

type TransitionResult = {
  next: MemoState;
  effects: MemoEffect[];
};

export function transition(state: MemoState, event: MemoEvent): TransitionResult {
  switch (event.type) {
    case 'memo/content-changed':
    case 'memo/title-changed': {
      if (state === 'saving' || state === 'deleting') {
        return { next: state, effects: [] };
      }
      return { next: event.payload.dirty ? 'dirty' : 'clean', effects: [] };
    }
    case 'memo/links-changed': {
      if (state === 'deleting') {
        return { next: state, effects: [] };
      }
      return {
        next: state,
        effects: [{ type: 'effect/sync-links', added: event.payload.added, deleted: event.payload.deleted }],
      };
    }
    case 'memo/save-requested': {
      if (state !== 'dirty') {
        return { next: state, effects: [] };
      }
      return { next: 'saving', effects: [{ type: 'effect/save-memo', mode: event.payload.mode }] };
    }
    case 'memo/save-succeeded': {
      if (state !== 'saving' && state !== 'dirty') {
        return { next: state, effects: [] };
      }
      return { next: 'clean', effects: [{ type: 'effect/notify-updated', memoSlug: event.payload.memoSlug }] };
    }
    case 'memo/save-failed': {
      if (state !== 'saving' && state !== 'dirty') {
        return { next: state, effects: [] };
      }
      return { next: 'dirty', effects: [] };
    }
    case 'memo/delete-requested': {
      if (state === 'saving') {
        return { next: state, effects: [] };
      }
      return { next: state, effects: [{ type: 'effect/confirm-delete', previousState: state }] };
    }
    case 'memo/delete-confirmed': {
      return { next: 'deleting', effects: [{ type: 'effect/delete-memo', previousState: event.payload.previousState }] };
    }
    case 'memo/delete-succeeded': {
      if (state !== 'deleting') {
        return { next: state, effects: [] };
      }
      return { next: 'clean', effects: [{ type: 'effect/notify-deleted' }] };
    }
    case 'memo/delete-failed': {
      return { next: event.payload.previousState, effects: [] };
    }
    default: {
      return { next: state, effects: [] };
    }
  }
}
