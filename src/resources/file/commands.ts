import { command as tauriCommand } from '~/external/tauri/command';

export const fileCommand = {
  listInbox: (params?: { limit?: number; offset?: number }) => tauriCommand.file.listInbox(params),
  importInboxFile: (sourcePath: string) => tauriCommand.file.importInboxFile(sourcePath),
  createExternalLink: (params: { displayName: string; url: string }) => tauriCommand.file.createExternalLink(params),
  listFiles: (params?: { limit?: number; offset?: number; unlinkedOnly?: boolean }) => tauriCommand.file.listFiles(params),
  getFileDetail: (fileId: string) => tauriCommand.file.getFileDetail(fileId),
  resolveOpenTarget: (fileId: string) => tauriCommand.file.resolveOpenTarget(fileId),
  openManagedFile: (fileId: string) => tauriCommand.file.openManagedFile(fileId),
  openLocalPath: (path: string) => tauriCommand.file.openLocalPath(path),
  deleteFileRecord: (fileId: string) => tauriCommand.file.deleteFileRecord(fileId),
  updateDisplayName: (params: { fileId: string; displayName: string }) => tauriCommand.file.updateDisplayName(params),
  updateExternalLink: (params: { fileId: string; displayName: string; url: string }) => tauriCommand.file.updateExternalLink(params),
  updateNote: (params: { fileId: string; note: string }) => tauriCommand.file.updateNote(params),
  linkFileToMemo: (params: { workspaceSlug: string; memoSlug: string; fileId: string }) => tauriCommand.file.linkFileToMemo(params),
  listFilesForMemo: (params: { workspaceSlug: string; memoSlug: string }) => tauriCommand.file.listFilesForMemo(params),
} as const;
