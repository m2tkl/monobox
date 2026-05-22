import type { InboxFilePage, ManagedFileDetail, ManagedFileListPage, MemoLinkedFileItem } from '~/models/file';
import type { MemoQueryArgs } from '~/resources/memo/queries';

import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type WorkspaceManagedFileQueryArgs = {
  workspaceSlug: string;
  limit: number;
  offset: number;
  unlinkedOnly: boolean;
};

export type InboxFileQueryArgs = {
  limit: number;
  offset: number;
};

export type ManagedFileDetailQueryArgs = {
  workspaceSlug: string;
  fileId: string;
};

export const memoFilesQuery = defineQuery<MemoQueryArgs, MemoLinkedFileItem[]>({
  key: ({ workspaceSlug, memoSlug }) => ['workspace', workspaceSlug, 'memo', memoSlug, 'files'] as const,
  resources: ({ workspaceSlug, memoSlug }) => [resourceRefs.memo(workspaceSlug, memoSlug)],
  when: ({ workspaceSlug, memoSlug }) => workspaceSlug.length > 0 && memoSlug.length > 0,
  load: ({ workspaceSlug, memoSlug }) => command.file.listFilesForMemo({
    workspaceSlug,
    memoSlug,
  }),
});

export const workspaceManagedFilesQuery = defineQuery<WorkspaceManagedFileQueryArgs, ManagedFileListPage>({
  key: ({ workspaceSlug, limit, offset, unlinkedOnly }) =>
    ['workspace', workspaceSlug, 'files', limit, offset, unlinkedOnly] as const,
  resources: ({ workspaceSlug }) => [resourceRefs.fileCollection(workspaceSlug)],
  when: ({ workspaceSlug }) => workspaceSlug.length > 0,
  load: ({ limit, offset, unlinkedOnly }) => command.file.listFiles({
    limit,
    offset,
    unlinkedOnly,
  }),
});

export const inboxFilesQuery = defineQuery<InboxFileQueryArgs, InboxFilePage>({
  key: ({ limit, offset }) => ['inbox', 'files', limit, offset] as const,
  resources: () => [resourceRefs.inboxFileCollection()],
  load: ({ limit, offset }) => command.file.listInbox({
    limit,
    offset,
  }),
});

export const managedFileDetailQuery = defineQuery<ManagedFileDetailQueryArgs, ManagedFileDetail>({
  key: ({ workspaceSlug, fileId }) => ['workspace', workspaceSlug, 'file', fileId] as const,
  resources: ({ workspaceSlug, fileId }) => [resourceRefs.file(workspaceSlug, fileId)],
  when: ({ workspaceSlug, fileId }) => workspaceSlug.length > 0 && fileId.length > 0,
  load: ({ fileId }) => command.file.getFileDetail(fileId),
});
