export type ChangeRef =
  | { type: 'workspaceCollectionChanged' }
  | { type: 'memoCreated'; workspaceSlug: string; memoSlug: string }
  | { type: 'memoChanged'; workspaceSlug: string; memoSlug: string }
  | { type: 'memoRenamed'; workspaceSlug: string; previousMemoSlug: string; memoSlug: string }
  | { type: 'memoDeleted'; workspaceSlug: string; memoSlug: string }
  | { type: 'memoLinksChanged'; workspaceSlug: string; memoSlug: string }
  | { type: 'bookmarkCollectionChanged'; workspaceSlug: string }
  | { type: 'kanbanCollectionChanged'; workspaceSlug: string }
  | { type: 'kanbanStatusCollectionChanged'; workspaceSlug: string; kanbanId: number }
  | { type: 'kanbanEntryCollectionChanged'; workspaceSlug: string; memoSlug: string };

export const changeRefs = {
  workspaceCollectionChanged: (): ChangeRef => ({ type: 'workspaceCollectionChanged' }),
  memoCreated: (workspaceSlug: string, memoSlug: string): ChangeRef => ({ type: 'memoCreated', workspaceSlug, memoSlug }),
  memoChanged: (workspaceSlug: string, memoSlug: string): ChangeRef => ({ type: 'memoChanged', workspaceSlug, memoSlug }),
  memoRenamed: (workspaceSlug: string, previousMemoSlug: string, memoSlug: string): ChangeRef => ({
    type: 'memoRenamed',
    workspaceSlug,
    previousMemoSlug,
    memoSlug,
  }),
  memoDeleted: (workspaceSlug: string, memoSlug: string): ChangeRef => ({ type: 'memoDeleted', workspaceSlug, memoSlug }),
  memoLinksChanged: (workspaceSlug: string, memoSlug: string): ChangeRef => ({ type: 'memoLinksChanged', workspaceSlug, memoSlug }),
  bookmarkCollectionChanged: (workspaceSlug: string): ChangeRef => ({ type: 'bookmarkCollectionChanged', workspaceSlug }),
  kanbanCollectionChanged: (workspaceSlug: string): ChangeRef => ({ type: 'kanbanCollectionChanged', workspaceSlug }),
  kanbanStatusCollectionChanged: (workspaceSlug: string, kanbanId: number): ChangeRef => ({ type: 'kanbanStatusCollectionChanged', workspaceSlug, kanbanId }),
  kanbanEntryCollectionChanged: (workspaceSlug: string, memoSlug: string): ChangeRef => ({ type: 'kanbanEntryCollectionChanged', workspaceSlug, memoSlug }),
};
