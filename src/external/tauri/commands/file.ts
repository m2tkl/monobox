import { invokeCommand } from '../core/invoker';

import type {
  InboxFilePage,
  ManagedFileDetail,
  MemoLinkedFileItem,
  ManagedFileListPage,
  ManagedFileRecord,
  ResolvedFileOpenTarget,
} from '~/models/file';

export const fileCommand = {
  listInbox: async (params?: { limit?: number; offset?: number }) => {
    return await invokeCommand<InboxFilePage>('list_inbox_files', {
      limit: params?.limit,
      offset: params?.offset,
    });
  },

  importInboxFile: async (sourcePath: string) => {
    return await invokeCommand<ManagedFileRecord>('import_inbox_file', {
      source_path: sourcePath,
    });
  },

  createExternalLink: async (params: { displayName: string; url: string }) => {
    return await invokeCommand<ManagedFileRecord>('create_external_file_link', {
      display_name: params.displayName,
      url: params.url,
    });
  },

  listFiles: async (params?: { limit?: number; offset?: number; unlinkedOnly?: boolean }) => {
    return await invokeCommand<ManagedFileListPage>('list_files', {
      limit: params?.limit,
      offset: params?.offset,
      unlinked_only: params?.unlinkedOnly,
    });
  },

  getFileDetail: async (fileId: string) => {
    return await invokeCommand<ManagedFileDetail>('get_file_detail', {
      file_id: fileId,
    });
  },

  resolveOpenTarget: async (fileId: string) => {
    return await invokeCommand<ResolvedFileOpenTarget>('resolve_file_open_target', {
      file_id: fileId,
    });
  },

  openManagedFile: async (fileId: string) => {
    await invokeCommand('open_managed_file', {
      file_id: fileId,
    });
  },

  openLocalPath: async (path: string) => {
    await invokeCommand('open_local_path', {
      path,
    });
  },

  deleteFileRecord: async (fileId: string) => {
    await invokeCommand('delete_file_record', {
      file_id: fileId,
    });
  },

  updateDisplayName: async (params: { fileId: string; displayName: string }) => {
    return await invokeCommand<ManagedFileRecord>('update_file_display_name', {
      file_id: params.fileId,
      display_name: params.displayName,
    });
  },

  updateExternalLink: async (params: { fileId: string; displayName: string; url: string }) => {
    return await invokeCommand<ManagedFileRecord>('update_external_file_link', {
      file_id: params.fileId,
      display_name: params.displayName,
      url: params.url,
    });
  },

  updateNote: async (params: { fileId: string; note: string }) => {
    return await invokeCommand<ManagedFileRecord>('update_file_note', {
      file_id: params.fileId,
      note: params.note,
    });
  },

  linkFileToMemo: async (params: { workspaceSlug: string; memoSlug: string; fileId: string }) => {
    await invokeCommand('link_file_to_memo', {
      workspace_slug_name: params.workspaceSlug,
      memo_slug_title: params.memoSlug,
      file_id: params.fileId,
    });
  },

  listFilesForMemo: async (params: { workspaceSlug: string; memoSlug: string }) => {
    return await invokeCommand<MemoLinkedFileItem[]>('list_files_for_memo', {
      workspace_slug_name: params.workspaceSlug,
      memo_slug_title: params.memoSlug,
    });
  },
} as const;
