export type ResourceRef =
  | { type: 'workspaceCollection' }
  | { type: 'workspace'; workspaceSlug: string }
  | { type: 'memoCollection'; workspaceSlug: string }
  | { type: 'memo'; workspaceSlug: string; memoSlug: string }
  | { type: 'memoTemplateCollection'; workspaceSlug: string }
  | { type: 'memoTemplate'; workspaceSlug: string; templateSlug: string }
  | { type: 'linkCollection'; workspaceSlug: string; memoSlug: string }
  | { type: 'memoLinkCountCollection'; workspaceSlug: string }
  | { type: 'bookmarkCollection'; workspaceSlug: string }
  | { type: 'focusMemoCollection'; workspaceSlug: string }
  | { type: 'calendarDayCollection'; workspaceSlug: string }
  | { type: 'kanbanCollection'; workspaceSlug: string }
  | { type: 'kanbanStatusCollection'; workspaceSlug: string; kanbanId: number }
  | { type: 'kanbanEntryCollection'; workspaceSlug: string; memoSlug: string }
  | { type: 'kanbanAssignmentCollection'; workspaceSlug: string; kanbanId: number }
  | { type: 'fileCollection'; workspaceSlug: string }
  | { type: 'file'; workspaceSlug: string; fileId: string }
  | { type: 'inboxFileCollection' };

export const resourceRefs = {
  workspaceCollection: (): ResourceRef => ({ type: 'workspaceCollection' }),
  workspace: (workspaceSlug: string): ResourceRef => ({ type: 'workspace', workspaceSlug }),
  memoCollection: (workspaceSlug: string): ResourceRef => ({ type: 'memoCollection', workspaceSlug }),
  memo: (workspaceSlug: string, memoSlug: string): ResourceRef => ({ type: 'memo', workspaceSlug, memoSlug }),
  memoTemplateCollection: (workspaceSlug: string): ResourceRef => ({ type: 'memoTemplateCollection', workspaceSlug }),
  memoTemplate: (workspaceSlug: string, templateSlug: string): ResourceRef => ({ type: 'memoTemplate', workspaceSlug, templateSlug }),
  linkCollection: (workspaceSlug: string, memoSlug: string): ResourceRef => ({ type: 'linkCollection', workspaceSlug, memoSlug }),
  memoLinkCountCollection: (workspaceSlug: string): ResourceRef => ({ type: 'memoLinkCountCollection', workspaceSlug }),
  bookmarkCollection: (workspaceSlug: string): ResourceRef => ({ type: 'bookmarkCollection', workspaceSlug }),
  focusMemoCollection: (workspaceSlug: string): ResourceRef => ({ type: 'focusMemoCollection', workspaceSlug }),
  calendarDayCollection: (workspaceSlug: string): ResourceRef => ({ type: 'calendarDayCollection', workspaceSlug }),
  kanbanCollection: (workspaceSlug: string): ResourceRef => ({ type: 'kanbanCollection', workspaceSlug }),
  kanbanStatusCollection: (workspaceSlug: string, kanbanId: number): ResourceRef => ({ type: 'kanbanStatusCollection', workspaceSlug, kanbanId }),
  kanbanEntryCollection: (workspaceSlug: string, memoSlug: string): ResourceRef => ({ type: 'kanbanEntryCollection', workspaceSlug, memoSlug }),
  kanbanAssignmentCollection: (workspaceSlug: string, kanbanId: number): ResourceRef => ({ type: 'kanbanAssignmentCollection', workspaceSlug, kanbanId }),
  fileCollection: (workspaceSlug: string): ResourceRef => ({ type: 'fileCollection', workspaceSlug }),
  file: (workspaceSlug: string, fileId: string): ResourceRef => ({ type: 'file', workspaceSlug, fileId }),
  inboxFileCollection: (): ResourceRef => ({ type: 'inboxFileCollection' }),
};

export function serializeResourceRef(ref: ResourceRef) {
  return JSON.stringify(ref);
}
