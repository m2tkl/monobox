export type InboxFilesListState = {
  currentPage: number;
};

export type InboxFilesListEvent =
  | { type: 'list/load-requested' }
  | { type: 'list/previous-page-requested' }
  | { type: 'list/next-page-requested'; payload: { totalPages: number } };

export type InboxFilesListEffect = {
  type: 'effect/load-page';
};

export type InboxFilesListApplyResult = {
  state: InboxFilesListState;
  effects: InboxFilesListEffect[];
};

export const initialInboxFilesListState: InboxFilesListState = {
  currentPage: 1,
};

export function applyInboxFilesListEvent(
  state: InboxFilesListState,
  event: InboxFilesListEvent,
): InboxFilesListApplyResult {
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
          currentPage: state.currentPage + 1,
        },
        effects: [{ type: 'effect/load-page' }],
      };
  }
}
