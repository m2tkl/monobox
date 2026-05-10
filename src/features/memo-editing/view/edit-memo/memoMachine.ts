export type MemoEditableState =
  | { type: 'clean' }
  | { type: 'dirty' };

export type MemoState =
  | MemoEditableState
  | {
      type: 'saving';
      mode: 'explicit' | 'auto';
    }
  | {
      type: 'deleting';
      returnState: MemoEditableState;
    };

export type MemoEvent =
  | { type: 'memo/content-changed'; payload: { dirty: boolean } }
  | { type: 'memo/title-changed'; payload: { dirty: boolean } }
  | { type: 'memo/links-changed'; payload: { added: string[]; deleted: string[] } }
  | { type: 'memo/save-requested'; payload: { mode: 'explicit' | 'auto' } }
  | { type: 'memo/save-succeeded'; payload: { memoSlug: string } }
  | { type: 'memo/save-failed'; payload: { error?: unknown } }
  | { type: 'memo/delete-requested' }
  | { type: 'memo/delete-confirmation-resolved'; payload: { confirmed: boolean } }
  | { type: 'memo/delete-succeeded' }
  | { type: 'memo/delete-failed'; payload: { error?: unknown } };

export type MemoEffect =
  | { type: 'effect/save-memo'; mode: 'explicit' | 'auto' }
  | { type: 'effect/sync-links'; added: string[]; deleted: string[] }
  | { type: 'effect/snapshot-saved' }
  | { type: 'effect/emit-memo-updated'; memoSlug: string }
  | { type: 'effect/replace-memo-route'; memoSlug: string }
  | { type: 'effect/confirm-delete' }
  | { type: 'effect/delete-memo' }
  | { type: 'effect/emit-memo-deleted' }
  | { type: 'effect/replace-workspace-route' };

export type ApplyResult = {
  state: MemoState;
  effects: MemoEffect[];
};

const cleanState: MemoEditableState = { type: 'clean' };
const dirtyState: MemoEditableState = { type: 'dirty' };

type MemoStateByType = {
  clean: Extract<MemoState, { type: 'clean' }>;
  dirty: Extract<MemoState, { type: 'dirty' }>;
  saving: Extract<MemoState, { type: 'saving' }>;
  deleting: Extract<MemoState, { type: 'deleting' }>;
};

type MemoEventByType = {
  'memo/content-changed': Extract<MemoEvent, { type: 'memo/content-changed' }>;
  'memo/title-changed': Extract<MemoEvent, { type: 'memo/title-changed' }>;
  'memo/links-changed': Extract<MemoEvent, { type: 'memo/links-changed' }>;
  'memo/save-requested': Extract<MemoEvent, { type: 'memo/save-requested' }>;
  'memo/save-succeeded': Extract<MemoEvent, { type: 'memo/save-succeeded' }>;
  'memo/save-failed': Extract<MemoEvent, { type: 'memo/save-failed' }>;
  'memo/delete-requested': Extract<MemoEvent, { type: 'memo/delete-requested' }>;
  'memo/delete-confirmation-resolved': Extract<MemoEvent, { type: 'memo/delete-confirmation-resolved' }>;
  'memo/delete-succeeded': Extract<MemoEvent, { type: 'memo/delete-succeeded' }>;
  'memo/delete-failed': Extract<MemoEvent, { type: 'memo/delete-failed' }>;
};

type TransitionHandler<
  StateType extends keyof MemoStateByType,
  EventType extends keyof MemoEventByType,
> = (input: {
  state: MemoStateByType[StateType];
  event: MemoEventByType[EventType];
}) => ApplyResult;

type TransitionMap = {
  [StateType in keyof MemoStateByType]: Partial<{
    [EventType in keyof MemoEventByType]: TransitionHandler<StateType, EventType>;
  }>;
};

const transitions: TransitionMap = {
  clean: {
    'memo/content-changed': ({ event }) => ({
      state: event.payload.dirty ? dirtyState : cleanState,
      effects: [],
    }),
    'memo/title-changed': ({ event }) => ({
      state: event.payload.dirty ? dirtyState : cleanState,
      effects: [],
    }),
    'memo/links-changed': ({ state, event }) => ({
      state,
      effects: [{ type: 'effect/sync-links', added: event.payload.added, deleted: event.payload.deleted }],
    }),
    'memo/delete-requested': ({ state }) => ({
      state,
      effects: [{ type: 'effect/confirm-delete' }],
    }),
    'memo/delete-confirmation-resolved': ({ state, event }) => {
      if (!event.payload.confirmed) {
        return { state, effects: [] };
      }

      return {
        state: { type: 'deleting', returnState: state },
        effects: [{ type: 'effect/delete-memo' }],
      };
    },
  },
  dirty: {
    'memo/content-changed': ({ event }) => ({
      state: event.payload.dirty ? dirtyState : cleanState,
      effects: [],
    }),
    'memo/title-changed': ({ event }) => ({
      state: event.payload.dirty ? dirtyState : cleanState,
      effects: [],
    }),
    'memo/links-changed': ({ state, event }) => ({
      state,
      effects: [{ type: 'effect/sync-links', added: event.payload.added, deleted: event.payload.deleted }],
    }),
    'memo/save-requested': ({ event }) => ({
      state: { type: 'saving', mode: event.payload.mode },
      effects: [{ type: 'effect/save-memo', mode: event.payload.mode }],
    }),
    'memo/delete-requested': ({ state }) => ({
      state,
      effects: [{ type: 'effect/confirm-delete' }],
    }),
    'memo/delete-confirmation-resolved': ({ state, event }) => {
      if (!event.payload.confirmed) {
        return { state, effects: [] };
      }

      return {
        state: { type: 'deleting', returnState: state },
        effects: [{ type: 'effect/delete-memo' }],
      };
    },
  },
  saving: {
    'memo/save-succeeded': ({ event }) => ({
      state: cleanState,
      effects: [
        { type: 'effect/snapshot-saved' },
        { type: 'effect/emit-memo-updated', memoSlug: event.payload.memoSlug },
        { type: 'effect/replace-memo-route', memoSlug: event.payload.memoSlug },
      ],
    }),
    'memo/save-failed': () => ({
      state: dirtyState,
      effects: [],
    }),
  },
  deleting: {
    'memo/delete-succeeded': () => ({
      state: cleanState,
      effects: [
        { type: 'effect/emit-memo-deleted' },
        { type: 'effect/replace-workspace-route' },
      ],
    }),
    'memo/delete-failed': ({ state }) => ({
      state: state.returnState,
      effects: [],
    }),
  },
};

export function apply(state: MemoState, event: MemoEvent): ApplyResult {
  const handlers = transitions[state.type];
  const handler = handlers[event.type] as ((input: { state: MemoState; event: MemoEvent }) => ApplyResult) | undefined;

  if (!handler) {
    return { state, effects: [] };
  }

  return handler({ state, event });
}
