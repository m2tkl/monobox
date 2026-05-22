export type ManagedFilesListState = {
  currentPage: number;
  showUnlinkedOnly: boolean;
};

export type ManagedFilesListEvent =
  | { type: 'list/load-requested' }
  | { type: 'list/previous-page-requested' }
  | { type: 'list/next-page-requested'; payload: { totalPages: number } }
  | { type: 'list/unlinked-toggle-requested' };

export type ManagedFilesListEffect = {
  type: 'effect/load-page';
};

export type ManagedFilesListApplyResult = {
  state: ManagedFilesListState;
  effects: ManagedFilesListEffect[];
};

export const initialManagedFilesListState: ManagedFilesListState = {
  currentPage: 1,
  showUnlinkedOnly: false,
};

export function applyManagedFilesListEvent(
  state: ManagedFilesListState,
  event: ManagedFilesListEvent,
): ManagedFilesListApplyResult {
  switch (event.type) {
    case 'list/load-requested':
      return {
        state,
        effects: [{ type: 'effect/load-page' }],
      };
    case 'list/previous-page-requested':
      if (state.currentPage <= 1) {
        return { state, effects: [] };
      }
      return {
        state: {
          ...state,
          currentPage: state.currentPage - 1,
        },
        effects: [{ type: 'effect/load-page' }],
      };
    case 'list/next-page-requested':
      if (state.currentPage >= event.payload.totalPages) {
        return { state, effects: [] };
      }
      return {
        state: {
          ...state,
          currentPage: state.currentPage + 1,
        },
        effects: [{ type: 'effect/load-page' }],
      };
    case 'list/unlinked-toggle-requested':
      return {
        state: {
          currentPage: 1,
          showUnlinkedOnly: !state.showUnlinkedOnly,
        },
        effects: [{ type: 'effect/load-page' }],
      };
  }
}
