export type ChangeRef =
  | { type: 'workspaceCollectionChanged' }
  | { type: 'memoCreated'; workspaceSlug: string; memoSlug: string }
  | { type: 'memoChanged'; workspaceSlug: string; memoSlug: string }
  | { type: 'memoRenamed'; workspaceSlug: string; previousMemoSlug: string; memoSlug: string }
  | { type: 'memoDeleted'; workspaceSlug: string; memoSlug: string }
  | { type: 'memoLinksChanged'; workspaceSlug: string; memoSlug: string }
  | { type: 'memoTemplateCreated'; workspaceSlug: string; templateSlug: string }
  | { type: 'memoTemplateChanged'; workspaceSlug: string; templateSlug: string }
  | { type: 'memoTemplateRenamed'; workspaceSlug: string; previousTemplateSlug: string; templateSlug: string }
  | { type: 'memoTemplateDeleted'; workspaceSlug: string }
  | { type: 'memoTemplateDefaultChanged'; workspaceSlug: string }
  | { type: 'bookmarkCollectionChanged'; workspaceSlug: string }
  | { type: 'focusMemoCollectionChanged'; workspaceSlug: string }
  | { type: 'kanbanCollectionChanged'; workspaceSlug: string }
  | { type: 'kanbanStatusCollectionChanged'; workspaceSlug: string; kanbanId: number }
  | { type: 'kanbanEntryCollectionChanged'; workspaceSlug: string; memoSlug: string }
  | { type: 'fileCollectionChanged'; workspaceSlug: string }
  | { type: 'fileChanged'; workspaceSlug: string; fileId: string }
  | { type: 'inboxFileCollectionChanged' };

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
  memoTemplateCreated: (workspaceSlug: string, templateSlug: string): ChangeRef => ({ type: 'memoTemplateCreated', workspaceSlug, templateSlug }),
  memoTemplateChanged: (workspaceSlug: string, templateSlug: string): ChangeRef => ({ type: 'memoTemplateChanged', workspaceSlug, templateSlug }),
  memoTemplateRenamed: (workspaceSlug: string, previousTemplateSlug: string, templateSlug: string): ChangeRef => ({
    type: 'memoTemplateRenamed',
    workspaceSlug,
    previousTemplateSlug,
    templateSlug,
  }),
  memoTemplateDeleted: (workspaceSlug: string): ChangeRef => ({ type: 'memoTemplateDeleted', workspaceSlug }),
  memoTemplateDefaultChanged: (workspaceSlug: string): ChangeRef => ({ type: 'memoTemplateDefaultChanged', workspaceSlug }),
  bookmarkCollectionChanged: (workspaceSlug: string): ChangeRef => ({ type: 'bookmarkCollectionChanged', workspaceSlug }),
  focusMemoCollectionChanged: (workspaceSlug: string): ChangeRef => ({ type: 'focusMemoCollectionChanged', workspaceSlug }),
  kanbanCollectionChanged: (workspaceSlug: string): ChangeRef => ({ type: 'kanbanCollectionChanged', workspaceSlug }),
  kanbanStatusCollectionChanged: (workspaceSlug: string, kanbanId: number): ChangeRef => ({ type: 'kanbanStatusCollectionChanged', workspaceSlug, kanbanId }),
  kanbanEntryCollectionChanged: (workspaceSlug: string, memoSlug: string): ChangeRef => ({ type: 'kanbanEntryCollectionChanged', workspaceSlug, memoSlug }),
  fileCollectionChanged: (workspaceSlug: string): ChangeRef => ({ type: 'fileCollectionChanged', workspaceSlug }),
  fileChanged: (workspaceSlug: string, fileId: string): ChangeRef => ({ type: 'fileChanged', workspaceSlug, fileId }),
  inboxFileCollectionChanged: (): ChangeRef => ({ type: 'inboxFileCollectionChanged' }),
};
