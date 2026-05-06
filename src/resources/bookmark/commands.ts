import { command as tauriCommand } from '~/external/tauri/command';

export const bookmarkCommand = {
  list: (workspaceSlug: string) => tauriCommand.bookmark.list(workspaceSlug),
  add: (workspaceSlug: string, memoSlug: string) => tauriCommand.bookmark.add(workspaceSlug, memoSlug),
  delete: (workspaceSlug: string, memoSlug: string) => tauriCommand.bookmark.delete(workspaceSlug, memoSlug),
} as const;
